# Nexo — Arquitectura Técnica

## Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|--------------|
| Backend | Python 3.12 + FastAPI | Alto rendimiento, tipado nativo, documentación OpenAPI automática |
| Frontend | React 18 + TypeScript + Vite | Ecosistema maduro, DX excelente, builds rápidos |
| Estilos | TailwindCSS + shadcn/ui | Componentes accesibles y customizables sin overhead de diseño |
| Base de datos | PostgreSQL 16 | ACID, JSON nativo, row-level security, madurez |
| ORM | SQLAlchemy 2.0 (async) | Estándar de Python, soporte async nativo |
| Migraciones | Alembic | Par natural de SQLAlchemy |
| Auth | JWT (access + refresh tokens) | Stateless, estándar, fácil de implementar |
| Storage | MinIO (S3-compatible) | Local para dev/staging, swap transparente a S3 en producción |
| Infra local | Docker Compose | Un comando para levantar todo el stack |
| Testing | Pytest + httpx | Testing de API asíncrono |

---

## Decisión: shadcn/ui sobre TailwindCSS puro

TailwindCSS está incluido en el stack. Para acelerar la construcción de UI sin sacrificar calidad, se usa **shadcn/ui**: componentes copiados al proyecto (no una librería externa), construidos sobre Radix UI para accesibilidad, estilizados con Tailwind. Esto permite:

- Componentes accesibles desde el día 1
- Control total sobre el código (no hay `node_modules` que actualizar con breaking changes)
- Diseño consistente que se puede adaptar sin fricción

---

## Visión General del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                          CLIENTE                            │
│                   React SPA (Vite + TS)                     │
│                    Puerto 3000 (dev)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/JSON (REST API)
                           │ Authorization: Bearer <JWT>
┌──────────────────────────▼──────────────────────────────────┐
│                         BACKEND                             │
│                FastAPI (Python 3.12)                        │
│                    Puerto 8000                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   api/   │  │services/ │  │  repos/  │  │ models/  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────┬───────────────────────────────────┬─────────────┘
           │ SQLAlchemy (async)                │ boto3/minio
┌──────────▼──────────┐             ┌──────────▼──────────────┐
│     PostgreSQL       │             │         MinIO           │
│     Puerto 5432      │             │      Puerto 9000        │
│   (datos de app)     │             │   (archivos/docs)       │
└─────────────────────┘             └─────────────────────────┘
```

---

## Multi-tenancy

### Decisión: Row-Level Isolation con `studio_id`

Cada tabla de datos tiene una columna `studio_id` que apunta al estudio contable dueño del registro.

**Por qué no schema-per-tenant:**
- Complejidad innecesaria para el MVP
- Las migraciones de Alembic se vuelven complicadas (hay que correrlas por cada schema)
- El tamaño esperado de los datos no justifica el aislamiento físico

**Por qué no database-per-tenant:**
- Operativamente inmanejable para un producto SaaS
- Costo y overhead disproportionados

**Row-level isolation:**
- Simple de implementar
- Fácil de mantener
- Escalable hasta decenas de miles de registros por tabla
- Los índices en `studio_id` garantizan performance

**Implementación:** Cada endpoint protegido recibe el `studio_id` del token JWT. Todos los queries incluyen `WHERE studio_id = :studio_id` a través de una dependencia de FastAPI.

---

## Arquitectura del Backend

### Estructura de Directorios

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py          # Agrupa todos los routers
│   │       ├── auth.py            # /auth/login, /auth/refresh, /auth/logout
│   │       ├── clients.py         # /clients CRUD
│   │       ├── billing.py         # /clients/{id}/billing
│   │       ├── payments.py        # /clients/{id}/payments
│   │       ├── documents.py       # /clients/{id}/documents
│   │       ├── alerts.py          # /alerts
│   │       ├── dashboard.py       # /dashboard
│   │       └── categories.py     # /categories (referencia)
│   │
│   ├── core/
│   │   ├── config.py              # Settings desde variables de entorno
│   │   ├── security.py            # JWT encode/decode, password hashing
│   │   └── dependencies.py        # Dependencias FastAPI (get_current_user, etc.)
│   │
│   ├── database/
│   │   ├── session.py             # AsyncSession factory
│   │   └── base.py                # Base declarativa de SQLAlchemy
│   │
│   ├── models/
│   │   ├── studio.py
│   │   ├── user.py
│   │   ├── client.py
│   │   ├── category.py
│   │   ├── billing_entry.py
│   │   ├── payment.py
│   │   ├── document.py
│   │   └── alert.py
│   │
│   ├── schemas/
│   │   ├── auth.py                # LoginRequest, TokenResponse, etc.
│   │   ├── client.py              # ClientCreate, ClientUpdate, ClientResponse, etc.
│   │   ├── billing.py
│   │   ├── payment.py
│   │   ├── document.py
│   │   ├── alert.py
│   │   └── dashboard.py
│   │
│   ├── repositories/
│   │   ├── base.py                # Repositorio genérico con operaciones CRUD
│   │   ├── client_repository.py
│   │   ├── billing_repository.py
│   │   ├── payment_repository.py
│   │   ├── document_repository.py
│   │   └── alert_repository.py
│   │
│   ├── services/
│   │   ├── auth_service.py        # Lógica de autenticación
│   │   ├── client_service.py      # Lógica de negocio de clientes
│   │   ├── billing_service.py     # Cálculos de facturación y categorías
│   │   ├── alert_service.py       # Motor de alertas
│   │   └── storage_service.py     # Upload/download a MinIO
│   │
│   └── main.py                    # Instancia FastAPI, middlewares, CORS
│
├── alembic/
│   ├── versions/
│   └── env.py
│
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_clients.py
│   └── test_billing.py
│
├── alembic.ini
├── pyproject.toml
├── Dockerfile
└── .env.example
```

