# 📌 Casos de Uso Implementados — NEXUS

> Registro vivo de los casos de uso implementados en el software. Cada entrada documenta qué se implementó, dónde vive en el código, y cómo verificarlo.

---

## Estado General

| Estado | Símbolo |
|--------|---------|
| Implementado | ✅ |
| En progreso | 🔧 |
| Pendiente | ⏳ |

---

## 🔐 Autenticación

### ✅ UC-01 — Registrarse en la plataforma

| Campo | Detalle |
|-------|---------|
| **Descripción** | El usuario crea una cuenta con email, contraseña y rol (Padawan o Jedi). |
| **Actores** | 🧑‍🎓 Padawan · 🧙‍♂️ Mentor Jedi |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|-----------------|
| Frontend | `frontend/src/pages/RegisterPage.tsx` | Formulario de registro con validación Zod |
| Frontend | `frontend/src/hooks/useAuth.tsx` | Función `register()` — guarda token en localStorage |
| Backend | `backend/src/controllers/auth.controller.ts` | `register()` — hash bcrypt, insert en BD, genera JWT |
| Backend | `backend/src/routes/auth.routes.ts` | `POST /api/v1/auth/register` |
| Backend | `backend/src/schemas/auth.schema.ts` | Validación de campos con Zod |

**Flujo:**
1. Usuario llena formulario (nombres, apellidos, email, contraseña, rol)
2. Frontend valida con Zod → envía `POST /api/v1/auth/register`
3. Backend verifica email no duplicado → hash contraseña → INSERT en `usuario`
4. Si Padawan → crea `perfil_aprendiz`; si Jedi → crea `mentor`
5. Genera JWT (24h) → responde con `{ token, user }`
6. Frontend guarda token y redirige a `/dashboard`

---

### ✅ UC-02 — Iniciar sesión

| Campo | Detalle |
|-------|---------|
| **Descripción** | Autenticación con email/contraseña. |
| **Actores** | 🧑‍🎓 Padawan · 🧙‍♂️ Mentor Jedi · 🏢 Empresa |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|-----------------|
| Frontend | `frontend/src/pages/LoginPage.tsx` | Formulario de login con validación |
| Frontend | `frontend/src/hooks/useAuth.tsx` | Función `login()` — persiste sesión |
| Frontend | `frontend/src/services/api.ts` | Interceptor que adjunta JWT a cada request |
| Backend | `backend/src/controllers/auth.controller.ts` | `login()` — compara hash, genera JWT |
| Backend | `backend/src/routes/auth.routes.ts` | `POST /api/v1/auth/login` |
| Backend | `backend/src/middleware/auth.middleware.ts` | Verificación de JWT en rutas protegidas |

**Flujo:**
1. Usuario ingresa email y contraseña
2. Frontend valida → envía `POST /api/v1/auth/login`
3. Backend busca usuario → verifica `activo = true` → compara bcrypt
4. Genera JWT → responde con `{ token, user }`
5. Frontend guarda en localStorage → redirige a `/dashboard`
6. Interceptor de Axios adjunta `Bearer {token}` a requests futuros

**Nota:** La recuperación de contraseña está pendiente como sub-feature.

---

### ✅ UC-03 — Cerrar sesión

| Campo | Detalle |
|-------|---------|
| **Descripción** | Terminar la sesión activa de forma segura. |
| **Actores** | 🧑‍🎓 Padawan · 🧙‍♂️ Mentor Jedi · 🏢 Empresa |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|-----------------|
| Frontend | `frontend/src/components/layout/Layout.tsx` | Botón "Cerrar sesión" en sidebar |
| Frontend | `frontend/src/hooks/useAuth.tsx` | Función `logout()` — limpia localStorage |
| Frontend | `frontend/src/App.tsx` | `ProtectedRoute` redirige a `/login` si no autenticado |

**Flujo:**
1. Usuario hace clic en "Cerrar sesión" (sidebar desktop o mobile)
2. Se ejecuta `logout()` → elimina `nexus_token` y `nexus_user` de localStorage
3. Estado de React se limpia (`user = null`, `token = null`)
4. Navegación automática a `/login`
5. Cualquier intento de acceder a rutas protegidas redirige a login

---

## 👤 Perfil

