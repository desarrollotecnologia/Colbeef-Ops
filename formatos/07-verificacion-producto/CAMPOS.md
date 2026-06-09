# Formato 7 — Verificación de Producto Terminado

**Archivo Excel:** `VERIFICACION DE PRODUCTO TERMINADO.xlsx`  
**Código:** AC-FR-022 · Versión 02  
**Hojas operativas:** 2

| # | Hoja Excel | Tipo producto |
|---|------------|---------------|
| 1 | PRODUCTO TERMINADO REFRIGERADO | Refrigerado (0 – 4 °C) |
| 2 | PRODUCTO TERMINADO CONGELADO | Congelado (-18 °C) |

---

## Campos comunes

| Campo | Tipo | Manual/Auto |
|-------|------|-------------|
| Fecha | Fecha | **Auto** |
| Operario | Texto | **Auto** |

**Reglas generales:** Domingo no se llena · C/NC con un click · Corrección solo si hubo observación o NC.

---

## Registro por lote (se repite varias veces por hoja — 4 bloques en Excel)

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Lote | Texto | **Manual** | |
| Área de refrigeración / congelación | Multi-selección | **Manual** | CER · Túnel de congelación · Contenedor #1 · Contenedor #2 · Contenedor #3 · Cava 12 · Contenedor externo |
| Producto | Texto | **Manual** | |
| Fecha de producción | Fecha | **Manual** | |
| Fecha de vencimiento | Fecha | **Manual** | |
| Temperatura | Número | **Manual** | |
| Hora | Hora | **Manual** | |
| Empaque al vacío — C / NC | Checklist | **Manual** | Un click |
| Etiqueta — C / NC | Checklist | **Manual** | Un click |
| Empaque a granel — C / NC | Checklist | **Manual** | Un click — tipo empaque: **Vacío o Granel** |
| Observaciones | Texto | **Manual** | |

> En el Excel, empaque al vacío y granel son columnas separadas con C/NC cada una. En el programa: tipo de empaque (Vacío/Granel) + estado C/NC según corresponda.

---

## Observaciones generales (al final de cada hoja)

| Campo | Tipo | Manual/Auto |
|-------|------|-------------|
| Observaciones generales | Texto | **Manual** |

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
