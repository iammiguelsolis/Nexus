# 🚀 NEXUS — Transformación del Talento

**Plataforma SaaS de mentoría 1-a-1** que conecta jóvenes universitarios de tecnología (Padawans) con profesionales en activo (Mentores Jedis).

> Proyecto académico — Pruebas de Software (SQA) · UNMSM · Grupo 10 · Mayo 2026
> ODS 4 (Educación de calidad), ODS 8 (Trabajo decente), ODS 17 (Alianzas)

---

## 📋 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS v3 |
| **Backend** | Node.js + Express.js + TypeScript |
| **Base de Datos** | PostgreSQL 15 |
| **Auth** | JWT stateless (jsonwebtoken + bcrypt) |
| **Validación** | Zod |
| **Componentes UI** | react-day-picker + date-fns |
| **Testing** | Jest + Supertest (backend) · Vitest (frontend) |
| **DevOps** | Docker + Docker Compose · GitHub Actions |
| **Cloud** | Azure App Service + Azure Static Web Apps |

---

## 🏗️ Setup Local con Docker (5 pasos)

### Prerrequisitos
- Docker Desktop instalado
- Git

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/nexus.git
cd nexus

# 2. Levantar todo con Docker Compose
docker-compose up --build

# 3. ¡Listo! La app está corriendo:
#    Frontend → http://localhost:5173
#    Backend  → http://localhost:3001
#    Postgres → localhost:5432

# 4. Registrar un usuario de prueba (Padawan)
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombres":"Carlos",
    "apellidos":"García",
    "email":"carlos@test.com",
    "contrasena":"Test1234!",
    "rol":"Padawan"
  }'

# 5. Registrar usuario Jedi (Mentor)
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombres":"José",
    "apellidos":"López",
    "email":"jose@test.com",
    "contrasena":"Test1234!",
    "rol":"Jedi"
  }'

# 6. Abrir el frontend y hacer login
open http://localhost:5173
```

---

## 🧪 Ejecutar Tests

```bash
# Backend (requiere PostgreSQL corriendo)
cd backend
npm install
npm test

# Frontend
cd frontend
npm install
npm test
```

---

## 📁 Estructura del Proyecto

```
nexus/
├── frontend/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Componentes base (Modal, Dropdown, DatePicker, Badge, etc)
│   │   │   ├── layout/          # Layout principal
│   │   │   ├── ProfileSkills/   # Gestión de habilidades del Padawan
│   │   │   ├── AddSkillModal/   # Modal para agregar habilidades
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── LoginPage
│   │   │   ├── RegisterPage
│   │   │   ├── DashboardPage    # Panel principal con ProfileSkills integrado
│   │   │   ├── SessionsPage
│   │   │   ├── OKRPage
│   │   │   ├── VacanciesPage
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── useAuth          # Contexto de autenticación
│   │   │   ├── useProfileSkills # Gestión de habilidades (CRUD)
│   │   │   └── ...
│   │   ├── services/            # Axios API client con interceptores
│   │   ├── types/               # TypeScript interfaces
│   │   └── utils/               # Helpers & formatters
│   └── package.json
│
├── backend/           # Express + TypeScript
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts       # Register, Login, Me
│   │   │   ├── profile.controller.ts    # Transaction 1: Skill management
│   │   │   ├── session.controller.ts    # Session CRUD
│   │   │   ├── okr.controller.ts        # Transaction 2: Complete OKR
│   │   │   └── vacancy.controller.ts    # Vacancy listing
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── profile.routes.ts        # NEW: POST/GET/DELETE skills
│   │   │   ├── session.routes.ts
│   │   │   ├── okr.routes.ts
│   │   │   └── vacancy.routes.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── schemas/
│   │   │   ├── auth.schema.ts
│   │   │   ├── profile.schema.ts        # NEW: Zod schemas para skills
│   │   │   ├── session.schema.ts
│   │   │   ├── okr.schema.ts
│   │   │   └── vacancy.schema.ts
│   │   ├── db/
│   │   │   ├── pool.ts          # PostgreSQL connection pool
│   │   │   └── migrations/
│   │   │       └── 001_init.sql # Schema inicial
│   │   ├── types/               # TypeScript interfaces compartidas
│   │   ├── app.ts               # Express app setup
│   │   └── server.ts            # Entry point
│   ├── tests/
│   │   ├── auth.test.ts
│   │   ├── okr.test.ts          # Transaction 2 tests
│   │   └── ...
│   └── package.json
│
├── docker-compose.yml
├── .github/workflows/
│   └── ci.yml                   # CI/CD pipeline
└── README.md
```

---

## 🔑 API Endpoints

### 🔐 Autenticación (sin requerimientos)
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Registrar usuario (Padawan o Jedi) |
| `/api/v1/auth/login` | POST | Login → JWT Token (24h) |
| `/api/v1/auth/me` | GET | Obtener datos del usuario logueado |

### 🎯 Habilidades — Transaction 1 ⭐ (NEW)
| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/v1/profiles/habilidades` | GET | ❌ | Listar todas las habilidades disponibles |
| `/api/v1/profiles/:profileId/skills` | GET | ✅ | Obtener habilidades del Padawan |
| `/api/v1/profiles/:profileId/skills` | POST | ✅ | **[TRANSACTION]** Agregar habilidad al perfil |
| `/api/v1/profiles/:profileId/skills/:skillId` | DELETE | ✅ | Eliminar habilidad del perfil |

