# Formato 2 — Preoperativo de Planta Desposte

**Archivo Excel:** `FORMATO PREOPERATIVO (2).xlsx`  
**Hojas operativas:** 4 (+ 1 hoja "control de cambios" — solo referencia, no se llena)

| # | Nombre en Excel | Descripción |
|---|-----------------|-------------|
| 1 | preoperativo 1 | Control cloro, temperaturas, titulación, equipos, pediluvios |
| 2 | preoperativo 2 | Áreas comunes, etiquetado, porcionado |
| 3 | preoperativo 3 | Alistamiento, pasillo cuarteo, sala desposte |
| 4 | preoperativo 4 | Otras áreas, higienización alturas, material extraño |
| — | control de cambios | Solo historial del documento — **no se digitaliza** |

**Código documento:** AC-FR-017 · Versión 03

---

## Campos comunes a todas las hojas

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Fecha | Fecha | **Auto** | Fecha del día actual |
| Operario | Texto | **Auto** | Usuario logueado |
| Empresa | Texto | **Auto** | "COLBEEF S.A.S" (fijo) |

**Regla heredada del Formato 1:** Los **domingos no se llena** el formato.

---

## HOJA 1 — Preoperativo 1

### Encabezado

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Especie | Multi-selección | **Manual** | Opciones: **Bovino**, **Bufalino**, **Porcino** — puede elegir 1, 2 o las 3 |

---

### Sección 1 — Control de cloro residual

| Campo | Tipo | Manual/Auto | Obligatorio | Notas |
|-------|------|-------------|-------------|-------|
| Hora | Hora | **Manual** | Sí | |
| Punto de toma | Texto | **Manual** | Sí | |
| pH | Número | **Auto** | — | Siempre **7.0** |
| Cloro residual | Número | **Manual** | **Sí** | Rango: 0.3 – 2.0 ppm |
| Cumple (C) | Checklist | **Manual** | Sí | Un click |
| No cumple (NC) | Checklist | **Manual** | Sí | Un click |
| Corrección | Texto | **Manual** | Condicional | Solo si hubo observación o NC |

---

### Sección 2 — Temperaturas de áreas

Un registro por cada área. Campos por fila:

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Hora | Hora | **Manual** | |
| Temperatura (°C) | Número | **Manual** | |
| C / NC | Checklist | **Manual** | Un click |
| Corrección | Texto | **Manual** | Solo si hubo observación o NC |

**Áreas (del Excel):**

| # | Área |
|---|------|
| 1 | Sala desposte |
| 2 | Cuarto de etiquetado y empaque secundario |
| 3 | Porcionado |
| 4 | Alistamiento o picking |
| 5 | Cuarto de refrigeración # 1 |
| 6 | Cuarto de congelación # 1 |
| 7 | Contenedor # 1 |
| 8 | Contenedor # 2 |
| 9 | Contenedor # 3 |
| 10 | Cava 12 |

---

### Sección 3 — Titulación de ácido láctico

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Hora | Hora | **Manual** | |
| Volumen de NaOH (ml) | Número / Selección | **Manual** | Ingresa el valor; si es **2.2** o **2.3**, la concentración se asigna sola |
| Concentración ác. láctico 2% | Número | **Auto** | Se llena al elegir/ingresar volumen 2.2 o 2.3 |
| C / NC | Checklist | **Manual** | Un click |
| Corrección | Texto | **Manual** | Solo si hubo observación o NC |

**Regla automática de concentración:**

| Si volumen es… | Concentración resultante |
|----------------|--------------------------|
| 2.2 ml | **1.98** |
| 2.3 ml | **2.07** |

> El operario ingresa o selecciona el volumen. Si el valor es 2.2 o 2.3, el programa muestra la concentración correspondiente automáticamente.

---

