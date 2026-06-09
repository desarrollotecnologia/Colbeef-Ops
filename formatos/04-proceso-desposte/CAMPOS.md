# Formato 4 — Verificación Desposte Operativo (Proceso Desposte)

**Archivo Excel:** `FORMATOS PROCESO DESPOSTE.xlsx`  
**Código:** AC-FR-014 · Versión 04  
**Hojas operativas:** 5 (DIARIO 1 a DIARIO 5)

---

## Campos comunes

| Campo | Tipo | Manual/Auto |
|-------|------|-------------|
| Fecha | Fecha | **Auto** |
| Operario | Texto | **Auto** |

**Reglas generales:** Domingo no se llena · C/NC con un click · Corrección solo si hubo observación o NC.

---

## HOJA 1 — DIARIO 1

> **Nota importante:** La toma de temperaturas se realiza **cada hora**.  
> Se debe registrar **Bovino, Bufalino o Porcino** — pueden presentarse varias especies en un mismo día.

### Especie

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Especie | Multi-selección | **Manual** | Bovino · Bufalino · Porcino — una o varias |

### Temperaturas de áreas (cada hora)

Matriz: **Área × Hora** — el operario registra temperatura manual por celda.

**Áreas (fijas, como en Excel):**

| # | Área |
|---|------|
| 1 | Sala de desposte |
| 2 | Etiquetado y empaque secundario |
| 3 | Porcionado |
| 4 | Alistamiento o picking |
| 5 | Cuarto de refrigeración # 1 |
| 6 | Cuarto de congelación # 1 |
| 7 | Contenedor # 1 |
| 8 | Contenedor # 2 |
| 9 | Contenedor # 3 |
| 10 | Cava 12 |

| Campo por celda | Tipo | Manual/Auto |
|-----------------|------|-------------|
| Hora | Hora | **Manual** |
| Temperatura (°C) | Número | **Manual** |
| PROM (promedio por área) | Número | **Auto** | Se calcula al registrar temperaturas del día |
| Observaciones | Texto | **Manual** |

---

### Control de cloro residual (cada 4 horas)

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Hora | Hora | **Manual** | |
| Punto de toma | Multi-selección | **Manual** | Lavamanos #1 al #15 — un click por punto |
| Cloro residual (0.3 – 2.0 ppm) | Número | **Manual** | |
| C / NC | Checklist | **Manual** | Un click |
| Corrección | Texto | **Manual** | Condicional |

---

### Titulación de ácido láctico

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Hora | Hora | **Manual** | |
| Volumen NaOH (ml) | Checklist | **Manual** | **2.2** o **2.3** — selección |
| Concentración AC láctico | Número | **Auto** | 2.2 → **1.98%** · 2.3 → **2.07%** |
| C / NC | Checklist | **Manual** | Un click |
| Corrección | Texto | **Manual** | Condicional |

---

### Pediluvios (3 casillas — Pediluvios 1 y 2)

| Campo | Tipo | Manual/Auto |
|-------|------|-------------|
| Área | Solo lectura | **Auto** — "Pediluvios 1 y 2" |
| Hora | Hora | **Manual** |
| Principio activo | Texto | **Manual** |
| Concentración (ppm) | Texto/Número | **Manual** |
| C / NC | Checklist | **Manual** |
| Corrección | Texto | **Manual** — condicional |

---

## HOJA 2 — DIARIO 2 — Inspección producto en proceso (0 a 7 °C)

> Registro **cada hora**. Por cada hora se registran **2 cortes**.  
> Debe indicarse si el proceso es **Desposte**, **Porcionado** o **ambos**.  
> Espacio suficiente para procesos **superiores a 12 horas**.

### Encabezado de proceso

| Campo | Tipo | Manual/Auto |
|-------|------|-------------|
| Despostado | Check / indicador | **Manual** |
| Porcionado | Check / indicador | **Manual** |

### Registros por hora (2 cortes por hora)

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Hora | Hora | **Manual** | |
| Nombre del corte | Texto | **Manual** | 2 registros por hora |
| Lote | Texto | **Manual** | |
| T°C | Número | **Manual** | Rango proceso: 0 – 7 °C |
| Hallazgos | Multi-selección | **Manual** | Hematomas · Abscesos · Vacunas (varias a la vez) |
| Peso | Número | **Manual** | |
| Corrección | Texto | **Manual** | Condicional |
| Observaciones | Texto | **Manual** | Al final de la hoja |

