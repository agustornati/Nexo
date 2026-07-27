# Nexo — Modelo de Datos

## Principios del Diseño

1. **UUIDs** como primary keys en todas las tablas
2. **`studio_id`** en todas las tablas de datos del negocio (multi-tenancy)
3. **Soft delete** vía campo `is_active` / `status` (no borrar registros)
4. **`created_at` / `updated_at`** en todas las tablas
5. **Categorías en DB** — los límites del monotributo son datos, no código

---

## Diagrama de Entidades

```
┌─────────────────┐         ┌─────────────────┐
│    studios      │────────<│     users        │
│─────────────────│         │─────────────────│
│ id (PK)         │         │ id (PK)          │
│ name            │         │ studio_id (FK)   │
│ cuit            │         │ email            │
│ email           │         │ password_hash    │
│ phone           │         │ first_name       │
│ is_active       │         │ last_name        │
│ created_at      │         │ role             │
│ updated_at      │         │ is_active        │
└─────────────────┘         │ created_at       │
         │                  │ updated_at       │
         │                  │ last_login_at    │
         │                  └─────────────────┘
         │
         └────────────────────────────────────────────┐
                                                       │
┌──────────────────────┐    ┌──────────────────────┐  │
│  monotributo_        │    │      clients          │  │
│  categories          │    │─────────────────────│  │
│──────────────────────│    │ id (PK)              │  │
│ id (PK)              │    │ studio_id (FK) ───────┘  │
│ code (A,B,C...)      │    │ first_name           │
│ activity_type        │<───│ last_name            │
│ annual_limit         │    │ cuit                 │
│ monthly_fee          │    │ email                │
│ effective_from       │    │ phone                │
│ effective_to         │    │ category_id (FK)     │
│ created_at           │    │ registration_date    │
└──────────────────────┘    │ status               │
                            │ notes                │
                            │ created_at           │
                            │ updated_at           │
                            └──────────┬───────────┘
                                       │
              ┌────────────────────────┼─────────────────────────┐
              │                        │                          │
              ▼                        ▼                          ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   billing_entries   │  │      payments        │  │     documents       │
│─────────────────────│  │─────────────────────│  │─────────────────────│
│ id (PK)             │  │ id (PK)              │  │ id (PK)             │
│ client_id (FK)      │  │ client_id (FK)       │  │ client_id (FK)      │
│ studio_id (FK)      │  │ studio_id (FK)       │  │ studio_id (FK)      │
│ year                │  │ period               │  │ uploaded_by (FK)    │
│ month               │  │ amount               │  │ filename            │
│ amount              │  │ payment_date         │  │ original_filename   │
│ invoice_count       │  │ status               │  │ file_size           │
│ notes               │  │ payment_method       │  │ mime_type           │
│ created_at          │  │ notes                │  │ document_type       │
│ updated_at          │  │ created_at           │  │ storage_path        │
└─────────────────────┘  │ updated_at           │  │ created_at          │
                         └─────────────────────┘  └─────────────────────┘

┌─────────────────────┐
│       alerts        │
│─────────────────────│
│ id (PK)             │
│ client_id (FK)      │
│ studio_id (FK)      │
│ alert_type          │
│ message             │
│ is_read             │
│ is_dismissed        │
│ triggered_at        │
│ read_at             │
│ created_at          │
└─────────────────────┘
```

---

## Definición de Tablas

### `studios`
El estudio contable. Es el tenant principal del sistema.

| Columna | Tipo | Constraints | Descripción |
|---------|------|------------|-------------|
| id | UUID | PK, default gen_random_uuid() | |
| name | VARCHAR(255) | NOT NULL | Nombre del estudio |
| cuit | VARCHAR(13) | UNIQUE, NOT NULL | CUIT del estudio |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email de contacto |
| phone | VARCHAR(50) | | Teléfono |
| is_active | BOOLEAN | NOT NULL, default TRUE | Soft delete |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### `users`
Usuarios del estudio. Un estudio puede tener múltiples usuarios con distintos roles.

| Columna | Tipo | Constraints | Descripción |
|---------|------|------------|-------------|
| id | UUID | PK | |
| studio_id | UUID | FK → studios, NOT NULL | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| role | VARCHAR(20) | NOT NULL, default 'accountant' | 'admin' o 'accountant' |
| is_active | BOOLEAN | NOT NULL, default TRUE | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |
| last_login_at | TIMESTAMPTZ | | Auditoría |

