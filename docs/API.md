# Nexo — Diseño de API

## Principios

- REST estándar con recursos en plural (`/clients`, `/alerts`)
- Versionado desde el inicio: `/api/v1/`
- Todas las respuestas en JSON
- Errores con estructura consistente
- Autenticación JWT via header `Authorization: Bearer <token>`
- Paginación consistente en todos los endpoints de listado

---

## Estructura de Respuestas

### Éxito — recurso único
```json
{
  "data": { ... }
}
```

### Éxito — listado paginado
```json
{
  "data": [ ... ],
  "pagination": {
    "total": 150,
    "page": 1,
    "per_page": 20,
    "pages": 8
  }
}
```

### Error
```json
{
  "error": {
    "code": "CLIENT_NOT_FOUND",
    "message": "El cliente solicitado no existe"
  }
}
```

---

## Autenticación — `/api/v1/auth`

### `POST /auth/login`
Inicia sesión. Devuelve access y refresh token.

**Request:**
```json
{
  "email": "contador@estudio.com",
  "password": "********"
}
```

**Response 200:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Errores:** `401 INVALID_CREDENTIALS`

---

### `POST /auth/refresh`
Renueva el access token usando el refresh token.

**Request:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response 200:**
```json
{
  "access_token": "eyJ...",
  "expires_in": 1800
}
```

**Errores:** `401 INVALID_REFRESH_TOKEN`, `401 EXPIRED_REFRESH_TOKEN`

---

### `POST /auth/logout`
Invalida el refresh token.

**Request:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response 204:** (sin body)

---

### `GET /auth/me`
Devuelve el usuario autenticado.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "email": "contador@estudio.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "role": "admin",
    "studio": {
      "id": "uuid",
      "name": "Estudio Pérez & Asociados"
    }
  }
}
```

---

## Clientes — `/api/v1/clients`

> Todos los endpoints requieren autenticación. El `studio_id` se extrae del JWT.

### `GET /clients`
Lista todos los clientes del estudio.

**Query params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| page | int | default 1 |
| per_page | int | default 20, max 100 |
| search | string | Búsqueda por nombre, apellido o CUIT |
| status | string | `active`, `inactive`, `suspended` |
| category | string | Código de categoría (A, B, C...) |
| alert | string | `approaching_80`, `over_limit` |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "first_name": "María",
      "last_name": "González",
      "cuit": "27123456789",
      "email": "maria@ejemplo.com",
      "phone": "1123456789",
      "status": "active",
      "category": {
        "code": "C",
        "annual_limit": 13620000,
        "activity_type": "services"
      },
      "billing_summary": {
        "last_12_months": 9800000,
        "percentage_used": 71.95,
        "current_month": 850000
      },
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### `POST /clients`
Crea un nuevo cliente.

**Request:**
```json
{
  "first_name": "María",
  "last_name": "González",
  "cuit": "27123456789",
  "email": "maria@ejemplo.com",
  "phone": "1123456789",
  "category_id": "uuid",
  "registration_date": "2023-03-01",
  "notes": "Cliente referida por González & Hnos."
}
```

**Response 201:**
```json
{
  "data": { ... }  // cliente completo
}
```

**Errores:** `409 CUIT_ALREADY_EXISTS`, `422 VALIDATION_ERROR`

---

### `GET /clients/{id}`
Ficha completa del cliente.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "first_name": "María",
    "last_name": "González",
    "cuit": "27123456789",
    "email": "maria@ejemplo.com",
    "phone": "1123456789",
    "status": "active",
    "category": { ... },
    "registration_date": "2023-03-01",
    "notes": "...",
    "billing_summary": {
      "last_12_months": 9800000,
      "percentage_used": 71.95,
      "current_month": 850000,
      "current_year": 7650000
    },
    "active_alerts": [ ... ],
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

### `PATCH /clients/{id}`
Actualiza datos del cliente (campos parciales).

**Request:** cualquier subset de campos de `POST /clients`

**Response 200:** cliente actualizado

---

### `DELETE /clients/{id}`
Desactiva el cliente (soft delete — cambia status a `inactive`).

**Response 204:** (sin body)

---

## Facturación — `/api/v1/clients/{id}/billing`

### `GET /clients/{id}/billing`
Historial de facturación del cliente.

**Query params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| year | int | Filtrar por año |
| months | int | Últimos N meses (default 12) |

**Response 200:**
```json
{
  "data": {
    "client_id": "uuid",
    "category": {
      "code": "C",
      "annual_limit": 13620000
    },
    "summary": {
      "last_12_months": 9800000,
      "percentage_used": 71.95,
      "recategorization_status": "ok"
    },
    "entries": [
      {
        "id": "uuid",
        "year": 2025,
        "month": 3,
        "amount": 920000,
        "invoice_count": 4,
        "notes": null
      }
    ]
  }
}
```

---

### `POST /clients/{id}/billing`
Registra o actualiza facturación de un período.

**Request:**
```json
{
  "year": 2025,
  "month": 3,
  "amount": 920000,
  "invoice_count": 4,
  "notes": null
}
```

**Response 201:** entrada de facturación creada

**Errores:** `409 BILLING_ENTRY_EXISTS` (si ya existe, usar PUT)

---

### `PUT /clients/{id}/billing/{entry_id}`
Actualiza una entrada de facturación existente.

**Request:** mismo body que POST

**Response 200:** entrada actualizada

---

### `DELETE /clients/{id}/billing/{entry_id}`
Elimina una entrada de facturación.

**Response 204**

---

## Dashboard — `/api/v1/dashboard`

### `GET /dashboard`
Datos consolidados para el dashboard principal.

**Response 200:**
```json
{
  "data": {
    "stats": {
      "total_clients": 87,
      "active_clients": 82,
      "inactive_clients": 5,
      "clients_approaching_80": 12,
      "clients_over_limit": 2,
      "clients_requiring_recategorization": 3
    },
    "upcoming_deadlines": [
      {
        "type": "recategorization",
        "date": "2025-05-01",
        "clients_affected": 3
      },
      {
        "type": "payment",
        "date": "2025-04-20",
        "clients_count": 82
      }
    ],
    "recent_alerts": [
      {
        "id": "uuid",
        "client_id": "uuid",
        "client_name": "María González",
        "alert_type": "approaching_limit_80",
        "message": "María González superó el 80% de su categoría C",
        "triggered_at": "2025-04-10T08:00:00Z"
      }
    ]
  }
}
```

---

## Alertas — `/api/v1/alerts`

### `GET /alerts`
Lista alertas del estudio.

**Query params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| is_read | bool | Filtrar por leídas/no leídas |
| is_dismissed | bool | Incluir descartadas |
| alert_type | string | Tipo específico de alerta |
| client_id | uuid | Alertas de un cliente |
| page | int | Paginación |

**Response 200:** lista paginada de alertas

---

### `PATCH /alerts/{id}/read`
Marca una alerta como leída.

**Response 200**

---

### `PATCH /alerts/{id}/dismiss`
Descarta una alerta.

**Response 200**

---

### `POST /alerts/mark-all-read`
Marca todas las alertas como leídas.

**Response 200:** `{ "updated": 15 }`

---

## Documentos — `/api/v1/clients/{id}/documents`

### `GET /clients/{id}/documents`
Lista documentos del cliente.

**Query params:** `document_type`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "original_filename": "DNI_frente.pdf",
      "file_size": 245000,
      "mime_type": "application/pdf",
      "document_type": "dni",
      "uploaded_by": "Juan Pérez",
      "created_at": "2024-03-15T10:30:00Z",
      "download_url": "/api/v1/clients/{id}/documents/{doc_id}/download"
    }
  ]
}
```

