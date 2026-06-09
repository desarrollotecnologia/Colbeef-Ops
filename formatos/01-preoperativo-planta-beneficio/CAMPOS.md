# Formato 1 — Preoperativo de Planta Beneficio

**Archivo Excel:** `PREOPERATIVO ACTUALIZADO (1) (2).xlsx`  
**Total hojas:** 8

| # | Nombre en Excel | Nombre corto |
|---|-----------------|--------------|
| 1 | 1-Zona sangria | Zona Sangría |
| 2 | 2-Zona intermedia | Zona Intermedia |
| 3 | 3-Zona limpia | Zona Limpia |
| 4 | 4-SUB-P | Subproductos (Pág. 4) |
| 5 | 5-sub | Subproductos (Pág. 5) |
| 6 | 6- SUB-P | Subproductos (Pág. 6) |
| 7 | 7-REFRIGERACION | Refrigeración |
| 8 | 8-CAVAS | Cavas |

---

## Campos comunes a todas las hojas

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Fecha | Fecha | **Auto** | Fecha del día actual |
| Operario | Texto | **Auto** | Nombre del usuario logueado |
| Empresa | Texto | **Auto** | "COLBEEF S.A.S" (fijo) |

---

## HOJA 1 — Zona Sangría

Esta hoja tiene **3 secciones especiales** arriba + **2 bloques de checklist** de equipos.

### Sección A — Encabezado de inspección diaria

#### A.1 Puntos Inspeccionados
| Campo | Tipo | Manual/Auto |
|-------|------|-------------|
| Puntos inspeccionados | Lista de texto | **Auto por día de la semana** |

**Regla automática por día:**

| Día | Puntos que se muestran automáticamente |
|-----|----------------------------------------|
| Lunes | Sangría, Segunda pierna, Desolladora |
| Martes | Tolerancia cero, Área de cabezas, Eviscerado de blancas |
| Miércoles | Patas y manos, Víscera roja, Marcación canales |
| Jueves | Sierra pecho, Víscera blanca, Ins. de canales |
| Viernes | Sierra canal, Lavado de canales, Desuello de brazo |
| Sábado | Sangría, Patas y manos, Lavado de canales |
| **Domingo** | **No se llena el formato** |

#### A.2 Cloro residual y pH

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Cloro residual libre | Número | **Manual** | **Obligatorio.** Rango esperado: 0.3 – 2 ppm |
| pH | Número | **Auto** | Siempre **7.0** |
| Resultado cloro/pH | Checklist C / NC | **Manual** | C = Cumple, NC = No cumple |
| Observaciones (cloro/pH) | Texto | **Manual** | |

---

### Sección B — Esterilizadores

#### B.1 Puntos de inspección (segundo bloque automático)

| Campo | Tipo | Manual/Auto |
|-------|------|-------------|
| Puntos de inspección | Lista de texto | **Auto por día de la semana** |

**Regla automática por día:**

| Día | Puntos que se muestran automáticamente |
|-----|----------------------------------------|
| Lunes | Sierra canal, Sierra pecho, Clipado de esófago, Corte de grandes vasos |
| Martes | Víscera roja, Limpieza inferior, Desolladora, Vuelta |
| Miércoles | Sierra pecho, Clipado de esófago, Víscera blanca, Tobogán de víscera blanca |
| Jueves | Sierra canal, Sierra pecho, Limpieza inferior, Desolladora |
| Viernes | Clipado de esófago, Corte de grandes vasos, Víscera roja, Vuelta |
| Sábado | Sierra canal, Sierra pecho, Corte de grandes vasos, Desolladora |
| **Domingo** | **No se llena el formato** |

#### B.2 Valores y verificación

| Campo | Tipo | Manual/Auto | Notas |
|-------|------|-------------|-------|
| Valores encontrados (°C) | Número/Texto | **Manual** | Temperatura esterilizadores |
| Resultado esterilizadores | Checklist C / NC | **Manual** | |
| Observaciones (esterilizadores) | Texto | **Manual** | |

---

### Sección C — Áreas Comunes (checklist por equipo)

Cada ítem tiene: **C / NC** + **Observaciones** + **Acción correctiva**

> **Acción correctiva:** obligatoria solo si hubo observación o se marcó NC. Si cumple (C) sin observación, no es necesaria.

| # | Equipo o superficie | C/NC | Observaciones | Acción correctiva |
|---|---------------------|------|---------------|-------------------|
| 1 | Piso | Manual | Manual | Manual |
| 2 | Paredes | Manual | Manual | Manual |
| 3 | Puerta de ingreso | Manual | Manual | Manual |
| 4 | Petos del personal | Manual | Manual | Manual |
| 5 | Botas del personal | Manual | Manual | Manual |
| 6 | Dotación del personal | Manual | Manual | Manual |
| 7 | Lavamanos de piso | Manual | Manual | Manual |
| 8 | Dispensadores de jabón | Manual | Manual | Manual |
| 9 | Baterías sanitarias | Manual | Manual | Manual |
| 10 | Camilla | Manual | Manual | Manual |

