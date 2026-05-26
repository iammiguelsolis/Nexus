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
| **Descripción** | El Mentor ingresa al Aula de un Padawan y agenda una nueva sesión en la pestaña "Trabajo en clase". |
| **Actores** | 🧙‍♂️ Mentor Jedi |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/components/classroom/WorkTab.tsx` | Modal de creación (solo para mentores) |
| Backend | `backend/src/controllers/session.controller.ts` | `createSession()` |
| Backend | `backend/src/routes/session.routes.ts` | `POST /api/v1/matchings/:matchingId/sessions` |
| Backend | `backend/src/schemas/session.schema.ts` | Validación con Zod |

**Flujo:**
1. **Solo mentores**: entra a "Mis Aulas", selecciona un Padawan, va a la pestaña "Trabajo en clase".
2. Hace clic en "+ Nueva sesión".
3. Llena título, fecha, duración y notas opcionales.
4. Frontend envía `POST /api/v1/matchings/:matchingId/sessions`.
5. Backend verifica que el mentor sea propietario del matching (activo).
6. Crea sesión con estado `Programada` asignada al Padawan.
7. **Padawans**: ven sesiones programadas pero NO pueden crear nuevas.

---

### ✅ UC-13 — Realizar sesión de mentoría

| Campo | Detalle |
|-------|--------|
| **Descripción** | Ejecutar la sesión y marcarla como Realizada, agregando notas y feedback en la pestaña "Trabajo en clase". |
| **Actores** | 🧙‍♂️ Mentor Jedi |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/components/classroom/WorkTab.tsx` | Botón "Completar" + modal con notas |
| Backend | `backend/src/controllers/session.controller.ts` | `updateSession()` con `estado: Realizada` |
| Backend | `backend/src/routes/session.routes.ts` | `PUT /api/v1/sessions/:sesionId` |

**Flujo:**
1. Mentor Jedi ve sesiones programadas en "Trabajo en clase".
2. Hace clic en "✓ Completar" → se abre modal.
3. Agrega notas y feedback de la sesión.
4. Backend actualiza estado a `Realizada` y guarda notas.

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
| Frontend | `frontend/src/components/classroom/WorkTab.tsx` | Botón "✕ Cancelar" en sesiones programadas |
| Backend | `backend/src/controllers/session.controller.ts` | `deleteSession()` — soft delete |
| Backend | `backend/src/routes/session.routes.ts` | `DELETE /api/v1/sessions/:sesionId` |

**Flujo:**
1. Usuario ve una sesión con estado `Programada` en "Trabajo en clase".
2. Hace clic en "✕ Cancelar".
3. Backend cambia estado a `Cancelada` (soft delete, no borra datos).

---

### ✅ UC-15 — Ver historial de sesiones

| Campo | Detalle |
|-------|--------|
| **Descripción** | Consultar sesiones pasadas en el Aula Virtual con sus notas y tareas asociadas. |
| **Actores** | 🧑‍🎓 Padawan · 🧙‍♂️ Mentor Jedi |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/components/classroom/WorkTab.tsx` | Visualización en bloques (Programadas/Realizadas) |
| Frontend | `frontend/src/services/api.ts` | `api.get(/matchings/:id/sessions)` |
| Backend | `backend/src/controllers/session.controller.ts` | `getSessionsByMatching()` |

**Flujo:**
1. Usuario accede a un "Aula" y a la pestaña "Trabajo en clase".
2. Ve las sesiones agrupadas por Programadas y Realizadas.
3. Cada tarjeta muestra: título, fecha, notas, conteo de tareas (OKRs).
4. Puede navegar a las tareas de cada sesión con "Ver tareas →".

## 🎯 OKRs

### ✅ UC-16 — Crear OKR en una sesión

| Campo | Detalle |
|-------|--------|
| **Descripción** | El Mentor define una tarea (antiguo OKR) con valor de puntuación máxima y fecha límite. |
| **Actores** | 🧙‍♂️ Mentor Jedi |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/OKRPage.tsx` | Modal de creación con descripción, puntaje máx y fecha |
| Backend | `backend/src/controllers/okr.controller.ts` | `createOKR()` |

