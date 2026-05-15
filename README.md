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

# 4. Registrar un usuario de prueba
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombres":"Carlos","apellidos":"García","email":"carlos@test.com","contrasena":"Test1234!","rol":"Padawan"}'

# 5. Abrir el frontend y hacer login
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
│   │   ├── components/  # UI, Layout, Features
│   │   ├── pages/       # Login, Dashboard, Sessions, OKRs, Vacancies
│   │   ├── hooks/       # useAuth
│   │   ├── services/    # Axios API client
│   │   ├── types/       # TypeScript interfaces
│   │   └── utils/       # Helpers & formatters
│   └── package.json
│
├── backend/           # Express + TypeScript
│   ├── src/
│   │   ├── controllers/ # auth, session, okr, vacancy
│   │   ├── routes/      # Express routers
│   │   ├── middleware/  # auth, validate, error
│   │   ├── schemas/     # Zod schemas
│   │   ├── db/          # Pool + migrations
│   │   └── types/       # Shared interfaces
│   ├── tests/           # Jest + Supertest
│   └── package.json
│
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

---

## 🔑 API Endpoints

| Ruta | Método | Auth | Descripción |
|------|--------|------|-------------|
| `/api/v1/auth/register` | POST | ❌ | Registrar usuario |
| `/api/v1/auth/login` | POST | ❌ | Login → JWT |
| `/api/v1/auth/me` | GET | ✅ | Datos del usuario |
| `/api/v1/sessions/my-sessions` | GET | ✅ | Mis sesiones |
| `/api/v1/matchings/:id/sessions` | POST/GET | ✅ | CRUD sesiones |
| `/api/v1/sessions/:id/okrs` | POST/GET | ✅ | CRUD OKRs |
| `/api/v1/okrs/:id/complete` | PATCH | ✅ | **Transacción ACID** |
| `/api/v1/vacancies` | GET | ❌ | Listar vacantes |
| `/api/v1/vacancies/:id` | GET | ❌ | Detalle vacante |

---

## ⚡ Transacción Crítica — Completar OKR

El endpoint `PATCH /api/v1/okrs/:id/complete` implementa una transacción ACID completa:

1. **RN-01**: Verifica propiedad del OKR (JOIN chain)
2. **RN-02**: Verifica estado = `EnProgreso` (409 si no)
3. **RN-03**: Verifica `valor_actual >= valor_meta` (422 si no)
4. **BEGIN** → UPDATE okr → INSERT historial → UPDATE score → **COMMIT**
5. **RN-05**: Score de empleabilidad += 12 (cap 100)
6. **RN-06**: ROLLBACK automático en caso de error
7. **RN-07**: Notificación asíncrona al mentor

---

## 👥 Equipo — Grupo 10

Proyecto académico para el curso de Pruebas de Software (SQA)
Universidad Nacional Mayor de San Marcos (UNMSM)
Mayo 2026

---

## 📄 Licencia

Proyecto académico — uso educativo únicamente.
