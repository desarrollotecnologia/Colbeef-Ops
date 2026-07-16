# Colbeef-Ops

Sistema web para digitalizar, diligenciar, revisar y conservar los formatos operativos y de aseguramiento de calidad de Colbeef.

La aplicación reemplaza planillas de Excel y formatos impresos por formularios dinámicos que pueden utilizarse desde computadores, tabletas o celulares. Los registros quedan almacenados en MySQL y pueden revisarse, aprobarse y exportarse a PDF.

## Contenido

- [Características principales](#características-principales)
- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Arquitectura](#arquitectura)
- [Roles y flujo de trabajo](#roles-y-flujo-de-trabajo)
- [Formatos disponibles](#formatos-disponibles)
- [Requisitos](#requisitos)
- [Instalación local](#instalación-local)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos](#base-de-datos)
- [Ejecución y compilación](#ejecución-y-compilación)
- [Despliegue en Windows Server](#despliegue-en-windows-server)
- [Scripts disponibles](#scripts-disponibles)
- [API REST](#api-rest)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Seguridad](#seguridad)
- [Respaldo y restauración](#respaldo-y-restauración)
- [Solución de problemas](#solución-de-problemas)

## Características principales

- Formularios digitales organizados por formato y hoja.
- Campos configurables desde los seeds de Prisma.
- Controles de cumplimiento: **C**, **NC** y **NA**.
- Tablas, listas de verificación, campos repetibles, fotografías y valores automáticos.
- Guardado progresivo por hoja.
- Estados de registro: borrador, pendiente de revisión, aprobado y rechazado.
- Validación de campos obligatorios en frontend y backend.
- Revisión, observaciones, aprobación y firma por parte del administrador.
- Búsqueda de registros por fecha, formato y estado.
- Generación de informes PDF con estructura específica para cada formato.
- Panel de métricas y telemetría de uso.
- Interfaz adaptable a computador, tableta y celular.
- Restricción de creación de formatos los domingos.
- Ejecución como servicio de producción mediante scripts de Windows.

## Tecnologías utilizadas

### Lenguajes

- **TypeScript 5.8**: lenguaje principal del frontend y backend.
- **JavaScript/Node.js**: entorno de ejecución del servidor y herramientas de construcción.
- **SQL/MySQL**: almacenamiento relacional y scripts de base de datos.
- **HTML y CSS**: estructura y presentación de la aplicación.
- **Batch (`.bat`)**: automatización de instalación, actualización y ejecución en Windows.

### Frontend

- **React 19**: construcción de la interfaz de usuario.
- **Vite 6**: servidor de desarrollo y compilación.
- **React Router 7**: navegación entre páginas.
- **Tailwind CSS 4**: estilos y diseño adaptable.
- **Axios**: comunicación con la API REST.
- **Lucide React**: iconografía.
- **Recharts**: gráficas del panel de métricas.

### Backend

- **Node.js 18+**: entorno de ejecución.
- **Express 4**: API REST y servidor web.
- **Prisma 6**: ORM, migraciones, modelo de datos y seeds.
- **MySQL 8**: base de datos.
- **JSON Web Tokens (JWT)**: autenticación.
- **bcryptjs**: cifrado de contraseñas.
- **Zod y express-validator**: validación de datos.
- **PDFKit**: generación de informes PDF.

### Herramientas de desarrollo

- **npm**: administración de dependencias y comandos.
- **tsx**: ejecución de TypeScript durante el desarrollo.
- **Concurrently**: ejecución simultánea del frontend y backend.
- **Git y GitHub**: control de versiones.
- **Prisma Studio**: inspección visual de la base de datos.

## Arquitectura

Colbeef-Ops utiliza una arquitectura cliente-servidor:

```text
Navegador
   │
   ├── React + Vite
   │       │
   │       └── solicitudes HTTP /api
   │
   └──── Express API
              │
              ├── autenticación y autorización
              ├── reglas de negocio
              ├── generación de PDF
              └── Prisma ORM
                       │
                       └── MySQL
```

En desarrollo, Vite sirve el frontend en el puerto `5173` y redirige `/api` hacia Express en el puerto `3001`.

En producción, Express sirve tanto la API como los archivos compilados del frontend desde un único puerto configurado mediante `PORT`.

Los formularios son dirigidos por esquema: el catálogo, las hojas y los campos se definen en `backend/prisma/seeds/`. Esto permite agregar o modificar formatos sin crear una página completamente independiente para cada campo.

## Roles y flujo de trabajo

### Operario (`OPERARIO`)

- Crea registros para la fecha de trabajo.
- Diligencia y guarda cada hoja.
- Conserva registros como borradores.
- Envía el formato para revisión.
- Corrige formatos rechazados.
- Consulta y elimina sus propios borradores cuando corresponda.

### Administrador (`ADMIN`)

- Consulta los registros de todos los operarios.
- Revisa formatos pendientes.
- Aprueba y firma registros.
- Rechaza registros con observaciones.
- Busca por fecha, formato o estado.
- Descarga informes PDF.

### Panel (`PANEL`)

- Accede al panel de indicadores.
- Consulta métricas y eventos de uso.
- No puede diligenciar ni revisar formatos operativos.

### Ciclo de un registro

```text
DRAFT (borrador)
   │
   └── el operario envía el formato
          ↓
PENDING_REVIEW (pendiente de revisión)
   │
   ├── el administrador aprueba → APPROVED
   │
   └── el administrador devuelve → REJECTED
                                          │
                                          └── el operario corrige y reenvía
```

## Formatos disponibles

El catálogo actual contiene **16 formatos**:

1. Preoperativo de Planta Beneficio — 8 hojas.
2. Preoperativo de Planta Desposte — 4 hojas.
3. Despacho de Producto Terminado — 1 hoja.
4. Verificación Desposte Operativo — 5 hojas.
5. Recepción e Inspección de Canales Foráneas — 1 hoja.
6. Recepción e Inspección de Canales para Desposte — 1 hoja.
7. Verificación de Producto Terminado — 2 hojas.
8. Inspección de Vehículos — 1 hoja.
9. Calibración pH-metro — 1 hoja.
10. Inspección de Hábitos Higiénicos — 1 hoja.
11. Seguimiento a Devoluciones — 1 hoja.
12. Formato de Decomisos — 1 hoja.
13. Verificación Línea Operativo — 1 hoja.
14. Verificación PC Comestibles Operativo — 4 hojas.
15. Verificación POES Operativo — 1 hoja.
16. Verificación de Productos Cárnicos Comestibles — 1 hoja.

La fuente oficial del catálogo está en:

```text
backend/prisma/seeds/format-catalog.ts
```

Los campos de cada formato están separados en:

```text
backend/prisma/seeds/fields/
```

## Requisitos

### Desarrollo

- Node.js **18 o superior**.
- npm incluido con Node.js.
- MySQL **8.0 o superior**.
- Git.
- Windows, Linux o macOS.

### Producción actual

- Windows Server o Windows 10/11.
- MySQL ejecutándose como servicio.
- Node.js 18 o superior.
- Acceso a la red interna.
- Permisos de administrador para configurar el arranque automático.

Puede verificar las versiones instaladas con:

```powershell
node --version
npm --version
git --version
mysql --version
```

## Instalación local

### 1. Clonar el repositorio

```powershell
git clone https://github.com/desarrollotecnologia/Colbeef-Ops.git
cd Colbeef-Ops
git checkout master
```

### 2. Instalar las dependencias

Desde la raíz:

```powershell
npm install
cd backend
npm install
cd ..\frontend
npm install
cd ..
```

También está disponible el comando raíz:

```powershell
npm run install:all
```

### 3. Crear la base de datos

En MySQL:

```sql
CREATE DATABASE colbeef_ops
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Para producción se recomienda crear un usuario dedicado:

```sql
CREATE USER 'colbeef'@'localhost' IDENTIFIED BY 'CONTRASENA_SEGURA';
GRANT ALL PRIVILEGES ON colbeef_ops.* TO 'colbeef'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Configurar las variables de entorno

```powershell
Copy-Item backend\.env.example backend\.env
```

Edite `backend/.env` con los datos reales del servidor.

### 5. Preparar Prisma y cargar los formatos

```powershell
cd backend
npm run db:generate
npx prisma migrate deploy
npm run db:seed
cd ..
```

Para una instalación de desarrollo también puede usar:

```powershell
scripts\setup-database.bat
```

### 6. Iniciar en modo desarrollo

```powershell
npm run dev
```

Direcciones predeterminadas:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Estado de la API: `http://localhost:3001/api/health`

## Variables de entorno

Archivo requerido:

```text
backend/.env
```

Ejemplo:

```env
DATABASE_URL="mysql://colbeef:CONTRASENA@localhost:3306/colbeef_ops"
JWT_SECRET="secreto-largo-unico-y-aleatorio"
JWT_EXPIRES_IN="8h"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

Descripción:

- `DATABASE_URL`: conexión completa a MySQL.
- `JWT_SECRET`: clave usada para firmar tokens. Debe ser larga, privada y distinta en producción.
- `JWT_EXPIRES_IN`: duración de la sesión autenticada.
- `PORT`: puerto utilizado por Express.
- `NODE_ENV`: `development` o `production`.
- `FRONTEND_URL`: origen permitido por CORS en desarrollo.

No se debe subir `backend/.env` al repositorio.

## Base de datos

### Entidades principales

- `users`: usuarios, roles y estado de la cuenta.
- `formats`: catálogo de formatos.
- `format_sheets`: hojas de cada formato.
- `format_fields`: definición dinámica de campos.
- `form_submissions`: encabezado y estado de cada registro.
- `form_submission_sheets`: información diligenciada por hoja en JSON.
- `signatures`: aprobación, firma y observaciones.
- `usage_events`: eventos utilizados por el panel de métricas.

### Comandos de Prisma

Ejecutados desde `backend/`:

```powershell
npm run db:generate  # Genera Prisma Client
npm run db:migrate   # Crea una migración en desarrollo
npm run db:seed      # Actualiza catálogo, hojas, campos y usuarios base
npm run db:studio    # Abre Prisma Studio en el puerto 5555
```

Después de modificar archivos en `backend/prisma/seeds/fields/`, ejecute:

```powershell
cd backend
npm run db:seed
```

El seed usa operaciones de actualización o creación, por lo que mantiene sincronizadas las definiciones de los formatos con la base de datos.

Consulte [docs/DATABASE.md](docs/DATABASE.md) para información adicional.

## Ejecución y compilación

### Desarrollo completo

```powershell
npm run dev
```

### Solo backend

```powershell
npm run dev:backend
```

### Solo frontend

```powershell
npm run dev:frontend
```

### Compilar todo

```powershell
npm run build
```

Los resultados quedan en:

```text
frontend/dist/
backend/dist/
```

### Iniciar la compilación de producción

```powershell
npm run start
```

El backend debe estar compilado y `NODE_ENV` debe configurarse como `production` para que Express sirva `frontend/dist`.

## Despliegue en Windows Server

### Primera instalación

1. Instale Node.js, Git y MySQL.
2. Clone la rama `master`.
3. Instale las dependencias.
4. Cree y configure `backend/.env`.
5. Cree la base de datos.
6. Genere Prisma, ejecute las migraciones y el seed.
7. Compile frontend y backend.
8. Ejecute `scripts\start-server.bat`.
9. Opcionalmente ejecute `scripts\setup-autostart.bat` como administrador.

### Actualizar una instalación existente

Desde la raíz del proyecto:

```powershell
scripts\update.bat
```

El script:

1. Detiene el servidor.
2. Ejecuta `git pull origin master`.
3. Compila el frontend.
4. Genera Prisma Client y compila el backend.
5. Ejecuta el seed para actualizar los formatos.
6. Inicia nuevamente el servidor.

La instalación actual de producción está preparada para utilizar los puertos `8081` o `3001`, según el valor de `PORT` en `backend/.env`.

Antes de actualizar, el repositorio del servidor debe estar limpio:

```powershell
git status
```

No edite archivos de código directamente en el servidor. Los cambios deben subirse primero a GitHub.

## Scripts disponibles

Scripts de Windows ubicados en `scripts/`:

- `dev.bat`: inicia frontend y backend en modo desarrollo.
- `setup-database.bat`: genera Prisma, ejecuta migraciones de desarrollo y carga el seed.
- `start.bat`: compila lo que falte e inicia el servidor en primer plano.
- `start-server.bat`: inicia la compilación de producción en segundo plano.
- `run-server-bg.bat`: proceso auxiliar usado por `start-server.bat`.
- `stop.bat`: detiene procesos en los puertos 8081 y 3001.
- `restart-server.bat`: detiene e inicia nuevamente el servidor.
- `update.bat`: trae `master`, compila, actualiza el seed y reinicia.
- `setup-autostart.bat`: registra una tarea de inicio automático en Windows.
- `install.bat`: asistente de instalación de dependencias y compilación.

Scripts npm disponibles desde la raíz:

```text
npm run install:all
npm run dev
npm run dev:backend
npm run dev:frontend
npm run build
npm run start
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

## API REST

Base en desarrollo:

```text
http://localhost:3001/api
```

Rutas principales:

### Salud

- `GET /api/health`: verifica que el servicio esté activo.

### Autenticación

- `POST /api/auth/login`: inicia sesión y entrega un JWT.
- `GET /api/auth/me`: obtiene el usuario autenticado.

### Formatos

- `GET /api/formats`: lista los formatos activos.
- `GET /api/formats/:id`: obtiene hojas y campos de un formato.

### Registros

- `GET /api/submissions`: consulta registros según rol y filtros.
- `GET /api/submissions/pending`: lista pendientes para el administrador.
- `POST /api/submissions`: crea un registro.
- `GET /api/submissions/:id`: obtiene un registro completo.
- `PUT /api/submissions/:id/sheets/:sheetId`: guarda una hoja.
- `POST /api/submissions/:id/submit`: envía a revisión.
- `POST /api/submissions/:id/approve`: aprueba y firma.
- `POST /api/submissions/:id/reject`: rechaza para corrección.
- `DELETE /api/submissions/:id`: elimina un registro permitido.
- `GET /api/submissions/:id/pdf`: genera o descarga el PDF.

### Analítica

- `GET /api/analytics/dashboard`: consulta indicadores para el rol Panel.
- `POST /api/analytics/events`: registra eventos de uso.

Las rutas protegidas esperan:

```http
Authorization: Bearer <token>
```

## Estructura del proyecto

```text
Colbeef-Ops/
├── backend/
│   ├── prisma/
│   │   ├── migrations/              # Migraciones SQL
│   │   ├── seeds/
│   │   │   ├── fields/              # Definición de campos por formato
│   │   │   ├── field-helpers.ts     # Constructores reutilizables
│   │   │   └── format-catalog.ts    # Catálogo de los 16 formatos
│   │   ├── schema.prisma            # Modelo relacional
│   │   └── seed.ts                  # Carga y sincronización inicial
│   ├── scripts/                     # Utilidades internas
│   └── src/
│       ├── config/                  # Variables de entorno
│       ├── lib/                     # Cliente Prisma
│       ├── middleware/              # Autenticación y errores
│       ├── routes/                  # Endpoints REST
│       ├── services/                # PDF, métricas y telemetría
│       ├── utils/                   # Fechas y validaciones
│       └── index.ts                 # Entrada de Express
├── frontend/
│   ├── public/                      # Logotipos e iconos
│   └── src/
│       ├── components/
│       │   └── form/                # Motor y diseños de formularios
│       ├── context/                 # Sesión y autenticación
│       ├── lib/                     # API, fechas y utilidades
│       ├── pages/
│       │   ├── admin/               # Revisión y administración
│       │   ├── operator/            # Diligenciamiento
│       │   └── panel/               # Indicadores de uso
│       ├── types/                   # Tipos compartidos del frontend
│       ├── App.tsx                  # Rutas de la aplicación
│       └── main.tsx                 # Entrada de React
├── docs/                            # Documentación técnica
├── formatos/                        # Excel y documentos de referencia
├── scripts/                         # Automatización para Windows
├── package.json                     # Comandos generales
└── README.md
```

## Seguridad

- Las contraseñas se almacenan con hash de bcrypt; nunca en texto plano.
- La autenticación utiliza JWT con expiración configurable.
- Los endpoints verifican autenticación y rol.
- CORS se restringe mediante `FRONTEND_URL`.
- Prisma evita la construcción manual de consultas SQL comunes.
- Los datos recibidos se validan antes de guardarse.

Recomendaciones para producción:

1. Cambie inmediatamente las credenciales creadas por el seed.
2. Use un `JWT_SECRET` largo, aleatorio y privado.
3. No publique `backend/.env`.
4. Use un usuario MySQL dedicado con permisos limitados a `colbeef_ops`.
5. Restrinja los puertos mediante el firewall.
6. Mantenga Node.js y MySQL actualizados.
7. Realice respaldos periódicos.
8. Si la aplicación queda expuesta fuera de la red interna, utilice HTTPS mediante un proxy inverso.

### Usuarios de desarrollo creados por el seed

El seed crea usuarios base para facilitar la instalación:

```text
Administrador: admin / admin123
Operario:     operario / operario123
```

Estas contraseñas son únicamente para instalación o desarrollo y deben cambiarse antes de usar el sistema en producción.

## Respaldo y restauración

### Crear respaldo

```powershell
mysqldump -u colbeef -p --single-transaction colbeef_ops > colbeef_ops_backup.sql
```

### Restaurar respaldo

```powershell
mysql -u colbeef -p colbeef_ops < colbeef_ops_backup.sql
```

Se recomienda:

- Crear un respaldo diario.
- Conservar copias fuera del servidor principal.
- Probar periódicamente la restauración.
- Realizar un respaldo antes de aplicar migraciones.

## Solución de problemas

### La aplicación no conecta con MySQL

- Verifique que el servicio MySQL esté activo.
- Revise usuario, contraseña, host, puerto y base en `DATABASE_URL`.
- Confirme que el usuario tenga permisos sobre `colbeef_ops`.

### Prisma Client no está generado

```powershell
cd backend
npm run db:generate
```

### Los cambios de un formato no aparecen

```powershell
cd backend
npm run db:seed
```

Después recargue la aplicación.

### El frontend no refleja cambios

```powershell
cd frontend
npm run build
```

Luego reinicie el servidor y actualice el navegador sin caché.

### El puerto está ocupado

```powershell
netstat -aon | findstr :3001
taskkill /PID <PID> /F
```

También puede ejecutar:

```powershell
scripts\stop.bat
```

### `git push` indica que la referencia `master` no existe

Verifique que la rama local siga el remoto:

```powershell
git fetch origin
git checkout -B master origin/master
```

No ejecute este comando si tiene cambios locales sin guardar.

### Verificación del servidor

Abra:

```text
http://SERVIDOR:PUERTO/api/health
```

Una respuesta correcta incluye:

```json
{
  "status": "ok",
  "service": "colbeef-ops"
}
```

## Documentación relacionada

- [Guía de base de datos MySQL](docs/DATABASE.md)
- [Paso a paso de MySQL](docs/PASO-A-PASO-MYSQL.md)
- [Documentación de formatos](formatos/README.md)
- Archivos `CAMPOS.md` dentro de cada carpeta de `formatos/`.

## Mantenimiento

Al agregar o modificar un formato:

1. Actualice su archivo en `backend/prisma/seeds/fields/`.
2. Ajuste el catálogo si cambia el nombre o número de hojas.
3. Actualice el componente especializado del frontend si el diseño lo requiere.
4. Ajuste el generador PDF cuando existan columnas o reglas especiales.
5. Ejecute `npm run db:seed`.
6. Compile frontend y backend.
7. Pruebe el diligenciamiento, guardado, revisión y PDF.

## Estado del proyecto

Proyecto privado de uso interno de Colbeef. No se concede una licencia de distribución pública.