**Flujo:**
1. Mentor Jedi hace clic en "+ Nueva tarea" dentro de una sesión.
2. Llena descripción, puntaje máximo y fecha límite.
3. Backend crea la tarea con estado `Pendiente`.

---

### ✅ UC-17 — Entregar tarea (Estudiante)

| Campo | Detalle |
|-------|--------|
| **Descripción** | El Padawan registra su entrega (texto o enlace) y cambia el estado a Entregado (EnProgreso). |
| **Actores** | 🧑‍🎓 Padawan |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/OKRPage.tsx` | Botón "Entregar tarea" + modal de envío |
| Backend | `backend/src/controllers/okr.controller.ts` | `updateOKR()` |

**Flujo:**
1. Padawan ve tareas pendientes.
2. Hace clic en "📤 Entregar tarea" → modal.
3. Ingresa su texto o enlace y envía.
4. Estado cambia automáticamente a `EnProgreso`.

---

### ✅ UC-18 — Calificar tarea (Mentor)

| Campo | Detalle |
|-------|--------|
| **Descripción** | El Mentor evalúa una tarea entregada, asigna una calificación y feedback. |
| **Actores** | 🧙‍♂️ Mentor Jedi |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/OKRPage.tsx` | Botón "✏️ Calificar" + modal con nota |
| Backend | `backend/src/controllers/okr.controller.ts` | `completeOKR()` |

**Flujo:**
1. Mentor ve tarea "Entregada" (`EnProgreso`).
2. Hace clic en "✏️ Calificar" → modal.
3. Ingresa el puntaje (0 hasta el máximo) y el feedback.
4. Backend ejecuta actualización:
   - Cambia estado a `Completado`.
   - Suma +12 al `score_empleabilidad` del padawan (máximo 100).
5. Se muestra la calificación final con una barra de progreso.

## 📈 Placement

### ✅ UC-20 — Ver score de empleabilidad

| Campo | Detalle |
|-------|--------|
| **Descripción** | El Padawan consulta su score actualizado tras completar OKRs y sesiones. |
| **Actores** | 🧑‍🎓 Padawan · 🤖 Sistema / IA |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/DashboardPage.tsx` | Tarjeta de score con valor destacado |
| Frontend | `frontend/src/pages/ProfilePage.tsx` | Score visible en perfil |
| Backend | `backend/src/controllers/dashboard.controller.ts` | `getDashboard()` — retorna `score_empleabilidad` |
| Backend | `backend/src/controllers/okr.controller.ts` | `completeOKR()` — suma +12 al score (transacción ACID) |

**Flujo:**
1. Padawan accede al Dashboard o a su Perfil
2. Ve su score de empleabilidad actualizado (0–100)
3. El score sube automáticamente al completar OKRs (+12 por OKR, máximo 100)
4. Se calcula en transacción ACID dentro de `completeOKR()`

---

## 💼 Vacantes

### ✅ UC-21 — Publicar vacante laboral

| Campo | Detalle |
|-------|--------|
| **Descripción** | La Empresa crea una oferta con descripción, skills requeridas, salario y modalidad. |
| **Actores** | 🏢 Empresa |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Backend | `backend/src/controllers/vacancy.controller.ts` | `createVacancy()` |
| Backend | `backend/src/routes/vacancy.routes.ts` | `POST /api/v1/vacancies` (rol Admin) |
| Backend | `backend/src/schemas/vacancy.schema.ts` | Validación con Zod |
| DB | `backend/src/db/migrations/001_init.sql` | Tablas `vacante` + `empresa` |

**Flujo:**
1. Admin/Empresa envía `POST /api/v1/vacancies` con datos de la oferta
2. Backend valida título, descripción, salario mín/máx y modalidad
3. Crea la vacante vinculada a una empresa
4. La vacante aparece automáticamente en la lista pública

---

### ✅ UC-22 — Buscar y filtrar vacantes

| Campo | Detalle |
|-------|--------|
| **Descripción** | El Padawan explora vacantes filtradas por sector, modalidad y habilidades. El Mentor Jedi puede visualizar las vacantes para recomendarlas, pero en modo de solo lectura. |
| **Actores** | 🧑‍🎓 Padawan · 🧙‍♂️ Mentor Jedi |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |
| **Restricción** | Visible para Padawans y Mentores. |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/VacanciesPage.tsx` | Búsqueda por texto + filtro de modalidad |
| Frontend | `frontend/src/services/api.ts` | `vacancyService.list()` con parámetro modalidad |
| Backend | `backend/src/controllers/vacancy.controller.ts` | `listVacancies()` con filtro |
| Backend | `backend/src/routes/vacancy.routes.ts` | `GET /api/v1/vacancies?modalidad=` |