**Roles:**
- `admin`: puede gestionar usuarios del estudio, ver todo
- `accountant`: acceso completo a clientes y operaciones

---

### `refresh_tokens`
Almacena los refresh tokens activos para permitir logout e invalidación.

| Columna | Tipo | Constraints | Descripción |
|---------|------|------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users, NOT NULL | |
| token_hash | VARCHAR(255) | UNIQUE, NOT NULL | SHA-256 del token |
| expires_at | TIMESTAMPTZ | NOT NULL | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| revoked_at | TIMESTAMPTZ | | NULL = activo |

---

### `monotributo_categories`
Categorías del monotributo con sus límites vigentes. Datos de referencia actualizables sin redespliegue.

| Columna | Tipo | Constraints | Descripción |
|---------|------|------------|-------------|
| id | UUID | PK | |
| code | VARCHAR(5) | NOT NULL | A, B, C, D, E, F, G, H, I, J, K |
| activity_type | VARCHAR(20) | NOT NULL | 'services', 'commerce', 'both' |
| annual_limit | NUMERIC(18,2) | NOT NULL | Límite anual en pesos |
| monthly_fee | NUMERIC(18,2) | NOT NULL | Cuota mensual |
| effective_from | DATE | NOT NULL | Vigente desde |
| effective_to | DATE | | NULL = vigente actualmente |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Nota:** Para obtener la categoría vigente se filtra `effective_to IS NULL` o `effective_to >= CURRENT_DATE`. Cuando AFIP actualiza los valores, se inserta un nuevo registro con la nueva fecha de vigencia y se cierra el anterior con `effective_to`.

**Categorías iniciales a cargar (servicios, valores 2025):**

| Código | Límite Anual | Cuota Mensual |
|--------|-------------|--------------|
| A | 6.450.000 | a definir |
| B | 9.660.000 | a definir |
| C | 13.620.000 | a definir |
| D | 19.200.000 | a definir |
| E | 24.250.000 | a definir |
| F | 29.000.000 | a definir |
| G | 34.000.000 | a definir |
| H | 45.000.000 | a definir |

> Los valores exactos deben confirmarse contra la resolución general AFIP vigente antes de cargar el seed.

---

### `clients`
El monotributista. Entidad central del sistema.

| Columna | Tipo | Constraints | Descripción |
|---------|------|------------|-------------|
| id | UUID | PK | |
| studio_id | UUID | FK → studios, NOT NULL, INDEX | |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| cuit | VARCHAR(13) | NOT NULL | Sin guiones, 11 dígitos |
| email | VARCHAR(255) | | |
| phone | VARCHAR(50) | | |
| category_id | UUID | FK → monotributo_categories | Categoría actual |
| registration_date | DATE | | Fecha de alta en monotributo |
| status | VARCHAR(20) | NOT NULL, default 'active' | 'active', 'inactive', 'suspended' |
| notes | TEXT | | Observaciones internas |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Índices:**
- `(studio_id)` — filtro base de multi-tenancy
- `(studio_id, status)` — listado de clientes activos
- `(cuit)` — búsqueda por CUIT

**Constraint:** `UNIQUE(studio_id, cuit)` — un CUIT no puede repetirse dentro del mismo estudio.

---

### `billing_entries`
Facturación mensual de cada cliente. Un registro por mes por cliente.

| Columna | Tipo | Constraints | Descripción |
|---------|------|------------|-------------|
| id | UUID | PK | |
| client_id | UUID | FK → clients, NOT NULL | |
| studio_id | UUID | FK → studios, NOT NULL | Desnormalizado para queries directas |
| year | SMALLINT | NOT NULL | 2024, 2025... |
| month | SMALLINT | NOT NULL | 1-12 |
| amount | NUMERIC(18,2) | NOT NULL | Monto facturado |
| invoice_count | INTEGER | NOT NULL, default 0 | Cantidad de comprobantes |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Constraint:** `UNIQUE(client_id, year, month)` — un solo registro de facturación por período.

**Índices:**
- `(client_id, year, month)` — historial del cliente
- `(studio_id, year, month)` — reportes del estudio

