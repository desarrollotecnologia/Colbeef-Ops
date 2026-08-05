# Diagrama UML / ER — Base de datos Colbeef-Ops

Modelo relacional según `backend/prisma/schema.prisma` (MySQL).

> **Cómo pegar en [mermaid.live](https://mermaid.live):** copia **solo** desde `erDiagram` hasta el final del diagrama.  
> **No** copies las líneas \`\`\`mermaid ni \`\`\`.

```mermaid
erDiagram
  users ||--o{ user_format_access : tiene_acceso
  formats ||--o{ user_format_access : asignado_a
  formats ||--|{ format_sheets : contiene
  format_sheets ||--|{ format_fields : define
  formats ||--o{ form_submissions : instancia
  users ||--o{ form_submissions : crea
  users ||--o{ form_submissions : revisa
  form_submissions ||--|{ form_submission_sheets : llena
  format_sheets ||--o{ form_submission_sheets : referencia
  form_submissions ||--o| signatures : firma
  users ||--o{ signatures : firma_admin
  users ||--o{ usage_events : genera

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

## Enums

| Enum | Valores |
|------|---------|
| `UserRole` | `ADMIN`, `OPERARIO`, `PANEL` |
| `SubmissionStatus` | `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED` |
| `FieldType` | `TEXT`, `TEXTAREA`, `NUMBER`, `DATE`, `TIME`, `DATETIME`, `CHECKBOX`, `CHECKLIST`, `SELECT`, `MULTI_SELECT`, `RADIO`, `SIGNATURE`, `AUTO`, `READONLY`, `REPEATER`, `PHOTO` |
| `AutoFillRule` | `CURRENT_DATE`, `CURRENT_TIME`, `CURRENT_DATETIME`, `CURRENT_USER`, `CURRENT_USER_NAME`, `FIXED_VALUE`, `DAY_SCHEDULE`, `CALC_MAP` |
| `UsageEventType` | `LOGIN`, `LOGIN_FAILED`, `LOGOUT`, `PAGE_VIEW`, `SUBMISSION_CREATED`, `SHEET_SAVED`, `SUBMISSION_SUBMITTED`, `SUBMISSION_SUBMITTED_FAILED`, `SUBMISSION_APPROVED`, `SUBMISSION_REJECTED`, `SUBMISSION_DELETED`, `SUBMISSION_OPENED`, `PDF_DOWNLOADED`, `SEARCH_EXECUTED`, `PENDING_VIEWED` |

## Relaciones clave

| Desde | Hasta | Cardinalidad | Descripción |
|-------|-------|--------------|-------------|
| `users` | `user_format_access` | 1:N | Formatos que puede diligenciar un operario |
| `formats` | `format_sheets` | 1:N | Hojas del formato |
| `format_sheets` | `format_fields` | 1:N | Campos de cada hoja |
| `users` | `form_submissions` | 1:N | Envíos creados por el operario |
| `users` | `form_submissions` | 1:N | Envíos revisados por el admin |
| `form_submissions` | `form_submission_sheets` | 1:N | Datos JSON por hoja |
| `form_submissions` | `signatures` | 1:0..1 | Firma al aprobar |
| `users` | `usage_events` | 1:N | Telemetría de usabilidad |

## Dónde visualizar y exportar

1. **[Mermaid Live Editor](https://mermaid.live)** *(recomendado)*  
   - Copia el bloque `mermaid` de este archivo.  
   - Pégalo en https://mermaid.live  
   - Usa **Actions → PNG / SVG** para exportar.

2. **VS Code / Cursor**  
   - Extensión *Markdown Preview Mermaid Support* o *Mermaid*.  
   - Abre este `.md` → Preview → captura o exporta según la extensión.

3. **GitHub**  
   - Sube el archivo al repo: GitHub renderiza Mermaid solo.  
   - Para exportar imagen: abre en Mermaid Live o usa captura.

4. **Prisma ERD (opcional)**  
   - En `backend`: `npx prisma generate` con un generador ERD, o herramientas como [prisma-erd-generator](https://github.com/keonik/prisma-erd-generator).  
   - Genera diagrama directo desde `schema.prisma`.

5. **dbdiagram.io**  
   - Puedes reescribir el modelo en DBML y exportar PNG/PDF desde https://dbdiagram.io