### Sección 4 — Variables de equipos

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Estado | Check Encendido / Apagado | **Manual** | Un click — solo una opción |
| Variable (T°C / Presión) | Texto | **Auto / Solo lectura** | Predeterminado en el formato — no lo llena el operario |
| Observaciones | Texto | **Manual** | |

**Equipos:**

| # | Equipo | Variable (solo lectura) |
|---|--------|-------------------------|
| 1 | Termo-encogido | T°C / Presión — N.A |
| 2 | Empacadora al vacío | T°C / Presión — N.A |
| 3 | Termoformadora | T°C / Presión — N.A |
| 4 | Pediluvios | — |

---

### Sección 5 — Pediluvios (principio activo)

Dos registros (N° 1 y N° 2):

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Principio activo | Texto | **Manual** | |
| Concentración (250 ppm) | Texto/Número | **Manual** | |
| C / NC | Checklist | **Manual** | Un click |
| Corrección | Texto | **Manual** | Solo si hubo observación o NC |

---

### Sección 6 — Observaciones generales (Hoja 1)

| Campo | Tipo | Manual/Auto |
|-------|------|-------------|
| Observaciones | Texto | **Manual** |

---

## HOJAS 2, 3 y 4 — Checklist operación sanitaria

Mismo patrón que Formato 1: **C/NC con un click**, corrección solo si hubo observación o NC.

### Patrón común (Hojas 2, 3, 4)

Cada ítem de área/equipo tiene:

| Columna | Tipo | Quién llena |
|---------|------|-------------|
| FR (Dr, Sn, TM…) | **Solo lectura** | Predeterminado — ya viene en el formato impreso |
| REV. — C / NC | Checklist | **Operario** — un click |
| Observación | Texto | **Operario** — manual |
| Corrección | Texto | **Operario** — solo si hubo observación o NC |
| Verif. final — C / NC | Checklist | **Operario** — un click |
| Responsable C | Texto | **Operario** — manual |

**Leyenda:** REV = Revisión · C = Cumple · NC = No cumple · Dr/Sn/TM = códigos fijos por ítem (no editables)

**Encabezados fijos (solo lectura):**
- Detergente: Alcalino clorado 2%
- Desinfectante: Amonio cuaternario 200 ppm
---

### Hoja 2 — Áreas comunes, etiquetado y porcionado

**Detergente / Desinfectante (encabezado fijo):**
- Alcalino clorado 2%
- Amonio cuaternario 200 ppm

**Áreas comunes — ítems:**
- Puertas de ingreso, Pisos, Paredes
- Salón múltiple, Oficinas administrativas
- Secador botas, Baño hombres-mujeres, Lavamanos
- Enfermería, Sala reuniones administrativa, Cuarto LYD
- Filtro sanitario, Dispensadores de jabón
- Cepillos lavabotas, Toallas para manos
- Paredes, Pisos y puertas

**Área de etiquetado:**
- Pisos, Paredes, Puertas, Cortinas
- Equipos de cómputo, Bandas, Grameras, Mesones
- Almacenamiento de cajas, Cuarto canastillas limpias
- Bases y canastillas, Cuarto canastillas sucias

**Área de porcionado:**
- Pisos y paredes, Puertas
- Molino (P.O.E.S), Equipo termoformadora
- Equipo formadora de hamburguesas, Equipo video jet, Mesones

---

### Hoja 3 — Alistamiento, pasillo y sala desposte

**Área de alistamiento:**
- Pisos, Paredes, Cortinas
- Cuarto refrigeración #1, Cuarto congelación
- Contenedor #1, #2, #3, Cava 12
- Muelle de despacho, Estibas y traspale

**Pasillo y área de cuarteo:**
- Paredes, Pisos, Puertas, Plataforma, Difusor

