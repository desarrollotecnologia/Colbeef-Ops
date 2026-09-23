"""
==============================================================================
  Inventario de Subproductos — Colbeef SAS
==============================================================================
Aplicación web Streamlit + MySQL para la trazabilidad de subproductos
cárnicos (bilis, borlas, carne industrial, esófagos, orejas, tráqueas,
vejigas, viriles, etc.).

Responsabilidades del módulo
----------------------------
- Autenticar usuarios contra la tabla ``usuarios`` y aplicar control de
  acceso por rol (Consulta / Operador / Administrador / Super Admin).
- Registrar movimientos oficiales (INGRESO, SALIDA, MERMA, AJUSTE) y
  calcular el stock por producto en tiempo real.
- Mantener auditoría de dos capas: bitácora general (``log_actividad``) e
  historial fino por ID de movimiento (``historial_movimiento``).
- Gestionar el catálogo maestro de productos y los destinos/almacenes.
- Producir reportes exportables a Excel y estadísticas de uso.
- Integrarse con el resto de la suite Colbeef mediante *SSO ligero por
  URL* (query param ``?usuario=<nombre>``).

Diseño de la ejecución
----------------------
Streamlit reejecuta este script completo en cada interacción del usuario;
por ello el estado se conserva en ``st.session_state`` y las conexiones
MySQL se abren/cierran por operación (patrón *connection per request*).

Documentación funcional detallada: ver ``DOCUMENTACION.md``.
Diagrama de flujo: ver ``FLUJO_SISTEMA.drawio``.

Autor: Daniel Almeida Jaimes — Colbeef SAS © 2026.
==============================================================================
"""

import streamlit as st
import mysql.connector
import pandas as pd
from datetime import datetime, date, timedelta
import io
import time

# -----------------------------------------------------------------------------
# CONSTANTES DE NEGOCIO
# -----------------------------------------------------------------------------
# Whitelist de tipos de movimiento. Se usa tanto en el selector del formulario
# como en las agregaciones de stock; mantener sincronizado con los CASE WHEN de
# los reportes para no romper el cálculo (INGRESO/AJUSTE suman, resto restan).
TIPOS_MOVIMIENTO_OFICIALES = (
    "INGRESO DE PRODUCCION",
    "SALIDA POR DESPACHO",
    "MERMA",
    "ENTRADA POR AJUSTE",
    "DEVOLUCION",
)

# Tipos de movimiento que representan entradas físicas al inventario. Son los
# únicos que reciben una FECHA_VENCIMIENTO (por lote), porque son los que
# introducen producto perecedero a stock.
TIPOS_QUE_INGRESAN = ("INGRESO DE PRODUCCION", "ENTRADA POR AJUSTE")

# Tipos que restan del stock (SALIDA / MERMA / DEVOLUCION). Se centraliza aquí
# para mantener sincronizada la lógica de cálculo con la validación del form.
TIPOS_QUE_SALEN = ("SALIDA POR DESPACHO", "MERMA", "DEVOLUCION")

# Ventana en días para el reporte de "próximos a vencer".
DIAS_PROXIMO_A_VENCER = 15

# Semilla del catálogo cuando ``catalogo_productos`` está vacío. Preserva la
# retro-compatibilidad con movimientos históricos que fueron capturados antes
# de existir la tabla de catálogo.
PRODUCTOS_LEGACY_FALLBACK = (
    "BILIS",
    "BORLAS",
    "CARNE INDUSTRIAL",
    "ESOFAGOS",
    "OREJAS",
    "TRAQUEAS",
    "VEJIGAS",
    "VIRILES",
)

# --- 1. CONFIGURACIÓN DE PÁGINA ---
st.set_page_config(page_title="Inventario De Subproductos Colbeef", layout="wide", page_icon="🥩")

# =============================================================================
# 2. FUNCIONES CORE — Conexión, sesión, auditoría y bootstrap de esquema
# =============================================================================
def conectar():
    """Fábrica de conexiones MySQL (patrón *connection per request*).

    Devuelve una conexión nueva contra la BD ``inventario_subproductos``.
    Es responsabilidad del *caller* invocar ``conn.close()`` al terminar.

    Nota de seguridad: las credenciales están *hard-coded* por decisión de
    despliegue on-premise. Migrar a ``st.secrets`` o variables de entorno
    al mover a producción externa.

    Returns:
        mysql.connector.MySQLConnection: conexión activa lista para operar.
    """
    return mysql.connector.connect(
        host='localhost', user='root', password='root',
        database='inventario_subproductos', port=3306
    )


def refrescar_datos_usuario():
    """Sincroniza en caliente el ``rol`` del usuario autenticado.

    Streamlit conserva ``session_state`` entre reruns, por lo que si un
    Super Admin modifica el rol de un usuario mientras éste tiene la
    aplicación abierta, sin este refresco seguiría operando con el rol
    en caché. Esta función garantiza que los permisos reflejen siempre
    el valor persistido en la tabla ``usuarios``.

    Falla silenciosamente ante errores de conexión para no bloquear el
    render: la próxima interacción reintentará.
    """
    if st.session_state.get('autenticado'):
        try:
            conn = conectar()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT rol FROM usuarios WHERE nombre = %s", (st.session_state.nombre,))
            res = cursor.fetchone()
            if res:
                st.session_state.rol = res['rol']
            conn.close()
        except:
            pass


def obtener_usuario_desde_url():
    """Extrae el identificador de usuario del query string.

    Soporta dos parámetros equivalentes (``?usuario=<X>`` o ``?login=<X>``)
    para tolerar diferencias entre las apps hermanas de la suite Colbeef.

    Implementa un *fallback* al API antiguo ``st.experimental_get_query_params``
    por compatibilidad con Streamlit < 1.30.

    Returns:
        str: nombre del usuario (o cadena vacía si no viene en la URL).
    """
    try:
        qp = st.query_params
        usuario_q = (qp.get("usuario", "") or "").strip()
        login_q = (qp.get("login", "") or "").strip()
        return usuario_q or login_q
    except Exception:
        try:
            qp_old = st.experimental_get_query_params()
            usuario_q = ((qp_old.get("usuario") or [""])[0] or "").strip()
            login_q = ((qp_old.get("login") or [""])[0] or "").strip()
            return usuario_q or login_q
        except Exception:
            return ""


def restaurar_sesion_por_usuario_url():
    """Implementa *SSO ligero por URL* al volver de una app hermana.

    Reglas de restauración (todas deben cumplirse):
      1. No hay sesión activa aún.
      2. El usuario no cerró sesión manualmente en esta vuelta
         (``logout_manual`` evita bucles con la propia URL en cache).
      3. El nombre viene en el query param.
      4. Existe en la tabla ``usuarios`` (match por ``nombre`` o ``correo``).

    Si todo se cumple, popula ``session_state`` y registra el evento
    ``Sesión restaurada por retorno desde Librillos`` en ``log_actividad``.

    Advertencia de seguridad: este SSO no valida un token firmado.
    Es aceptable dentro del perímetro LAN corporativo; para exposición
    pública debe reemplazarse por JWT / token de un solo uso.

    Returns:
        bool: ``True`` si se restauró la sesión (el caller debe hacer
        ``st.rerun()`` para refrescar la UI), ``False`` en caso contrario.
    """
    if st.session_state.get("autenticado"):
        return False
    if st.session_state.get("logout_manual"):
        return False

    usuario_url = obtener_usuario_desde_url()
    if not usuario_url:
        return False

    try:
        conn = conectar()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, nombre, rol FROM usuarios WHERE nombre = %s OR correo = %s LIMIT 1",
            (usuario_url, usuario_url),
        )
        res = cursor.fetchone()
        conn.close()
        if not res:
            return False

        st.session_state.autenticado = True
        st.session_state.logout_manual = False
        st.session_state.user_id = res["id"]
        st.session_state.nombre = res["nombre"]
        st.session_state.rol = res["rol"]
        registrar_log("Sesión restaurada por retorno desde Librillos")
        return True
    except Exception:
        return False


def registrar_log(accion):
    """Inserta un evento en la bitácora general ``log_actividad``.

    Usada para auditar acciones de alto nivel (logins, creación/edición
    /eliminación de entidades, etc.). Alimenta el módulo *Estadísticas
    de uso*.

    Args:
        accion (str): texto descriptivo libre del evento (ej.
            ``"Inicio de Sesión"``, ``"Editó movimiento 42"``).

    Silencia excepciones a propósito: la falla del log nunca debe
    romper la operación funcional del usuario.
    """
    try:
        conn = conectar(); cursor = conn.cursor()
        query = "INSERT INTO log_actividad (nombre_usuario, accion, fecha_hora, rol) VALUES (%s, %s, %s, %s)"
        cursor.execute(query, (st.session_state.nombre, accion, datetime.now(), st.session_state.rol))
        conn.commit(); conn.close()
    except: pass


def ensure_historial_movimiento_table():
    """DDL idempotente de ``historial_movimiento`` (auditoría fina por ID).

    Crea la tabla si aún no existe. Se llama de forma perezosa desde los
    puntos donde se va a escribir historial, permitiendo desplegar la
    aplicación contra bases limpias sin script SQL previo.

    Índices creados:
      * ``idx_hist_mov``   — búsquedas de historial por movimiento.
      * ``idx_hist_fecha`` — ordenamientos y filtros por rango de fechas.
    """
    try:
        conn = conectar()
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS historial_movimiento (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_movimiento INT NOT NULL,
                fecha_hora DATETIME NOT NULL,
                nombre_usuario VARCHAR(200) NULL,
                accion VARCHAR(40) NOT NULL,
                detalle TEXT NULL,
                INDEX idx_hist_mov (id_movimiento),
                INDEX idx_hist_fecha (fecha_hora)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """
        )
        conn.commit()
        conn.close()
    except Exception:
        pass

def registrar_historial_movimiento(id_movimiento, accion, detalle):
    """Persiste un evento de auditoría *fina* asociado a un movimiento.

    Complementa a ``registrar_log()``: mientras aquel registra la acción
    a nivel humano, este mantiene la trazabilidad **por ID de movimiento**
    con el *diff* exacto de los cambios aplicados.

    Args:
        id_movimiento (int | None): ID del movimiento afectado. Si viene
            ``None`` la función no hace nada (protección defensiva).
        accion (str): tipo de evento — ``'CREAR'`` | ``'ACTUALIZAR'`` |
            ``'ELIMINAR'``.
        detalle (str): descripción libre. En ediciones se recomienda usar
            el formato ``"Campo: «antes» → «después»"`` separado por
            ``"; "``. Se trunca a 60 000 caracteres por seguridad.
    """
    if id_movimiento is None:
        return
    try:
        ensure_historial_movimiento_table()
        conn = conectar()
        cur = conn.cursor()
        txt = (detalle or "")[:60000]
        cur.execute(
            """INSERT INTO historial_movimiento (id_movimiento, fecha_hora, nombre_usuario, accion, detalle)
               VALUES (%s, %s, %s, %s, %s)""",
            (int(id_movimiento), datetime.now(), st.session_state.get("nombre"), accion, txt),
        )
        conn.commit()
        conn.close()
    except Exception:
        pass

def ensure_catalogo_productos_table():
    """DDL idempotente del catálogo maestro de productos.

    Estructura:
      * ``id``              — clave primaria autoincremental (inmutable).
      * ``nombre``          — nombre canónico único.
      * ``vida_util_dias``  — días de vida útil del producto (nullable).
                              Sirve para calcular ``FECHA_VENCIMIENTO``
                              automáticamente en cada INGRESO/AJUSTE:
                              ``fecha_vencimiento = fecha_ingreso + vida_util_dias``.

    Los movimientos referencian el producto **por nombre** (relación lógica,
    no FK física) para tolerar renombres cascada gestionados a nivel
    aplicación desde el módulo *Catálogo de productos*.

    Migración idempotente: si la tabla ya existía sin ``vida_util_dias``
    (bases previas), se añade la columna con ``ALTER TABLE`` sin perder
    datos.
    """
    try:
        conn = conectar()
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS catalogo_productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(200) NOT NULL,
                vida_util_dias INT NULL,
                UNIQUE KEY uk_catalogo_prod_nombre (nombre)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """
        )
        # Migración perezosa: agrega la columna si la tabla ya existía sin ella.
        cur.execute("SHOW COLUMNS FROM catalogo_productos LIKE 'vida_util_dias'")
        if not cur.fetchone():
            cur.execute("ALTER TABLE catalogo_productos ADD COLUMN vida_util_dias INT NULL AFTER nombre")
        conn.commit()
        conn.close()
    except Exception:
        pass