### Flujo de una Request

```
Request HTTP
    │
    ▼
FastAPI Router (api/v1/)
    │  Valida schema (Pydantic)
    │  Inyecta dependencias (JWT → current_user, studio_id)
    ▼
Service Layer
    │  Lógica de negocio
    │  Orquesta repositorios
    │  No conoce HTTP ni SQL directo
    ▼
Repository Layer
    │  Queries SQLAlchemy
    │  SIEMPRE filtra por studio_id
    │  Devuelve modelos ORM
    ▼
SQLAlchemy Models → PostgreSQL
```

---

## Arquitectura del Frontend

### Estructura de Directorios

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts             # Axios instance con interceptors JWT
│   │   ├── auth.ts
│   │   ├── clients.ts
│   │   ├── billing.ts
│   │   └── documents.ts
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui (Button, Input, Table, etc.)
│   │   ├── layout/               # Sidebar, Navbar, PageLayout
│   │   └── shared/               # Componentes reutilizables del dominio
│   │
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Clients/
│   │   │   ├── ClientList.tsx
│   │   │   ├── ClientDetail.tsx
│   │   │   └── ClientForm.tsx
│   │   └── NotFound.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useClients.ts
│   │   └── useBilling.ts
│   │
│   ├── store/
│   │   └── authStore.ts          # Zustand (solo estado de auth)
│   │
│   ├── types/
│   │   └── index.ts              # Tipos TypeScript del dominio
│   │
│   ├── utils/
│   │   ├── formatters.ts         # Formateo de moneda, fechas, CUIT
│   │   └── validators.ts         # Validación de CUIT
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── Dockerfile
└── .env.example
```

### Estado en el Frontend

| Tipo de estado | Solución | Justificación |
|---------------|----------|--------------|
| Server state (datos de API) | TanStack Query (React Query) | Cache, invalidación, loading states automáticos |
| UI state global (auth, user) | Zustand | Minimal, sin boilerplate |
| UI state local | useState/useReducer | No escalar innecesariamente |

**No se usa Redux.** Para la escala de esta aplicación es sobreingeniería.

---

## Autenticación

### Flujo JWT

```
1. POST /auth/login
   → Valida credenciales
   → Devuelve: { access_token, refresh_token, expires_in }

2. Requests autenticadas
   → Header: Authorization: Bearer <access_token>
   → El access_token expira en 30 minutos

3. POST /auth/refresh
   → Body: { refresh_token }
   → Devuelve nuevo access_token
   → El refresh_token expira en 7 días

4. POST /auth/logout
   → Invalida el refresh_token en DB
```

### Seguridad
- Passwords hasheados con bcrypt (cost factor 12)
- Refresh tokens almacenados como hash en DB
- Los access tokens no se guardan en DB (stateless)
- HTTPS obligatorio en producción

---

## Almacenamiento de Archivos

### MinIO

MinIO corre en Docker Compose como contenedor independiente. La aplicación usa el SDK de boto3 (compatible con S3).

Ventaja clave: el código de la aplicación no cambia al migrar de MinIO local a S3 en producción. Solo cambian las variables de entorno.

**Estructura de buckets:**
```
nexo-documents/
└── {studio_id}/
    └── {client_id}/
        └── {uuid}_{original_filename}
```

---

## Variables de Entorno

```env
# Backend
DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/nexo
SECRET_KEY=<32+ random chars>
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=nexo-documents

# Frontend
VITE_API_URL=http://localhost:8000/api/v1
```

---

## Docker Compose (estructura)

```yaml
services:
  db:           # PostgreSQL 16
  backend:      # FastAPI (uvicorn)
  frontend:     # Vite dev server (dev) / nginx (prod)
  minio:        # MinIO object storage
```

Un solo `docker compose up` levanta el stack completo. No hay dependencias externas.

---

## Decisiones Técnicas Importantes

### ¿Por qué async en SQLAlchemy?
FastAPI es async por diseño. Usar SQLAlchemy síncrono bloquearía el event loop en operaciones de DB. `asyncpg` con SQLAlchemy 2.0 async es el stack correcto para FastAPI.

### ¿Por qué UUIDs y no integers secuenciales?
- Evita enumeración de recursos (seguridad)
- No expone el tamaño de la base de datos
- Preparado para eventual distribución
- Costo negligible en PostgreSQL con índices

### ¿Por qué las categorías de monotributo en DB?
AFIP actualiza los límites con cada resolución general (frecuentemente por inflación). Hardcodear los valores significa redesplegar la aplicación cada vez que cambian. En DB, el contador puede actualizarlos sin intervención del equipo técnico.

### ¿Por qué no Celery en el MVP?
El motor de alertas del Sprint 5 puede arrancar con APScheduler (scheduler en el mismo proceso FastAPI). Celery agrega Redis o RabbitMQ como dependencia adicional. Si el volumen de clientes crece significativamente, la migración a Celery es directa y no requiere cambios en la lógica de negocio.