---

### `POST /clients/{id}/documents`
Sube un documento. Multipart form data.

**Form fields:**
- `file`: archivo (requerido)
- `document_type`: `dni`, `constancia`, `pdf`, `other`

**Límites:** máximo 10MB por archivo. Tipos: PDF, JPG, PNG, DOCX.

**Response 201:** documento creado

---

### `GET /clients/{id}/documents/{doc_id}/download`
Descarga un documento. Devuelve redirect a URL firmada de MinIO.

**Response 302:** redirect a URL temporal (válida 15 minutos)

---

### `DELETE /clients/{id}/documents/{doc_id}`
Elimina un documento (del storage y de la DB).

**Response 204**

---

## Categorías — `/api/v1/categories`

### `GET /categories`
Lista categorías de monotributo vigentes.

**Query params:** `activity_type` (`services`, `commerce`)

**Response 200:** lista de categorías vigentes ordenadas por límite

---

## Códigos de Error HTTP

| Código | Uso |
|--------|-----|
| 200 | OK |
| 201 | Creado |
| 204 | Sin contenido (DELETE exitoso) |
| 302 | Redirect (descarga de archivos) |
| 400 | Bad request (datos inválidos) |
| 401 | No autenticado o token inválido |
| 403 | Autenticado pero sin permisos |
| 404 | Recurso no encontrado |
| 409 | Conflicto (duplicado) |
| 413 | Archivo demasiado grande |
| 422 | Error de validación (Pydantic) |
| 500 | Error interno del servidor |

---

## Notas de Implementación

### Seguridad en endpoints de recursos
Antes de devolver cualquier recurso, el service verifica que el `studio_id` del recurso coincida con el `studio_id` del token JWT. Si no coincide → 404 (no revelar que el recurso existe).

### `billing_summary` calculado
El campo `billing_summary` en la respuesta de clientes es calculado en tiempo real (no almacenado). Se obtiene con una query de agregación sobre `billing_entries`. Para el dashboard, se puede cachear en memoria por 5 minutos en una versión futura.

### Paginación
Default siempre 20 registros. Máximo 100. El cliente no puede pedir "todos los registros" sin paginar.
