# Formato 3 — Despacho de Producto Terminado

**Archivo Excel:** `FORMATOS DESPACHO DE PRODUCTO TERMINADO.xlsx`  
**Código:** AC-FR-015 · Versión 3  
**Hojas operativas:** 1 (DESPACHOS)

---

## Campos comunes

| Campo | Tipo | Manual/Auto |
|-------|------|-------------|
| Operario | Texto | **Auto** |

**Reglas generales:** Domingo no se llena · C/NC con un click · Corrección solo si hubo observación o NC.

---

## Encabezado del despacho (por vehículo / turno)

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Especie | Multi-selección | **Manual** | Bovino · Bufalino · Porcino — puede elegir 1, 2 o 3 (dos especies en mismo vehículo) |
| Fecha | Fecha | **Manual** | |
| Hora | Hora | **Manual** | |
| Destino | Texto | **Manual** | |
| Nombre del conductor | Texto | **Manual** | |
| Placa | Texto | **Manual** | |
| T°C vehículo | Número | **Manual** | |
| Limpieza del vehículo | Checklist C / NC | **Manual** | Un click |
| Desinfección del vehículo | Checklist C / NC | **Manual** | Un click |
| Observaciones (encabezado) | Texto | **Manual** | |

---

## Tabla de productos despachados

Múltiples filas (una por producto):

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Producto | Texto | **Manual** | |
| Lote | Texto | **Manual** | |
| Fecha de producción | Fecha | **Manual** | |
| Fecha de vencimiento | Fecha | **Manual** | |
| Tipo de empaque | Checklist | **Manual** | Vacío **o** Granel — una opción |
| Estado de empaque | Checklist C / NC | **Manual** | Un click |
| Temperatura de producto | Número | **Manual** | Refrig: 0–4 °C · Congelado: -18 °C *(según tipo)* |
| Observaciones | Texto | **Manual** | |
| Corrección | Texto | **Manual** | Condicional |

**Leyenda (solo lectura):** C = Cumple · NC = No cumple · REFR = Refrigerado · CONG = Congelado

---

## Firmas

| Campo | Notas |
|-------|-------|
| Elaboró | Vacío por ahora |

---

## Estado

- [x] Documentado y confirmado
- [x] **Formato cerrado**