**Flujo:**
1. Usuario accede a la sección "Vacantes".
2. **Padawans**: ven botón "Postularme" y la pestaña "Mis Postulaciones".
3. **Mentores**: ven la lista como "Mercado Laboral" en modo lectura, sin opción de postularse.
4. Pueden buscar por texto (título, empresa, sector) en tiempo real y filtrar por modalidad.

---

### ✅ UC-23 — Postularse a una vacante

| Campo | Detalle |
|-------|--------|
| **Descripción** | El Padawan aplica a una oferta, enviando su perfil dinámico a la empresa. |
| **Actores** | 🧑‍🎓 Padawan |
| **Restricción** | Solo Padawans pueden postularse. |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/pages/VacanciesPage.tsx` | Botón "Postularme" + modal con mensaje (solo Padawans) |
| Frontend | `frontend/src/services/api.ts` | `vacancyService.apply()` |
| Backend | `backend/src/controllers/vacancy.controller.ts` | `applyToVacancy()` |
| Backend | `backend/src/routes/vacancy.routes.ts` | `POST /api/v1/vacancies/:vacancyId/apply` |

**Flujo:**
1. **Solo Padawans**: navegan las vacantes y hacen clic en "Postularme"
2. Escriben un mensaje opcional de presentación
3. Frontend envía `POST /api/v1/vacancies/:vacancyId/apply`
4. Backend verifica autenticación (Padawan) y no haya postulación previa
5. Crea registro en `postulacion` →ies/:vacancyId/apply`
4. Backend verifica que no haya postulación previa (evita duplicados)
5. Crea registro en `postulacion` → la tarjeta cambia a "✓ Postulado"

---

### ✅ UC-24 — Gestionar vacantes publicadas

| Campo | Detalle |
|-------|--------|
| **Descripción** | La Empresa puede editar, activar o desactivar sus ofertas laborales. |
| **Actores** | 🏢 Empresa |
| **Estado** | ✅ Implementado |
| **Restricción** | Solo Admins/Empresas (no visible en UI normal). |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Backend | `backend/src/controllers/vacancy.controller.ts` | `updateVacancy()` |
| Backend | `backend/src/routes/vacancy.routes.ts` | `PUT /api/v1/vacancies/:vacancyId` (rol Admin) |
| Backend | `backend/src/schemas/vacancy.schema.ts` | `updateVacancySchema` — incluye campo `activa` |