**Parámetros POST `/api/v1/profiles/:profileId/skills`:**
```json
{
  "habilidad_id": "uuid-string",
  "nivel": "Basico|Intermedio|Avanzado",
  "fecha_adquisicion": "2026-05-22" // Opcional
}
```

**Transacción ACID Completa:**
1. ✅ Validación de entrada (Zod schema)
2. ✅ Autenticación JWT
3. ✅ Verificar rol = Padawan (solo Padawans agregan skills)
4. ✅ Verificar propiedad del perfil (no pueden editar perfiles ajenos)
5. ✅ Prevenir duplicados (409 Conflict si ya existe)
6. ✅ INSERT en `perfil_habilidad` table
7. ✅ Recalcular `score_empleabilidad` (Basico×5 + Intermedio×10 + Avanzado×15, cap 100)
8. ✅ ROLLBACK automático en caso de error
9. ✅ Respuesta 201 con datos insertados + score actualizado

### 📅 Sesiones de Mentoría
| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/v1/sessions/my-sessions` | GET | ✅ | Mis sesiones (Padawan o Jedi) |
| `/api/v1/matchings/:id/sessions` | POST | ✅ | Crear sesión (sin implementar) |
| `/api/v1/sessions/:id` | GET/PATCH | ✅ | Obtener/Actualizar sesión (sin implementar) |

### 🎓 OKRs — Transaction 2
| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/v1/sessions/:sessionId/okrs` | POST | ✅ | Crear OKR (sin implementar) |
| `/api/v1/sessions/:sessionId/okrs` | GET | ✅ | Listar OKRs de sesión |
| `/api/v1/okrs/:id` | GET/PATCH | ✅ | Obtener/Actualizar OKR (sin implementar) |
| `/api/v1/okrs/:id/complete` | PATCH | ✅ | **[TRANSACTION]** Completar OKR (+12 pts) |

### 💼 Vacantes / Oportunidades Laborales
| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/v1/vacancies` | GET | ❌ | Listar vacantes disponibles (sin implementar) |
| `/api/v1/vacancies/:vacancyId` | GET | ❌ | Detalle de vacante (sin implementar) |
| `/api/v1/vacancies/:vacancyId/apply` | POST | ✅ | **[TRANSACTION]** Postular a vacante (sin implementar) |

---

## ⚡ Transacciones ACID Implementadas

### Transaction 1: Registrar Habilidad en el Perfil (✅ IMPLEMENTADO)
**Endpoint:** `POST /api/v1/profiles/:profileId/skills`

**Flujo:**
```
INPUT VALIDATION (Zod)
    ↓
AUTH MIDDLEWARE (JWT)
    ↓
ROLE CHECK (Padawan only)
    ↓
PERMISSION CHECK (profile ownership)
    ↓
DUPLICATE CHECK (409 if exists)
    ↓
BEGIN TRANSACTION
    ├── INSERT perfil_habilidad
    ├── UPDATE perfil_aprendiz.score_empleabilidad
    └── COMMIT / ROLLBACK
    ↓
RESPONSE 201 with {score_actualizado, ...data}
```

**Error Codes:**
- `400` VALIDATION_ERROR - Input inválido
- `401` UNAUTHORIZED - Sin JWT o token inválido
- `403` FORBIDDEN_ROLE - No es Padawan
- `403` FORBIDDEN_PROFILE - No es su propio perfil
- `404` USER_NOT_FOUND - Usuario no existe
- `404` PROFILE_NOT_FOUND - Perfil no existe
- `404` SKILL_NOT_FOUND - Habilidad no existe
- `409` SKILL_ALREADY_EXISTS - Habilidad ya registrada
- `500` INTERNAL_ERROR - Error del servidor

### Transaction 2: Completar OKR (✅ IMPLEMENTADO)
**Endpoint:** `PATCH /api/v1/okrs/:id/complete`

**Flujo:**
```
INPUT VALIDATION
    ↓
AUTH MIDDLEWARE
    ↓
OWNERSHIP CHECK (user owns OKR via session)
    ↓
STATE CHECK (must be EnProgreso)
    ↓
PROGRESS CHECK (valor_actual >= valor_meta)
    ↓
