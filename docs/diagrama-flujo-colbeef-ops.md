# Diagrama de flujo — Colbeef-Ops

Flujo unificado del sistema: autenticación, roles, diligenciamiento, revisión y ciclo de vida de envíos.

```mermaid
flowchart TB
  Start([Inicio]) --> Login[Login<br/>usuario + contraseña]
  Login --> Auth{¿Credenciales OK<br/>y usuario activo?}
  Auth -->|No| Login
  Auth -->|Sí| JWT[JWT con rol]
  JWT --> Rol{¿Rol?}

  %% ── PANEL ──────────────────────────────────────
  Rol -->|PANEL| Panel[Dashboard usabilidad]
  Panel --> FinPanel([Fin panel])

  %% ── OPERARIO ───────────────────────────────────
  Rol -->|OPERARIO| OpHome[Mis Formatos]
  OpHome --> Filtro[Solo formatos asignados<br/>UserFormatAccess]
  Filtro --> Abrir[Abrir formato]
  Abrir --> Local[Borrador en pantalla]
  Local --> Guardar[Guardar hoja]
  Guardar --> Draft[Crear envío DRAFT<br/>+ schemaSnapshot]
  Draft --> Llenar[Completar hojas]
  Llenar --> Validar{¿Campos OK?}
  Validar -->|No| Llenar
  Validar -->|Sí| Enviar[Enviar formato]
  Enviar --> Pending[Estado: PENDING_REVIEW]
  Pending --> MisEnvios[Mis Envíos]
  MisEnvios --> VerEstado{¿Estado?}
  VerEstado -->|DRAFT / REJECTED| Llenar
  VerEstado -->|PENDING / APPROVED| OpPDF[Ver / descargar PDF]
  OpPDF --> FinOp([Fin operario])

  %% ── ADMIN ──────────────────────────────────────
  Rol -->|ADMIN| AdminHome[Panel Admin]
  AdminHome --> AdminMenu{¿Acción?}

  AdminMenu -->|Pendientes| Revisar[Abrir revisión]
  Revisar --> Decision{¿Decisión?}
  Decision -->|Aprobar| Approved[Estado: APPROVED]
  Approved --> Firma[Crear Signature<br/>admin + fecha]
  Firma --> AdminPDF[PDF disponible]
  AdminPDF --> FinAdmin([Fin admin])

  Decision -->|Rechazar<br/>con notas| Rejected[Estado: REJECTED]
  Rejected -.->|Operario corrige| Llenar

  AdminMenu -->|Buscar| Buscar[Buscar envíos / PDF]
  Buscar --> FinAdmin

  AdminMenu -->|Usuarios| Users[Crear / editar / clave]
  Users --> Permisos[Asignar formatos<br/>al operario]
  Permisos --> FinAdmin

  %% ── CICLO DE ESTADOS ───────────────────────────
  subgraph Ciclo["Ciclo de vida del envío"]
    direction LR
    S1[DRAFT] --> S2[PENDING_REVIEW]
    S2 --> S3[APPROVED]
    S2 --> S4[REJECTED]
    S4 -.-> S2
  end

  Pending -.-> S2
  Approved -.-> S3
  Rejected -.-> S4
```

## Resumen

1. El usuario inicia sesión y recibe un JWT según su rol (`OPERARIO`, `ADMIN` o `PANEL`).
2. El **operario** solo ve los formatos asignados, llena el formulario, guarda un borrador (`DRAFT`) y lo envía a revisión (`PENDING_REVIEW`).
3. El **admin** revisa pendientes: aprueba (crea firma y habilita PDF) o rechaza (el operario corrige y reenvía).
4. El admin también gestiona usuarios y permisos de formatos, y puede buscar envíos.
5. El rol **PANEL** solo accede al dashboard de usabilidad.
