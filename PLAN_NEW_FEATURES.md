# ActionsHub — Plan de Nuevas Features

## 1. Notificaciones en Tiempo Real

### 1.1 Notificaciones del Navegador (Web Push)
- Alertar al usuario cuando un workflow falla o se completa.
- Configuración por usuario: qué repos/workflows notificar.
- Soporte para Web Push API con Service Worker.

### 1.2 Integración con Slack / Discord / Microsoft Teams
- Webhook configurable para enviar alertas a canales externos.
- Plantilla personalizable del mensaje (nombre del workflow, repo, status, link directo).
- Endpoint nuevo: `POST /api/notifications/configure`.

---

## 2. Scheduling y Triggers Manuales

### 2.1 Disparar Workflows desde el Dashboard
- Botón "Run Workflow" que invoque `POST /repos/{owner}/{repo}/actions/workflows/{id}/dispatches` via Octokit.
- Formulario dinámico para `workflow_dispatch` inputs (leer inputs del YAML del workflow).
- Página nueva o modal: seleccionar branch, rellenar inputs, lanzar.

### 2.2 Programar Ejecuciones Recurrentes
- Scheduler interno (cron-like) para re-lanzar workflows en horarios definidos por el usuario.
- Modelo Prisma nuevo: `ScheduledRun` con campos `cronExpression`, `workflowId`, `branch`, `enabled`.
- Worker background que evalúe crons pendientes cada minuto.

---

## 3. Métricas y Analytics Avanzados

### 3.1 Dashboard de Métricas Históricas
- Gráfica de tendencia de success rate a lo largo del tiempo (7d, 30d, 90d).
- Tiempo medio de ejecución por workflow con evolución temporal.
- Comparativa entre branches (main vs feature branches).
- Heatmap de actividad (estilo GitHub contributions).

### 3.2 Detección de Flaky Tests
- Identificar workflows que alternan pass/fail frecuentemente.
- Score de estabilidad por workflow (basado en los últimos N runs).
- Vista dedicada: "Flaky Workflows" con ranking de inestabilidad.

### 3.3 Métricas de Costes (Billing de GitHub Actions)
- Consumo de minutos por repo/workflow/organización.
- Desglose por runner type (ubuntu, macos, windows) con multiplicadores de coste.
- Alertas cuando se acerque al límite de minutos del plan de GitHub.

---

## 4. Gestión de Workflows

### 4.1 Cancelar Workflows en Ejecución
- Botón "Cancel" en workflows con status `in_progress` o `queued`.
- Llamar a `POST /repos/{owner}/{repo}/actions/runs/{run_id}/cancel` via Octokit.
- Confirmación antes de cancelar.

### 4.2 Workflow Favorites / Pinned
- Permitir al usuario marcar workflows como favoritos.
- Sección "Pinned Workflows" en la parte superior del dashboard.
- Almacenar en LocalStorage o en base de datos (modelo `UserPreference`).

### 4.3 Comparar Runs
- Seleccionar 2 runs del mismo workflow y ver diff de duración, jobs, resultados de tests.
- Vista side-by-side de logs entre dos ejecuciones.

---

## 5. Gestión de Secretos y Variables

### 5.1 Visor de Secrets y Variables
- Listar secrets y variables de repositorio/organización (sin revelar valores).
- Indicar fecha de última actualización.
- Endpoint: `GET /api/settings/{owner}/{repo}/secrets`.

### 5.2 Editor de Variables de Entorno
- CRUD de variables de Actions (no secrets por seguridad).
- `GET/PUT/DELETE /repos/{owner}/{repo}/actions/variables/{name}` via Octokit.

---

## 6. Vista Multi-Organización

### 6.1 Soporte para Múltiples Organizaciones
- Actualmente `GITHUB_ORG` soporta una sola organización.
- Permitir al usuario autenticado ver workflows de todas sus orgs.
- Selector de organización en el header/sidebar.
- Filtro cruzado entre organizaciones.

### 6.2 Role-Based Access Control (RBAC)
- Definir roles: `admin`, `viewer`, `operator` (puede hacer rerun/cancel).
- Modelo Prisma: `TeamMember` con `userId`, `orgId`, `role`.
- Middleware que verifique permisos antes de acciones destructivas.

---

## 7. Mejoras de UX

### 7.1 Dark/Light Mode Automático
- Detectar `prefers-color-scheme` del sistema y aplicar automáticamente.
- Respetar preferencia manual del usuario (ya tiene ThemeToggle).

