# SAI-CAL-F005 — Control de temperatura de víscera en cava

Formato digital con **2 hojas** (misma estructura de campos):

1. **Vísceras rojas**
2. **Vísceras blancas**

Código sistema: `TEMP_VISCERAS_CAVA`

## Encabezado (por hoja)

| Campo | Tipo | Notas |
|-------|------|-------|
| Cava de almacenamiento | Texto | Obligatorio |
| Cliente / destino | Texto | Obligatorio |

Fecha y operario del documento: automáticos del sistema.

## Registros (repetidor, 5 filas iniciales, se pueden añadir)

Cada fila tiene dueño (colaboración): solo se editan filas vacías o propias.

| Campo | Tipo | Notas |
|-------|------|-------|
| Código víscera | Texto | Obligatorio si la fila tiene datos |
| T° Control 1 — Fecha, H. inicio, H. final, T° | Fecha / Hora / Número | Obligatorio en filas llenas |
| T° Control 2 — Fecha, H. inicio, H. final, T° | Fecha / Hora / Número | Opcional; si se inicia, completar los 4 |
| T° Control 3 — Fecha, H. inicio, H. final, T° | Fecha / Hora / Número | Opcional; si se inicia, completar los 4 |
| Observaciones | Texto | Opcional |

## PDF

- Horizontal (landscape)
- Encabezado del formato + cava / cliente
- Tabla de filas con los 3 controles
- Solo firma **Verificó** (admin)

## Seed

```bash
cd backend
npm run db:seed
```