**Flujo:**
1. **Solo Admins**: envían `PUT /api/v1/vacancies/:vacancyId`
2. Pueden actualizar título, descripción, salario, modalidad
3. Pueden activar o desactivar con el campo `activa: true/false`
4. Vacantes desactivadas dejan de aparecer en la lista pública
5. No hay UI para estudiantes (acceso backend-only para admins)`
4. Vacantes desactivadas dejan de aparecer en la lista pública

---

## 🤖 Inteligencia Artificial

### ✅ UC-25 — Detectar riesgo de abandono (IA)

| Campo | Detalle |
|-------|--------|
| **Descripción** | El motor de IA monitorea la actividad y alerta cuando un Padawan muestra señales de abandono. |
| **Actores** | 🤖 Sistema / IA |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Backend | `backend/src/controllers/ia.controller.ts` | `detectarRiesgoAbandono()`, `listarRiesgosAbandono()` |
| Backend | `backend/src/routes/ia.routes.ts` | `GET /api/v1/ia/riesgo-abandono` |
| Frontend | `frontend/src/services/api.ts` | `iaService.getRiesgoAbandono()` |

**Algoritmo de scoring (0–100):**
- **+25–30 pts**: Sin sesiones en >14 días o sin sesiones nunca
- **+10–25 pts**: OKRs estancados (sin progreso en >7 días)
- **+10–20 pts**: Ratio de cancelación de sesiones >25%
- **+20 pts**: Score de empleabilidad <20 después de 14 días

**Niveles:** bajo (<20), medio (20–44), alto (45–69), crítico (≥70)

**Flujo:**
1. Backend analiza: días sin sesión, OKRs sin avance, ratio de cancelación, score
2. Calcula un score de riesgo con 4 factores ponderados
3. Retorna nivel, alertas descriptivas y factores detallados
4. Endpoint admin/Jedi permite ver todos los padawans en riesgo

---

## 🔔 Notificaciones

### ✅ UC-26 — Recibir notificaciones

| Campo | Detalle |
|-------|--------|
| **Descripción** | Alertas de nuevas sesiones, OKRs completados, matchings y mensajes del mentor. |
| **Actores** | 🧑‍🎓 Padawan · 🧙‍♂️ Mentor Jedi · 🏢 Empresa |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Frontend | `frontend/src/components/layout/Layout.tsx` | Campana 🔔 con badge y dropdown |
| Frontend | `frontend/src/services/api.ts` | `notificationService` (list, unread, markRead) |
| Backend | `backend/src/controllers/notification.controller.ts` | CRUD de notificaciones |
| Backend | `backend/src/routes/notification.routes.ts` | Rutas GET/PATCH |
| DB | `backend/src/db/migrations/003_notifications.sql` | Tabla `notificacion` |

**Endpoints:**
- `GET /api/v1/notifications` — listar últimas 50
- `GET /api/v1/notifications/unread-count` — conteo de no leídas
- `PATCH /api/v1/notifications/:id/read` — marcar como leída
- `PATCH /api/v1/notifications/read-all` — marcar todas como leídas

**Flujo:**
1. Layout muestra campana 🔔 con badge de no leídas
2. Polling cada 30 segundos para actualizar conteo
3. Clic en campana → dropdown con lista de notificaciones
4. Clic en notificación → se marca como leída
5. Botón "Marcar todas leídas" para limpiar

---

## 🏫 Aula Virtual & Chat

### ✅ UC-27 — Colaborar en el feed del Aula Virtual

| Campo | Detalle |
|-------|--------|
| **Descripción** | Padawans y Mentores pueden publicar anuncios, enlaces o material en el muro ("Novedades") del Aula. |
| **Actores** | 🧑‍🎓 Padawan · 🧙‍♂️ Mentor Jedi |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**
- `frontend/src/pages/ClassroomPage.tsx`
- `frontend/src/components/classroom/FeedTab.tsx`
- `backend/src/controllers/classroom.controller.ts`
- `backend/src/db/migrations/004_classroom.sql`

**Flujo:**
1. Usuario entra a su Aula y ve la pestaña "Novedades".
2. Puede crear una publicación (Anuncio, Material, Enlace).
3. Puede comentar en publicaciones existentes.
4. El Mentor puede fijar (Pin) o eliminar cualquier publicación; el Padawan solo puede eliminar las propias.

---

### ✅ UC-28 — Chatear directamente (1:1)

| Campo | Detalle |
|-------|--------|
| **Descripción** | Un widget flotante permite enviar y recibir mensajes en tiempo real dentro del Aula Virtual. |
| **Actores** | 🧑‍🎓 Padawan · 🧙‍♂️ Mentor Jedi |
| **Estado** | ✅ Implementado |
| **Fecha** | 2026-05-17 |

**Archivos clave:**
- `frontend/src/components/classroom/ChatWidget.tsx`
- `backend/src/controllers/chat.controller.ts`
- `backend/src/routes/chat.routes.ts`

**Flujo:**
1. Dentro del Aula, se muestra un botón flotante 💬 en la esquina inferior derecha.
2. Al abrirlo, muestra el historial de mensajes de ese matching.
3. El usuario envía un mensaje y se actualiza la interfaz (hace polling automático).
4. El widget muestra una burbuja roja con los mensajes no leídos.

---

## 📊 Resumen de Progreso

| Métrica | Valor |
|---------|-------|
| **Total Casos de Uso** | 28 |
| **Implementados** | 28 (UC-01 a UC-28) |
| **En progreso** | 0 |
| **Pendientes** | 0 |
| **Avance** | **100%** ✅ |

---

> Última actualización: 2026-05-17