### ✅ UC-04 — Completar perfil y habilidades

| Campo | Detalle |
|-------|--------|
| **Descripción** | El Padawan registra sus habilidades, nivel de dominio, estudios y objetivos de carrera. |
| **Actores** | 🧑‍🎓 Padawan |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/ProfilePage.tsx` | Formulario de perfil con gestión de habilidades |
| Backend | `backend/src/controllers/profile.controller.ts` | `listSkills()`, `addSkill()`, `removeSkill()` |
| Backend | `backend/src/routes/profile.routes.ts` | `GET/POST/DELETE /api/v1/profile/skills` |
| Backend | `backend/src/schemas/profile.schema.ts` | Validación con Zod |

**Flujo:**
1. Padawan navega a "Mi Perfil" en la barra lateral
2. Ve sus habilidades actuales con nivel de dominio (Básico, Intermedio, Avanzado)
3. Hace clic en "+ Agregar" → modal con catálogo de habilidades
4. Selecciona habilidad y nivel → `POST /api/v1/profile/skills`
5. Puede eliminar habilidades con el botón ✕

---

### ✅ UC-05 — Actualizar perfil profesional

| Campo | Detalle |
|-------|--------|
| **Descripción** | Editar datos personales, bio, preferencias y portafolio. |
| **Actores** | 🧑‍🎓 Padawan · 🧙‍♂️ Mentor Jedi |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/ProfilePage.tsx` | Formulario adaptado según rol |
| Backend | `backend/src/controllers/profile.controller.ts` | `getMyProfile()`, `updateMyProfile()` |
| Backend | `backend/src/routes/profile.routes.ts` | `GET/PUT /api/v1/profile/me` |

**Flujo:**
1. Usuario navega a "Mi Perfil"
2. Edita nombres, apellidos y campos según su rol:
   - **Padawan**: bio, URL de portafolio
   - **Jedi**: especialidades, años de experiencia, bio profesional
3. Hace clic en "Guardar cambios" → `PUT /api/v1/profile/me`
4. Backend actualiza tablas `usuario` + `perfil_aprendiz` o `mentor` en transacción

---

### ✅ UC-06 — Ver perfil de otro usuario

| Campo | Detalle |
|-------|--------|
| **Descripción** | Consultar el perfil público de un aprendiz o mentor. |
| **Actores** | 🧙‍♂️ Mentor Jedi · 🏢 Empresa |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/UserProfilePage.tsx` | Vista de perfil público |
| Backend | `backend/src/controllers/profile.controller.ts` | `getUserProfile()` |
| Backend | `backend/src/routes/profile.routes.ts` | `GET /api/v1/profile/user/:userId` |

**Flujo:**
1. Usuario accede a `/profile/:userId`
2. Frontend llama `GET /api/v1/profile/user/:userId`
3. Backend devuelve datos públicos (sin email) + habilidades si es Padawan
4. Se muestra tarjeta con avatar, rol, bio, score y habilidades

## 🚀 Onboarding

### ✅ UC-07 — Completar evaluación diagnóstica

| Campo | Detalle |
|-------|--------|
| **Descripción** | El Padawan responde un test inicial que alimenta al motor para generar su Learning Path. |
| **Actores** | 🧑‍🎓 Padawan · 🤖 Sistema / IA |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/OnboardingPage.tsx` | Test paso a paso con barra de progreso |
| Backend | `backend/src/controllers/onboarding.controller.ts` | `getDiagnostic()`, `submitDiagnostic()` |
| Backend | `backend/src/routes/onboarding.routes.ts` | `GET/POST /api/v1/onboarding/diagnostic` |
| DB | `backend/src/db/migrations/002_onboarding.sql` | Tabla `evaluacion_diagnostica` |

**Flujo:**
1. Padawan abre la sección "Onboarding" desde la barra lateral
2. Responde 8 preguntas de opción múltiple navegando con botones
3. Al enviar → `POST /api/v1/onboarding/diagnostic`
4. Backend calcula nivel (Principiante/Intermedio/Avanzado) y áreas fuertes/débiles
5. Resultado se guarda en `evaluacion_diagnostica`

---

### ✅ UC-08 — Generar ruta de aprendizaje (IA)

