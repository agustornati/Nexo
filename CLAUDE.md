# Nexo — Contexto del Proyecto

## ¿Qué es Nexo?

Aplicación web para estudios contables argentinos que administran carteras de monotributistas.

El problema que resuelve: un contador con 80+ clientes necesita saber rápidamente cuánto facturó cada uno, qué categoría tiene, cuánto le falta para el límite, y qué vencimientos tiene. Todo en un solo lugar.

**No es un ERP. No integrar con ARCA (todavía).**

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.12 + FastAPI |
| Frontend | React 18 + TypeScript + Vite + TailwindCSS |
| Base de datos | PostgreSQL 16 |
| ORM | SQLAlchemy 2.0 async |
| Migraciones | Alembic |
| Auth | JWT (access 30 min + refresh 7 días) |
| Storage | MinIO (S3-compatible) |
| Infra | Docker Compose |

## Arquitectura

**Multi-tenancy por row-level:** todas las tablas de negocio tienen `studio_id`. El `studio_id` viene del JWT y se aplica en cada query del repositorio.

**Capas del backend (no mezclar):**
```
api/v1/     → recibe HTTP, valida schema, llama al service
services/   → lógica de negocio, orquesta repositorios
repositories/ → queries SQLAlchemy, SIEMPRE filtra por studio_id
models/     → definiciones ORM
schemas/    → Pydantic (request/response)
core/       → config, security, dependencies
database/   → session, base
```

## Estado Actual

- **Sprint 0 ✅** — Documentación completa en `docs/`
- **Sprint 1 ✅** — Infraestructura base + autenticación JWT completa

### Lo que está implementado

**Backend:**
- `POST /api/v1/auth/register` — crea estudio + usuario admin
- `POST /api/v1/auth/login` — devuelve access + refresh token
- `POST /api/v1/auth/refresh` — renueva access token
- `POST /api/v1/auth/logout` — revoca refresh token
- `GET /api/v1/auth/me` — usuario autenticado
- `GET /health` — health check

**Frontend:**
- Página de login (`/login`)
- Página de registro (`/register`)
- Dashboard placeholder (`/`)
- Sidebar con navegación base
- Componentes UI: Button, Input, Label, Card
- Auth flow completo: tokens en localStorage, refresh automático en 401

**Migraciones:**
- `alembic/versions/001_initial.py` — tablas `studios`, `users`, `refresh_tokens`

## Cómo correr el proyecto

### Con Docker (recomendado)
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

### Sin Docker

**Backend:**
```bash
cd backend
pip install -e ".[dev]"
# Configurar backend/.env con DATABASE_URL apuntando a PostgreSQL local
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Acceder en `http://localhost:3000`

## Variables de entorno

Copiar `backend/.env.example` a `backend/.env`:
```
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/nexo
SECRET_KEY=<mínimo 32 caracteres random>
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=nexo-documents
```

Copiar `frontend/.env.example` a `frontend/.env`:
```
VITE_API_URL=http://localhost:8000/api/v1
```

## Roadmap

- Sprint 0 ✅ Diseño y documentación
- Sprint 1 ✅ Infraestructura + autenticación
- Sprint 2 ⏳ CRUD de clientes
- Sprint 3 Dashboard con KPIs
- Sprint 4 Facturación mensual y categorías
- Sprint 5 Alertas automáticas
- Sprint 6 Carga de documentos

## Decisiones de diseño importantes

1. **UUIDs** como PKs en todas las tablas (no integers)
2. **Soft delete** — nunca borrar registros, usar `status` / `is_active`
3. **Categorías de monotributo en DB** — no hardcodear, AFIP las actualiza con cada resolución general
4. **No integrar con ARCA** en esta etapa
5. **shadcn/ui style** para componentes UI (Radix UI + Tailwind, copiados al proyecto)
6. **Refresh token opaco** almacenado como SHA-256 hash en DB

## Reglas del proyecto

- No sobreingenierizar ni anticipar módulos futuros
- No generar código muerto
- No crear abstracciones sin valor real para el MVP
- Diseño profesional: minimalista, mucho espacio en blanco, estilo Stripe/Linear/Notion
- Toda funcionalidad pensada para ahorrar tiempo al contador

## Documentación completa

Ver carpeta `docs/`:
- `VISION.md` — qué es el producto y para quién
- `ROADMAP.md` — sprints detallados con criterios de éxito
- `ARCHITECTURE.md` — arquitectura técnica completa
- `DATABASE.md` — modelo de datos con todas las tablas
- `API.md` — diseño de endpoints REST
