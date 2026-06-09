# Paso a paso — Base de datos Colbeef-Ops

Sigue estos pasos **en orden**. Marca cada uno al completarlo.

---

## Paso 1 — Abrir MySQL Workbench

Abre **MySQL Workbench** en tu PC.

---

## Paso 2 — Entrar a MySQL (elige UNA opción)

### Opción A — Tienes contraseña de GH_nexus, Lockerbeef u otra

1. Doble clic en la conexión que **sí recuerdes** (ej. **GH_nexus**)
2. Si entra → ve al **Paso 3**

### Opción B — Recuerdas root

1. Doble clic en **root**
2. Pon la contraseña → ve al **Paso 3**

### Opción C — No recuerdas ninguna contraseña

1. Busca en Windows: **MySQL Installer**
2. MySQL Server → **Reconfigure** → **Accounts and Roles**
3. Pon contraseña nueva a **root** y anótala
4. Entra a **root** con esa contraseña → **Paso 3**

---

## Paso 3 — Ejecutar el SQL de Colbeef

1. En Workbench, abre el archivo:
   ```
   Colbeef-Ops\scripts\crear-colbeef-mysql.sql
   ```
   (File → Open SQL Script)

2. **Cambia la contraseña** en la línea:
   ```sql
   IDENTIFIED BY 'Colbeef2026!';
   ```
   por la que quieras usar (anótala).

3. Selecciona todo el script y pulsa el **rayo** ⚡ (Execute).

4. Abajo debe decir que se ejecutó sin error y ver `colbeef_ops` en los resultados.

---

## Paso 4 — Crear conexión Colbeef-Ops en Workbench

1. Pantalla inicial → botón **+** (nueva conexión)
2. Llenar:

   | Campo | Valor |
   |-------|--------|
   | Connection Name | `Colbeef-Ops` |
   | Hostname | `127.0.0.1` |
   | Port | `3306` |
   | Username | `colbeef` |
   | Password | Store in Vault → la que pusiste en el SQL |
   | Default Schema | `colbeef_ops` |

3. **Test Connection** → OK → **OK**

---

## Paso 5 — Configurar el proyecto

Abre el archivo:

```
Colbeef-Ops\backend\.env
```

Cámbialo así (usa la **misma contraseña** del Paso 3):

```env
DATABASE_URL="mysql://colbeef:Colbeef2026!@localhost:3306/colbeef_ops"
JWT_SECRET="colbeef-secreto-cambiar-en-produccion"
JWT_EXPIRES_IN="8h"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

> Si la contraseña tiene caracteres especiales (`!`, `@`, `#`), avísame para codificarla en la URL.

Guarda el archivo.

---

## Paso 6 — Crear tablas y cargar los 7 formatos

Abre **PowerShell** o **CMD** en la carpeta del proyecto y ejecuta:

```
scripts\setup-database.bat
```

Debe mostrar algo como:
- ✓ Migraciones aplicadas
- ✓ Seed completado
- Usuarios: admin / operario

---

## Paso 7 — Verificar en Workbench

1. Doble clic en **Colbeef-Ops**
2. Panel izquierdo **Schemas** → clic derecho → **Refresh All**
3. Expande **colbeef_ops** → **Tables**

Debes ver tablas como:

- `users`
- `formats`
- `format_sheets`
- `format_fields`
- `form_submissions`
- `form_submission_sheets`
- `signatures`

4. Clic derecho en `formats` → **Select Rows** → deben aparecer **7 formatos**.

---

## Paso 8 — Probar el login en la app

1. Ejecuta `scripts\dev.bat` (o reinicia si ya estaba corriendo)
2. Abre http://localhost:5173
3. Entra con:
   - **admin** / **admin123**
   - **operario** / **operario123**

---

## Resumen visual

```
Workbench (GH_nexus o root)
        ↓
Ejecutar crear-colbeef-mysql.sql
        ↓
Crear conexión "Colbeef-Ops" (usuario colbeef)
        ↓
Editar backend\.env
        ↓
scripts\setup-database.bat
        ↓
Ver tablas en Workbench + login en la app
```

---

## Si algo falla

| Error | Qué hacer |
|-------|-----------|
| Access denied | Contraseña mal en `.env` o usuario no creado |
| Can't connect | MySQL no está corriendo — inicia el servicio MySQL en Windows |
| Database does not exist | Repite Paso 3 (crear-colbeef-mysql.sql) |
| setup-database.bat falla | Copia el error y compártelo |

---

## Tu situación actual

- [ ] Entrar a Workbench con alguna conexión
- [ ] Ejecutar `crear-colbeef-mysql.sql`
- [ ] Crear conexión **Colbeef-Ops**
- [ ] Editar `backend\.env`
- [ ] Ejecutar `setup-database.bat`
- [ ] Verificar tablas y probar login