**Sala de desposte:**
- Sierra sin fin (P.O.E.S), Tablas teflón (P.O.E.S)
- Bandas desposte (P.O.E.S), Soporte/gancho deshuesador (P.O.E.S)
- Pisos, Paredes, Puertas, Lavamanos
- Empacadora al vacío, Termoencogido
- Bandas para hueso, Bandas para sebo, Básculas de piso, Mesas
- Bodega insumos producción, Cuarto de sebo, Cuarto de máquinas
- Escaleras, Canalinas, Difusores, Cuarto de afilado, Esterilizadores

---

### Hoja 4 — Otras áreas e higienización

**Equipos, utensilios e instalaciones:**
- Oficina de producción, Oficina recepción de canales
- Base lavado cuchillos, Cuchillos (P.O.E.S), Chairas, Portacuchillos
- Guante de malla (P.O.E.S), Gancho desposte (P.O.E.S)
- Delantales plásticos (P.O.E.S), Laboratorio

**Higienización alturas:**
- Riel, Extractores, Lámparas, Difusores, Techos y cielorraso

**Material extraño:**
| Campo | Tipo | Notas |
|-------|------|-------|
| ¿Presencia de material extraño? | Sí / No | Check |
| Observaciones | Texto | Manual |

**Firmas al final (Hoja 4):**

| Campo | Tipo | Notas |
|-------|------|-------|
| Elaboró | — | **Vacío por ahora** — se define después quién lo firma |
| Verificó | Auto al aprobar | Lo completa el **jefe de área (admin)** al revisar y firmar |

---

## Resumen de tipos de campo — Todo el formato

| Tipo en el programa | Uso |
|---------------------|-----|
| **Multi-select** | Especie (Bovino / Bufalino / Porcino) |
| **Auto fijo** | pH = 7.0, Fecha, Operario, Empresa, códigos FR (Dr/Sn/TM) |
| **Auto calculado** | Concentración ác. láctico al ingresar volumen 2.2 o 2.3 |
| **Solo lectura** | Variables T°C/Presión equipos, detergente/desinfectante |
| **Manual número/hora/texto** | Cloro, temperaturas, horas, pediluvios, observaciones |
| **Checklist C/NC** | Un click — revisión y verificación final (hojas 2–4) |
| **Check Enc/Apag** | Estado de equipos (hoja 1) |
| **Check Sí/No** | Material extraño (hoja 4) |
| **Corrección** | Solo obligatoria si hubo observación o NC |
| **Verificó** | Admin al aprobar (hoja 4) |
---

## Reglas de validación al entregar

| Regla | Detalle |
|-------|---------|
| Domingo | No se llena el formato |
| Especie | Al menos una opción seleccionada |
| Cloro residual | **Obligatorio** |
| C/NC | Cada ítem con checklist debe tener C o NC marcado |
| Corrección | Solo obligatoria si hubo observación o NC |
| C/NC (REV + Verif. final) | Cada ítem debe tener C o NC en ambas columnas |
| Corrección | Solo obligatoria si hubo observación o NC |
| Volumen titulación | Manual; si es 2.2 o 2.3 → concentración automática |
| Códigos FR (Dr, Sn, TM) | Solo lectura — no editables |

---

## Respuestas confirmadas

1. **Hojas 2–4:** Sí, C/NC con un click; corrección solo si hay observación o NC.
2. **REV y Verif. final:** Sí, el operario marca C/NC en ambas.
3. **Dr, Sn, TM:** Predeterminados — solo lectura, no los llena el operario.
4. **Titulación:** Volumen manual; si ingresa 2.2 o 2.3, la concentración se asigna sola (1.98 / 2.07).
5. **Equipos:** Solo Encendido/Apagado + observaciones; T°C/Presión va fijo como en el Excel.
6. **Elaboró / Verificó:** Elaboró vacío por ahora; Verificó lo pone el jefe al aprobar.

---

## Estado

- [x] Excel recibido y revisado
- [x] Hoja 1 documentada
- [x] Hojas 2–4 confirmadas
- [x] **Formato 2 cerrado** — listo para implementar
- [ ] Pasar al Formato 3