# Sistema de Inventario de Subproductos — Colbeef SAS

Documentación técnica y funcional del módulo **`main_colbeef_web.py`**.

> Aplicación web para la trazabilidad de **subproductos cárnicos** (bilis, borlas, carne industrial, esófagos, orejas, tráqueas, vejigas, viriles, etc.) integrada con la suite corporativa de **Colbeef SAS**.

---

## Tabla de contenidos

1. [Descripción general](#1-descripción-general)
2. [Stack tecnológico y lenguajes](#2-stack-tecnológico-y-lenguajes)
3. [Arquitectura del sistema](#3-arquitectura-del-sistema)
4. [Estructura del código fuente](#4-estructura-del-código-fuente)
5. [Modelo de datos (MySQL)](#5-modelo-de-datos-mysql)
6. [Modelo de seguridad y roles](#6-modelo-de-seguridad-y-roles)
7. [Ciclo de vida de la sesión (SSO por URL)](#7-ciclo-de-vida-de-la-sesión-sso-por-url)
8. [Módulos funcionales](#8-módulos-funcionales)
9. [Trazabilidad de vencimientos (vida útil por producto)](#9-trazabilidad-de-vencimientos-vida-útil-por-producto)
10. [Auditoría y trazabilidad](#10-auditoría-y-trazabilidad)
11. [Integración con la suite Colbeef](#11-integración-con-la-suite-colbeef)
12. [Estilo visual (branding)](#12-estilo-visual-branding)
13. [Instalación y ejecución](#13-instalación-y-ejecución)
14. [Buenas prácticas y decisiones de diseño](#14-buenas-prácticas-y-decisiones-de-diseño)
15. [Puntos de mejora recomendados](#15-puntos-de-mejora-recomendados)
16. [Historial de cambios funcionales](#16-historial-de-cambios-funcionales)
17. [Glosario](#17-glosario)

---

## 1. Descripción general

Aplicación **single-page** construida sobre **Streamlit** que centraliza la operación de inventario de subproductos cárnicos de Colbeef SAS. Sus responsabilidades son:

- Registrar los cinco tipos de **movimiento oficial** (`INGRESO DE PRODUCCIÓN`, `SALIDA POR DESPACHO`, `MERMA`, `ENTRADA POR AJUSTE`, `DEVOLUCIÓN`).
- Calcular el **stock real** en tiempo real mediante agregación por producto.
- Auditar cada movimiento con **historial de cambios por ID**.
- Administrar **usuarios**, **catálogo de productos** (con **días de vida útil**) y **destinos/almacenes**.
- Calcular automáticamente la **fecha de vencimiento** de cada lote de ingreso a partir de la vida útil del producto.
- Producir **reportes** exportables a Excel, incluido el **reporte de vencimientos** (vencidos + próximos a vencer).
- Ofrecer **estadísticas de uso** para el rol Super Admin.
- Integrarse con el resto de la suite corporativa vía **navegación por URL con SSO ligero**.

El programa vive en un único archivo (`main_colbeef_web.py`, ~1780 líneas) por decisión explícita: reduce fricción de despliegue en el entorno on-premise de Colbeef y permite editar en caliente sin gestionar módulos ni empaquetado.

---

## 2. Stack tecnológico y lenguajes

| Capa | Tecnología | Versión sugerida | Rol |
|------|------------|------------------|-----|
| **Lenguaje principal** | Python | 3.10+ | Lógica de negocio, orquestación |
| **Framework web** | Streamlit | ≥ 1.30 | UI reactiva server-rendered (incluye `st.data_editor` y `st.query_params`) |
| **Base de datos** | MySQL | 5.7+ / 8.x | Persistencia relacional |
| **Driver BD** | `mysql-connector-python` | ≥ 8.x | Cliente MySQL para Python |
| **Análisis de datos** | pandas | ≥ 2.0 | Consulta, transformación y visualización tabular |
| **Exportación** | openpyxl | ≥ 3.1 | Serialización a `.xlsx` (con soporte multi-hoja) |
| **UI enriquecida** | HTML + CSS | (embebido) | Estilos premium, botones de navegación, banners |
| **SQL** | SQL (dialecto MySQL) | — | Consultas, DDL y agregaciones |
| **Plantillas** | f-strings Python | — | Composición dinámica de URLs y mensajes |

### Detalle por lenguaje

- **Python** — orquesta el ciclo de vida de la aplicación, controla `st.session_state`, expone la lógica de negocio y arma los formularios. También calcula la fecha de vencimiento derivada (`fecha_ingreso + vida_util_dias`).
- **SQL** — DDL de bootstrap idempotente (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN` condicional), DML transaccional y agregaciones (`SUM`, `COUNT`, `GROUP BY`, `DATE()`).
- **HTML + CSS** — inyectados vía `st.markdown(..., unsafe_allow_html=True)` para el pie de página fijo, el título principal y los tres botones de navegación con gradientes corporativos.
- **JavaScript** — no se escribe explícitamente: Streamlit genera el runtime front-end (React interno).

### Componentes de Streamlit destacados

- `st.form` con `clear_on_submit=True` para registros atómicos.
- `st.data_editor` para edición **en lote** de la vida útil de productos y del catálogo.
- `st.query_params` (nuevo) + fallback a `st.experimental_get_query_params` (legacy) para SSO por URL.
- `st.date_input`, `st.selectbox`, `st.metric`, `st.download_button`, `st.bar_chart` para las visualizaciones.

---

## 3. Arquitectura del sistema

Arquitectura **cliente-servidor de dos capas** con integración por URL con otros módulos del ecosistema Colbeef.

```
┌────────────────────────────────────────────────────────────────────┐
│                        Ecosistema Colbeef                          │
│                                                                    │
│   ┌──────────────┐   ┌──────────────┐   ┌───────────────────┐      │
│   │  SUITE HTML  │   │  LIBRILLOS   │   │  VÍSCERAS Gestor  │      │
│   │  :8000       │   │  :8080       │   │  :3001            │      │
│   └──────┬───────┘   └──────┬───────┘   └─────────┬─────────┘      │
│          │  ?usuario=NOMBRE │  ?usuario=NOMBRE    │  ?usuario=NOMBRE│
│          └──────────────────┴─────────────────────┘                │
│                              │                                     │
│                     ┌────────▼─────────┐                           │
│                     │  Inventario      │  ← main_colbeef_web.py    │
│                     │  Streamlit :8501 │                           │
│                     └────────┬─────────┘                           │
│                              │                                     │
│                     ┌────────▼─────────┐                           │
│                     │  MySQL           │                           │
│                     │  inventario_...  │                           │
│                     └──────────────────┘                           │
└────────────────────────────────────────────────────────────────────┘
```

Componentes clave:

- **Presentación**: navegador → HTML/CSS generados por Streamlit + botones custom `<a>` estilizados con gradiente para las tres apps hermanas.
- **Aplicación**: proceso Python de un solo archivo. Estado en memoria vía `st.session_state`. Cada acción del usuario reejecuta el script (modelo reactivo de Streamlit).
- **Persistencia**: base MySQL `inventario_subproductos` en `localhost:3306`. Conexiones ad-hoc (abrir → operar → cerrar) para evitar mantener sesiones colgadas.
- **Integración**: URL con `?usuario={nombre}` habilita **SSO ligero** entre módulos hermanos.

---

## 4. Estructura del código fuente

El archivo `main_colbeef_web.py` sigue un layout por **secciones numeradas** que se leen top-down:

```
main_colbeef_web.py  (~1780 líneas)
├── DOCSTRING DE MÓDULO                        (responsabilidades, ejecución)
├── IMPORTS                                    (streamlit, mysql.connector, pandas, io, time)
├── CONSTANTES DE NEGOCIO
│   ├── TIPOS_MOVIMIENTO_OFICIALES             (whitelist de tipos, incl. DEVOLUCION)
│   ├── TIPOS_QUE_INGRESAN                     (INGRESO / AJUSTE — llevan vencimiento)
│   ├── TIPOS_QUE_SALEN                        (SALIDA / MERMA / DEVOLUCION — restan)
│   ├── DIAS_PROXIMO_A_VENCER                  (ventana de alerta configurable)
│   └── PRODUCTOS_LEGACY_FALLBACK              (semilla del catálogo)
│
├── 1. CONFIGURACIÓN DE PÁGINA                 (st.set_page_config)
│
├── 2. FUNCIONES CORE
│   ├── conectar()                             (fábrica de conexiones MySQL)
│   ├── refrescar_datos_usuario()              (sincroniza rol desde DB)
│   ├── obtener_usuario_desde_url()            (lee query params)
│   ├── restaurar_sesion_por_usuario_url()     (SSO ligero)
│   ├── registrar_log(accion)                  (audit log general)
│   ├── ensure_historial_movimiento_table()    (DDL idempotente historial fino)
│   ├── registrar_historial_movimiento(...)    (auditoría por ID de movimiento)
│   ├── ensure_catalogo_productos_table()      (DDL + ALTER idempotente con vida_util_dias)
│   ├── seed_catalogo_productos_si_vacio()     (bootstrap catálogo)
│   ├── cargar_nombres_productos()             (lista de nombres para selectores)
│   ├── cargar_vida_util_productos()           (dict {producto: vida_útil_días})   ⬅ NUEVO
│   └── mostrar_firma()                        (footer HTML fijo)
│
├── 3. ESTILOS CSS                             (título, footer, botones-nav)
│
├── 4. LÓGICA DE SESIÓN Y ROUTER
│   ├── Inicialización session_state
│   ├── SSO por URL (?usuario=...)
│   ├── Refresco de rol
│   ├── Pantalla de LOGIN                      (formulario contra usuarios)
│   └── APP AUTENTICADA
│       ├── Sidebar (avatar, rol, menú por rol, botones-nav, cerrar sesión)
│       └── Routing por menú (todas las opciones con ícono para consistencia visual):
│           │  ── Bloque OPERATIVO (visible según rol) ──
│           ├── 📊 Stock Real                   (TODOS los roles)
│           ├── ➕ Registrar Movimiento         (Operador / Médico Vet. / Admin / Super)
│           ├── 🕘 Historial y Reportes         (TODOS los roles)
│           ├── ⚠️ Reporte de Vencimientos     (TODOS los roles)
│           │  ── Bloque CALIDAD ──
│           ├── 🗓️ Fechas de Vencimiento       (Admin / Super / Médico Vet.)
│           │  ── Bloque ADMINISTRACIÓN ──
│           ├── 🛠️ Gestión de Registros         (Admin / Super Admin)
│           ├── 📦 Catálogo de productos        (Admin / Super Admin)
│           ├── 🏪 Gestión de Almacenes         (Admin / Super Admin)
│           │  ── Bloque SUPER ADMIN ──
│           ├── 📈 Estadísticas de uso          (Super Admin)
│           └── ⚙️ Gestión de Usuarios          (Super Admin)
│
└── FIRMA final (mostrar_firma)
```

### Patrón de reactividad de Streamlit

Streamlit **reejecuta el script completo** en cada interacción del usuario. Por eso el código emplea tres patrones críticos:

1. **`st.session_state`** — retiene la identidad y el rol entre reruns.
2. **Widgets fuera de `st.form`** cuando su valor debe influir en la estructura del formulario antes del `submit`. Ejemplos: el `selectbox` de *Tipo de Movimiento* y el `selectbox` de *Producto* están **fuera** del `st.form` para que:
   - La aparición del campo *Remisión* (exclusivo de `SALIDA POR DESPACHO` y `DEVOLUCIÓN`) se refleje sin esperar al envío.
   - La **vista previa de la fecha de vencimiento calculada** aparezca al instante de seleccionar el producto.
3. **DDL idempotente perezoso** — las funciones `ensure_*_table()` y las migraciones vía `SHOW COLUMNS + ALTER TABLE` se ejecutan al primer uso, sin script SQL previo.

---

## 5. Modelo de datos (MySQL)

Base: `inventario_subproductos`. Motor `InnoDB`, charset `utf8mb4`.

### 5.1. Tabla `usuarios`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK AI | Identificador **fijo** (trazabilidad) |
| `nombre` | VARCHAR | Nombre de usuario (login) |
| `password` | VARCHAR | **Contraseña en texto plano** ⚠️ (ver §15) |
| `rol` | VARCHAR | `Consulta` / `Operador` / `Medico Veterinario` / `Administrador` / `Super Admin` |
| `correo` | VARCHAR | Opcional, usado por SSO por URL |

### 5.2. Tabla `movimientos`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `ID_MOVIMIENTOS` | INT PK AI | ID trazable del movimiento |
| `TIPO_DE_MOVIMIENTO` | VARCHAR | Uno de `TIPOS_MOVIMIENTO_OFICIALES` (incluye **DEVOLUCION**) |
| `PRODUCTO` | VARCHAR | Nombre de producto (proveniente del catálogo) |
| `PESO` | DECIMAL/FLOAT | Peso neto en kg |
| `ALMACEN_ORIGEN` | VARCHAR | Reservado (histórico) |
| `ALMACEN_DESTINO` | VARCHAR | `CAVA INTERNA`, `DESPERDICIO`, `DEVOLUCION` o valor de `almacenes.nombre_almacen` |
| `REMISION` | VARCHAR | Documento de remisión (solo `SALIDA POR DESPACHO` y `DEVOLUCIÓN`) |
| `FECHA` | DATETIME | Fecha/hora del registro |
| `FECHA_VENCIMIENTO` | DATE NULL | Fecha de caducidad del lote (**solo INGRESO / AJUSTE**) ⬅ **NUEVO** |
| `NOMBRE_USUARIO` | VARCHAR | Usuario que registró el movimiento |

### 5.3. Tabla `catalogo_productos` *(bootstrap on-demand)*

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK AI | ID **inmutable** del producto |
| `nombre` | VARCHAR UNIQUE | Nombre canónico |
| `vida_util_dias` | INT NULL | Días de vida útil del producto ⬅ **NUEVO**. Se usa como `FECHA_VENCIMIENTO = FECHA + vida_util_dias` |

Si la tabla está vacía se siembra con `PRODUCTOS_LEGACY_FALLBACK`.

### 5.4. Tabla `almacenes`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `nombre_almacen` | VARCHAR | Destino válido para `SALIDA POR DESPACHO` |

### 5.5. Tabla `log_actividad`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `nombre_usuario` | VARCHAR | Actor |
| `accion` | VARCHAR | Texto descriptivo (`Inicio de Sesión`, `Registro: …`, `Editó …`, `Actualizó vida útil …`, etc.) |
| `fecha_hora` | DATETIME | Timestamp |
| `rol` | VARCHAR | Rol al momento del evento |

### 5.6. Tabla `historial_movimiento` *(bootstrap on-demand)*

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK AI | ID interno del evento |
| `id_movimiento` | INT | FK lógica a `movimientos.ID_MOVIMIENTOS` |
| `fecha_hora` | DATETIME | Timestamp del evento |
| `nombre_usuario` | VARCHAR | Actor |
| `accion` | VARCHAR(40) | `CREAR` / `ACTUALIZAR` / `ELIMINAR` |
| `detalle` | TEXT | Diff en formato `Campo: «antes» → «después»` |

Índices: `idx_hist_mov` (por movimiento), `idx_hist_fecha` (por fecha).

### 5.7. Diagrama entidad-relación (lógico)

```
usuarios ─────┐
              │  1..N (NOMBRE_USUARIO)
              ▼
        movimientos ────────► catalogo_productos (por nombre)
              │                         │
              │                         └─── vida_util_dias
              │  1..N (ID_MOVIMIENTOS)  │        │
              ▼                         │        ▼
      historial_movimiento              │  cálculo automático de
                                        │  FECHA_VENCIMIENTO en INGRESO/AJUSTE
                                        ▼
                              FECHA_VENCIMIENTO
                              (columna en movimientos)

log_actividad ─── (referencia por nombre_usuario, sin FK física)
almacenes ─── (referencia por ALMACEN_DESTINO en movimientos)
```

> **Nota:** las relaciones son **lógicas** (referenciales por nombre), no restricciones `FOREIGN KEY` físicas en el DDL. Esto se hizo para tolerar productos y almacenes renombrados sin cascadas rígidas; la integridad se gestiona a nivel aplicación (ver módulo *Catálogo de productos*).

---

## 6. Modelo de seguridad y roles

Cinco roles definidos, ordenados de menor a mayor privilegio.

### 6.1. Matriz de permisos completa

| Módulo | Consulta | Operador | Medico Veterinario | Administrador | Super Admin |
|--------|:--------:|:--------:|:------------------:|:-------------:|:-----------:|
| 📊 Stock Real | ✅ | ✅ | ✅ | ✅ | ✅ |
| ➕ Registrar Movimiento | ❌ | ✅ *(todos menos DEVOLUCIÓN)* | ✅ *(solo DEVOLUCIÓN)* | ✅ | ✅ |
| 🕘 Historial y Reportes | ✅ | ✅ | ✅ | ✅ | ✅ |
| ⚠️ Reporte de Vencimientos | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🗓️ Fechas de Vencimiento | ❌ | ❌ | ✅ | ✅ | ✅ |
| 🛠️ Gestión de Registros | ❌ | ❌ | ❌ | ✅ | ✅ |
| 📦 Catálogo de productos | ❌ | ❌ | ❌ | ✅ | ✅ |
| 🏪 Gestión de Almacenes | ❌ | ❌ | ❌ | ✅ | ✅ |
| 📈 Estadísticas de uso | ❌ | ❌ | ❌ | ❌ | ✅ |
| ⚙️ Gestión de Usuarios | ❌ | ❌ | ❌ | ❌ | ✅ |

### 6.2. Matriz de tipos de movimiento por rol

| Rol | Tipos habilitados en *Registrar Movimiento* |
|-----|----------------------------------------------|
| **Consulta** | *(sin acceso — perfil de solo lectura)* |
| **Operador** | INGRESO DE PRODUCCIÓN, SALIDA POR DESPACHO, MERMA, ENTRADA POR AJUSTE |
| **Medico Veterinario** | **DEVOLUCIÓN** *(exclusivo — control sanitario/calidad)* |
| **Administrador** | Todos los cinco tipos |
| **Super Admin** | Todos los cinco tipos |

### 6.3. Enforcement (defensa en profundidad)

El control se aplica en **tres capas**:

1. **Sidebar**: solo se listan las opciones del menú permitidas para el rol activo (primera línea de defensa — UX).
2. **Selector del formulario**: la lista de tipos de movimiento se filtra según el rol antes de mostrar el `selectbox`.
3. **Servidor / submit**: cada handler revalida `st.session_state.rol` y `tipo in tipos_disponibles` al procesar el envío. Protege ante manipulación de estado.

### 6.4. Autoprotecciones

- Un Super Admin **no puede eliminarse a sí mismo** (`id_del == st.session_state.user_id` → error).
- Al cerrar sesión manualmente se levanta `logout_manual = True` para evitar que el SSO por URL vuelva a autenticar de forma automática al usuario en la misma vuelta.

### 6.5. Usuarios de referencia

| Usuario | Rol | Uso previsto |
|---------|-----|--------------|
| `daniel almeida` | Super Admin | Administración general |
| `calidad` | Medico Veterinario | Registrar devoluciones + gestionar vida útil |

---

## 7. Ciclo de vida de la sesión (SSO por URL)

El sistema soporta **dos vías** de autenticación:

### 7.1. Login manual

1. Usuario ingresa `nombre` + `password`.
2. Se consulta `usuarios` con `WHERE nombre=%s AND PASSWORD=%s`.
3. Si hay match → se llenan `session_state.autenticado / user_id / nombre / rol` y se registra `Inicio de Sesión` en `log_actividad`.

### 7.2. SSO ligero por URL (retorno desde apps hermanas)

Cuando el usuario navega a `http://…:8501/?usuario=<nombre>` (o `?login=<nombre>`):

1. `obtener_usuario_desde_url()` lee el query param (con fallback a `st.experimental_get_query_params` en versiones antiguas de Streamlit).
2. `restaurar_sesion_por_usuario_url()` valida:
   - No hay sesión activa.
   - No hubo logout manual reciente.
   - El nombre existe en `usuarios` (o coincide con `correo`).
3. Restaura la sesión **sin pedir contraseña** y registra `Sesión restaurada por retorno desde Librillos`.

Este modelo asume que el perímetro (LAN corporativa) es de confianza. En un entorno más expuesto **debería reemplazarse por un token firmado** (JWT) para evitar suplantación por URL.

### 7.3. Máquina de estados de sesión

```
[Anónimo] ──login OK──► [Autenticado]
   │                          │
   │  ?usuario=X en URL       │  Cerrar Sesión
   ▼                          ▼
[Restauración] ──match──► [Autenticado (via SSO)]
                          │
                          │  logout_manual=True
                          ▼
                       [Anónimo, blindado contra SSO
                        hasta próximo enlace]
```

---

## 8. Módulos funcionales

### 8.1. 📊 Stock Real (todos los roles)

Consulta agregada que calcula el stock por producto sumando ingresos y restando salidas / mermas / devoluciones:

```sql
SELECT PRODUCTO,
       SUM(CASE WHEN TIPO_DE_MOVIMIENTO IN ('INGRESO DE PRODUCCION','ENTRADA POR AJUSTE')
                THEN PESO ELSE -PESO END) AS STOCK_KG
FROM movimientos
GROUP BY PRODUCTO;
```

Regla: `INGRESO DE PRODUCCION` y `ENTRADA POR AJUSTE` suman; `SALIDA POR DESPACHO`, `MERMA` y `DEVOLUCION` restan (el `ELSE -PESO` cubre por defecto cualquier tipo de salida).

### 8.2. ➕ Registrar Movimiento (Operador / Médico Veterinario / Administrador / Super Admin)

Formulario dinámico condicionado por el *Tipo de movimiento* y filtrado por rol:

- **INGRESO DE PRODUCCION** / **ENTRADA POR AJUSTE** → destino fijo `CAVA INTERNA`. La **fecha de vencimiento se calcula automáticamente** a partir de la vida útil configurada del producto. **La vida útil es opcional**: si el producto no la tiene configurada, el ingreso se registra con `FECHA_VENCIMIENTO = NULL` (aparece como *N/A* en el reporte de vencimientos hasta que se configure y se use el recálculo masivo).
- **SALIDA POR DESPACHO** → obliga a elegir almacén registrado y admite `REMISION` opcional.
- **MERMA** → destino fijo `DESPERDICIO`.
- **DEVOLUCIÓN** → resta del stock, destino etiquetado como `DEVOLUCION`, `REMISION` opcional para trazabilidad (guía, cliente, motivo).

Validaciones antes de persistir:
- Producto existe en catálogo.
- Tipo pertenece a la whitelist `TIPOS_MOVIMIENTO_OFICIALES` **y** al subconjunto habilitado para el rol.
- Peso `> 0`.
- Para salidas: destino registrado obligatorio.

> ⚠️ **La vida útil NO es obligatoria** para registrar un movimiento. Si el producto la tiene configurada, la fecha de vencimiento se calcula y persiste; si no, el ingreso se guarda con `FECHA_VENCIMIENTO = NULL` y no se bloquea al usuario.

Al guardar, se registra en `log_actividad` **y** en `historial_movimiento` con acción `CREAR` y `detalle` completo (incluye vida útil aplicada si es ingreso, o *N/A* en caso contrario).

### 8.3. 🕘 Historial y Reportes (todos los roles)

- Tabla completa de `movimientos` ordenada por fecha DESC (incluye `FECHA_VENCIMIENTO`).
- **Selección de fila** → despliega el historial (`historial_movimiento`) del ID seleccionado.
- Descarga de reporte Excel en memoria (`io.BytesIO` + `openpyxl`).

### 8.4. ⚠️ Reporte de Vencimientos (todos los roles) — **NUEVO**

Vista de lectura para toda la organización. Alimentada exclusivamente por movimientos de INGRESO/AJUSTE con `FECHA_VENCIMIENTO` no nula.

Contenido:
- **KPIs superiores**: lotes vencidos, próximos a vencer (ventana de `DIAS_PROXIMO_A_VENCER = 15` días), total histórico con vencimiento.
- **🔴 Lotes vencidos**: `FECHA_VENCIMIENTO < hoy`, con columna calculada `DIAS_VENCIDOS`.
- **🟠 Próximos a vencer**: `hoy ≤ FECHA_VENCIMIENTO ≤ hoy + N`, con columna calculada `DIAS_RESTANTES`.
- **Descarga Excel** con dos hojas (`Vencidos`, `Proximos_a_vencer`).

### 8.5. 🗓️ Fechas de Vencimiento (Administrador / Super Admin / Médico Veterinario) — **NUEVO**

Módulo con tres paneles:

**Panel 1 — Editor de vida útil por producto** (edición en lote)
- Tabla interactiva vía `st.data_editor` con columnas: `ID`, `Producto`, `Días de vida útil`, `Ejemplo (si ingresa hoy)`.
- El cambio se persiste al pulsar 💾 Guardar. Se detecta el diff por producto y se registra en `log_actividad` una entrada por cambio.

**Panel 2 — Recálculo masivo de vencimientos**
- Utilidad para bases con histórico previo: aplica la vida útil actual a los lotes de INGRESO/AJUSTE que aún **no tienen** fecha de vencimiento.
- No sobrescribe fechas ya asignadas.
- Cada recálculo queda en `historial_movimiento` como `ACTUALIZAR` con detalle `Vencimiento recalculado: (N/A) → YYYY-MM-DD (vida útil X días)`.

**Panel 3 — Lotes de ingreso registrados** (solo lectura)
- Tabla filtrable por producto con `ID_MOVIMIENTOS`, `PRODUCTO`, `TIPO`, `PESO`, `FECHA`, `FECHA_VENCIMIENTO`, `NOMBRE_USUARIO`.

### 8.6. 🛠️ Gestión de Registros (Admin / Super Admin)

CRUD sobre `movimientos` con auditoría fina:

- Selecciona una fila de la tabla → abre editor.
- Editor soporta cambio de tipo, producto, peso, destino, remisión y **fecha de vencimiento** (para ingresos).
- Al guardar, se calcula el **diff campo a campo** y se persiste con acción `ACTUALIZAR`.
- Al eliminar se registra `ELIMINAR` en el historial **antes** del `DELETE`.

### 8.7. 📦 Catálogo de productos (Admin / Super Admin)

- CRUD sobre `catalogo_productos` (nombre; los días de vida útil se gestionan desde el módulo *🗓️ Fechas de Vencimiento*).
- **Rename cascada por aplicación**: al renombrar un producto, se actualizan los `movimientos` que usaban el nombre anterior en la misma transacción de dos statements.
- **Delete blindado**: si hay movimientos que referencian el producto, la eliminación se rechaza. Solo se permite eliminar productos huérfanos.

### 8.8. 🏪 Gestión de Almacenes (Admin / Super Admin) — **NUEVO**

CRUD sobre `almacenes` con la misma filosofía que Catálogo de productos:

- **ID inmutable**: la clave primaria (`id`) nunca se muestra editable; garantiza trazabilidad en logs.
- **Constraint física + validación en app**: `UNIQUE KEY uk_almacenes_nombre (nombre_almacen)` bloquea duplicados a nivel BD; adicionalmente el módulo valida existencia por nombre antes de `INSERT`/`UPDATE` para dar mensajes amigables.
- **Rename cascada por aplicación**: renombrar un almacén ejecuta, en la misma sesión de conexión:
  ```sql
  UPDATE almacenes    SET nombre_almacen = :nuevo WHERE id = :id;
  UPDATE movimientos  SET ALMACEN_DESTINO = :nuevo WHERE ALMACEN_DESTINO = :ant;
  UPDATE movimientos  SET ALMACEN_ORIGEN  = :nuevo WHERE ALMACEN_ORIGEN  = :ant;
  ```
  Así el histórico permanece consistente sin FK físicas.
- **Delete blindado**: si existen movimientos con `ALMACEN_DESTINO = :nombre` o `ALMACEN_ORIGEN = :nombre`, la eliminación se rechaza. Un panel informativo cuenta cuántos movimientos referencian el almacén antes de intentar borrar.
- **Migración idempotente**: la primera vez que se accede al módulo, `ensure_almacenes_table()` intenta agregar la UNIQUE KEY sobre `nombre_almacen` si no existía. Si detecta duplicados históricos, deja la unicidad al control de aplicación.
- **Log de auditoría** en `log_actividad`:
  - `Creó almacén id=X «NOMBRE»`
  - `Editó almacén id=X: «ANT» → «NVO» (movimientos actualizados en cascada)`
  - `Eliminó almacén id=X «NOMBRE» (sin movimientos asociados)`

### 8.9. 📈 Estadísticas de uso (Super Admin)

Panel KPI con:
- Líneas de log (muestra), usuarios distintos, inicios de sesión, total de movimientos histórico.
- **Ingresos por usuario** (incluye login manual + retornos vía SSO).
- Eventos de log por día (últimos 45 días).
- Movimientos por usuario, por tipo y por día.
- Últimos 400 eventos del log.

### 8.10. ⚙️ Gestión de Usuarios (Super Admin)

CRUD sobre `usuarios`:
- Crear (nombre + rol + password). Roles disponibles: `Consulta`, `Operador`, **`Medico Veterinario`**, `Administrador`, `Super Admin`.
- Editar (mantiene `id`, password vacía = no cambiar).
- Eliminar (con anti-autoborrado).

---

## 9. Trazabilidad de vencimientos (vida útil por producto)

Modelo de trabajo introducido en la versión 2026.07:

### 9.1. Idea central

Cada **producto** del catálogo tiene un atributo `vida_util_dias` (nullable). Cuando se registra un **INGRESO DE PRODUCCION** o una **ENTRADA POR AJUSTE**, la aplicación calcula automáticamente:

```
FECHA_VENCIMIENTO = FECHA_DE_INGRESO + vida_util_dias
```

No se pide al usuario teclear la fecha: se elimina el error humano y se centraliza la política de caducidad por producto.

### 9.2. Ciclo completo

```
┌──────────────────────────────────────────────────────────────────┐
│  1. Admin / Super Admin / Médico Vet.                             │
│     configura vida_util_dias por producto en                     │
│     🗓️ Fechas de Vencimiento (Panel 1)                            │
└─────────────────────────┬────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. Operador registra INGRESO DE PRODUCCIÓN                       │
│     La app carga vida_util_dias, calcula                          │
│     FECHA_VENCIMIENTO = date.today() + vida_util_dias             │
│     y persiste el lote                                            │
└─────────────────────────┬────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. Todos los roles consultan ⚠️ Reporte de Vencimientos          │
│     - 🔴 Vencidos  (FECHA_VENCIMIENTO < hoy)                      │
│     - 🟠 Próximos  (hoy ≤ FECHA_VENCIMIENTO ≤ hoy + 15 días)      │
│     Descarga Excel con dos hojas                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 9.3. Constantes involucradas

| Constante | Valor | Ubicación | Descripción |
|-----------|-------|-----------|-------------|
| `TIPOS_QUE_INGRESAN` | `("INGRESO DE PRODUCCION", "ENTRADA POR AJUSTE")` | cabecera del archivo | Únicos tipos que reciben `FECHA_VENCIMIENTO` |
| `TIPOS_QUE_SALEN` | `("SALIDA POR DESPACHO", "MERMA", "DEVOLUCION")` | cabecera | Restan del stock |
| `DIAS_PROXIMO_A_VENCER` | `15` | cabecera | Ventana de alerta del reporte |

### 9.4. Escenarios de borde

- **Producto sin vida útil configurada** al registrar un INGRESO → mensaje **informativo** (no bloqueante). El movimiento se persiste con `FECHA_VENCIMIENTO = NULL` y podrá corregirse más tarde desde el Panel 2 (*recálculo masivo*) o manualmente en *🛠️ Gestión de Registros*. Esta es la regla actual: la operación diaria **nunca** se detiene por falta de vida útil.
- **Cambio retroactivo de vida útil** → no modifica fechas de lotes ya registrados. Para propagar el cambio, el admin/vet usa el Panel 2 (recálculo masivo, solo aplica a lotes sin fecha).
- **Edición manual desde 🛠️ Gestión de Registros** → el admin/superadmin puede sobrescribir `FECHA_VENCIMIENTO` de un movimiento puntual como excepción; el cambio queda auditado en el historial fino.

---

## 10. Auditoría y trazabilidad

El sistema mantiene **dos flujos de auditoría paralelos**:

1. **`log_actividad`** — bitácora general de acciones humanas (login, edición, eliminación, creación, actualización de vida útil, etc.). Alimentada por `registrar_log()`. Es la fuente de las estadísticas de uso.
2. **`historial_movimiento`** — trazabilidad **por ID de movimiento**. Guarda el diff de cada edición y la acción de eliminación. Alimentada por `registrar_historial_movimiento()` desde los módulos *Registrar Movimiento*, *Gestión de Registros* y *🗓️ Fechas de Vencimiento* (Panel 2).

Ambas tablas se crean **de forma idempotente** al arrancar los módulos que las necesitan (`CREATE TABLE IF NOT EXISTS`), permitiendo despliegues en bases limpias sin script SQL previo.

Ejemplos de entradas típicas:

| Origen | `log_actividad.accion` | `historial_movimiento.accion` / `detalle` |
|--------|------------------------|-------------------------------------------|
| Registrar Movimiento (INGRESO) | `Registro: INGRESO DE PRODUCCION BILIS` | `CREAR` — `Tipo: …; Peso: …; Fecha de vencimiento: 2026-08-01 (vida útil 5 días)` |
| Gestión de Registros | `Editó movimiento 123` | `ACTUALIZAR` — `Peso: 5.0 → 6.5 kg; Vencimiento: «2026-08-01» → «2026-08-03»` |
| 🗓️ Fechas de Vencimiento — Panel 1 | `Actualizó vida útil de 'BILIS' (id=1): N/A → 5 días` | — |
| 🗓️ Fechas de Vencimiento — Panel 2 | `Recalculo masivo de vencimientos: 12 lotes actualizados` | `ACTUALIZAR` — `Vencimiento recalculado: (N/A) → 2026-08-01 …` |

---

## 11. Integración con la suite Colbeef

En el sidebar se renderizan tres botones estilizados con gradientes que llevan el `nombre` del usuario en la URL:

| Botón | URL | App destino |
|-------|-----|-------------|
| **🥩 VISCERAS** | `http://192.168.20.205:3001/gestor.html?usuario={nombre}` | Gestor de vísceras |
| **🏠 IR A SUITE** | `http://192.168.20.205:8000/site.html` | Portal principal |
| **📚 SOFTWARE LIBRILLOS** | `http://192.168.20.205:8080/?vista=historial&usuario={nombre}` | Librillos |

La app receptora reconoce al usuario por el query param y — si ambas comparten la tabla `usuarios` — restaura la sesión sin fricción. Esta es la base del **SSO ligero por URL** descrito en §7.

---

## 12. Estilo visual (branding)

Paleta corporativa Colbeef aplicada vía CSS embebido:

| Elemento | Color / Gradiente | Uso |
|----------|-------------------|-----|
| Rojo Colbeef | `#E63946 → #800020` | Título principal, botón SUITE, footer |
| Azul institucional | `#1D3557 → #457B9D` | Botón LIBRILLOS |
| Púrpura vísceras | `#6A0572 → #AB83A1` | Botón VISCERAS |
| Vino | `#800020` | Footer y CTA de volver a Suite en login |

Efectos: sombras (`box-shadow`), transición 0.3s, elevación (`translateY(-3px)`) y brillo (`filter: brightness(1.2)`) en hover para dar sensación de UI premium.

---

## 13. Instalación y ejecución

### 13.1. Requisitos

- Python 3.10 o superior
- MySQL 5.7 / 8.x accesible en `localhost:3306`
- Base de datos `inventario_subproductos` creada, con las tablas `usuarios`, `movimientos`, `almacenes` y `log_actividad` provistas (las demás se autogeneran).

### 13.2. Dependencias

```bash
pip install "streamlit>=1.30" "mysql-connector-python>=8" "pandas>=2.0" "openpyxl>=3.1"
```

> Requerido Streamlit ≥ 1.23 para `st.data_editor`; se recomienda ≥ 1.30 por la API estable de `st.query_params`.

### 13.3. Arranque

```bash
streamlit run main_colbeef_web.py --server.port 8501
```

### 13.4. Configuración de conexión

En `conectar()` se define la conexión MySQL:

```python
mysql.connector.connect(
    host='localhost', user='root', password='root',
    database='inventario_subproductos', port=3306
)
```

Para producción, migrar estas credenciales a variables de entorno o `st.secrets`.

### 13.5. Migración de esquema (idempotente y automática)

Al primer arranque después de una actualización, la app añade automáticamente las siguientes columnas si no existen (sin intervención manual):

- `movimientos.FECHA_VENCIMIENTO DATE NULL`
- `catalogo_productos.vida_util_dias INT NULL`

También crea las tablas `historial_movimiento` y `catalogo_productos` si faltan.

---

## 14. Buenas prácticas y decisiones de diseño

- **Whitelist de tipos de movimiento** (`TIPOS_MOVIMIENTO_OFICIALES`) — evita valores libres que rompan agregaciones de stock.
- **Filtrado de tipos por rol** — el `selectbox` solo muestra los tipos habilitados; el submit revalida.
- **DDL idempotente + ALTER perezoso** — `CREATE TABLE IF NOT EXISTS` y `SHOW COLUMNS → ALTER TABLE` en tablas secundarias facilita despliegues limpios y migraciones sin scripts.
- **ID inmutable** — la trazabilidad se preserva por ID; los renombres se cascadean por aplicación.
- **Doble validación de rol** — sidebar filtra opciones + cada handler valida al ingresar + submit revalida.
- **Auditoría de doble canal** — general (`log_actividad`) + fina por movimiento (`historial_movimiento`).
- **Delete bloqueado por dependencias** — evita productos huérfanos en `movimientos`.
- **Guard clauses tempranas** — validaciones al inicio del handler para reducir anidamiento.
- **Manejo defensivo de query params** — soporta `st.query_params` (nuevo) y `st.experimental_get_query_params` (legacy).
- **Widget fuera del `st.form`** — patrón usado a propósito cuando la estructura del formulario depende del valor del widget (tipo, producto → vista previa de vencimiento).
- **Cálculo de vencimiento server-side** — la fecha se calcula en Python al momento del submit, no en el cliente, garantizando consistencia.
- **Edición en lote con `st.data_editor`** — diff automático por PK (`id` del producto) evita colisiones en updates concurrentes.

---

## 15. Puntos de mejora recomendados

Áreas de deuda técnica identificadas, ordenadas por criticidad:

1. **🔴 Contraseñas en texto plano** — la columna `password` almacena valores sin hash. Migrar a `bcrypt` o `argon2` con un script de rotación.
2. **🔴 Credenciales de BD hard-coded** — `host/user/password` embebidos. Mover a `st.secrets` o `.env` con `python-dotenv`.
3. **🟡 Sin `try/except` estructurado en handlers** — algunas rutas pueden dejar conexiones abiertas si la query lanza excepción. Sustituir por `with contextlib.closing(conectar())` o context manager custom.
4. **🟡 SSO por URL sin firma** — cualquier persona con conocimiento de un nombre válido podría entrar. Reemplazar por JWT firmado o token de un solo uso.
5. **🟡 Excepciones silenciosas `except: pass`** — dificultan diagnóstico. Reemplazar por logging estructurado (módulo `logging`).
6. **🟡 Trazabilidad de vencimiento sin FIFO** — el reporte de vencimientos muestra todos los ingresos con fecha vencida sin descontar cuánto peso queda efectivamente en stock (no hay trazabilidad de lote FIFO). Para una segunda fase se puede introducir una tabla `lotes` con saldo por lote.
7. **🟢 Un solo archivo de ~1780 líneas** — a mediano plazo, dividir por módulo (`auth.py`, `db.py`, `modules/…`) mejoraría mantenibilidad.
8. **🟢 Sin tests automatizados** — introducir `pytest` con fixtures de MySQL en memoria (`sqlite` o `mysqlmock`).
9. **🟢 Sin control de concurrencia** — `INSERT`/`UPDATE` no envuelven transacciones explícitas. Para operaciones críticas (rename cascada, recálculo masivo) usar `START TRANSACTION`/`COMMIT`/`ROLLBACK`.
10. **🟢 Falta de índice compuesto en `movimientos(PRODUCTO, FECHA_VENCIMIENTO)`** — optimizaría el reporte de vencimientos y las consultas por rango.

---

## 16. Historial de cambios funcionales

### v2026.08.1 — Pulido estético del menú principal

- 🎨 **Iconografía 100 % consistente** en la barra lateral: todas las opciones del menú llevan emoji al inicio. Ítems renombrados:
  - `Stock Real` → `📊 Stock Real`
  - `Registrar Movimiento` → `➕ Registrar Movimiento`
  - `Historial y Reportes` → `🕘 Historial y Reportes`
  - `Gestión de Registros (Admin)` → `🛠️ Gestión de Registros`
  - `📊 Estadísticas de uso` → `📈 Estadísticas de uso` *(evita colisión con Stock Real)*
- 🗂️ **Orden lógico por bloques**: Operativo → Calidad → Administración → Super Admin.
- 🧭 Encabezados (`st.header`) uniformizados en los tres módulos que no lo tenían (*Stock Real*, *Registrar Movimiento*, *Historial y Reportes*) con caption descriptivo.
- 🔄 Referencias internas (mensajes de log, textos de auditoría y documentación) sincronizadas con los nuevos nombres.

### v2026.08 — Gestión de almacenes

- ➕ **Nuevo módulo `🏪 Gestión de Almacenes`** para Administrador / Super Admin: CRUD sobre `almacenes` con rename cascada sobre `movimientos.ALMACEN_DESTINO` y `movimientos.ALMACEN_ORIGEN`, y delete blindado por referencias.
- ➕ **Nueva función `ensure_almacenes_table()`** — DDL/ALTER idempotente. Agrega `UNIQUE KEY uk_almacenes_nombre (nombre_almacen)` de forma best-effort si aún no existe.
- 🛡️ Validación de duplicados en dos capas: `UNIQUE` en BD + `SELECT` previo en la app para mensaje de error amigable.
- 📋 Log de auditoría: `Creó almacén`, `Editó almacén …` y `Eliminó almacén …` en `log_actividad`.

### v2026.07.2 — Vida útil opcional (hotfix)

- 🛠️ Se **quita el bloqueo** que impedía registrar INGRESOS/AJUSTES de productos sin vida útil configurada. Ahora la vida útil es **opcional** y el guardado nunca se detiene por su ausencia.
- El aviso de "no configurado" pasa a ser una nota informativa (`st.caption`) en vez de un `st.warning`/`st.error` bloqueante.

### v2026.07 — Trazabilidad de calidad y vencimientos

- ➕ **Nuevo rol `Medico Veterinario`** con permisos específicos (Devolución + vida útil + reportes).
- ➕ **Nuevo tipo de movimiento `DEVOLUCION`** — resta del stock, exclusivo del rol Médico Veterinario. Cambiado el filtro por rol para bloquear el uso por parte del Operador.
- ➕ **Nueva columna `movimientos.FECHA_VENCIMIENTO DATE NULL`**.
- ➕ **Nueva columna `catalogo_productos.vida_util_dias INT NULL`**.
- ➕ **Nuevo módulo `🗓️ Fechas de Vencimiento`** con tres paneles (editor de vida útil + recálculo masivo + vista de lotes).
- ➕ **Nuevo módulo `⚠️ Reporte de Vencimientos`** accesible a todos los roles, con dos secciones y descarga Excel multi-hoja.
- ➕ **Cálculo automático de `FECHA_VENCIMIENTO`** al registrar INGRESO/AJUSTE.
- ➕ **Nueva función `cargar_vida_util_productos()`** como fuente de verdad para el cálculo.
- 🛡️ **Blindaje**: Operador no puede seleccionar `DEVOLUCION` en el formulario; el submit revalida.
- 🛡️ **Migración idempotente**: la app auto-agrega las nuevas columnas si faltan al arrancar.

### v2026.06 — Integración con la suite

- ➕ Botón navegación **🥩 VISCERAS** al portal `192.168.20.205:3001`.
- 🔄 URL del botón **📚 SOFTWARE LIBRILLOS** actualizada con SSO por `?usuario={nombre}`.

---

## 17. Glosario

| Término | Definición |
|---------|-----------|
| **Movimiento** | Registro individual de entrada, salida, merma, ajuste o devolución sobre un producto. |
| **Producto** | Subproducto cárnico registrado en el catálogo (bilis, borlas, etc.). |
| **Vida útil** | Días de caducidad de un producto contados desde su fecha de ingreso al inventario. |
| **Lote** | Instancia concreta de un producto que ingresa al inventario. Cada movimiento de INGRESO/AJUSTE representa un lote con su propio vencimiento. |
| **Almacén / Destino** | Ubicación física a la que se despacha un producto (`SALIDA POR DESPACHO`). |
| **Remisión** | Documento externo asociado a una salida o devolución. |
| **Stock real** | Saldo actual por producto = ingresos − salidas/mermas/devoluciones. |
| **Devolución** | Producto que sale del stock por evento de calidad (rechazo del cliente, no conformidad, decomiso sanitario). Exclusivo del rol Médico Veterinario. |
| **Auditoría** | Registro histórico de todas las acciones humanas (`log_actividad`) y cambios sobre movimientos (`historial_movimiento`). |
| **SSO ligero** | Restauración de sesión sin contraseña vía query param `?usuario=`. |
| **Rol** | Nivel de permisos: `Consulta`, `Operador`, `Medico Veterinario`, `Administrador`, `Super Admin`. |
| **DDL idempotente** | Sentencias `CREATE ... IF NOT EXISTS` / `ALTER TABLE ADD COLUMN` condicional que pueden ejecutarse múltiples veces sin efecto lateral. |
| **Whitelist** | Lista cerrada de valores permitidos para un campo (aquí: tipos de movimiento). |

---

**Documento generado y mantenido por el equipo de desarrollo de Colbeef SAS.**
Última actualización sincronizada con `main_colbeef_web.py` — v2026.07.
