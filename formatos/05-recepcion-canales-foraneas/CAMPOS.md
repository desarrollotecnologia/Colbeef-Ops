# Formato 5 — Recepción e Inspección de Canales Foráneas

**Archivo Excel:** `FORMATO RECEPCION CANALES FORANEAS.xlsx`  
**Código:** AC-FR-016 · Versión 3  
**Hojas operativas:** 1

---

## Campos comunes

| Campo | Tipo | Manual/Auto |
|-------|------|-------------|
| Fecha | Fecha | **Auto** |
| Operario | Texto | **Auto** |

**Reglas generales:** Domingo no se llena · C/NC con un click · Corrección solo si hubo observación o NC.

---

## Sección 1 — Recepción de canales

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Desinfección de canales | Checklist C / NC | **Manual** | Un click |
| Concentración de ácido láctico | Checklist C / NC | **Manual** | Un click |
| Placa del vehículo | Texto | **Manual** | |
| T°C vehículo | Número | **Manual** | |
| Cantidad de canales | Número | **Manual** | |
| Fecha de beneficio | Fecha | **Manual** | |
| Cliente | Texto | **Manual** | |
| Especie | Checklist | **Manual** | Bovino · Bufalino · Porcino |
| Lote N° | Texto | **Manual** | |

---

## Sección 2 — Inspección de canales (por código)

Múltiples filas (una por cada código de canal):

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Código de canal | Texto | **Manual** | |
| pH — resultado | Número | **Manual** | Rango referencia Excel: 5.4 – 5.8 |
| pH — C / NC | Checklist | **Manual** | Un click |
| T°C — resultado | Número | **Manual** | Rango: 0 – 4 °C |
| T°C — C / NC | Checklist | **Manual** | Un click |
| Hallazgos en cuartos de canal | Multi-selección | **Manual** | CR · MF · LV · PELO · HM · GS (varias a la vez) |
| Corrección | Texto | **Manual** | Condicional |

**Leyenda hallazgos (solo lectura):**
- CR: Contenido Ruminal · MF: Materia Fecal · LV: Leche Visible
- HM: Hematomas · GS: Grasa/Suero *(según Excel GM)*

---

## Sección 3 — Inspección durante desposte

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Fecha de desposte | Fecha | **Manual** | |
| Cava de almacenamiento | Texto | **Manual** | |
| T° (0° – 4° C) | Número | **Manual** | |
| Temperatura promedio | Número | **Manual** | Rango referencia: 0 – 4 °C |
| pH promedio | Número | **Manual** | Rango referencia: 5.4 – 5.8 |
| Lote asignado N° | Texto | **Manual** | |

---

## Observaciones

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Texto fijo | Solo lectura | **Auto** | Texto predeterminado del formato impreso |
| Observaciones adicionales | Texto | **Manual** | Espacio libre debajo del texto fijo |

**Texto fijo (del Excel):**
> Inspección según especie: Cuartos bovinos 10% - Canales porcinas 10%; …

*(Se muestra completo tal como viene en el documento original)*

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
