# Diagrama UML / ER — Base de datos Colbeef-Ops

Modelo relacional según `backend/prisma/schema.prisma` (MySQL).

Incluye: catálogo de formatos, permisos por operario, envíos, **compatibilidad de esquema** (`schema_snapshot`), colaboración y telemetría.

> **Cómo pegar en [mermaid.live](https://mermaid.live):** copia **solo** desde `erDiagram` hasta el final del diagrama (antes del cierre \`\`\`).  
> **No** copies las líneas \`\`\`mermaid ni \`\`\`.

```mermaid
erDiagram
  users ||--o{ user_format_access : tiene_acceso
  formats ||--o{ user_format_access : asignado_a
  formats ||--|{ format_sheets : contiene
  format_sheets ||--|{ format_fields : define
  formats ||--o{ form_submissions : instancia
  users ||--o{ form_submissions : inicia_dueno
  users ||--o{ form_submissions : entrega
  users ||--o{ form_submissions : revisa
  form_submissions ||--|{ form_submission_sheets : llena
  format_sheets ||--o{ form_submission_sheets : referencia
  form_submissions ||--o| signatures : firma
  users ||--o{ signatures : firma_admin
  users ||--o{ usage_events : genera
  form_submissions ||--o{ submission_collaborators : invita
  users ||--o{ submission_collaborators : es_colaborador
  users ||--o{ submission_collaborators : agrega_colaborador
  form_submissions ||--o{ submission_field_locks : bloquea_campos
  users ||--o{ submission_field_locks : lleno_por
  form_submissions ||--o{ submission_activities : trazabilidad
  users ||--o{ submission_activities : actor
  users ||--o{ submission_activities : usuario_objetivo

  users {
    string id PK
    string username UK
    string email UK
    string password_hash
    string full_name
    string role
    boolean active
    datetime created_at
    datetime updated_at
  }

  formats {
    string id PK
    string code UK
    string name
    text description
    string document_code
    int sheet_count
    boolean no_sunday
    boolean active
    int sort_order
    datetime created_at
    datetime updated_at
  }

  user_format_access {
    string id PK
    string user_id FK
    string format_id FK
    datetime created_at
  }

  format_sheets {
    string id PK
    string format_id FK
    int sheet_order
    string name
    string slug
  }

  format_fields {
    string id PK
    string sheet_id FK
    string field_key
    string label
    string field_type
    boolean required
    boolean manual_only
    string auto_fill_rule
    json options
    json config
    string placeholder
    string default_value
    int sort_order
    string group_name
    text help_text
  }

  form_submissions {
    string id PK
    string format_id FK
    string operator_id FK
    string submitted_by_id FK
    date work_date
    string status
    datetime submitted_at
    datetime reviewed_at
    string reviewed_by_id FK
    text review_notes
    string pdf_path
    json schema_snapshot
    datetime created_at
    datetime updated_at
  }

  form_submission_sheets {
    string id PK
    string submission_id FK
    string sheet_id FK
    json data
  }

  submission_collaborators {
    string id PK
    string submission_id FK
    string user_id FK
    string added_by_id FK
    datetime added_at
  }

  submission_field_locks {
    string id PK
    string submission_id FK
    string sheet_id
    string field_key
    string filled_by_id FK
    datetime filled_at
  }

  submission_activities {
    string id PK
    string submission_id FK
    string type
    string actor_id FK
    string target_user_id FK
    text notes
    json metadata
    datetime created_at
  }

  signatures {
    string id PK
    string submission_id FK,UK
    string admin_id FK
    datetime signed_at
    text notes
  }

  usage_events {
    string id PK
    string event_type
    string user_id FK
    string username
    string user_role
    string path
    string format_id
    string format_code
    string format_name
    string submission_id
    string sheet_id
    string sheet_name
    json metadata
    datetime created_at
  }
```

## Compatibilidad de formatos (`schema_snapshot`)

Al **crear el borrador** (y de nuevo al entregar si faltara), el sistema guarda en `form_submissions.schema_snapshot` una copia del esquema de hojas y campos vigentes.

| Situación | Qué usa el envío |
|-----------|------------------|
| Borrador / enviado / aprobado / rechazado **con** snapshot | Campos del snapshot (congelados) |
| Cambio de catálogo vía `db:seed` | Solo afecta **nuevos** envíos (sin snapshot previo) |
| Ver ficha, validar, PDF | Se aplica `applySchemaSnapshotToFormat` |

**Regla operativa:** se puede cambiar un formato en seed/UI sin alterar documentos ya iniciados o enviados.

**Excepción PDF (solo presentación):** al descargar, el PDF se **regenera** con el motor actual (filas dinámicas, cabeceras de continuación, numeración, campos vacíos con línea excepto observaciones). Eso no cambia los datos ni el esquema congelado; solo el layout del archivo. La hoja de trazabilidad/colaboración solo se incluye si el envío tiene colaboradores.

Código de referencia: `backend/src/utils/schemaSnapshot.ts`.

## Enums

| Enum | Valores |
|------|---------|
| `UserRole` | `ADMIN`, `OPERARIO`, `PANEL` |
| `SubmissionStatus` | `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED` |
| `FieldType` | `TEXT`, `TEXTAREA`, `NUMBER`, `DATE`, `TIME`, `DATETIME`, `CHECKBOX`, `CHECKLIST`, `SELECT`, `MULTI_SELECT`, `RADIO`, `SIGNATURE`, `AUTO`, `READONLY`, `REPEATER`, `PHOTO` |
| `AutoFillRule` | `CURRENT_DATE`, `CURRENT_TIME`, `CURRENT_DATETIME`, `CURRENT_USER`, `CURRENT_USER_NAME`, `FIXED_VALUE`, `DAY_SCHEDULE`, `CALC_MAP` |
| `SubmissionActivityType` | `CREATED`, `COLLABORATOR_ADDED`, `COLLABORATOR_REMOVED`, `SHEET_SAVED`, `SUBMITTED`, `REJECTED`, `APPROVED` |
| `UsageEventType` | `LOGIN`, `LOGIN_FAILED`, `LOGOUT`, `PAGE_VIEW`, `SUBMISSION_CREATED`, `SHEET_SAVED`, `SUBMISSION_SUBMITTED`, `SUBMISSION_SUBMITTED_FAILED`, `SUBMISSION_APPROVED`, `SUBMISSION_REJECTED`, `SUBMISSION_DELETED`, `SUBMISSION_OPENED`, `PDF_DOWNLOADED`, `SEARCH_EXECUTED`, `PENDING_VIEWED` |

## Relaciones clave

| Desde | Hasta | Cardinalidad | Descripción |
|-------|-------|--------------|-------------|
| `users` | `user_format_access` | 1:N | Formatos que puede diligenciar un operario |
| `formats` | `format_sheets` | 1:N | Hojas del formato |
| `format_sheets` | `format_fields` | 1:N | Campos de cada hoja |
| `users` | `form_submissions` | 1:N | Dueño del borrador (`operator_id`) |
| `users` | `form_submissions` | 1:N | Quién entregó (`submitted_by_id`) |
| `users` | `form_submissions` | 1:N | Quién revisó (`reviewed_by_id`) |
| `form_submissions` | `form_submission_sheets` | 1:N | Datos JSON por hoja |
| `form_submissions` | `submission_collaborators` | 1:N | Operarios invitados al mismo envío |
| `form_submissions` | `submission_field_locks` | 1:N | Campo ya llenado (otros no lo editan) |
| `form_submissions` | `submission_activities` | 1:N | Trazabilidad (crear, entregar, aprobar, etc.) |
| `form_submissions` | `signatures` | 1:0..1 | Firma al aprobar |
| `users` | `usage_events` | 1:N | Telemetría de usabilidad |

## Dónde visualizar y exportar

1. **[Mermaid Live Editor](https://mermaid.live)** *(recomendado)*  
   - Copia desde `erDiagram` hasta el final del diagrama.  
   - Pégalo en https://mermaid.live  
   - Usa **Actions → PNG / SVG** para exportar.

2. **VS Code / Cursor**  
   - Extensión *Markdown Preview Mermaid Support* o *Mermaid*.  
   - Abre este `.md` → Preview.

3. **GitHub**  
   - Sube el archivo al repo: GitHub renderiza Mermaid solo.

4. **Prisma ERD (opcional)**  
   - [prisma-erd-generator](https://github.com/keonik/prisma-erd-generator) desde `schema.prisma`.

5. **dbdiagram.io**  
   - Reescribir en DBML y exportar PNG/PDF.
