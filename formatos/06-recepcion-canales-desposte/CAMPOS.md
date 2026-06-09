# Formato 6 — Recepción e Inspección de Canales para Desposte

**Archivo Excel:** `FORMATO RECEPCION CANALES.xlsx`  
**Código:** AC-FR-011 · Versión 03  
**Hojas operativas:** 1

---

## Campos comunes

| Campo | Tipo | Manual/Auto |
|-------|------|-------------|
| Fecha | Fecha | **Auto** |
| Operario | Texto | **Auto** |

**Reglas generales:** Domingo no se llena · C/NC con un click · Corrección solo si hubo observación o NC.

---

## Encabezado — Inspección de canales

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Cava de almacenamiento | Texto | **Manual** | |
| T°C cava | Checklist C / NC | **Manual** | Un click — cumple / no cumple |
| Cantidad de canales | Número | **Manual** | |
| Especie | Checklist | **Manual** | Bovino · Bufalino · Porcino (una opción) |
| Fecha de beneficio | Fecha | **Manual** | |
| Cliente | Texto | **Manual** | |
| Lote N° | Texto | **Manual** | |

---

## Inspección por código de cuarto de canal

Múltiples filas (una por cada código de canal):

| Campo | Tipo | Manual/Auto | Validación | Notas |
|-------|------|-------------|------------|-------|
| Código cuarto de canal | Texto | **Manual** | — | |
| pH — resultado | Número | **Manual** | Rango **5.4 – 5.7** | El sistema valida si está en rango |
| pH — C / NC | Checklist | **Manual** | — | Un click |
| T°C cuarto canal — resultado | Número | **Manual** | Rango **0 – 4 °C** | El sistema valida si está en rango |
| T°C — C / NC | Checklist | **Manual** | — | Un click |
| Hallazgos en cuartos de canal | Multi-selección | **Manual** | — | CR · MF · LV · PELO (varias a la vez) |
| Corrección | Texto | **Manual** | Condicional | Solo si hubo observación o NC |

**Leyenda hallazgos (solo lectura):**
- CR: Contenido Ruminal
- MF: Materia Fecal
- LV: Leche Visible
- PELO: Pelo

---

## Observaciones

| Campo | Tipo | Manual/Auto |
|-------|------|-------------|
| Observaciones | Texto | **Manual** |

---

## Firmas

| Campo | Notas |
|-------|-------|
| Elaboró | Vacío por ahora |
| Verificó | Admin al aprobar |

---

## Estado

- [x] Documentado y confirmado
- [x] **Formato cerrado**