| Campo | Detalle |
|-------|--------|
| **Descripción** | El sistema analiza el perfil y crea un Learning Path personalizado con metas y sprints. |
| **Actores** | 🤖 Sistema / IA |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/OnboardingPage.tsx` | Vista de ruta con metas y sprints |
| Backend | `backend/src/controllers/onboarding.controller.ts` | `generateLearningPath()`, `getLearningPath()` |
| Backend | `backend/src/routes/onboarding.routes.ts` | `GET/POST /api/v1/onboarding/learning-path` |
| DB | `backend/src/db/migrations/002_onboarding.sql` | Tabla `learning_path` |

**Flujo:**
1. Tras completar evaluación, Padawan hace clic en "Generar mi Learning Path"
2. Backend lee evaluación → selecciona plantilla según nivel y objetivo
3. Genera 3 metas + 4 sprints con tareas concretas
4. Guarda en `learning_path` → muestra resultado con tarjetas

---

## 📊 Dashboard

### ✅ UC-09 — Ver dashboard de progreso

| Campo | Detalle |
|-------|--------|
| **Descripción** | El Padawan visualiza su score de empleabilidad, OKRs activos y próximas sesiones. |
| **Actores** | 🧑‍🎓 Padawan |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/DashboardPage.tsx` | Vista con stats, OKRs, sesiones, onboarding |
| Backend | `backend/src/controllers/dashboard.controller.ts` | `getDashboard()` — consulta múltiples tablas |
| Backend | `backend/src/routes/dashboard.routes.ts` | `GET /api/v1/dashboard` |

**Flujo:**
1. Padawan entra al dashboard
2. Backend consulta: score, OKRs activos, próximas sesiones, stats, estado de onboarding
3. Frontend muestra: 4 tarjetas de stats, lista de OKRs con barras de progreso, próximas sesiones, banners de onboarding

---

## 🔗 Matching

### ✅ UC-10 — Recibir matching con Mentor Jedi

| Campo | Detalle |
|-------|--------|
| **Descripción** | El algoritmo empareja al Padawan con el Mentor más afín por habilidades y objetivos. |
| **Actores** | 🧑‍🎓 Padawan · 🧙‍♂️ Mentor Jedi · 🤖 Sistema / IA |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/MatchingPage.tsx` | Vista de matchings + botón "Buscar mentor" |
| Backend | `backend/src/controllers/matching.controller.ts` | `getMyMatchings()`, `generateMatching()` |
| Backend | `backend/src/routes/matching.routes.ts` | `GET /api/v1/matchings/me`, `POST /api/v1/matchings/generate` |

**Flujo:**
1. Padawan sin mentor hace clic en "Buscar mentor"
2. Backend busca mentores disponibles → calcula score de afinidad
3. Crea matching con estado `Pendiente` → el mentor debe aceptar
4. Ambos usuarios ven el matching en su página de Matching

---

### ✅ UC-11 — Aceptar o rechazar un matching

| Campo | Detalle |
|-------|--------|
| **Descripción** | El Mentor puede revisar el perfil del Padawan propuesto y decidir si acepta la mentoría. |
| **Actores** | 🧙‍♂️ Mentor Jedi |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/MatchingPage.tsx` | Botones "Aceptar" / "Rechazar" para Jedi |
| Backend | `backend/src/controllers/matching.controller.ts` | `respondMatching()` |
| Backend | `backend/src/routes/matching.routes.ts` | `PATCH /api/v1/matchings/:matchingId/respond` |
| DB | `backend/src/db/migrations/002_onboarding.sql` | Estado `Pendiente` agregado a matching |

**Flujo:**
1. Mentor Jedi ve matchings pendientes en su página
2. Puede ver perfil, bio y score del Padawan
3. Hace clic en "Aceptar" → estado cambia a `Activo`
4. O hace clic en "Rechazar" → estado cambia a `Cancelado`

## 🎓 Mentoría

### ✅ UC-12 — Programar sesión de mentoría

