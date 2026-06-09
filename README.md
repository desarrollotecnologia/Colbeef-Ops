# Colbeef-Ops

Sistema digital de formatos operativos para planta de beneficio y desposte.

Reemplaza los formatos impresos en Excel por formularios digitales que se llenan desde tablet o celular, con flujo de revisión y firma del jefe de área.

---

## Formatos incluidos (7)

| # | Formato | Hojas |
|---|---------|-------|
| 1 | Preoperativo de Planta Beneficio | 8 |
| 2 | Preoperativo de Planta Desposte | 4 |
| 3 | Despacho Producto | 1 |
| 4 | Proceso Desposte | 5 |
| 5 | Recepción e Inspección de Canales Foráneas | 1 |
| 6 | Recepción e Inspección de Canales para Desposte | 1 |
| 7 | Verificación de Producto | 2 |

---

## Roles

| Rol | Funciones |
|-----|-----------|
| **Operario** | Llena formatos del día desde tablet/celular. Entrega para revisión. |
| **Admin (Jefe de área)** | Revisa formatos pendientes, firma/aprueba, busca por fecha, descarga PDF. |

---

## Flujo de trabajo

```
Operario llena formatos → Guarda borrador → Entrega del día
                                                    ↓
                              Admin ve pendientes → Revisa → Firma/Aprueba
                                                    ↓
                              Guardado en BD → Búsqueda por fecha → Descarga PDF
```

---

## Requisitos

- **Node.js** 18 o superior
- **MySQL** 8.0 o superior
- **Windows Server** (para scripts .bat de arranque automático)

---

## Instalación rápida

```bash
# 1. Instalar dependencias
scripts\install.bat

# 2. Crear BD en MySQL (ver docs/DATABASE.md paso 2)
#    scripts\init-database.sql

# 3. Configurar backend\.env con credenciales MySQL

# 4. Crear tablas + cargar 7 formatos y campos
scripts\setup-database.bat

# 5. Iniciar
scripts\start.bat
```

El sistema quedará disponible en: **http://localhost:3001**

---

## Desarrollo local

```bash
scripts\dev.bat
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

---

## Usuarios de prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Admin |
| operario | operario123 | Operario |

> Cambiar contraseñas en producción.

---

## Estructura del proyecto

```
Colbeef-Ops/
├── backend/                 # API REST (Express + TypeScript + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma    # Modelo de base de datos
│   │   └── seed.ts          # Datos iniciales (formatos, usuarios)
│   └── src/
│       ├── routes/          # Endpoints API
│       ├── middleware/      # Autenticación, roles
│       └── index.ts         # Punto de entrada
├── frontend/                # Interfaz web (React + Vite + Tailwind)
│   └── src/
│       ├── pages/
│       │   ├── operator/    # Vistas del operario
│       │   └── admin/       # Vistas del admin
│       └── components/      # Componentes reutilizables
├── scripts/                 # Scripts .bat para Windows
│   ├── install.bat
│   ├── start.bat
│   ├── dev.bat
│   ├── setup-database.bat
│   ├── setup-autostart.bat
│   └── stop.bat
└── docs/
    └── DATABASE.md          # Guía de base de datos
```

---

## Documentación

- [Guía de base de datos MySQL](docs/DATABASE.md) — Paso a paso para crear y configurar MySQL

---

## Próximos pasos

Los campos de cada formato se configurarán conforme se reciban los archivos Excel. El sistema ya tiene la estructura lista para recibirlos.