---

### Sección D — Zona Insensibilización y Sangría (checklist por equipo)

Cada ítem tiene: **C / NC** + **Observaciones** + **Acción correctiva**

> **Acción correctiva:** obligatoria solo si hubo observación o se marcó NC. Si cumple (C) sin observación, no es necesaria.

| # | Equipo o superficie | C/NC | Observaciones | Acción correctiva |
|---|---------------------|------|---------------|-------------------|
| 1 | Cajón de noqueo | Manual | Manual | Manual |
| 2 | Plataformas fijas | Manual | Manual | Manual |
| 3 | Inspección de cabezas | Manual | Manual | Manual |
| 4 | Desendedor de cabezas | Manual | Manual | Manual |
| 5 | Esterilizadores de plataforma | Manual | Manual | Manual |
| 6 | Lavamanos no manual plataforma | Manual | Manual | Manual |
| 7 | Riel para cabezas | Manual | Manual | Manual |
| 8 | Descornadora | Manual | Manual | Manual |
| 9 | Estimulador eléctrico | Manual | Manual | Manual |
| 10 | Colector de sangre | Manual | Manual | Manual |
| 11 | Mangueras | Manual | Manual | Manual |
| 12 | Anudador de esófago | Manual | Manual | Manual |
| 13 | Lavamanos no manual piso | Manual | Manual | Manual |
| 14 | Esterilizadores de piso | Manual | Manual | Manual |

**Leyenda:** C = Cumple · NC = No cumple · AC = Acción correctiva

---

## HOJAS 2, 3, 4, 5, 6 — Checklist estándar

**Patrón:** Cada equipo/superficie tiene:
- **C / NC** (checklist)
- **Observaciones y acciones** (texto manual)

> Las hojas 2 y 3 además tienen columnas por **plataforma (PLAT 1 a PLAT 5)** con C/NC independiente por plataforma.
>
> **Comportamiento en el programa:** el operario marca **una por una con un solo click** (C o NC) en cada ítem y en cada plataforma. Casi todas las hojas con equipos siguen este mismo patrón.

### Hoja 2 — Zona Intermedia

**Área: Zona Insensibilización y Sangría**
- Gancho de izado
- Activador para izado y transporte
- Grilletes
- Pistola de noqueo
- Paredes
- Pisos
- Canalinas y cajas cifonadas

**Área: Zona Intermedia**
- Puerta de ingreso a la zona
- Esterilizador(s)
- Lavamanos no manual
- Tijeras hidráulicas para corte de patas
- Mesas de acero inoxidable
- Sistema para transporte de pieles
- Máquina desolladora
- Cuarto de zona intermedia
- Sierra de esternón o pecho
- Sistema de transporte de vísceras blancas

**Plataformas (PLAT 1–5)** — cada una con C/NC:
- Base superior elevador
- Base inferior elevador
- Debajo de la plataforma
- Cepillo
- Esterilizador(s)
- Lavamanos no manual
- Lavadelantales
- Barra de contacto

---

### Hoja 3 — Zona Limpia

**Área: Zona Intermedia**
- Llave azul para agua
- Mangueras
- Pisos, Paredes
- Canalinas y cajas cifonadas
- Control, Freno de mano

**Área: Zona Limpia**
- Sierra canal
- Puerta de ingreso a zona
- Hidrolavadora
- Aspiradora a vapor
- Manguera auxiliar
- Cuarto de lavado y esterilización de poleas y grilletes
- Puerta de retenidos
- Esterilizadores
- Lava manos no manual
- Puerta de oreo

**Plataformas (PLAT 1–5)** — C/NC por plataforma:
- Base superior/inferior elevador
- Debajo de la plataforma
- Esterilizador(s), Lavamanos, Lavadelantales
- Barra de contacto
- Llave azul, Mangueras, Pisos, Paredes, Canalinas

---

### Hoja 4 — Subproductos (Pág. 4)

**Área: Cuarto de Afilado y Tanque de Sangre**
- Mangueras, Canalinas, Tanque de sangre
- Mesón de acero inoxidable, Piso, Paredes, Puerta de ingreso

**Área: Cuarto de Cabezas**
- Puerta de ingreso, Plataforma de desposte
- Mesones, Guillotina, Estibas
- Canalinas, Mangueras, Pisos, Paredes
- Puertas, Lavamanos de piso, Rieles de cabezas

---

### Hoja 5 — Subproductos (Pág. 5)

**Área: Cuarto de Refrigeración Cabezas, Patas y Manos**
- Carros, Estibas, Canalinas, Pisos, Paredes, Cortinas, Puertas