def seed_catalogo_productos_si_vacio():
    """Siembra el catálogo con la lista *legacy* si está vacío.

    Garantiza continuidad operativa en despliegues limpios: los ocho
    productos históricos definidos en ``PRODUCTOS_LEGACY_FALLBACK`` se
    insertan con ``INSERT IGNORE`` (idempotente ante ejecuciones
    concurrentes). No sobrescribe registros existentes.
    """
    try:
        ensure_catalogo_productos_table()
        conn = conectar()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM catalogo_productos")
        n = cur.fetchone()[0]
        if n == 0:
            for nom in PRODUCTOS_LEGACY_FALLBACK:
                cur.execute(
                    "INSERT IGNORE INTO catalogo_productos (nombre) VALUES (%s)",
                    (nom,),
                )
            conn.commit()
        conn.close()
    except Exception:
        try:
            conn.close()
        except Exception:
            pass

def cargar_nombres_productos():
    """Devuelve la lista canónica de productos ordenada por ``id``.

    Fuente de verdad para los ``st.selectbox`` de *Registrar movimiento*
    y *Gestión de registros*. Garantiza:

    - Tabla existente (llama ``ensure_catalogo_productos_table``).
    - Datos mínimos (llama ``seed_catalogo_productos_si_vacio``).
    - *Fallback* a ``PRODUCTOS_LEGACY_FALLBACK`` si el DataFrame llega
      vacío o si la consulta falla (BD caída, tabla corrupta, etc.).

    Returns:
        list[str]: nombres de producto listos para presentar en UI.
    """
    try:
        ensure_catalogo_productos_table()
        seed_catalogo_productos_si_vacio()
        conn = conectar()
        df = pd.read_sql("SELECT nombre FROM catalogo_productos ORDER BY id ASC", conn)
        conn.close()
        if df.empty:
            return list(PRODUCTOS_LEGACY_FALLBACK)
        return df["nombre"].dropna().astype(str).str.strip().tolist()
    except Exception:
        return list(PRODUCTOS_LEGACY_FALLBACK)


def cargar_vida_util_productos():
    """Devuelve un ``dict {nombre_producto: vida_util_dias | None}``.

    Se usa para calcular la ``FECHA_VENCIMIENTO`` automáticamente en el
    formulario de *Registrar Movimiento* y en el módulo *Gestión de
    Registros* (para ingresos/ajustes).

    Contrato:
      * Si el producto tiene un entero configurado en la BD → se retorna
        como ``int``.
      * Si es ``NULL`` en BD → se retorna ``None`` (el llamador debe
        interpretarlo como "no configurado" y no permitir el guardado
        hasta que el admin/veterinario asigne el valor).

    Returns:
        dict[str, int | None]: mapping nombre → días de vida útil.
    """
    try:
        ensure_catalogo_productos_table()
        seed_catalogo_productos_si_vacio()
        conn = conectar()
        df = pd.read_sql(
            "SELECT nombre, vida_util_dias FROM catalogo_productos", conn
        )
        conn.close()
        salida = {}
        for _, r in df.iterrows():
            nom = str(r["nombre"]).strip()
            v = r["vida_util_dias"]
            if pd.isna(v) or v is None:
                salida[nom] = None
            else:
                try:
                    salida[nom] = int(v)
                except (TypeError, ValueError):
                    salida[nom] = None
        return salida
    except Exception:
        return {}