**Nota:** Para calcular la facturación de los últimos 12 meses se hace `SUM(amount)` filtrando por `client_id` y el rango de fechas correspondiente. Esta es la base del cálculo de recategorización.

---

### `payments`
Historial de pagos del monotributo. Preparado para el Sprint Post-MVP.

| Columna | Tipo | Constraints | Descripción |
|---------|------|------------|-------------|
| id | UUID | PK | |
| client_id | UUID | FK → clients, NOT NULL | |
| studio_id | UUID | FK → studios, NOT NULL | |
| period | DATE | NOT NULL | Período de pago (primer día del mes) |
| amount | NUMERIC(18,2) | NOT NULL | |
| payment_date | DATE | | NULL = pendiente |
| status | VARCHAR(20) | NOT NULL, default 'pending' | 'pending', 'paid', 'overdue' |
| payment_method | VARCHAR(50) | | |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### `documents`
Archivos subidos por el estudio para cada cliente.

| Columna | Tipo | Constraints | Descripción |
|---------|------|------------|-------------|
| id | UUID | PK | |
| client_id | UUID | FK → clients, NOT NULL | |
| studio_id | UUID | FK → studios, NOT NULL | |
| uploaded_by | UUID | FK → users, NOT NULL | Quién subió el archivo |
| filename | VARCHAR(255) | NOT NULL | Nombre en storage (UUID + ext) |
| original_filename | VARCHAR(255) | NOT NULL | Nombre original del usuario |
| file_size | INTEGER | NOT NULL | Bytes |
| mime_type | VARCHAR(100) | NOT NULL | |
| document_type | VARCHAR(30) | NOT NULL | 'dni', 'constancia', 'pdf', 'other' |
| storage_path | VARCHAR(500) | NOT NULL | Path en MinIO |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### `alerts`
Alertas generadas por el motor de alertas.

| Columna | Tipo | Constraints | Descripción |
|---------|------|------------|-------------|
| id | UUID | PK | |
| client_id | UUID | FK → clients, NOT NULL | |
| studio_id | UUID | FK → studios, NOT NULL | |
| alert_type | VARCHAR(30) | NOT NULL | Ver tipos abajo |
| message | TEXT | NOT NULL | Mensaje descriptivo |
| is_read | BOOLEAN | NOT NULL, default FALSE | |
| is_dismissed | BOOLEAN | NOT NULL, default FALSE | |
| triggered_at | TIMESTAMPTZ | NOT NULL | Cuándo se detectó la condición |
| read_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Tipos de alerta (`alert_type`):**
- `approaching_limit_80` — Superó el 80% del límite anual
- `over_limit` — Superó el límite de categoría
- `recategorization_required` — Necesita recategorización este período
- `upcoming_payment` — Vencimiento de pago en X días
- `no_billing_data` — Sin datos de facturación en 2+ meses

---

## Lógica de Recategorización

### Cálculo del porcentaje utilizado

```
facturado_12m = SUM(billing_entries.amount) 
                WHERE client_id = X 
                AND (year, month) en los últimos 12 meses

porcentaje = (facturado_12m / category.annual_limit) * 100
```

### Umbrales
- `porcentaje >= 80%` → Alerta: approaching_limit_80
- `porcentaje >= 100%` → Alerta: over_limit
- `porcentaje < umbral_descenso` → Notificar posibilidad de descenso de categoría

### Períodos de recategorización (AFIP)
- Enero (cubre julio–diciembre del año anterior)
- Mayo (cubre noviembre–octubre)
- Septiembre (cubre marzo–febrero)

Esta lógica se implementa en `billing_service.py`.

---

## Estrategia de Índices

```sql
-- Multi-tenancy (todos los queries de negocio)
CREATE INDEX idx_clients_studio ON clients(studio_id);
CREATE INDEX idx_billing_studio ON billing_entries(studio_id);
CREATE INDEX idx_alerts_studio_unread ON alerts(studio_id) WHERE is_read = FALSE AND is_dismissed = FALSE;

-- Queries frecuentes
CREATE INDEX idx_clients_studio_status ON clients(studio_id, status);
CREATE INDEX idx_billing_client_period ON billing_entries(client_id, year DESC, month DESC);
CREATE INDEX idx_alerts_client ON alerts(client_id);
```