**Área: Proceso de Patas y Manos**
- Descascadora, Mesones, Escaldadoras, Canalinas
- Lavamanos, Máquina pelapatas, Mangueras, Pisos
- Canasta metálica, Carro porta canasta, Paredes, Puertas

**Área: Proceso de Vísceras Blancas**
- Máquina lavacallos, Máquina lavalibros, Escaldadoras
- Tinas, Mesones, Tubería de agua, Mangueras
- Canalinas, Lavamanos, Pisos, Paredes, Puertas

---

### Hoja 6 — Subproductos (Pág. 6)

**Área: Cuarto de Refrigeración Vísceras Rojas y Blancas**
- Carros percheros, Canastillas, Estibas, Cajas cifonadas
- Pisos, Carros de uso general, Paredes, Puertas

**Área: Proceso e Inspección de Vísceras Rojas**
- Riel de vísceras, Carros perchero, Ganchos
- Cuarto decomisos, Carros, Mesa de acero
- Mangueras, Pisos, Techo, Paredes

**Área: Cuarto de Retenidos**
- Bases elevador, Debajo de plataforma
- Cajas cifonadas, Pisos, Paredes
- Puerta de ingreso, Puerta de ingreso a línea

---

## HOJAS 7 y 8 — Checklist con C / NC / NA

**Patrón diferente:** incluye opción **NA = No aplica**

| Opción | Significado |
|--------|-------------|
| C | Cumple |
| NC | No cumple |
| NA | No aplica |

Cada ítem + **Observaciones y acciones** (manual)

### Hoja 7 — Refrigeración

**Columnas por cava:** C#10, C#9, C#8, C#7 — **siempre se evalúan las 4 cavas**, cada una con C/NC/NA

**Áreas e ítems:**
- Cuarto de decomisos (carros, canalinas, pisos, paredes, puertas, mangueras)
- Cava #3 (cortinas, puerta, canalinas, pisos, paredes)
- Cuarto de canecas y canastillas
- Área de refrigeración (tubería, paredes, pisos, canalinas, puertas, muelle, etc.)
- Pasillos cavas, Muelle pre-refrigeración

**Al final:** campo general de **Observaciones**

---

### Hoja 8 — Cavas

**Columnas por cava:** C#10, C#9, C#8, C#7 — **siempre se evalúan las 4 cavas**, cada una con C/NC/NA

**Sección:** Condensación / Área de almacenamiento *(solo lo que muestra el Excel — no hay ítems adicionales)*

**Al final:**
- Observaciones
- Observaciones generales
- Elaboró (firma/nombre — podría ser auto con operario)

---

## Resumen de tipos de campo en este formato

| Tipo en el programa | Uso |
|---------------------|-----|
| **Auto por día** | Puntos inspeccionados y puntos de inspección (solo Hoja 1) |
| **Auto fijo** | pH = 7.0, Empresa, Fecha, Operario |
| **Manual número** | Cloro residual, Valores encontrados (°C) |
| **Checklist C/NC** | Hojas 1–6 — un click por ítem |
| **Checklist C/NC/NA** | Hojas 7–8 — un click por ítem y por cava |
| **Texto manual** | Observaciones, Observaciones y acciones |
| **Acción correctiva** | Solo obligatoria si hubo observación o NC |

---

## Reglas de validación al entregar

| Regla | Detalle |
|-------|---------|
| Domingo | El formato **no se llena** — el sistema no debe permitir crear envío ese día |
| Cloro residual | **Obligatorio** antes de entregar |
| Checklists C/NC | Cada ítem debe tener C o NC marcado (un click) |
| Plataformas (Hojas 2–3) | C/NC en cada plataforma (PLAT 1–5) por cada equipo |
| Cavas (Hojas 7–8) | Siempre evaluar las 4 cavas (C#10, C#9, C#8, C#7) |
| Acción correctiva | Obligatoria **solo si** hay observación o se marcó NC |
| Observaciones | Obligatorias solo cuando aplique (NC o hallazgo) |

---

## Respuestas confirmadas

1. **Domingo:** No se llena el formato.
2. **Plataformas:** Sí, marcar una por una con un solo click (C/NC). El mismo patrón aplica en las demás hojas con equipos.
3. **Cavas:** Sí, siempre se evalúan las 4 (C#10, C#9, C#8, C#7).
4. **Hoja 8:** Solo lo que muestra el Excel, nada adicional.
5. **Cloro residual:** Sí, es obligatorio.
6. **Acción correctiva:** Obligatoria solo si hubo observación; si no, no es necesaria.

---

## Estado

- [x] Excel recibido y revisado
- [x] Lógica de campos automáticos por día documentada (Hoja 1)
- [x] Ítems de checklist extraídos del Excel
- [x] Preguntas confirmadas
- [x] **Formato 1 cerrado** — listo para implementar
- [ ] Pasar al Formato 2