| Campo | Detalle |
|-------|--------|
| **Descripción** | Agendar una nueva sesión con fecha, hora y duración. |
| **Actores** | 🧑‍🎓 Padawan · 🧙‍♂️ Mentor Jedi |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/SessionsPage.tsx` | Modal de creación con formulario |
| Backend | `backend/src/controllers/session.controller.ts` | `createSession()` |
| Backend | `backend/src/routes/session.routes.ts` | `POST /api/v1/matchings/:matchingId/sessions` |
| Backend | `backend/src/schemas/session.schema.ts` | Validación con Zod |

**Flujo:**
1. Usuario hace clic en "+ Nueva sesión"
2. Llena título, fecha, duración y notas opcionales
3. Frontend envía `POST /api/v1/matchings/:matchingId/sessions`
4. Backend verifica que el matching esté activo y el usuario pertenezca
5. Crea la sesión con estado `Programada`

---

### ✅ UC-13 — Realizar sesión de mentoría

| Campo | Detalle |
|-------|--------|
| **Descripción** | Ejecutar la sesión y marcarla como Realizada, agregando notas y feedback. |
| **Actores** | 🧙‍♂️ Mentor Jedi |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/SessionsPage.tsx` | Botón "Completar" + modal con notas |
| Backend | `backend/src/controllers/session.controller.ts` | `updateSession()` con `estado: Realizada` |
| Backend | `backend/src/routes/session.routes.ts` | `PUT /api/v1/sessions/:sesionId` |

**Flujo:**
1. Mentor Jedi ve sesiones programadas
2. Hace clic en "✓ Completar" → se abre modal
3. Agrega notas y feedback de la sesión
4. Backend actualiza estado a `Realizada` y guarda notas

---

### ✅ UC-14 — Cancelar sesión programada

| Campo | Detalle |
|-------|--------|
| **Descripción** | Cancelar una sesión antes de que ocurra. |
| **Actores** | 🧑‍🎓 Padawan · 🧙‍♂️ Mentor Jedi |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/SessionsPage.tsx` | Botón "✕ Cancelar" en sesiones programadas |
| Backend | `backend/src/controllers/session.controller.ts` | `deleteSession()` — soft delete |
| Backend | `backend/src/routes/session.routes.ts` | `DELETE /api/v1/sessions/:sesionId` |

**Flujo:**
1. Usuario ve una sesión con estado `Programada`
2. Hace clic en "✕ Cancelar"
3. Backend cambia estado a `Cancelada` (soft delete, no borra datos)

---

### ✅ UC-15 — Ver historial de sesiones

| Campo | Detalle |
|-------|--------|
| **Descripción** | Consultar sesiones pasadas con sus notas, OKRs y feedback asociados. |
| **Actores** | 🧑‍🎓 Padawan · 🧙‍♂️ Mentor Jedi |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/SessionsPage.tsx` | Tabs (Todas/Programadas/Realizadas/Canceladas) |
| Frontend | `frontend/src/services/api.ts` | `sessionService.getMySessions()` |
| Backend | `backend/src/controllers/session.controller.ts` | `getMySessions()` |
| Backend | `backend/src/routes/session.routes.ts` | `GET /api/v1/sessions/my-sessions` |

**Flujo:**
1. Usuario accede a la sección "Sesiones"
2. Ve todas las sesiones con filtros por estado (tabs)
3. Cada tarjeta muestra: título, fecha, mentor/padawan, notas, conteo de OKRs
4. Puede navegar a los OKRs de cada sesión con "Ver OKRs →"

## 🎯 OKRs

### ✅ UC-16 — Crear OKR en una sesión

| Campo | Detalle |
|-------|--------|
| **Descripción** | El Mentor define un objetivo medible para el Padawan con valor meta y fecha límite. |
| **Actores** | 🧙‍♂️ Mentor Jedi |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/OKRPage.tsx` | Modal de creación con descripción, indicador, meta y fecha |
| Backend | `backend/src/controllers/okr.controller.ts` | `createOKR()` |
| Backend | `backend/src/routes/okr.routes.ts` | `POST /api/v1/sessions/:sesionId/okrs` |
| Backend | `backend/src/schemas/okr.schema.ts` | Validación con Zod |

**Flujo:**
1. Mentor Jedi hace clic en "+ Crear OKR"
2. Llena descripción, indicador, valor meta y fecha límite
3. Frontend envía `POST /api/v1/sessions/:sesionId/okrs`
4. Backend crea el OKR con estado `Pendiente`

---

### ✅ UC-17 — Actualizar progreso de un OKR

| Campo | Detalle |
|-------|--------|
| **Descripción** | El Padawan registra el valor alcanzado y cambia el estado a EnProgreso. |
| **Actores** | 🧑‍🎓 Padawan |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/OKRPage.tsx` | Botón "Actualizar progreso" + modal |
| Backend | `backend/src/controllers/okr.controller.ts` | `updateOKR()` |
| Backend | `backend/src/routes/okr.routes.ts` | `PUT /api/v1/okrs/:okrId` |