### 7.2 Vista Kanban de Workflows
- Columnas: `Queued`, `In Progress`, `Success`, `Failed`, `Cancelled`.
- Drag-and-drop visual (solo lectura, para organizar vista).
- Alternativa a la vista de lista actual.

### 7.3 Keyboard Shortcuts
- `k/j` para navegar entre workflows (estilo vim).
- `/` para abrir búsqueda.
- `r` para re-run el workflow seleccionado.
- `?` para mostrar panel de atajos.

### 7.4 Responsive & PWA
- Optimizar para móvil (el dashboard es principalmente desktop).
- Convertir en Progressive Web App con manifest.json e instalación.
- Offline mode básico con cached data de LocalStorage.

---

## 8. Integración con CI/CD Extendida

### 8.1 Soporte para Artifacts
- Listar artifacts generados por un workflow run.
- Descargar artifacts directamente desde el dashboard.
- Vista previa de artifacts comunes (coverage reports HTML, screenshots de tests).

### 8.2 Soporte para Environments y Deployments
- Mostrar deployments activos por environment (production, staging, dev).
- Estado de protección de environments (required reviewers, wait timer).
- Aprobar/rechazar deployments pendientes desde el dashboard.

### 8.3 Soporte para Pull Request Checks
- Vista de checks asociados a un PR específico.
- Link directo entre workflow runs y sus PRs.
- Status checks dashboard por PR.

---

## 9. Colaboración y Equipo

### 9.1 Comentarios en Workflow Runs
- Añadir notas/comentarios a un workflow run (ej. "investigando fallo", "fix en PR #42").
- Modelo Prisma: `RunComment` con `runId`, `userId`, `content`, `createdAt`.
- Timeline de comentarios en la página de detalle del workflow.

### 9.2 Asignación de Fallos
- Asignar un workflow fallido a un miembro del equipo.
- Modelo Prisma: `RunAssignment` con `runId`, `assigneeGithubId`, `status`.
- Vista "My Assignments" con workflows asignados al usuario actual.

### 9.3 Status Page Pública
- Página compartible (sin login) que muestre el estado de workflows seleccionados.
- URL pública tipo `/status/{orgName}`.
- Útil como status page interna del equipo.

---

## 10. Infraestructura y DevOps

### 10.1 Health Check Endpoint
- `GET /api/health` que verifique: DB connection, GitHub API reachability, session validity.
- Útil para monitoring con Prometheus, Datadog, etc.

### 10.2 API Pública con API Keys
- Generar API keys para acceso programático (sin OAuth).
- Rate limiting por API key.
- Documentación OpenAPI/Swagger auto-generada.

### 10.3 Exportar Datos
- Exportar workflow history a CSV/JSON.
- Exportar métricas para uso en herramientas externas (Grafana, etc.).
- Endpoint: `GET /api/export/workflows?format=csv&from=...&to=...`.

### 10.4 Audit Log
- Registrar todas las acciones del usuario (login, rerun, cancel, config changes).
- Modelo Prisma: `AuditLog` con `userId`, `action`, `resource`, `timestamp`, `metadata`.
- Vista admin para revisar actividad.

---

## Prioridad Sugerida

| Prioridad | Feature | Impacto | Esfuerzo |
|-----------|---------|---------|----------|
| Alta | Cancelar Workflows (#4.1) | Alto | Bajo |
| Alta | Disparar Workflows (#2.1) | Alto | Medio |
| Alta | Notificaciones Navegador (#1.1) | Alto | Medio |
| Alta | Soporte Artifacts (#8.1) | Alto | Medio |
| Alta | Health Check (#10.1) | Medio | Bajo |
| Media | Métricas Históricas (#3.1) | Alto | Alto |
| Media | Keyboard Shortcuts (#7.3) | Medio | Bajo |
| Media | Workflow Favorites (#4.2) | Medio | Bajo |
| Media | Exportar Datos (#10.3) | Medio | Medio |
| Media | Multi-Organización (#6.1) | Alto | Alto |
| Media | Environments & Deployments (#8.2) | Alto | Alto |
| Baja | Flaky Tests (#3.2) | Medio | Alto |
| Baja | Vista Kanban (#7.2) | Bajo | Alto |
| Baja | Comentarios (#9.1) | Medio | Medio |
| Baja | RBAC (#6.2) | Medio | Alto |
| Baja | Slack/Discord (#1.2) | Medio | Medio |
| Baja | Status Page (#9.3) | Bajo | Medio |
| Baja | PWA (#7.4) | Bajo | Medio |
| Baja | Scheduler (#2.2) | Bajo | Alto |
| Baja | API Pública (#10.2) | Bajo | Alto |
