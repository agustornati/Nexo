# Nexo — Roadmap

## Filosofía

Cada sprint entrega valor real. No hay sprints de "infraestructura invisible". Al finalizar cada sprint, el producto debe ser más útil que el sprint anterior.

---

## Sprint 0 — Diseño y Fundamentos
**Objetivo:** Tener todo definido antes de escribir código de producto.

### Entregables
- [x] Documento de visión (`VISION.md`)
- [x] Roadmap (`ROADMAP.md`)
- [x] Arquitectura técnica (`ARCHITECTURE.md`)
- [x] Modelo de datos (`DATABASE.md`)
- [x] Diseño de API (`API.md`)
- [ ] Repositorio configurado en GitHub
- [ ] Estructura de directorios definida

### Criterio de éxito
Cualquier desarrollador puede leer estos documentos y entender qué construir, cómo construirlo y por qué se tomaron las decisiones.

---

## Sprint 1 — Infraestructura Base
**Objetivo:** Tener el stack completo corriendo localmente con autenticación funcionando.

### Entregables
- [ ] `docker-compose.yml` con PostgreSQL, backend, frontend y MinIO
- [ ] Backend FastAPI con estructura de directorios limpia
- [ ] Migraciones base con Alembic (tablas: studios, users)
- [ ] Sistema de autenticación JWT completo (login, refresh, logout)
- [ ] Frontend React/Vite/TypeScript/Tailwind inicializado
- [ ] Página de login funcional conectada al backend
- [ ] Variables de entorno configuradas

### Criterio de éxito
Un usuario puede registrar un estudio, iniciar sesión y ver una pantalla de inicio (aunque esté vacía). El sistema funciona 100% con `docker compose up`.

---

## Sprint 2 — CRUD de Clientes
**Objetivo:** El contador puede gestionar su cartera de clientes.

### Entregables
- [ ] Modelo y migraciones de `clients`
- [ ] Tabla de categorías de monotributo con límites vigentes
- [ ] API REST completa para clientes (CRUD)
- [ ] Listado de clientes con búsqueda y filtros
- [ ] Formulario de alta/edición de cliente
- [ ] Ficha del cliente (tab: Datos)
- [ ] Soft delete (desactivar cliente, no borrar)

### Criterio de éxito
El contador puede dar de alta, editar, buscar y desactivar clientes. Todos los datos básicos del cliente están almacenados correctamente.

---

## Sprint 3 — Dashboard
**Objetivo:** El contador tiene visibilidad completa de su cartera al entrar a la aplicación.

### Entregables
- [ ] KPIs del dashboard (total clientes, activos, alertas)
- [ ] Indicadores de recategorización (80%, límite superado)
- [ ] Próximos vencimientos
- [ ] Tabla de clientes con estado de facturación
- [ ] Lógica de cálculo de porcentaje utilizado por categoría

### Criterio de éxito
En menos de 10 segundos de ingresar al dashboard, el contador sabe cuántos clientes tienen problemas y cuáles son.

---

## Sprint 4 — Facturación
**Objetivo:** El contador puede registrar y consultar la facturación de cada cliente.

### Entregables
- [ ] Modelo y migraciones de `billing_entries`
- [ ] API para registrar facturación mensual
- [ ] Ficha del cliente — tab: Facturación
- [ ] Gráfico de facturación mensual (últimos 12 meses)
- [ ] Barra de progreso de categoría (% utilizado)
- [ ] Historial de facturación anual
- [ ] Cálculo automático de facturación acumulada (últimos 12 meses)

### Criterio de éxito
El contador puede cargar la facturación mensual de un cliente y ver de inmediato qué porcentaje del límite de categoría consumió.

---

## Sprint 5 — Alertas
**Objetivo:** Nexo avisa proactivamente cuando algo requiere atención.

### Entregables
- [ ] Motor de alertas (cálculo en background con Celery o APScheduler)
- [ ] Alertas por superar el 80% del límite
- [ ] Alertas por superar el límite de categoría
- [ ] Alertas por vencimientos próximos
- [ ] Alertas por clientes inactivos (sin facturación cargada en X meses)
- [ ] Centro de notificaciones en el frontend
- [ ] Marcar alertas como leídas / descartadas

### Criterio de éxito
El contador recibe alertas accionables. No hay falsos positivos. Las alertas se calculan automáticamente sin intervención manual.

---

## Sprint 6 — Documentos
**Objetivo:** Cada cliente tiene su repositorio de documentos.

### Entregables
- [ ] Upload de archivos (PDF, imágenes, documentos)
- [ ] Almacenamiento en MinIO
- [ ] Ficha del cliente — tab: Documentos
- [ ] Clasificación por tipo (DNI, constancia, otros)
- [ ] Descarga y previsualización de archivos
- [ ] Límite de tamaño y tipos de archivo permitidos

### Criterio de éxito
El contador puede subir y encontrar cualquier documento de un cliente en menos de 30 segundos.

---

## Backlog Post-MVP (no priorizado)

Estas funcionalidades son candidatas para versiones futuras. No se diseñan ni implementan en esta etapa.

- Integración con ARCA (consulta de facturación automática)
- Pagos — tab completo con historial
- Exportación de reportes (PDF, Excel)
- Recordatorios por email/WhatsApp
- Portal del cliente (acceso limitado para el propio monotributista)
- API pública para integraciones
- Planes y facturación del estudio (SaaS)
- App mobile