**Flujo:**
1. Padawan ve OKRs pendientes o en progreso
2. Hace clic en "📊 Actualizar progreso" → modal
3. Ingresa nuevo valor actual
4. Si el valor > 0 y estado era Pendiente, cambia automáticamente a `EnProgreso`

---

### ✅ UC-18 — Completar un OKR

| Campo | Detalle |
|-------|--------|
| **Descripción** | El Padawan marca un OKR como Completado cuando supera la meta. El sistema actualiza el score. |
| **Actores** | 🧑‍🎓 Padawan · 🤖 Sistema / IA |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/OKRPage.tsx` | Botón "✓ Completar" + modal con nota de cierre |
| Backend | `backend/src/controllers/okr.controller.ts` | `completeOKR()` — transacción ACID |
| Backend | `backend/src/routes/okr.routes.ts` | `PATCH /api/v1/okrs/:okrId/complete` |

**Flujo:**
1. Padawan con OKR en `EnProgreso` hace clic en "✓ Completar"
2. Ingresa valor alcanzado (≥ meta) y nota de cierre
3. Backend ejecuta transacción ACID:
   - Verifica propiedad y estado
   - Valida que `valor_actual ≥ valor_meta`
   - Actualiza OKR a `Completado`
   - Registra en `okr_historial` (auditoría)
   - Suma +12 al `score_empleabilidad` (máximo 100)

---

### ✅ UC-19 — Dar feedback sobre un OKR

| Campo | Detalle |
|-------|--------|
| **Descripción** | El Mentor revisa el OKR completado y registra su conformidad o solicita revisión. |
| **Actores** | 🧙‍♂️ Mentor Jedi |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/OKRPage.tsx` | Botón "💬 Dar feedback" + modal con aprobar/revisar |
| Backend | `backend/src/controllers/okr.controller.ts` | `feedbackOKR()` |
| Backend | `backend/src/routes/okr.routes.ts` | `PATCH /api/v1/okrs/:okrId/feedback` |
| Backend | `backend/src/schemas/okr.schema.ts` | `feedbackOKRSchema` |

**Flujo:**
1. Mentor Jedi ve OKRs completados
2. Hace clic en "💬 Dar feedback" → modal
3. Escribe comentario y elige:
   - "✓ Aprobar" → agrega nota de aprobación
   - "🔄 Pedir revisión" → revierte estado a `EnProgreso`
4. Se registra en `okr_historial`

## 📈 Placement

| ID | Caso de Uso | Estado |
|----|-------------|--------|
| UC-20 | Ver score de empleabilidad | ⏳ Pendiente |

## 💼 Vacantes

| ID | Caso de Uso | Estado |
|----|-------------|--------|
| UC-21 | Publicar vacante laboral | ⏳ Pendiente |
| UC-22 | Buscar y filtrar vacantes | ⏳ Pendiente |
| UC-23 | Postularse a una vacante | ⏳ Pendiente |
| UC-24 | Gestionar vacantes publicadas | ⏳ Pendiente |

## 🤖 Inteligencia Artificial

| ID | Caso de Uso | Estado |
|----|-------------|--------|
| UC-25 | Detectar riesgo de abandono (IA) | ⏳ Pendiente |

## 🔔 Notificaciones

| ID | Caso de Uso | Estado |
|----|-------------|--------|
| UC-26 | Recibir notificaciones | ⏳ Pendiente |

---

## 📊 Resumen de Progreso

| Métrica | Valor |
|---------|-------|
| **Total Casos de Uso** | 26 |
| **Implementados** | 19 (UC-01 a UC-19) |
| **En progreso** | 0 |
| **Pendientes** | 7 |
| **Avance** | 73% |

---

> Última actualización: 2026-05-17
