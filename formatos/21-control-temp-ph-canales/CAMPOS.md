# AC-FR-034 — Control de temperatura y pH de canales

Código sistema: `CONTROL_TEMP_PH_CANALES`

## Características

- **Multi-día**: fecha inicio al crear, fecha cierre al entregar
- **Colaborativo**: filas con dueño; cualquier colaborador puede iniciar y entregar
- **1 hoja**

## Encabezado

| Campo | Tipo |
|-------|------|
| Cliente | Texto |

## Controles 1–4 (compartidos)

Por cada control: Cava, T°C cava, Fecha, Hora

## Liberación de canales

Cava, T°C cava, Fecha, Hora

## Referencia

| Campo | Tipo |
|-------|------|
| Tiempo de almacenamiento en refrigeración (horas) | Texto |

## Registro de canales (repetidor, 5 filas iniciales)

| Campo | Tipo |
|-------|------|
| N° | Automático |
| Código | Texto |
| Control 1–4 (temp. almacenamiento) | Texto |
| T°C liberación | Texto |
| pH | Texto |
| Responsable | Automático (dueño de fila) |

## Observaciones generales

Texto largo al pie.

## Base de datos

No requiere cambios de esquema Prisma: usa campos JSON existentes.

## Seed

```bash
cd backend && npm run db:seed
```
