# Base de Datos MySQL — Colbeef-Ops

Guía paso a paso para crear la base de datos con los **7 formatos** y todos sus campos.

---

## Resumen

| Tabla | Función |
|-------|---------|
| `users` | Admin y operarios |
| `formats` | Catálogo de 7 formatos |
| `format_sheets` | Hojas de cada formato (22 hojas en total) |
| `format_fields` | Definición de campos (~500+ campos sembrados) |
| `form_submissions` | Registros llenados por día |
| `form_submission_sheets` | Datos JSON por hoja |
| `signatures` | Firma del jefe de área |

---

## Paso 1 — Instalar MySQL 8.0+

Descargue desde: https://dev.mysql.com/downloads/mysql/

- Puerto: **3306**
- Anote la contraseña de `root`
- Active **MySQL como servicio de Windows**

---

## Paso 2 — Crear la base de datos

Opción A — MySQL Workbench / consola:

```sql
CREATE DATABASE colbeef_ops
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Opción B — Script incluido:

```
scripts\init-database.sql
```

Usuario dedicado (recomendado en producción):

```sql
CREATE USER 'colbeef'@'localhost' IDENTIFIED BY 'SuPasswordSeguro123!';
GRANT ALL PRIVILEGES ON colbeef_ops.* TO 'colbeef'@'localhost';
FLUSH PRIVILEGES;
```

---

## Paso 3 — Configurar conexión

Copie y edite el archivo de entorno:

```
backend\.env.example  →  backend\.env
```

```env
DATABASE_URL="mysql://root:SU_PASSWORD@localhost:3306/colbeef_ops"
JWT_SECRET="cambie-esto-por-un-secreto-largo-y-aleatorio"
JWT_EXPIRES_IN="8h"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

---

## Paso 4 — Instalar dependencias (si aún no lo hizo)

```
scripts\install.bat
```

---

## Paso 5 — Crear tablas y cargar datos

```
scripts\setup-database.bat
```

Este script ejecuta en orden:

1. `prisma generate` — genera el cliente
2. `prisma migrate dev` — crea las tablas
3. `prisma db seed` — carga formatos, hojas, campos y usuarios de prueba

**Usuarios de prueba:**

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Admin / Jefe de área |
| operario | operario123 | Operario |

---

## Paso 6 — Verificar

```bash
cd backend
npx prisma studio
```

Abra http://localhost:5555 y revise:

- `formats` → 7 registros
- `format_sheets` → 22 hojas
- `format_fields` → campos de cada hoja
- `users` → admin y operario

---

## Paso 7 — Iniciar el sistema

Desarrollo:

```
scripts\dev.bat
```

Producción:

```
scripts\start.bat
```

Arranque automático al reiniciar Windows:

```
scripts\setup-autostart.bat
```

---

## Formatos cargados en la BD

| Código | Nombre | Hojas |
|--------|--------|-------|
| PREOP_BENEFICIO | Preoperativo Planta Beneficio | 8 |
| PREOP_DESPOSTE | Preoperativo Planta Desposte | 4 |
| DESPACHO_PRODUCTO | Despacho Producto Terminado | 1 |
| PROCESO_DESPOSTE | Verificación Desposte Operativo | 5 |
| RECEPCION_CANALES_FORANEAS | Recepción Canales Foráneas | 1 |
| RECEPCION_CANALES_DESPOSTE | Recepción Canales Desposte | 1 |
| VERIFICACION_PRODUCTO | Verificación Producto Terminado | 2 |

---

## Cómo se guardan los campos

Cada campo en `format_fields` tiene:

| Columna | Uso |
|---------|-----|
| `field_type` | TEXT, NUMBER, CHECKLIST, MULTI_SELECT, REPEATER, PHOTO, AUTO… |
| `options` | Opciones C/NC, ítems de checklist, columnas repetibles |
| `config` | Rangos min/max, reglas de corrección obligatoria |
| `auto_fill_rule` | Fecha actual, pH fijo, horario por día, cálculos |
| `group_name` | Agrupa visualmente (Control cloro, Pediluvios…) |

Los datos llenados se guardan en `form_submission_sheets.data` como JSON.

---

## Reglas del sistema

- **Domingo:** ningún formato se puede crear (`no_sunday = true` en todos)
- **Corrección:** obligatoria solo si NC u observación (`config.requiredIf`)
- **Rangos:** pH 5.4–5.7, T°C 0–4 °C validados en frontend y backend

---

## Respaldo

```bash
mysqldump -u root -p colbeef_ops > backup_colbeef_ops.sql
```

Restaurar:

```bash
mysql -u root -p colbeef_ops < backup_colbeef_ops.sql
```

---

## Solución de problemas

| Error | Solución |
|-------|----------|
| `Can't connect to MySQL` | Verifique que el servicio MySQL esté corriendo |
| `Access denied` | Revise usuario/contraseña en `backend\.env` |
| `Database does not exist` | Ejecute el Paso 2 |
| Migrate falla | Borre `backend/prisma/migrations` solo en desarrollo y vuelva a migrar |

---

## Archivos relacionados

```
backend/prisma/schema.prisma          — Modelo de datos
backend/prisma/seed.ts                — Seed principal
backend/prisma/seeds/format-catalog.ts — 7 formatos
backend/prisma/seeds/fields/          — Campos por formato
formatos/*/CAMPOS.md                  — Documentación de negocio
```
