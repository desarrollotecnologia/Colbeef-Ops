# Colaboración en formatos

Varios operarios pueden llenar el mismo envío en turnos distintos.

## Reglas

- Quien **inicia** el borrador es el dueño y puede agregar/quitar colaboradores (solo en `DRAFT` / `REJECTED`).
- Solo la lista (dueño + colaboradores) ve y edita el envío; cualquiera de ellos puede **entregar**.
- Dueño y colaboradores **pueden editar** campos ya llenados por otro (sobrescritura permitida).
- Cada guardado queda en la **trazabilidad** (`Guardó / editó hoja` + quién + hoja + cantidad de cambios).
- También se registra el **último editor** de cada campo (informativo; no bloquea).
- Si el admin **rechaza** (motivo obligatorio), el envío vuelve a todos con color de “pendiente ajustar”.
- En ficha (UI operario/admin) queda la trazabilidad en **Movimientos del formato** (inició, colaboradores, guardados/ediciones, entregó, rechazos/aprobaciones).
- Esa lista de movimientos **no** se incluye en el PDF.
- El **PDF** solo incluye la hoja de resumen (inició / colaboradores / entregó) si el envío **tiene colaboradores**. Sin colaboración no se agrega ese reporte.
- En firmas del PDF: sin colaboradores solo aparece **ELABORÓ**; **ENTREGÓ** solo en modo colaboración.

## Migración

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

Reiniciar API y frontend.
