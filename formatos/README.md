# Formatos Excel — Colbeef-Ops

Documentación de campos para los 7 formatos operativos.

---

## Estado de revisión

| # | Formato | Hojas | CAMPOS.md | UI digital |
|---|---------|-------|-----------|------------|
| 1 | Preoperativo Planta Beneficio | 8 | ✓ | ✓ Hojas 1–8 (matriz cavas hojas 7–8) |
| 2 | Preoperativo Planta Desposte | 4 | ✓ | ✓ Hoja 1 medición + hojas 2–4 sanitaria |
| 3 | Despacho Producto Terminado | 1 | ✓ | ✓ Encabezado + tabla productos |
| 4 | Verificación Desposte Operativo | 5 | ✓ | ✓ Diario 1–5 con layout formal |
| 5 | Recepción Canales Foráneas | 1 | ✓ | ✓ Recepción + inspección tabla |
| 6 | Recepción Canales para Desposte | 1 | ✓ | ✓ Encabezado + inspección tabla |
| 7 | Verificación Producto Terminado | 2 | ✓ | ✓ 4 bloques por lote + obs. generales |
| 8 | Inspección de Vehículos | 1 | — | ✓ Checklist + carga + firmas |
| 9 | Calibración pH-metro | 1 | — | ✓ Repetidor calibraciones |
| 10 | Hábitos Higiénicos | 1 | — | ✓ Área + matriz personal |
| 11 | Seguimiento Devoluciones | 1 | — | ✓ Encabezado + registros |
| 12 | Decomisos | 1 | — | ✓ Tabla + totales auto |

**Campos:** definidos en seeds (`backend/prisma/seeds/fields/`). Tras cambios ejecutar `npm run db:seed` y `scripts\update.bat` en servidor.

---

## Reglas generales (aplican a todos)

| Regla | Detalle |
|-------|---------|
| Domingo | No se llena ningún formato |
| C / NC | Un click por ítem |
| C / NC / NA | Hojas que lo incluyan (Formato 1 hojas 7–8, Formato 4 hoja 5 Video Jet) |
| Corrección | Obligatoria solo si hubo observación o NC |
| Elaboró | Vacío por ahora — se define después |
| Verificó | Lo completa el jefe de área (admin) al aprobar |
| Campos predeterminados | Solo lectura — no los edita el operario |
| Fecha / Operario | Automáticos al crear el registro |

---

## Estructura de carpetas

```
formatos/
├── 01-preoperativo-planta-beneficio/   CAMPOS.md ✓
├── 02-preoperativo-planta-desposte/    CAMPOS.md ✓
├── 03-despacho-producto/               CAMPOS.md ✓
├── 04-proceso-desposte/                CAMPOS.md ✓
├── 05-recepcion-canales-foraneas/      CAMPOS.md ✓
├── 06-recepcion-canales-desposte/      CAMPOS.md ✓
└── 07-verificacion-producto/           CAMPOS.md ✓
```

---

## Tipos de campo usados en el sistema

| Tipo | Ejemplos |
|------|----------|
| Auto fijo | pH = 7.0, Empresa, textos predeterminados |
| Auto por día | Puntos inspeccionados (Formato 1) |
| Auto calculado | Concentración ác. láctico, PROM temperaturas |
| Auto validación | pH 5.4–5.7, T°C 0–4 °C |
| Manual texto/número/fecha/hora | Cliente, lote, temperatura, peso |
| Checklist C/NC | Un click |
| Multi-selección | Especie, hallazgos CR/MF/LV, hematomas |
| Check Enc/Apag | Estado equipos |
| Foto | Etiquetas Formato 4 hoja 5 |
| Solo lectura | Códigos FR, leyendas, textos fijos |

---

## Próximo paso

Con los 7 formatos documentados, proceder a:

1. Diseñar la base de datos MySQL con todos los campos
2. Ejecutar `scripts\setup-database.bat`
3. Implementar los formularios digitales uno por uno

Ver `docs/DATABASE.md` para la guía de MySQL.
