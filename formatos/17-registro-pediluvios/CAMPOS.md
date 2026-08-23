# Registro y Control de Desinfectantes en Pediluvio (LD-FR-004)

Formato semanal colaborativo. Código en sistema: `REGISTRO_PEDILUVIOS`.

## Columnas

| Campo | Comportamiento |
|-------|----------------|
| Fecha | DATE (como otros formatos) |
| Hora | TIME |
| Desinfectante | Texto libre |
| Concentración (ppm) | Número |
| N° pediluvios | Automático = **2** |
| Responsable | Usuario que llena la fila |
| Observaciones | Select: **Operativo** / **Preoperativo** |

## Reglas

- Quien inicia agrega colaboradores.
- Cada usuario solo edita **sus** filas.
- Encabezado: **Fecha inicio** (al crear) y **Fecha cierre** (al entregar).
- Solo **Verificó** al aprobar el admin (sin Elaboró).
- 5 filas iniciales + botón añadir más.
- PDF landscape, encabezado en continuidad, pie con número de página, Verificó al final.

## Activar

```powershell
cd backend
npm run db:seed
```

Asignar el formato a operarios desde Admin → Usuarios.