---

## HOJA 3 — DIARIO 3

### Sección A — Condiciones de empaque

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Hora | Hora | **Manual** | |
| Nombre del corte | Texto | **Manual** | |
| Lote | Texto | **Manual** | |
| T°C | Número | **Manual** | |
| Sellado y presentación | Checklist C / NC | **Manual** | Un click |
| Información de etiqueta | Checklist C / NC | **Manual** | Un click |
| Etiqueta legible | Checklist C / NC | **Manual** | Un click |
| Observación | Texto | **Manual** | |
| Corrección | Texto | **Manual** | Condicional |

---

### Sección B — POES operativos equipos (cada 4 horas)

| Campo | Frecuencia | Tipo |
|-------|------------|------|
| Hora | — | Manual |
| Tablas | Cada 4 horas | C / NC |
| Sierra sin fin | Cada 4 horas | C / NC |
| Bandas 1, 2 y recortes | Cada 4 horas | C / NC |
| Delantales plásticos | Cada 4 horas | C / NC |
| Corrección | — | Manual — condicional |

---

### Sección C — POES operativos (cada hora)

| Campo | Frecuencia | Tipo |
|-------|------------|------|
| Hora | — | Manual |
| Molino | Cada hora | C / NC |
| Grameras | Cada hora | C / NC |
| Observaciones | — | Manual |
| Corrección | — | Manual — condicional |

---

## HOJA 4 — DIARIO 4 — POES operativo del manipulador (cada hora)

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Hora | Hora | **Manual** | |
| Operario | Texto | **Manual** | |
| Guantes | Checklist C / NC | **Manual** | Un click |
| Guante de malla | Checklist C / NC | **Manual** | Un click |
| Cuchillo | Checklist C / NC | **Manual** | Un click |
| Gancho despostador | Checklist C / NC | **Manual** | Un click |
| Soporte gancho deshuesador | Checklist C / NC | **Manual** | Un click |
| Corrección | Texto | **Manual** | Condicional |
| Observaciones | Texto | **Manual** | |

---

## HOJA 5 — DIARIO 5 — Verificación de etiquetado por lote

> Por cada **LOTE** se registran varias etiquetas.  
> **Funcionalidad especial:** espacios en blanco para **toma de fotos** de cada etiqueta.

### Bloque por lote (se repite — mínimo 2 bloques en Excel)

| Campo | Tipo | Manual/Auto |
|-------|------|-------------|
| Fecha | Fecha | **Manual** |
| Lote | Texto | **Manual** |

**Por cada tipo de producto (4 categorías):**

| Categoría | Empaque | Etiqueta | Video Jet |
|-----------|---------|----------|-----------|
| Producto refrigerado sin hueso | Vacío o Granel | C / NC | C / NC / N.A |
| Producto refrigerado con hueso | Vacío o Granel | C / NC | C / NC / N.A |
| Producto congelado sin hueso | Vacío o Granel | C / NC | C / NC / N.A |
| Producto congelado con hueso | Vacío o Granel | C / NC | C / NC / N.A |

| Campo adicional | Tipo | Notas |
|-----------------|------|-------|
| Foto de etiqueta | Imagen | Captura desde tablet/celular — un espacio por etiqueta |
| Observaciones | Texto | Manual |

**Leyenda:** C = Cumple · NC = No cumple · N.A = No aplica

---

## Firmas (Hoja 5)

| Campo | Notas |
|-------|-------|
| Elaboró | Vacío por ahora |
| Verificó | Admin al aprobar |

---

## Resumen de lógica especial en este formato

| Funcionalidad | Detalle |
|---------------|---------|
| Promedio temperatura | Auto por área al registrar datos hora a hora |
| Volumen titulación | Selección 2.2 / 2.3 → concentración automática |
| Lavamanos cloro | Checklist #1 al #15 |
| Proceso hoja 2 | Desposte / Porcionado / ambos + 2 cortes por hora |
| Fotos hoja 5 | Captura de imagen por espacio de etiqueta |
| Procesos largos | Tabla expandible para más de 12 horas |

---

## Estado

- [x] Excel recibido y revisado
- [x] Documentado con información del usuario
- [x] **Formato cerrado** — listo para implementar