BEGIN TRANSACTION
    ├── UPDATE okr SET estado = Completado
    ├── INSERT okr_historial
    ├── UPDATE perfil_aprendiz.score_empleabilidad += 12 (cap 100)
    └── COMMIT / ROLLBACK
    ↓
ASYNC NOTIFICATION to Mentor
    ↓
RESPONSE 200 with {okr_actualizado, score_nuevo}
```

---

## 🎨 Componentes Frontend Implementados

### UI Base Components
- **Modal** - Ventana flotante con backdrop blur
- **Dropdown** - Select personalizado (Portal + fixed positioning)
- **DatePicker** - Calendario con react-day-picker (Portal + fixed positioning)
- **Badge** - Etiqueta pequeña para categorías/estados
- **ProgressBar** - Barra de progreso con gradientes
- **LoadingSpinner** - Spinner de carga animado
- **EmptyState** - Estado vacío con icono e CTA

### Feature Components
- **ProfileSkills** - Display de habilidades registradas con grid glassmorphism
- **AddSkillModal** - Modal con form para agregar habilidades
  - Dropdown personalizado para seleccionar habilidad
  - Nivel selector (Basico/Intermedio/Avanzado) con radio buttons visuales
  - DatePicker personalizado
  - Preview de habilidad seleccionada
  - Validación de duplicados
  - Mensajes de éxito/error

### Funcionalidades
- ✅ Mostrar habilidades del Padawan
- ✅ Score de empleabilidad con barra de progreso
- ✅ Agregar habilidad (validación, transacción, actualización score)
- ✅ Eliminar habilidad (transacción)
- ✅ Prevención de duplicados
- ✅ Estado loading durante peticiones
- ✅ Manejo de errores (mensajes específicos)

---

## 📊 Endpoints Faltantes (Roadmap)

### Sesiones de Mentoría (PRIORITY: HIGH)
- [ ] `POST /api/v1/sessions` - Crear nueva sesión
- [ ] `PATCH /api/v1/sessions/:id` - Actualizar sesión (cambiar estado)
- [ ] `DELETE /api/v1/sessions/:id` - Cancelar sesión
- [ ] `GET /api/v1/sessions/:id/history` - Historial de cambios

### OKRs (PRIORITY: HIGH)
- [ ] `POST /api/v1/okrs` - Crear OKR
- [ ] `PATCH /api/v1/okrs/:id` - Actualizar OKR (incrementar valor_actual)
- [ ] `DELETE /api/v1/okrs/:id` - Cancelar OKR
- [ ] `GET /api/v1/okrs/history` - Historial de OKRs completados

### Vacantes (PRIORITY: MEDIUM)
- [ ] `POST /api/v1/vacancies` - Crear vacante (solo admin/company)
- [ ] `GET /api/v1/vacancies` - Listar vacantes con filtros
- [ ] `GET /api/v1/vacancies/:id` - Detalle de vacante
- [ ] `POST /api/v1/vacancies/:id/apply` - **[TRANSACTION 3]** Postular a vacante
- [ ] `PATCH /api/v1/vacancies/:id` - Actualizar vacante (estado)
- [ ] `DELETE /api/v1/vacancies/:id` - Eliminar vacante

### Perfiles & Usuarios (PRIORITY: LOW)
- [ ] `GET /api/v1/profiles` - Listar perfiles públicos
- [ ] `GET /api/v1/profiles/:id` - Ver perfil de otro usuario
- [ ] `PATCH /api/v1/profiles/:id` - Actualizar perfil (foto, bio, etc)
- [ ] `GET /api/v1/users/:id/stats` - Estadísticas del usuario

### Notificaciones (PRIORITY: LOW)
- [ ] `GET /api/v1/notifications` - Listar notificaciones
- [ ] `PATCH /api/v1/notifications/:id/read` - Marcar como leída
- [ ] WebSocket para notificaciones en tiempo real

### Admin/Analytics (PRIORITY: LOW)
- [ ] `GET /api/v1/admin/stats` - Dashboard de estadísticas
- [ ] `GET /api/v1/admin/users` - Listar usuarios (admin)
- [ ] `PATCH /api/v1/admin/users/:id` - Editar usuario (admin)

---

## 🧪 Testing

### Backend Tests (Jest + Supertest)
```bash
cd backend
npm test
```

Tests cubiertos:
- ✅ Auth (register, login, me)
- ✅ Profile Skills (add, get, delete, duplicates, permissions)
- ✅ OKRs (complete - transacción ACID)
- ✅ Error handling (4xx, 5xx)

### Frontend Tests (Vitest)
```bash
cd frontend
npm test
```

Tests cubiertos:
- ✅ LoginPage component
- ✅ API interceptors
- ✅ useAuth hook

---

## 👥 Equipo — Grupo 10

Proyecto académico para el curso de Pruebas de Software (SQA)
Universidad Nacional Mayor de San Marcos (UNMSM)
Mayo 2026

---

## 📄 Licencia

Proyecto académico — uso educativo únicamente.
