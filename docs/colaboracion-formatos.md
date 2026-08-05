# Colaboración en formatos

Varios operarios pueden llenar el mismo envío en turnos distintos.

## Reglas

- Quien **inicia** el borrador es el dueño y puede agregar/quitar colaboradores (solo en `DRAFT` / `REJECTED`).
- Solo la lista (dueño + colaboradores) ve y edita el envío; cualquiera de ellos puede **entregar**.
- Cada campo guardado queda bloqueado para su autor: los demás solo llenan lo vacío.
- Si el admin **rechaza** (motivo obligatorio), el envío vuelve a todos con color de “pendiente ajustar”.
- En ficha y PDF queda la trazabilidad (inició, colaboradores, entregó, rechazos/aprobaciones).

## Migración

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

Reiniciar API y frontend.
