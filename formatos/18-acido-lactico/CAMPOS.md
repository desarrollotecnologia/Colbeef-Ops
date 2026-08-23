# Titulación y Monitoreo de Ácido Láctico (AC-FR-033)

Código en sistema: `TITULACION_ACIDO_LACTICO` — 2 hojas.

## Hoja 1 — Titulación

Fecha | Hora | Vol. NaOH | Concentración (auto) | Cumple | No cumple | Corrección | Actividad (Operativo/Preoperativo) | Responsable (quien llena)

## Hoja 2 — Monitoreo

Igual + Monitoreo PCC (X) + Verificó por fila (✓ nombre del dueño / ✗).

## Reglas

- Colaboración con filas propias.
- Solo el dueño marca Verificó por fila y entrega a admin.
- Admin da el Verificó final del pie (sin Elaboró).
- Fórmula: `% = V × N × #eq × 100` (N=0,1; #eq=0,09). Rango monitoreo: 1,9%–2,1%.

## Activar

```powershell
cd backend
npm run db:seed
```

Asignar el formato a operarios en Admin → Usuarios.