def ensure_almacenes_table():
    """DDL idempotente del catálogo de almacenes / destinos.

    Estructura:
      * ``id``             — clave primaria autoincremental (inmutable).
      * ``nombre_almacen`` — nombre del destino de despacho.

    Migración idempotente (best-effort): intenta agregar la restricción
    UNIQUE sobre ``nombre_almacen`` si aún no existe. Si la tabla ya
    contiene duplicados históricos, la migración se omite silenciosamente y
    la unicidad se hace cumplir a nivel de aplicación al crear/renombrar.

    Los movimientos referencian el almacén **por nombre** (relación lógica),
    lo que permite renombres cascada gestionados por la app.
    """
    try:
        conn = conectar()
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS almacenes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre_almacen VARCHAR(100) NOT NULL,
                UNIQUE KEY uk_almacenes_nombre (nombre_almacen)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """
        )
        # ALTER perezoso: si la tabla ya existía sin la UNIQUE KEY.
        cur.execute("SHOW INDEX FROM almacenes WHERE Key_name = 'uk_almacenes_nombre'")
        if not cur.fetchone():
            try:
                cur.execute(
                    "ALTER TABLE almacenes ADD UNIQUE KEY uk_almacenes_nombre (nombre_almacen)"
                )
            except Exception:
                # Si hay duplicados históricos, dejamos la unicidad a la capa
                # de aplicación (el módulo valida antes de INSERT/UPDATE).
                pass
        conn.commit()
        conn.close()
    except Exception:
        pass


def mostrar_firma():
    """Renderiza el pie de página corporativo fijo (footer HTML)."""
    st.markdown(f'<div class="footer">Colbeef SAS. Derechos Reservados 2026 | Programado por Daniel Almeida Jaimes.</div>', unsafe_allow_html=True)


# =============================================================================
# 3. ESTILOS CSS — Branding corporativo (título, footer, botones de navegación)
# =============================================================================
# Paleta Colbeef:
#   - Rojo/vino     (#E63946 → #800020) : elementos primarios y botón SUITE
#   - Azul institucional (#1D3557 → #457B9D) : botón LIBRILLOS
#   - Púrpura       (#6A0572 → #AB83A1) : botón VISCERAS
# Interacción: elevación en hover (translateY -3px) + brillo (filter brightness).
st.markdown("""
    <style>
    .main-title { font-size: 48px; font-weight: bold; color: #E63946; text-align: center; text-shadow: 3px 3px 6px rgba(0,0,0,0.3); margin-bottom: 20px; }
    .footer { position: fixed; left: 0; bottom: 0; width: 100%; background-color: #800020; color: white; text-align: center; padding: 12px; font-size: 14px; z-index: 100; }
    .btn-nav { display: block; padding: 14px; color: white !important; text-decoration: none; border-radius: 10px; text-align: center; font-weight: bold; transition: 0.3s; box-shadow: 0 4px 8px rgba(0,0,0,0.2); margin-bottom: 10px; }
    .btn-suite { background: linear-gradient(90deg, #E63946 0%, #800020 100%); }
    .btn-librillos { background: linear-gradient(90deg, #1D3557 0%, #457B9D 100%); }
    .btn-visceras { background: linear-gradient(90deg, #6A0572 0%, #AB83A1 100%); }
    .btn-nav:hover { transform: translateY(-3px); filter: brightness(1.2); text-decoration: none; color: white !important; }
    </style>
    """, unsafe_allow_html=True)

# =============================================================================
# 4. LÓGICA DE SESIÓN Y ENRUTAMIENTO PRINCIPAL
# =============================================================================
# Estado inicial: se inicializan las flags críticas antes de cualquier acción
# reactiva para evitar KeyError en la primera ejecución.
if 'autenticado' not in st.session_state:
    st.session_state.autenticado = False
if 'logout_manual' not in st.session_state:
    st.session_state.logout_manual = False

# SSO ligero: si venimos con ?usuario=<X> desde una app hermana, se intenta
# restaurar sesión sin fricción. El st.rerun() posterior fuerza el redibujo
# con la nueva sesión ya poblada.
if restaurar_sesion_por_usuario_url():
    st.rerun()

# Sincroniza el rol con la BD en cada render por si se modificó en caliente.
refrescar_datos_usuario()

if not st.session_state.autenticado:
    # -------------------------------------------------------------------------
    # 4.A  PANTALLA DE LOGIN (usuario anónimo)
    # -------------------------------------------------------------------------
    st.write("")
    col_log1, col_log2, col_log3 = st.columns([1, 0.8, 1])
    with col_log2:
        try: st.image("logo_colbeef.png", use_container_width=True)
        except: st.markdown("<h1 style='text-align:center; color:#800020;'>COLBEEF</h1>", unsafe_allow_html=True)
    st.markdown('<p class="main-title">INVENTARIO DE SUBPRODUCTOS</p>', unsafe_allow_html=True)
    with st.columns([1, 1, 1])[1]:
        with st.form("login_form"):
            u_in = st.text_input("Usuario")
            p_in = st.text_input("Contraseña", type="password")
            if st.form_submit_button("INGRESAR AL SISTEMA"):
                conn = conectar(); cursor = conn.cursor(dictionary=True)
                cursor.execute("SELECT id, nombre, rol FROM usuarios WHERE nombre = %s AND PASSWORD = %s", (u_in, p_in))
                res = cursor.fetchone()
                if res:
                    st.session_state.autenticado = True
                    st.session_state.logout_manual = False
                    st.session_state.user_id = res['id']
                    st.session_state.nombre, st.session_state.rol = res['nombre'], res['rol']
                    registrar_log("Inicio de Sesión"); st.rerun()
                else: st.error("❌ Datos incorrectos")
                conn.close()
    st.markdown('<a href="http://192.168.20.205:8000/site.html" target="_self" style="display:block; text-align:center; color:#800020; font-weight:bold; text-decoration:none; margin-top:10px;">🏠 VOLVER A SUITE</a>', unsafe_allow_html=True)
    mostrar_firma()
else:
    # -------------------------------------------------------------------------
    # 4.B  APLICACIÓN AUTENTICADA — Sidebar + Router por menú
    # -------------------------------------------------------------------------
    try: st.sidebar.image("logo_colbeef.png", use_container_width=True)
    except: pass
    st.sidebar.title(f"👋 {st.session_state.nombre}")
    st.sidebar.caption(f"Perfil: {st.session_state.rol}")
    st.sidebar.divider()

    # --- HABILITACIÓN DE MENÚS POR ROL ---
    # Primera línea de defensa: solo se muestran las opciones permitidas para
    # el rol activo. Los handlers internos revalidan el rol como segunda línea
    # de defensa por si el estado se manipula.
    # ---------------------------------------------------------------------
    # Matriz efectiva de menús por rol
    # ---------------------------------------------------------------------
    #   Consulta          : solo módulos de lectura + reporte de vencimientos.
    #   Operador          : lectura + registro (todos los tipos salvo los que
    #                       apliquen validaciones específicas del form).
    #   Medico Veterinario: lectura, DEVOLUCION únicamente, y edición de
    #                       fechas de vencimiento.
    #   Administrador     : todo lo anterior + gestión de registros + catálogo.
    #   Super Admin       : full control + estadísticas + usuarios.
    # Todos los roles pueden ver el "⚠️ Reporte de Vencimientos".
    # ---------------------------------------------------------------------
    rol_actual = st.session_state.rol
    # Bloque OPERATIVO (visible para todos los roles autenticados).
    menu_ops = ["📊 Stock Real", "🕘 Historial y Reportes", "⚠️ Reporte de Vencimientos"]

    # El registro de movimientos aplica a Operador+, Admin, Super Admin y al
    # rol Medico Veterinario (con acotamiento a DEVOLUCION dentro del módulo).
    if rol_actual in ["Operador", "Administrador", "Super Admin", "Medico Veterinario"]:
        menu_ops.insert(1, "➕ Registrar Movimiento")

    # Bloque CALIDAD: fechas de vencimiento (Admin, Super Admin, Médico Vet.).
    if rol_actual in ["Administrador", "Super Admin", "Medico Veterinario"]:
        menu_ops.append("🗓️ Fechas de Vencimiento")

    # Bloque ADMINISTRACIÓN (Admin / Super Admin).
    if rol_actual in ["Administrador", "Super Admin"]:
        menu_ops.append("🛠️ Gestión de Registros")
        menu_ops.append("📦 Catálogo de productos")
        menu_ops.append("🏪 Gestión de Almacenes")

    # Bloque SUPER ADMIN (métricas y usuarios).
    if rol_actual == "Super Admin":
        menu_ops.append("📈 Estadísticas de uso")
        menu_ops.append("⚙️ Gestión de Usuarios")

    menu = st.sidebar.radio("📋 Menú Principal", menu_ops)

    # Navegación inter-módulos de la suite Colbeef.
    # Se pasa el nombre del usuario en el query string para habilitar el SSO
    # ligero en la app receptora (ver ``restaurar_sesion_por_usuario_url``).
    url_lib = f"http://192.168.20.205:8080/?vista=historial&usuario={st.session_state.nombre}"
    url_visceras = f"http://192.168.20.205:3001/gestor.html?usuario={st.session_state.nombre}"
    st.sidebar.markdown(f'<div class="nav-container"><a href="{url_visceras}" target="_self" class="btn-nav btn-visceras">🥩 VISCERAS</a><a href="http://192.168.20.205:8000/site.html" target="_self" class="btn-nav btn-suite">🏠 IR A SUITE</a><a href="{url_lib}" target="_self" class="btn-nav btn-librillos">📚 SOFTWARE LIBRILLOS</a></div>', unsafe_allow_html=True)
    
    if st.sidebar.button("🚪 Cerrar Sesión"):
        # ``logout_manual`` blinda el flujo: aunque la URL aún contenga
        # ``?usuario=...``, no se reautenticará hasta un nuevo enlace.
        st.session_state.autenticado = False
        st.session_state.logout_manual = True
        st.session_state.user_id = None
        st.session_state.nombre = ""
        st.session_state.rol = ""
        st.rerun()

    st.markdown(f'<p class="main-title">{menu.upper()}</p>', unsafe_allow_html=True)
    st.divider()

    # =========================================================================
    # MÓDULO: Registrar Movimiento
    # -------------------------------------------------------------------------
    # Formulario dinámico condicionado por el tipo de movimiento:
    #   * INGRESO/AJUSTE       → destino fijo CAVA INTERNA. La FECHA_VENCIMIENTO
    #                            se calcula automáticamente SI el producto tiene
    #                            vida útil configurada; si no la tiene, el
    #                            movimiento se registra con FECHA_VENCIMIENTO
    #                            NULL (nunca se bloquea el guardado).
    #   * SALIDA POR DESPACHO  → almacén obligatorio (de la tabla almacenes)
    #                            + campo remisión opcional.
    #   * MERMA                → destino fijo DESPERDICIO.
    #   * DEVOLUCION           → resta del stock; destino DEVOLUCION;
    #                            remisión opcional para trazabilidad.
    #
    # Restricciones por rol:
    #   * Consulta                    → sin acceso (mensaje de solo lectura).
    #   * Medico Veterinario          → SOLO DEVOLUCION (control sanitario/calidad).
    #   * Operador                    → todos los tipos EXCEPTO DEVOLUCION
    #                                    (la devolución es competencia de calidad).
    #   * Administrador / Super Admin → toda la whitelist.
    #
    # El widget de "Tipo" se ubica FUERA de st.form a propósito: los widgets
    # dentro de un form no disparan rerun hasta el submit, por lo que las
    # dependencias condicionales (remisión, almacén, vencimiento) no
    # aparecerían con el valor correcto.
    # =========================================================================
    if menu == "➕ Registrar Movimiento":
        if st.session_state.rol == "Consulta":
            st.error("🚫 Su perfil es de solo lectura.")
        else:
            st.header("➕ Registrar Movimiento")
            lista_prod = cargar_nombres_productos()
            vida_util_map = cargar_vida_util_productos()
            conn = conectar()
            df_dest = pd.read_sql("SELECT nombre_almacen FROM almacenes ORDER BY nombre_almacen ASC", conn)
            conn.close()
            destinos_registrados = (
                df_dest["nombre_almacen"].dropna().astype(str).str.strip().tolist()
                if not df_dest.empty and "nombre_almacen" in df_dest.columns
                else []
            )

            # Filtrado de tipos disponibles según rol (regla de negocio):
            #   * Medico Veterinario  → SOLO DEVOLUCION (control de calidad).
            #   * Operador            → TODOS los tipos EXCEPTO DEVOLUCION
            #                            (la devolución es competencia de
            #                            calidad/veterinario, no operativa).
            #   * Administrador / Super Admin → toda la whitelist.
            rol_actual_reg = st.session_state.rol
            if rol_actual_reg == "Medico Veterinario":
                tipos_disponibles = ["DEVOLUCION"]
                st.info(
                    "🩺 Su perfil **Médico Veterinario** solo permite registrar movimientos "
                    "de tipo **DEVOLUCIÓN** (control de calidad)."
                )
            elif rol_actual_reg == "Operador":
                tipos_disponibles = [t for t in TIPOS_MOVIMIENTO_OFICIALES if t != "DEVOLUCION"]
                st.caption(
                    "ℹ️ El tipo **DEVOLUCIÓN** es exclusivo del perfil **Médico Veterinario**."
                )
            else:
                tipos_disponibles = list(TIPOS_MOVIMIENTO_OFICIALES)

            tipo = st.selectbox(
                "Tipo de Movimiento",
                tipos_disponibles,
                key="registro_tipo_movimiento",
            )

            # ---------------------------------------------------------------
            # Producto se selecciona TAMBIÉN fuera del st.form: para los
            # ingresos necesitamos mostrar la fecha de vencimiento calculada
            # ANTES de guardar. Si el producto viviera dentro del form no
            # habría rerun al cambiarlo y la vista previa quedaría desfasada.
            # ---------------------------------------------------------------
            if lista_prod:
                prod = st.selectbox(
                    "Producto", lista_prod, key="registro_producto"
                )
            else:
                st.warning(
                    "No hay productos disponibles. Un **Administrador** o **Super Admin** "
                    "debe definirlos en **📦 Catálogo de productos**."
                )
                prod = ""

            # Vista previa de vencimiento.
            # Regla de negocio (flexible): la vida útil es OPCIONAL.
            #   * Si el producto la tiene configurada  → se calcula la fecha
            #     de vencimiento y se muestra al usuario.
            #   * Si NO la tiene o es inválida         → se guarda el ingreso
            #     con FECHA_VENCIMIENTO = NULL (aparece como "N/A" en el
            #     reporte de vencimientos hasta que se configure y recalcule).
            # El submit nunca se bloquea por vida útil ausente.
            vida_util = vida_util_map.get(prod) if prod else None
            fecha_vto_calc = None
            if tipo in TIPOS_QUE_INGRESAN and prod:
                if vida_util is None:
                    st.caption(
                        f"ℹ️ El producto **{prod}** no tiene **días de vida útil** configurados. "
                        "Se registrará **sin fecha de vencimiento**. Un administrador o médico "
                        "veterinario puede configurarla en **🗓️ Fechas de Vencimiento** y luego "
                        "usar el **recálculo masivo** para asignar la fecha a lotes ya registrados."
                    )
                elif vida_util <= 0:
                    st.caption(
                        f"ℹ️ La vida útil configurada para **{prod}** es {vida_util} días "
                        "(no válida). Se registrará sin fecha de vencimiento."
                    )
                else:
                    fecha_vto_calc = date.today() + timedelta(days=int(vida_util))
                    st.info(
                        f"🗓️ **Vida útil** de {prod}: **{vida_util} días** · "
                        f"Fecha de vencimiento calculada: **{fecha_vto_calc.isoformat()}**"
                    )

            with st.form("form_registro", clear_on_submit=True):
                peso = st.number_input("Peso Neto (kg)", min_value=0.0, step=0.01)

                dest_final = "CAVA INTERNA"
                remi = ""

                # --- Configuración por tipo de movimiento ---
                if tipo == "SALIDA POR DESPACHO":
                    if destinos_registrados:
                        dest_final = st.selectbox("Almacén / destino", destinos_registrados)
                    else:
                        st.warning("No hay destinos en **almacenes**. Debe existir al menos un almacén para registrar una salida.")
                        dest_final = ""
                    remi = st.text_input(
                        "Remisión (si aplica a salida por despacho)",
                        placeholder="Opcional — Ej. REM-MIG",
                    )
                elif tipo == "MERMA":
                    dest_final = "DESPERDICIO"
                elif tipo == "DEVOLUCION":
                    # Devolución: representa producto que sale del stock por
                    # un evento de calidad (rechazo del cliente, no conformidad,
                    # decomiso sanitario, etc.). El destino queda etiquetado
                    # como DEVOLUCION para diferenciarlo en reportes.
                    dest_final = "DEVOLUCION"
                    remi = st.text_input(
                        "Remisión / referencia de devolución",
                        placeholder="Opcional — Nº guía, cliente, motivo breve",
                    )
                # Para INGRESO / AJUSTE: la fecha de vencimiento NO se pide al
                # usuario; se calcula a partir de la vida útil configurada del
                # producto. La vista previa ya se mostró arriba del form.

                if st.form_submit_button("💾 GUARDAR"):
                    if not lista_prod or not prod:
                        st.error("Debe existir al menos un producto en el catálogo para guardar.")
                    elif tipo not in TIPOS_MOVIMIENTO_OFICIALES:
                        st.error("Tipo de movimiento no permitido.")
                    elif tipo not in tipos_disponibles:
                        st.error("Su perfil no está autorizado para este tipo de movimiento.")
                    elif peso <= 0:
                        st.error("El peso debe ser mayor que cero.")
                    elif tipo == "SALIDA POR DESPACHO" and (not destinos_registrados or not dest_final):
                        st.error("Debe existir un destino registrado y seleccionado para la salida.")
                    else:
                        # Solo SALIDA y DEVOLUCION persisten remisión; los demás
                        # tipos guardan cadena vacía por consistencia.
                        if tipo in ("SALIDA POR DESPACHO", "DEVOLUCION"):
                            remision_db = (remi or "").strip()
                        else:
                            remision_db = ""

                        # FECHA_VENCIMIENTO calculada automáticamente y persistida
                        # únicamente en INGRESO / AJUSTE.
                        vto_db = fecha_vto_calc if tipo in TIPOS_QUE_INGRESAN else None

                        conn = conectar()
                        cur = conn.cursor()
                        cur.execute(
                            "INSERT INTO movimientos "
                            "(TIPO_DE_MOVIMIENTO, PRODUCTO, PESO, ALMACEN_DESTINO, REMISION, "
                            " FECHA, FECHA_VENCIMIENTO, NOMBRE_USUARIO) "
                            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                            (
                                tipo, prod, peso, dest_final, remision_db,
                                datetime.now(), vto_db, st.session_state.nombre,
                            ),
                        )
                        id_nuevo = cur.lastrowid
                        conn.commit()
                        conn.close()

                        # Diff completo para el historial auditable del ID.
                        det_crear = (
                            f"Tipo: {tipo}; Producto: {prod}; Peso: {peso} kg; "
                            f"Destino: {dest_final}; Remisión: {remision_db or '(vacía)'}; "
                            f"Fecha de vencimiento: {vto_db or '(N/A)'}"
                            + (f" (vida útil {vida_util} días)" if vto_db else "")
                        )
                        registrar_historial_movimiento(id_nuevo, "CREAR", det_crear)
                        registrar_log(f"Registro: {tipo} {prod}")
                        st.success("✅ Guardado correctamente.")
                        time.sleep(1)
                        st.rerun()

    # =========================================================================
    # MÓDULO: Gestión de Usuarios  (solo Super Admin)
    # -------------------------------------------------------------------------
    # CRUD sobre la tabla ``usuarios``. El ID es INMUTABLE (trazabilidad).
    # Auto-protecciones:
    #   * Contraseña vacía en edición ⇒ conserva la actual.
    #   * No se permite eliminar el propio usuario en sesión.
    #   * El acceso al selector es por índice del DataFrame para evitar
    #     IndexError cuando la tabla se muta entre reruns.
    # =========================================================================
    elif menu == "⚙️ Gestión de Usuarios":
        if st.session_state.rol != "Super Admin":
            st.error("🚫 Solo el perfil Super Admin puede gestionar usuarios.")
        else:
            st.header("👤 Control de Usuarios")
            conn = conectar()
            df_u = pd.read_sql("SELECT id, nombre, rol, password FROM usuarios ORDER BY id ASC", conn)
            conn.close()

            st.caption("La tabla mantiene el **ID fijo** de cada fila: la trazabilidad en el sistema y en logs se hace por ese identificador.")
            st.dataframe(df_u, use_container_width=True)

            roles_u = ["Consulta", "Operador", "Medico Veterinario", "Administrador", "Super Admin"]

            with st.expander("➕ Crear usuario", expanded=True):
                with st.form("u_create", clear_on_submit=True):
                    n_nom = st.text_input("Nombre de usuario (login)")
                    n_rol = st.selectbox("Rol", roles_u)
                    n_pas = st.text_input("Contraseña", type="password")
                    if st.form_submit_button("Crear usuario"):
                        if not (n_nom or "").strip() or not (n_pas or "").strip():
                            st.error("Nombre y contraseña son obligatorios para un usuario nuevo.")
                        else:
                            conn = conectar()
                            cur = conn.cursor()
                            cur.execute(
                                "INSERT INTO usuarios (nombre, rol, password) VALUES (%s,%s,%s)",
                                (n_nom.strip(), n_rol, n_pas),
                            )
                            id_nuevo = cur.lastrowid
                            conn.commit()
                            conn.close()
                            registrar_log(f"Creó usuario {n_nom.strip()} (id={id_nuevo})")
                            st.success("Usuario creado. El **ID** lo asigna la base de datos automáticamente.")
                            time.sleep(1)
                            st.rerun()

            with st.expander("✏️ Modificar usuario (ID fijo, no editable)", expanded=False):
                if df_u.empty:
                    st.info("No hay usuarios registrados para modificar.")
                else:
                    def _etiqueta_mod(i):
                        r = df_u.iloc[i]
                        return f"ID {int(r['id'])} — {r['nombre']}"

                    idx_sel = st.selectbox(
                        "Seleccione el usuario a modificar",
                        list(range(len(df_u))),
                        format_func=_etiqueta_mod,
                        key="u_selector_modificar",
                    )
                    rsel = df_u.iloc[idx_sel]
                    id_fijo = int(rsel["id"])
                    st.text_input(
                        "ID de usuario (trazabilidad, no se puede editar)",
                        value=str(id_fijo),
                        disabled=True,
                        help="El ID es la clave fija en la base de datos. No cambia aunque actualice el nombre o el rol.",
                    )
                    rol_actual = str(rsel.get("rol", "") or "")
                    with st.form(f"u_edit_{id_fijo}"):
                        m_nom = st.text_input("Nombre", value=str(rsel.get("nombre", "") or ""))
                        m_rol = st.selectbox("Rol", roles_u, index=roles_u.index(rol_actual) if rol_actual in roles_u else 0)
                        m_pas = st.text_input(
                            "Nueva contraseña",
                            type="password",
                            placeholder="(Opcional) Deje vacío para no cambiar la contraseña actual",
                        )
                        if st.form_submit_button("Guardar cambios"):
                            if not (m_nom or "").strip():
                                st.error("El nombre no puede quedar vacío.")
                            else:
                                pwd = (m_pas or "").strip()
                                if not pwd:
                                    pwd = rsel.get("password") or ""
                                conn = conectar()
                                cur = conn.cursor()
                                cur.execute(
                                    "UPDATE usuarios SET nombre=%s, rol=%s, password=%s WHERE id=%s",
                                    (m_nom.strip(), m_rol, pwd, id_fijo),
                                )
                                conn.commit()
                                conn.close()
                                registrar_log(
                                    f"Editó usuario ID {id_fijo} (mismo id; nombre/rol/contraseña actualizados si aplica)"
                                )
                                st.success("Cambios guardados. El **ID** del usuario se mantiene para trazabilidad.")
                                time.sleep(1)
                                st.rerun()

            with st.expander("Eliminar usuario"):
                id_del = st.number_input("ID del usuario a eliminar", min_value=1, key="del_u_id")
                if st.button("🗑️ ELIMINAR USUARIO", key="del_u_btn"):
                    if id_del == st.session_state.get("user_id"):
                        st.error("No puede eliminar el usuario de su propia sesión.")
                    else:
                        conn = conectar(); cur = conn.cursor()
                        cur.execute("DELETE FROM usuarios WHERE id=%s", (id_del,))
                        conn.commit(); conn.close()
                        registrar_log(f"Eliminó usuario ID {id_del}")
                        st.success("Usuario eliminado."); time.sleep(1); st.rerun()

    # =========================================================================
    # MÓDULO: Estadísticas de uso  (solo Super Admin)
    # -------------------------------------------------------------------------
    # Panel KPI derivado de ``log_actividad`` y ``movimientos``. Ejecuta cinco
    # consultas independientes (log muestra, ingresos por usuario, log por
    # día, movimientos por usuario/tipo/día). Todas envueltas en un try/except
    # global que reporta el error de forma controlada en la UI.
    # =========================================================================
    elif menu == "📈 Estadísticas de uso":
        if st.session_state.rol != "Super Admin":
            st.error("🚫 Solo el perfil Super Admin puede ver estadísticas de uso.")
        else:
            st.header("📈 Estadísticas de uso")
            st.caption("Actividad registrada en **log_actividad** y volumen de **movimientos** por usuario y tipo.")

            df_log = pd.DataFrame()
            df_log_dia = pd.DataFrame()
            df_ingresos_usuario = pd.DataFrame()
            df_mov_user = pd.DataFrame()
            df_mov_tipo = pd.DataFrame()
            df_mov_dia = pd.DataFrame()
            err_msg = None
            try:
                conn = conectar()
                df_log = pd.read_sql(
                    "SELECT nombre_usuario, accion, fecha_hora, rol FROM log_actividad ORDER BY fecha_hora DESC LIMIT 2500",
                    conn,
                )
                # Todos los ingresos reales al módulo (login manual + sesión restaurada al volver de Librillos)
                df_ingresos_usuario = pd.read_sql(
                    """
                    SELECT COALESCE(NULLIF(TRIM(nombre_usuario), ''), '(sin usuario en log)') AS usuario,
                           COUNT(*) AS ingresos
                    FROM log_actividad
                    WHERE accion IN ('Inicio de Sesión', 'Sesión restaurada por retorno desde Librillos')
                    GROUP BY COALESCE(NULLIF(TRIM(nombre_usuario), ''), '(sin usuario en log)')
                    ORDER BY ingresos DESC, usuario ASC
                    """,
                    conn,
                )
                df_log_dia = pd.read_sql(
                    """
                    SELECT DATE(fecha_hora) AS dia, COUNT(*) AS eventos
                    FROM log_actividad
                    GROUP BY DATE(fecha_hora)
                    ORDER BY dia DESC
                    LIMIT 45
                    """,
                    conn,
                )
                df_mov_user = pd.read_sql(
                    """
                    SELECT NOMBRE_USUARIO AS usuario, COUNT(*) AS registros
                    FROM movimientos
                    GROUP BY NOMBRE_USUARIO
                    ORDER BY registros DESC
                    """,
                    conn,
                )
                df_mov_tipo = pd.read_sql(
                    """
                    SELECT TIPO_DE_MOVIMIENTO AS tipo, COUNT(*) AS registros
                    FROM movimientos
                    GROUP BY TIPO_DE_MOVIMIENTO
                    ORDER BY registros DESC
                    """,
                    conn,
                )
                df_mov_dia = pd.read_sql(
                    """
                    SELECT DATE(FECHA) AS dia, COUNT(*) AS movimientos
                    FROM movimientos
                    GROUP BY DATE(FECHA)
                    ORDER BY dia DESC
                    LIMIT 45
                    """,
                    conn,
                )
                conn.close()
            except Exception as ex:
                err_msg = str(ex)

            if err_msg:
                st.error(f"No se pudieron cargar las estadísticas: {err_msg}")
            else:
                n_log = len(df_log)
                n_users_log = df_log["nombre_usuario"].nunique() if n_log and "nombre_usuario" in df_log.columns else 0
                n_inicios = (
                    int((df_log["accion"] == "Inicio de Sesión").sum())
                    if n_log and "accion" in df_log.columns
                    else 0
                )
                n_mov = int(df_mov_user["registros"].sum()) if not df_mov_user.empty and "registros" in df_mov_user.columns else 0

                m1, m2, m3, m4 = st.columns(4)
                m1.metric("Líneas de log (muestra)", n_log)
                m2.metric("Usuarios distintos en log", n_users_log)
                m3.metric("Inicios de sesión (en muestra)", n_inicios)
                m4.metric("Total movimientos (hist.)", n_mov)

                st.subheader("Ingresos al inventario por usuario (todo el historial de log)")
                st.caption(
                    "Cada barra = total de accesos registrados: **Inicio de Sesión** y **vuelta desde Librillos** (sesión restaurada)."
                )
                if not df_ingresos_usuario.empty and "ingresos" in df_ingresos_usuario.columns:
                    mx = int(df_ingresos_usuario["ingresos"].max())
                    top_mask = df_ingresos_usuario["ingresos"] == mx
                    top_names = df_ingresos_usuario.loc[top_mask, "usuario"].astype(str).tolist()
                    c_top1, c_top2 = st.columns([2, 1])
                    with c_top1:
                        st.bar_chart(
                            df_ingresos_usuario.set_index("usuario")[["ingresos"]],
                            use_container_width=True,
                        )
                    with c_top2:
                        if len(top_names) == 1:
                            st.metric("Mayor actividad (ingresos)", top_names[0], delta=f"{mx} accesos")
                        else:
                            st.metric(
                                "Mayor actividad (ingresos)",
                                "Empate",
                                delta=f"{mx} accesos c/u",
                            )
                            for u in top_names:
                                st.caption(f"• {u}")
                    st.dataframe(
                        df_ingresos_usuario,
                        use_container_width=True,
                        hide_index=True,
                    )
                else:
                    st.info(
                        "Aún no hay eventos de ingreso en el log, o la tabla no contiene acciones de sesión. "
                        "Inicie sesión o entre desde Librillos para acumular datos."
                    )

                st.subheader("Eventos de log por día")
                if not df_log_dia.empty:
                    df_chart = df_log_dia.sort_values("dia").set_index("dia")
                    st.bar_chart(df_chart)
                else:
                    st.info("Sin datos de log agrupados por día.")

                c_a, c_b = st.columns(2)
                with c_a:
                    st.subheader("Movimientos por usuario")
                    if not df_mov_user.empty:
                        st.bar_chart(df_mov_user.set_index("usuario"))
                    else:
                        st.info("Sin movimientos.")
                with c_b:
                    st.subheader("Movimientos por tipo")
                    if not df_mov_tipo.empty:
                        st.bar_chart(df_mov_tipo.set_index("tipo"))
                    else:
                        st.info("Sin movimientos.")

                st.subheader("Movimientos registrados por día")
                if not df_mov_dia.empty:
                    st.bar_chart(df_mov_dia.sort_values("dia").set_index("dia"))
                else:
                    st.info("Sin movimientos por día.")

                st.subheader("Últimos eventos de actividad")
                if n_log:
                    st.dataframe(df_log.head(400), use_container_width=True, hide_index=True)
                else:
                    st.info("La tabla **log_actividad** está vacía o no devolvió filas.")

    # =========================================================================
    # MÓDULO: Gestión de Registros  (Administrador / Super Admin)
    # -------------------------------------------------------------------------
    # Edición y eliminación de movimientos con auditoría fina: cada cambio se
    # compara campo a campo contra el estado previo y se persiste el diff en
    # ``historial_movimiento``. La eliminación también se registra ANTES del
    # DELETE para preservar el rastro.
    # =========================================================================
    elif menu == "🛠️ Gestión de Registros":
        st.header("🛠️ Edición, eliminación y auditoría")
        conn = conectar(); df_adm = pd.read_sql("SELECT * FROM movimientos ORDER BY FECHA DESC LIMIT 100", conn); df_dest = pd.read_sql("SELECT nombre_almacen FROM almacenes ORDER BY nombre_almacen ASC", conn); conn.close()

        tipos_mov = list(TIPOS_MOVIMIENTO_OFICIALES)
        productos_list = cargar_nombres_productos()

        st.info("Seleccione una fila para editar o eliminar:")
        sel_r = st.dataframe(df_adm, use_container_width=True, on_select="rerun", selection_mode="single-row", key="audit_table")

        if sel_r.selection.rows:
            row_idx = sel_r.selection.rows[0]
            if row_idx < len(df_adm):
                row_data = df_adm.iloc[row_idx]
                id_mov = int(row_data['ID_MOVIMIENTOS'])
                cur_tipo = str(row_data.get("TIPO_DE_MOVIMIENTO", "") or "")
                cur_prod = str(row_data.get("PRODUCTO", "") or "")
                try:
                    cur_peso = float(row_data["PESO"])
                except (TypeError, ValueError):
                    cur_peso = 0.0
                cur_alm = str(row_data.get("ALMACEN_DESTINO", "") or "")
                rem_raw = row_data.get("REMISION", "")
                cur_rem = "" if pd.isna(rem_raw) else str(rem_raw)
                # Fecha de vencimiento actual (puede venir NULL en registros antiguos).
                vto_raw = row_data.get("FECHA_VENCIMIENTO", None) if "FECHA_VENCIMIENTO" in df_adm.columns else None
                if vto_raw is None or (isinstance(vto_raw, float) and pd.isna(vto_raw)) or pd.isna(vto_raw):
                    cur_vto = None
                else:
                    # Normalizar a datetime.date sin importar si viene como
                    # date, datetime, Timestamp o string.
                    try:
                        cur_vto = pd.to_datetime(vto_raw).date()
                    except Exception:
                        cur_vto = None

                with st.expander(f"✏️ Editar movimiento #{id_mov}", expanded=True):
                    # Tipo fuera del form (misma razón que en Registrar Movimiento).
                    e_tipo = st.selectbox(
                        "Tipo de movimiento",
                        tipos_mov,
                        index=tipos_mov.index(cur_tipo) if cur_tipo in tipos_mov else 0,
                        key=f"edit_tipo_mov_{id_mov}",
                    )
                    with st.form(f"edit_mov_{id_mov}"):
                        e_prod = st.selectbox("Producto", productos_list, index=productos_list.index(cur_prod) if cur_prod in productos_list else 0)
                        e_peso = st.number_input("Peso (kg)", min_value=0.0, value=float(cur_peso), step=0.01)
                        e_rem = ""
                        e_vto = None
                        if e_tipo == "SALIDA POR DESPACHO":
                            opts = df_dest["nombre_almacen"].tolist() if not df_dest.empty else []
                            if opts:
                                e_alm = st.selectbox("Almacén / destino", opts, index=opts.index(cur_alm) if cur_alm in opts else 0)
                            else:
                                e_alm = st.text_input("Almacén / destino", value=cur_alm)
                            e_rem = st.text_input("Remisión (si aplica a salida por despacho)", value=cur_rem)
                        elif e_tipo == "MERMA":
                            e_alm = "DESPERDICIO"
                            st.caption("Destino: DESPERDICIO")
                        elif e_tipo == "DEVOLUCION":
                            e_alm = "DEVOLUCION"
                            st.caption("Destino: DEVOLUCION")
                            e_rem = st.text_input("Remisión / referencia de devolución", value=cur_rem)
                        else:
                            # Ingresos: destino por defecto y fecha de vencimiento editable.
                            e_alm = st.text_input("Almacén / destino", value=cur_alm or "CAVA INTERNA")
                            e_vto = st.date_input(
                                "Fecha de vencimiento del lote",
                                value=cur_vto if cur_vto else date.today() + timedelta(days=30),
                                help="Aplica solo a INGRESO DE PRODUCCION y ENTRADA POR AJUSTE.",
                            )
                        if st.form_submit_button("💾 GUARDAR CAMBIOS"):
                            # Reglas de persistencia por tipo (mantienen consistencia
                            # con el formulario de Registrar Movimiento).
                            if e_tipo in ("SALIDA POR DESPACHO", "DEVOLUCION"):
                                remision_db = (e_rem or "").strip()
                            else:
                                remision_db = ""
                            vto_db = e_vto if e_tipo in TIPOS_QUE_INGRESAN else None

                            cambios = []
                            if str(cur_tipo) != str(e_tipo):
                                cambios.append(f"Tipo: «{cur_tipo}» → «{e_tipo}»")
                            if str(cur_prod) != str(e_prod):
                                cambios.append(f"Producto: «{cur_prod}» → «{e_prod}»")
                            if abs(float(cur_peso) - float(e_peso)) > 1e-9:
                                cambios.append(f"Peso: {cur_peso} → {e_peso} kg")
                            if str(cur_alm) != str(e_alm):
                                cambios.append(f"Destino: «{cur_alm}» → «{e_alm}»")
                            cur_rem_cmp = (cur_rem or "").strip()
                            if cur_rem_cmp != (remision_db or "").strip():
                                cambios.append(f"Remisión: «{cur_rem_cmp or '(vacía)'}» → «{(remision_db or '').strip() or '(vacía)'}»")
                            if (cur_vto or None) != (vto_db or None):
                                cambios.append(f"Vencimiento: «{cur_vto or '(N/A)'}» → «{vto_db or '(N/A)'}»")

                            conn = conectar()
                            cur = conn.cursor()
                            cur.execute(
                                "UPDATE movimientos SET TIPO_DE_MOVIMIENTO=%s, PRODUCTO=%s, "
                                "PESO=%s, ALMACEN_DESTINO=%s, REMISION=%s, FECHA_VENCIMIENTO=%s "
                                "WHERE ID_MOVIMIENTOS=%s",
                                (e_tipo, e_prod, e_peso, e_alm, remision_db, vto_db, id_mov),
                            )
                            conn.commit()
                            conn.close()
                            if cambios:
                                registrar_historial_movimiento(id_mov, "ACTUALIZAR", "; ".join(cambios))
                            registrar_log(f"Editó movimiento {id_mov}")
                            st.success("Cambios guardados."); time.sleep(1); st.rerun()

                st.warning(f"Eliminar definitivamente el registro #{id_mov}")
                if st.button("🗑️ ELIMINAR REGISTRO", key=f"del_mov_{id_mov}"):
                    registrar_historial_movimiento(
                        id_mov,
                        "ELIMINAR",
                        "El registro fue eliminado desde 🛠️ Gestión de Registros.",
                    )
                    conn = conectar()
                    cur = conn.cursor()
                    cur.execute("DELETE FROM movimientos WHERE ID_MOVIMIENTOS=%s", (id_mov,))
                    conn.commit()
                    conn.close()
                    registrar_log(f"Eliminó movimiento {id_mov}")
                    st.rerun()

    # =========================================================================
    # MÓDULO: Catálogo de productos  (Administrador / Super Admin)
    # -------------------------------------------------------------------------
    # Gestor del catálogo maestro. Reglas de integridad:
    #   * Nombre UNIQUE en BD (constraint) + validación en app.
    #   * Renombrar producto cascadea el cambio a ``movimientos`` (por nombre).
    #   * Eliminar producto está BLOQUEADO si existen movimientos que lo
    #     referencian (protección de integridad referencial lógica).
    # =========================================================================
    elif menu == "📦 Catálogo de productos":
        if st.session_state.rol not in ["Administrador", "Super Admin"]:
            st.error("🚫 Solo **Administrador** o **Super Admin** pueden gestionar el catálogo de productos.")
        else:
            st.header("📦 Catálogo de productos")
            st.caption(
                "**Administrador** o **Super Admin**. Listado maestro con **ID fijo**. Crear, editar o **eliminar**; "
                "si renombra, los movimientos con el nombre anterior se actualizan. "
                "**Eliminar** solo está permitido si no hay movimientos con ese producto."
            )
            ensure_catalogo_productos_table()
            seed_catalogo_productos_si_vacio()
            conn = conectar()
            df_p = pd.read_sql("SELECT id, nombre FROM catalogo_productos ORDER BY id ASC", conn)
            conn.close()
            st.dataframe(df_p, use_container_width=True, hide_index=True)

            with st.expander("➕ Crear producto", expanded=True):
                with st.form("prod_create", clear_on_submit=True):
                    n_nombre = st.text_input("Nombre del producto (como aparecerá en movimientos y reportes)")
                    if st.form_submit_button("Crear producto"):
                        if not (n_nombre or "").strip():
                            st.error("El nombre es obligatorio.")
                        else:
                            try:
                                conn = conectar()
                                cur = conn.cursor()
                                cur.execute(
                                    "INSERT INTO catalogo_productos (nombre) VALUES (%s)",
                                    (n_nombre.strip(),),
                                )
                                nid = cur.lastrowid
                                conn.commit()
                                conn.close()
                                registrar_log(f"Creó producto en catálogo id={nid} «{n_nombre.strip()}»")
                                st.success("Producto creado. Ya está disponible en **Registrar movimiento**.")
                                time.sleep(1)
                                st.rerun()
                            except Exception as ex:
                                err = str(ex)
                                if "Duplicate" in err or "1062" in err:
                                    st.error("Ya existe un producto con ese nombre.")
                                else:
                                    st.error(f"No se pudo crear: {err}")

            with st.expander("✏️ Editar producto (ID no modificable)", expanded=False):
                if df_p.empty:
                    st.info("No hay productos en el catálogo.")
                else:
                    def _etiqueta_prod(i):
                        r = df_p.iloc[i]
                        return f"ID {int(r['id'])} — {r['nombre']}"

                    idx_sel = st.selectbox(
                        "Seleccione el producto a editar",
                        list(range(len(df_p))),
                        format_func=_etiqueta_prod,
                        key="catalogo_pick_producto",
                    )
                    rsel = df_p.iloc[idx_sel]
                    id_fijo = int(rsel["id"])
                    nombre_ant = str(rsel.get("nombre", "") or "")
                    st.text_input(
                        "ID de producto (trazabilidad, no editable)",
                        value=str(id_fijo),
                        disabled=True,
                        help="Clave fija en base de datos.",
                    )
                    with st.form(f"prod_edit_{id_fijo}"):
                        m_nombre = st.text_input("Nombre", value=nombre_ant)
                        if st.form_submit_button("Guardar cambios"):
                            nuevo = (m_nombre or "").strip()
                            if not nuevo:
                                st.error("El nombre no puede quedar vacío.")
                            elif nuevo == nombre_ant:
                                st.info("No hay cambios que guardar.")
                            else:
                                try:
                                    conn = conectar()
                                    cur = conn.cursor()
                                    cur.execute(
                                        "UPDATE catalogo_productos SET nombre=%s WHERE id=%s",
                                        (nuevo, id_fijo),
                                    )
                                    cur.execute(
                                        "UPDATE movimientos SET PRODUCTO=%s WHERE PRODUCTO=%s",
                                        (nuevo, nombre_ant),
                                    )
                                    conn.commit()
                                    conn.close()
                                    registrar_log(
                                        f"Editó producto catálogo id={id_fijo}: «{nombre_ant}» → «{nuevo}» (movimientos actualizados)"
                                    )
                                    st.success("Nombre actualizado en catálogo y en movimientos que usaban el nombre anterior.")
                                    time.sleep(1)
                                    st.rerun()
                                except Exception as ex:
                                    err = str(ex)
                                    if "Duplicate" in err or "1062" in err:
                                        st.error("Ya existe otro producto con ese nombre.")
                                    else:
                                        st.error(f"No se pudo guardar: {err}")

            with st.expander("🗑️ Eliminar producto", expanded=False):
                if df_p.empty:
                    st.info("No hay productos para eliminar.")
                else:
                    def _etiqueta_del(i):
                        r = df_p.iloc[i]
                        return f"ID {int(r['id'])} — {r['nombre']}"

                    idx_del = st.selectbox(
                        "Seleccione el producto a eliminar del catálogo",
                        list(range(len(df_p))),
                        format_func=_etiqueta_del,
                        key="catalogo_pick_eliminar",
                    )
                    rdel = df_p.iloc[idx_del]
                    id_del = int(rdel["id"])
                    nom_del = str(rdel.get("nombre", "") or "")
                    try:
                        conn = conectar()
                        cur = conn.cursor()
                        cur.execute(
                            "SELECT COUNT(*) FROM movimientos WHERE PRODUCTO = %s",
                            (nom_del,),
                        )
                        n_mov = int(cur.fetchone()[0])
                        conn.close()
                    except Exception:
                        n_mov = -1
                    if n_mov >= 0:
                        st.caption(f"Movimientos que usan este nombre de producto: **{n_mov}**.")
                    if n_mov > 0:
                        st.warning(
                            "No se puede eliminar mientras existan movimientos con este producto. "
                            "Corrija o elimine esos registros en **Gestión de Registros** o cambie el producto en esos movimientos."
                        )
                    if st.button("🗑️ ELIMINAR producto del catálogo", key=f"btn_del_prod_{id_del}"):
                        if n_mov > 0:
                            st.error("Eliminación bloqueada: hay movimientos asociados.")
                        elif n_mov < 0:
                            st.error("No se pudo verificar movimientos asociados.")
                        else:
                            try:
                                conn = conectar()
                                cur = conn.cursor()
                                cur.execute("DELETE FROM catalogo_productos WHERE id=%s", (id_del,))
                                conn.commit()
                                conn.close()
                                registrar_log(f"Eliminó producto catálogo id={id_del} «{nom_del}» (sin movimientos asociados)")
                                st.success("Producto eliminado del catálogo.")
                                time.sleep(1)
                                st.rerun()
                            except Exception as ex:
                                st.error(f"No se pudo eliminar: {ex}")

    # =========================================================================
    # MÓDULO: Gestión de Almacenes  (Administrador / Super Admin)
    # -------------------------------------------------------------------------
    # CRUD sobre la tabla ``almacenes``. Los almacenes son los destinos válidos
    # para el tipo de movimiento SALIDA POR DESPACHO.
    #
    # Reglas de integridad (mismo patrón que Catálogo de productos):
    #   * ID inmutable (trazabilidad).
    #   * UNIQUE por nombre_almacen (constraint física + validación app).
    #   * Renombrar un almacén cascadea el cambio a movimientos.ALMACEN_DESTINO
    #     y a movimientos.ALMACEN_ORIGEN (relación lógica por nombre).
    #   * Eliminar un almacén está BLOQUEADO si existen movimientos que lo
    #     referencian (protección de integridad referencial lógica).
    # =========================================================================
    elif menu == "🏪 Gestión de Almacenes":
        if st.session_state.rol not in ["Administrador", "Super Admin"]:
            st.error("🚫 Solo **Administrador** o **Super Admin** pueden gestionar almacenes.")
        else:
            st.header("🏪 Gestión de Almacenes / Destinos")
            st.caption(
                "**Administrador** o **Super Admin**. Almacenes / destinos válidos para "
                "**SALIDA POR DESPACHO**. Crear, editar (rename cascada a movimientos) o "
                "eliminar. **Eliminar** solo está permitido si no hay movimientos que "
                "referencien el almacén."
            )
            ensure_almacenes_table()
            conn = conectar()
            df_alm = pd.read_sql(
                "SELECT id, nombre_almacen FROM almacenes ORDER BY id ASC", conn
            )
            conn.close()
            st.dataframe(df_alm, use_container_width=True, hide_index=True)

            # -----------------------------------------------------------------
            #  Crear almacén
            # -----------------------------------------------------------------
            with st.expander("➕ Crear almacén / destino", expanded=True):
                with st.form("alm_create", clear_on_submit=True):
                    n_nombre_alm = st.text_input(
                        "Nombre del almacén / destino (como aparecerá en las salidas)"
                    )
                    if st.form_submit_button("Crear almacén"):
                        nom_norm = (n_nombre_alm or "").strip()
                        if not nom_norm:
                            st.error("El nombre es obligatorio.")
                        else:
                            try:
                                conn = conectar()
                                cur = conn.cursor()
                                # Validación a nivel de aplicación (además de la UNIQUE KEY
                                # física, para dar un mensaje amigable).
                                cur.execute(
                                    "SELECT id FROM almacenes WHERE nombre_almacen = %s",
                                    (nom_norm,),
                                )
                                if cur.fetchone():
                                    conn.close()
                                    st.error("Ya existe un almacén con ese nombre.")
                                else:
                                    cur.execute(
                                        "INSERT INTO almacenes (nombre_almacen) VALUES (%s)",
                                        (nom_norm,),
                                    )
                                    nid = cur.lastrowid
                                    conn.commit()
                                    conn.close()
                                    registrar_log(
                                        f"Creó almacén id={nid} «{nom_norm}»"
                                    )
                                    st.success(
                                        "Almacén creado. Ya está disponible como destino en "
                                        "**Registrar movimiento** (SALIDA POR DESPACHO)."
                                    )
                                    time.sleep(1)
                                    st.rerun()
                            except Exception as ex:
                                err = str(ex)
                                if "Duplicate" in err or "1062" in err:
                                    st.error("Ya existe un almacén con ese nombre.")
                                else:
                                    st.error(f"No se pudo crear: {err}")

            # -----------------------------------------------------------------
            #  Editar almacén (ID inmutable)
            # -----------------------------------------------------------------
            with st.expander("✏️ Editar almacén (ID no modificable)", expanded=False):
                if df_alm.empty:
                    st.info("No hay almacenes registrados.")
                else:
                    def _etiqueta_alm(i):
                        r = df_alm.iloc[i]
                        return f"ID {int(r['id'])} — {r['nombre_almacen']}"

                    idx_sel_alm = st.selectbox(
                        "Seleccione el almacén a editar",
                        list(range(len(df_alm))),
                        format_func=_etiqueta_alm,
                        key="alm_pick_editar",
                    )
                    rsel_alm = df_alm.iloc[idx_sel_alm]
                    id_alm_fijo = int(rsel_alm["id"])
                    nombre_alm_ant = str(rsel_alm.get("nombre_almacen", "") or "")
                    st.text_input(
                        "ID del almacén (trazabilidad, no editable)",
                        value=str(id_alm_fijo),
                        disabled=True,
                        help="Clave fija en base de datos.",
                    )
                    with st.form(f"alm_edit_{id_alm_fijo}"):
                        m_nombre_alm = st.text_input("Nombre", value=nombre_alm_ant)
                        if st.form_submit_button("Guardar cambios"):
                            nuevo_alm = (m_nombre_alm or "").strip()
                            if not nuevo_alm:
                                st.error("El nombre no puede quedar vacío.")
                            elif nuevo_alm == nombre_alm_ant:
                                st.info("No hay cambios que guardar.")
                            else:
                                try:
                                    conn = conectar()
                                    cur = conn.cursor()
                                    # Validación: nombre destino no debe colisionar
                                    # con otro almacén.
                                    cur.execute(
                                        "SELECT id FROM almacenes "
                                        "WHERE nombre_almacen = %s AND id <> %s",
                                        (nuevo_alm, id_alm_fijo),
                                    )
                                    if cur.fetchone():
                                        conn.close()
                                        st.error("Ya existe otro almacén con ese nombre.")
                                    else:
                                        cur.execute(
                                            "UPDATE almacenes SET nombre_almacen=%s WHERE id=%s",
                                            (nuevo_alm, id_alm_fijo),
                                        )
                                        # Cascada por nombre a movimientos (ambos campos).
                                        cur.execute(
                                            "UPDATE movimientos SET ALMACEN_DESTINO=%s "
                                            "WHERE ALMACEN_DESTINO=%s",
                                            (nuevo_alm, nombre_alm_ant),
                                        )
                                        cur.execute(
                                            "UPDATE movimientos SET ALMACEN_ORIGEN=%s "
                                            "WHERE ALMACEN_ORIGEN=%s",
                                            (nuevo_alm, nombre_alm_ant),
                                        )
                                        conn.commit()
                                        conn.close()
                                        registrar_log(
                                            f"Editó almacén id={id_alm_fijo}: "
                                            f"«{nombre_alm_ant}» → «{nuevo_alm}» "
                                            "(movimientos actualizados en cascada)"
                                        )
                                        st.success(
                                            "Nombre actualizado en almacén y en los "
                                            "movimientos que usaban el nombre anterior."
                                        )
                                        time.sleep(1)
                                        st.rerun()
                                except Exception as ex:
                                    err = str(ex)
                                    if "Duplicate" in err or "1062" in err:
                                        st.error("Ya existe otro almacén con ese nombre.")
                                    else:
                                        st.error(f"No se pudo guardar: {err}")

            # -----------------------------------------------------------------
            #  Eliminar almacén (blindado por movimientos asociados)
            # -----------------------------------------------------------------
            with st.expander("🗑️ Eliminar almacén", expanded=False):
                if df_alm.empty:
                    st.info("No hay almacenes para eliminar.")
                else:
                    def _etiqueta_alm_del(i):
                        r = df_alm.iloc[i]
                        return f"ID {int(r['id'])} — {r['nombre_almacen']}"

                    idx_del_alm = st.selectbox(
                        "Seleccione el almacén a eliminar",
                        list(range(len(df_alm))),
                        format_func=_etiqueta_alm_del,
                        key="alm_pick_eliminar",
                    )
                    rdel_alm = df_alm.iloc[idx_del_alm]
                    id_del_alm = int(rdel_alm["id"])
                    nom_del_alm = str(rdel_alm.get("nombre_almacen", "") or "")
                    try:
                        conn = conectar()
                        cur = conn.cursor()
                        cur.execute(
                            "SELECT COUNT(*) FROM movimientos "
                            "WHERE ALMACEN_DESTINO = %s OR ALMACEN_ORIGEN = %s",
                            (nom_del_alm, nom_del_alm),
                        )
                        n_mov_alm = int(cur.fetchone()[0])
                        conn.close()
                    except Exception:
                        n_mov_alm = -1
                    if n_mov_alm >= 0:
                        st.caption(
                            f"Movimientos que referencian este almacén "
                            f"(destino u origen): **{n_mov_alm}**."
                        )
                    if n_mov_alm > 0:
                        st.warning(
                            "No se puede eliminar mientras existan movimientos que "
                            "referencien este almacén. Reasigne o elimine esos registros "
                            "en **Gestión de Registros** antes de continuar."
                        )
                    if st.button(
                        "🗑️ ELIMINAR almacén",
                        key=f"btn_del_alm_{id_del_alm}",
                    ):
                        if n_mov_alm > 0:
                            st.error("Eliminación bloqueada: hay movimientos asociados.")
                        elif n_mov_alm < 0:
                            st.error("No se pudo verificar movimientos asociados.")
                        else:
                            try:
                                conn = conectar()
                                cur = conn.cursor()
                                cur.execute(
                                    "DELETE FROM almacenes WHERE id=%s",
                                    (id_del_alm,),
                                )
                                conn.commit()
                                conn.close()
                                registrar_log(
                                    f"Eliminó almacén id={id_del_alm} «{nom_del_alm}» "
                                    "(sin movimientos asociados)"
                                )
                                st.success("Almacén eliminado.")
                                time.sleep(1)
                                st.rerun()
                            except Exception as ex:
                                st.error(f"No se pudo eliminar: {ex}")

    # =========================================================================
    # MÓDULO: Gestión de Fechas de Vencimiento (Vida útil por producto)
    # -------------------------------------------------------------------------
    # Roles permitidos: Administrador, Super Admin y Medico Veterinario.
    #
    # ¿Qué hace?
    #   Permite editar los DÍAS DE VIDA ÚTIL de cada producto del catálogo.
    #   A partir de ese valor, cuando se registra un movimiento de tipo
    #   INGRESO DE PRODUCCION o ENTRADA POR AJUSTE, la aplicación calcula
    #   automáticamente:
    #
    #       FECHA_VENCIMIENTO = fecha_de_ingreso + vida_util_dias
    #
    #   Esto centraliza el criterio de caducidad por producto y elimina el
    #   error humano de tipear fechas manualmente en cada lote.
    #
    # UX:
    #   * Panel 1: tabla editable con st.data_editor (edición en lote).
    #   * Panel 2: recálculo (opcional) del vencimiento de los lotes ya
    #     registrados que aún no tuvieran fecha (para bases con histórico
    #     previo a la implementación de vida útil).
    #   * Panel 3: listado auxiliar de todos los lotes de ingreso con su
    #     vencimiento actual (solo lectura, filtro por producto).
    #
    # Auditoría: cada cambio de vida útil se registra en log_actividad.
    # =========================================================================
    elif menu == "🗓️ Fechas de Vencimiento":
        if st.session_state.rol not in ["Administrador", "Super Admin", "Medico Veterinario"]:
            st.error("🚫 Su perfil no está autorizado para gestionar fechas de vencimiento.")
        else:
            st.header("🗓️ Vida útil por producto")
            st.caption(
                "Configure los **días de vida útil** de cada producto del catálogo. "
                "Al registrar un ingreso, la fecha de vencimiento se calcula "
                "automáticamente: `fecha_de_ingreso + vida_útil_días`."
            )

            # -----------------------------------------------------------------
            # PANEL 1 — Editor de vida útil por producto (tabla editable)
            # -----------------------------------------------------------------
            ensure_catalogo_productos_table()
            seed_catalogo_productos_si_vacio()
            conn = conectar()
            df_cat = pd.read_sql(
                "SELECT id, nombre, vida_util_dias FROM catalogo_productos ORDER BY id ASC",
                conn,
            )
            conn.close()

            if df_cat.empty:
                st.warning("El catálogo de productos está vacío. Añada productos en **📦 Catálogo de productos**.")
            else:
                # Columna calculada informativa: qué fecha vencería un lote
                # ingresado HOY con esos días de vida útil. Es solo visual.
                df_view = df_cat.copy()
                df_view["ejemplo_vencimiento_hoy"] = df_view["vida_util_dias"].apply(
                    lambda v: (date.today() + timedelta(days=int(v))).isoformat()
                    if pd.notna(v) and v is not None and int(v) > 0 else "—"
                )

                st.markdown("**Editar días de vida útil** (haga clic en la celda para modificar):")
                edited_df = st.data_editor(
                    df_view,
                    column_config={
                        "id": st.column_config.NumberColumn("ID", disabled=True, width="small"),
                        "nombre": st.column_config.TextColumn("Producto", disabled=True),
                        "vida_util_dias": st.column_config.NumberColumn(
                            "Días de vida útil",
                            min_value=0,
                            max_value=3650,
                            step=1,
                            help="Cantidad de días desde la fecha de ingreso hasta el vencimiento.",
                        ),
                        "ejemplo_vencimiento_hoy": st.column_config.TextColumn(
                            "Ejemplo (si ingresa hoy)",
                            disabled=True,
                            help="Fecha de vencimiento calculada para un ingreso registrado hoy.",
                        ),
                    },
                    use_container_width=True,
                    hide_index=True,
                    num_rows="fixed",
                    key="editor_vida_util",
                )

                if st.button("💾 Guardar cambios de vida útil", type="primary"):
                    # Diff por producto: comparamos vida_util_dias antes/después.
                    # Usamos merge por id para robustez ante reordenamientos.
                    df_ant = df_cat[["id", "nombre", "vida_util_dias"]].rename(
                        columns={"vida_util_dias": "vida_util_dias_ant"}
                    )
                    df_nue = edited_df[["id", "vida_util_dias"]].rename(
                        columns={"vida_util_dias": "vida_util_dias_nue"}
                    )
                    merged = df_ant.merge(df_nue, on="id", how="inner")

                    cambios = []
                    for _, row in merged.iterrows():
                        # Normalizamos: tratamos NaN, None y 0-negativos con cuidado.
                        v_ant = row["vida_util_dias_ant"]
                        v_nue = row["vida_util_dias_nue"]
                        v_ant_norm = int(v_ant) if pd.notna(v_ant) else None
                        v_nue_norm = int(v_nue) if pd.notna(v_nue) else None
                        if v_ant_norm != v_nue_norm:
                            cambios.append((int(row["id"]), row["nombre"], v_ant_norm, v_nue_norm))

                    if not cambios:
                        st.info("No hay cambios que guardar.")
                    else:
                        try:
                            conn = conectar()
                            cur = conn.cursor()
                            for id_prod, nom_prod, v_ant, v_nue in cambios:
                                cur.execute(
                                    "UPDATE catalogo_productos SET vida_util_dias=%s WHERE id=%s",
                                    (v_nue, id_prod),
                                )
                            conn.commit()
                            conn.close()
                            # Auditoría: una entrada de log por producto modificado.
                            for id_prod, nom_prod, v_ant, v_nue in cambios:
                                registrar_log(
                                    f"Actualizó vida útil de '{nom_prod}' (id={id_prod}): "
                                    f"{v_ant if v_ant is not None else 'N/A'} → "
                                    f"{v_nue if v_nue is not None else 'N/A'} días"
                                )
                            st.success(f"✅ {len(cambios)} producto(s) actualizado(s).")
                            time.sleep(1)
                            st.rerun()
                        except Exception as ex:
                            st.error(f"No se pudo guardar: {ex}")

            st.divider()

            # -----------------------------------------------------------------
            # PANEL 2 — Recalcular vencimientos de lotes ya registrados
            # -----------------------------------------------------------------
            # Utilidad para bases con histórico anterior a la vida útil: aplica
            # la vida útil actual al FECHA de cada lote de INGRESO/AJUSTE que
            # NO tenga fecha de vencimiento aún.
            st.subheader("🔄 Recalcular vencimiento de lotes existentes")
            st.caption(
                "Aplica la vida útil actualmente configurada por producto a los "
                "lotes de ingreso que **aún no tienen fecha de vencimiento** en la BD. "
                "No sobrescribe fechas ya asignadas."
            )

            conn = conectar()
            df_lotes_sin = pd.read_sql(
                "SELECT ID_MOVIMIENTOS, PRODUCTO, TIPO_DE_MOVIMIENTO, PESO, FECHA "
                "FROM movimientos "
                "WHERE TIPO_DE_MOVIMIENTO IN ('INGRESO DE PRODUCCION', 'ENTRADA POR AJUSTE') "
                "  AND FECHA_VENCIMIENTO IS NULL "
                "ORDER BY FECHA DESC",
                conn,
            )
            conn.close()

            if df_lotes_sin.empty:
                st.success("Todos los lotes de ingreso ya tienen fecha de vencimiento asignada.")
            else:
                st.write(f"Lotes sin fecha de vencimiento: **{len(df_lotes_sin)}**")
                st.dataframe(df_lotes_sin, use_container_width=True, hide_index=True)

                if st.button("🔄 Aplicar vida útil a lotes sin fecha"):
                    vida_map = cargar_vida_util_productos()
                    actualizados = 0
                    sin_config = []
                    conn = conectar()
                    cur = conn.cursor()
                    for _, r in df_lotes_sin.iterrows():
                        nom = str(r["PRODUCTO"]).strip()
                        v = vida_map.get(nom)
                        if v is None or v <= 0:
                            sin_config.append(nom)
                            continue
                        try:
                            f_ingreso = pd.to_datetime(r["FECHA"]).date()
                        except Exception:
                            continue
                        nueva_vto = f_ingreso + timedelta(days=int(v))
                        id_mov = int(r["ID_MOVIMIENTOS"])
                        cur.execute(
                            "UPDATE movimientos SET FECHA_VENCIMIENTO=%s WHERE ID_MOVIMIENTOS=%s",
                            (nueva_vto, id_mov),
                        )
                        registrar_historial_movimiento(
                            id_mov,
                            "ACTUALIZAR",
                            f"Vencimiento recalculado: (N/A) → {nueva_vto} "
                            f"(vida útil {v} días · módulo Fechas de Vencimiento)",
                        )
                        actualizados += 1
                    conn.commit()
                    conn.close()
                    registrar_log(f"Recalculo masivo de vencimientos: {actualizados} lotes actualizados.")
                    if actualizados:
                        st.success(f"✅ {actualizados} lote(s) actualizado(s).")
                    if sin_config:
                        productos_faltantes = sorted(set(sin_config))
                        st.warning(
                            "Los siguientes productos no tienen vida útil configurada y sus "
                            f"lotes se omitieron: {', '.join(productos_faltantes)}"
                        )
                    time.sleep(2)
                    st.rerun()

            st.divider()

            # -----------------------------------------------------------------
            # PANEL 3 — Vista de todos los lotes de ingreso (lectura + filtro)
            # -----------------------------------------------------------------
            st.subheader("📋 Lotes de ingreso registrados")
            st.caption("Vista de referencia con el vencimiento actual por lote.")

            conn = conectar()
            df_todos_lotes = pd.read_sql(
                "SELECT ID_MOVIMIENTOS, PRODUCTO, TIPO_DE_MOVIMIENTO, PESO, FECHA, "
                "FECHA_VENCIMIENTO, NOMBRE_USUARIO "
                "FROM movimientos "
                "WHERE TIPO_DE_MOVIMIENTO IN ('INGRESO DE PRODUCCION', 'ENTRADA POR AJUSTE') "
                "ORDER BY FECHA DESC",
                conn,
            )
            conn.close()

            if df_todos_lotes.empty:
                st.info("Aún no se han registrado ingresos.")
            else:
                productos_disp = sorted(df_todos_lotes["PRODUCTO"].dropna().astype(str).unique().tolist())
                filtro_prod = st.selectbox(
                    "Filtrar por producto",
                    ["(todos)"] + productos_disp,
                    key="filtro_lotes_vto",
                )
                df_show = df_todos_lotes
                if filtro_prod != "(todos)":
                    df_show = df_show[df_show["PRODUCTO"] == filtro_prod].reset_index(drop=True)
                st.dataframe(df_show, use_container_width=True, hide_index=True)

    # =========================================================================
    # MÓDULO: Reporte de Vencimientos
    # -------------------------------------------------------------------------
    # Roles: TODOS (Consulta, Operador, Medico Veterinario, Administrador,
    # Super Admin). Es una vista de lectura para toda la organización.
    #
    # Muestra dos secciones:
    #   1. Lotes VENCIDOS  (FECHA_VENCIMIENTO < hoy).
    #   2. Lotes PRÓXIMOS A VENCER (entre hoy y hoy + DIAS_PROXIMO_A_VENCER).
    #
    # Ambas alimentadas exclusivamente por movimientos de INGRESO (los únicos
    # que tienen fecha de vencimiento asociada). El reporte permite descargar
    # el resultado a Excel para consumo externo (auditorías, sanidad).
    # =========================================================================
    elif menu == "⚠️ Reporte de Vencimientos":
        st.header("⚠️ Reporte de vencimientos")
        st.caption(
            f"Ventana de aviso: **{DIAS_PROXIMO_A_VENCER} días** desde hoy. "
            "Fuente: movimientos de INGRESO DE PRODUCCION y ENTRADA POR AJUSTE "
            "con fecha de vencimiento registrada."
        )

        hoy = date.today()
        limite_prox = hoy + timedelta(days=DIAS_PROXIMO_A_VENCER)

        conn = conectar()
        df_todo_vto = pd.read_sql(
            "SELECT ID_MOVIMIENTOS, PRODUCTO, TIPO_DE_MOVIMIENTO, PESO, FECHA, "
            "FECHA_VENCIMIENTO, ALMACEN_DESTINO, NOMBRE_USUARIO "
            "FROM movimientos "
            "WHERE TIPO_DE_MOVIMIENTO IN ('INGRESO DE PRODUCCION', 'ENTRADA POR AJUSTE') "
            "  AND FECHA_VENCIMIENTO IS NOT NULL "
            "ORDER BY FECHA_VENCIMIENTO ASC",
            conn,
        )
        conn.close()

        if df_todo_vto.empty:
            st.info(
                "Aún no hay lotes con fecha de vencimiento registrada. "
                "Registre movimientos de INGRESO con vencimiento para poblar este reporte."
            )
        else:
            # Normalizamos la columna a date puro para poder comparar de forma segura.
            df_todo_vto["FECHA_VENCIMIENTO"] = pd.to_datetime(
                df_todo_vto["FECHA_VENCIMIENTO"], errors="coerce"
            ).dt.date

            mask_vencido = df_todo_vto["FECHA_VENCIMIENTO"].apply(
                lambda d: d is not None and d < hoy
            )
            mask_proximo = df_todo_vto["FECHA_VENCIMIENTO"].apply(
                lambda d: d is not None and hoy <= d <= limite_prox
            )
            df_vencidos = df_todo_vto[mask_vencido].copy()
            df_proximos = df_todo_vto[mask_proximo].copy()

            # Días restantes / vencidos como columna calculada (informativa).
            df_vencidos["DIAS_VENCIDOS"] = df_vencidos["FECHA_VENCIMIENTO"].apply(
                lambda d: (hoy - d).days if d else None
            )
            df_proximos["DIAS_RESTANTES"] = df_proximos["FECHA_VENCIMIENTO"].apply(
                lambda d: (d - hoy).days if d else None
            )

            # KPIs superiores.
            k1, k2, k3 = st.columns(3)
            k1.metric("🔴 Lotes vencidos", len(df_vencidos))
            k2.metric(f"🟠 Próximos a vencer ({DIAS_PROXIMO_A_VENCER} días)", len(df_proximos))
            k3.metric("🟢 Con vencimiento total (histórico)", len(df_todo_vto))

            st.subheader("🔴 Lotes VENCIDOS")
            if df_vencidos.empty:
                st.success("No hay lotes vencidos en este momento.")
            else:
                st.dataframe(df_vencidos, use_container_width=True, hide_index=True)

            st.subheader(f"🟠 Lotes PRÓXIMOS A VENCER (≤ {DIAS_PROXIMO_A_VENCER} días)")
            if df_proximos.empty:
                st.info("No hay lotes próximos a vencer en la ventana configurada.")
            else:
                st.dataframe(df_proximos, use_container_width=True, hide_index=True)

            # Descarga consolidada a Excel (dos hojas: vencidos + próximos).
            if not (df_vencidos.empty and df_proximos.empty):
                buffer = io.BytesIO()
                with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
                    if not df_vencidos.empty:
                        df_vencidos.to_excel(writer, index=False, sheet_name="Vencidos")
                    if not df_proximos.empty:
                        df_proximos.to_excel(writer, index=False, sheet_name="Proximos_a_vencer")
                st.download_button(
                    label="📥 Descargar reporte de vencimientos (Excel)",
                    data=buffer.getvalue(),
                    file_name=f"reporte_vencimientos_{hoy.isoformat()}.xlsx",
                )

    # =========================================================================
    # MÓDULO: Stock Real  (todos los roles)
    # -------------------------------------------------------------------------
    # Agregación en línea: INGRESO/AJUSTE suman, SALIDA/MERMA/DEVOLUCION restan.
    # Fuente única de verdad para el saldo por producto.
    # =========================================================================
    elif menu == "📊 Stock Real":
        st.header("📊 Stock Real")
        st.caption("Saldo por producto calculado en línea a partir de todos los movimientos.")
        conn = conectar()
        # INGRESO / AJUSTE suman al stock; SALIDA / MERMA / DEVOLUCION restan.
        # El ELSE -PESO cubre por defecto cualquier tipo de salida (incluyendo
        # DEVOLUCION, que también descuenta del inventario).
        q = (
            "SELECT PRODUCTO, "
            "SUM(CASE WHEN TIPO_DE_MOVIMIENTO IN ('INGRESO DE PRODUCCION', 'ENTRADA POR AJUSTE') "
            "THEN PESO ELSE -PESO END) AS STOCK_KG "
            "FROM movimientos GROUP BY PRODUCTO"
        )
        st.table(pd.read_sql(q, conn))
        conn.close()

    # =========================================================================
    # MÓDULO: Historial y Reportes  (todos los roles)
    # -------------------------------------------------------------------------
    # 1) Tabla completa de movimientos (DESC por fecha).
    # 2) Al seleccionar una fila se despliega el historial fino del ID.
    # 3) Descarga del reporte a Excel usando openpyxl en memoria (BytesIO).
    # =========================================================================
    elif menu == "🕘 Historial y Reportes":
        st.header("🕘 Historial y Reportes")
        st.caption("Auditoría completa por movimiento y descarga a Excel del histórico.")
        ensure_historial_movimiento_table()
        conn = conectar()
        df_h = pd.read_sql("SELECT * FROM movimientos ORDER BY FECHA DESC", conn)
        conn.close()

        st.subheader("Movimientos")
        st.caption("Seleccione **una fila** para ver el historial de cambios de ese ID de movimiento.")
        sel_h = st.dataframe(
            df_h,
            use_container_width=True,
            on_select="rerun",
            selection_mode="single-row",
            key="hist_rep_movimientos",
        )

        if not df_h.empty and sel_h.selection.rows:
            idx_sel = sel_h.selection.rows[0]
            if idx_sel < len(df_h):
                id_col = "ID_MOVIMIENTOS" if "ID_MOVIMIENTOS" in df_h.columns else None
                if id_col is None:
                    for c in df_h.columns:
                        if str(c).upper() == "ID_MOVIMIENTOS":
                            id_col = c
                            break
                if id_col is not None:
                    try:
                        id_sel = int(df_h.iloc[idx_sel][id_col])
                    except (TypeError, ValueError):
                        id_sel = None
                    if id_sel is not None:
                        st.divider()
                        st.subheader(f"Historial de cambios — movimiento #{id_sel}")
                        try:
                            conn = conectar()
                            df_hist = pd.read_sql(
                                """
                                SELECT fecha_hora AS Fecha_hora, nombre_usuario AS Usuario,
                                       accion AS Acción, detalle AS Detalle
                                FROM historial_movimiento
                                WHERE id_movimiento = %(mid)s
                                ORDER BY fecha_hora DESC
                                """,
                                conn,
                                params={"mid": id_sel},
                            )
                            conn.close()
                            if df_hist.empty:
                                st.info(
                                    "No hay eventos en el historial para este movimiento. "
                                    "Solo se registran cambios a partir de la creación de la tabla **historial_movimiento** "
                                    "(altas nuevas, ediciones o eliminaciones desde la aplicación)."
                                )
                            else:
                                st.dataframe(df_hist, use_container_width=True, hide_index=True)
                        except Exception as ex:
                            st.warning(f"No se pudo cargar el historial: {ex}")

        if not df_h.empty:
            towrite = io.BytesIO()
            df_h.to_excel(towrite, index=False, engine="openpyxl")
            st.download_button(
                label="📥 Descargar Reporte Excel",
                data=towrite.getvalue(),
                file_name=f"reporte_colbeef_{date.today()}.xlsx",
            )

    mostrar_firma()