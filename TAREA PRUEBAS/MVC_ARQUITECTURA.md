# Nexus — Arquitectura MVC: Documentacion y Guia de Demostracion

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Mapeo MVC en Nexus](#2-mapeo-mvc-en-nexus)
3. [Capa Model (Modelo)](#3-capa-model-modelo)
4. [Capa View (Vista)](#4-capa-view-vista)
5. [Capa Controller (Controlador)](#5-capa-controller-controlador)
6. [Tacticas de Calidad Aplicadas](#6-tacticas-de-calidad-aplicadas)
7. [Guia de Demostracion en Vivo](#7-guia-de-demostracion-en-vivo)

---

## 1. Resumen Ejecutivo

Nexus es una plataforma SaaS de mentoria 1-a-1 construida con una **arquitectura MVC distribuida** en dos capas:

| Aspecto | Tecnologia |
|---------|-----------|
| **Frontend (Vista)** | React 18 + TypeScript + Vite + Tailwind CSS |
| **Backend (Controlador + Modelo)** | Node.js + Express.js + TypeScript |
| **Base de Datos (Persistencia)** | PostgreSQL 16 |
| **Comunicacion** | API REST con JSON + JWT stateless |

La separacion MVC se evidencia asi:

```
┌──────────────────────────────────────────────────────────────┐
│  VISTA (Frontend React)                                      │
│  Pages → Components → Hooks → Services (Axios)              │
│  Responsabilidad: Presentacion + interaccion del usuario     │
├──────────────────────────────────────────────────────────────┤
│  CONTROLADOR (Backend Express)                               │
│  Routes → Middleware → Controllers                           │
│  Responsabilidad: Logica de negocio + orquestacion           │
├──────────────────────────────────────────────────────────────┤
│  MODELO (Datos)                                              │
│  Types/Interfaces → Schemas (Zod) → DB Pool → PostgreSQL    │
│  Responsabilidad: Estructura de datos + persistencia + ACID  │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Mapeo MVC en Nexus

### 2.1 Estructura de Directorios

```
nexus/
├── frontend/src/                    ← VISTA (View)
│   ├── pages/                       ← Vistas principales (11 paginas)
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── SessionsPage.tsx
│   │   ├── OKRPage.tsx
│   │   ├── VacanciesPage.tsx
│   │   ├── MatchingPage.tsx
│   │   ├── ClassroomPage.tsx
│   │   ├── OnboardingPage.tsx
│   │   └── UserProfilePage.tsx
│   ├── components/                  ← Componentes reutilizables de UI
│   │   ├── ui/                      ← Modal, Dropdown, DatePicker, Badge, etc.
│   │   ├── layout/                  ← Layout (Sidebar + Header)
│   │   ├── ProfileSkills.tsx        ← Componente feature
│   │   └── AddSkillModal.tsx        ← Componente feature
│   ├── hooks/                       ← Logica de control (Controller en frontend)
│   │   ├── useAuth.tsx              ← Estado de autenticacion
│   │   └── useProfileSkills.tsx     ← CRUD de habilidades
│   ├── services/                    ← Acceso a datos (Model proxy)
│   │   └── api.ts                   ← Axios + interceptores + service objects
│   └── types/                       ← Interfaces TypeScript
│       └── index.ts                 ← User, Session, OKR, Vacancy, etc.
│
├── backend/src/                     ← CONTROLADOR + MODELO
│   ├── routes/                      ← Enrutamiento (12 archivos)
│   │   ├── auth.routes.ts
│   │   ├── profile.routes.ts
│   │   ├── session.routes.ts
│   │   ├── okr.routes.ts
│   │   ├── vacancy.routes.ts
│   │   ├── matching.routes.ts
│   │   ├── classroom.routes.ts
│   │   ├── chat.routes.ts
│   │   ├── onboarding.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── ia.routes.ts
│   │   └── notification.routes.ts
│   ├── controllers/                 ← Logica de negocio (12 controladores)
│   │   ├── auth.controller.ts       ← register(), login(), getMe()
│   │   ├── profile.controller.ts    ← getMyProfile(), addSkill(), etc.
│   │   ├── session.controller.ts    ← CRUD sesiones
│   │   ├── okr.controller.ts        ← completeOKR() [ACID Transaction]
│   │   ├── vacancy.controller.ts    ← Listado y postulacion
│   │   ├── matching.controller.ts   ← Emparejamiento
│   │   ├── classroom.controller.ts  ← Aula virtual
│   │   ├── chat.controller.ts       ← Mensajeria
│   │   ├── onboarding.controller.ts ← Flujo onboarding
│   │   ├── dashboard.controller.ts  ← Estadisticas
│   │   ├── ia.controller.ts         ← Prediccion IA
│   │   └── notification.controller.ts ← Notificaciones
│   ├── middleware/                   ← Cross-cutting concerns
│   │   ├── auth.middleware.ts        ← JWT + roles
│   │   ├── validate.middleware.ts    ← Validacion Zod
│   │   └── error.middleware.ts       ← Manejo global de errores
│   ├── schemas/                     ← Contratos de validacion (Modelo)
│   │   ├── auth.schema.ts
│   │   ├── profile.schema.ts
│   │   ├── session.schema.ts
│   │   ├── okr.schema.ts
│   │   └── vacancy.schema.ts
│   ├── db/                          ← Acceso a datos (Modelo)
│   │   ├── pool.ts                  ← Connection pool PostgreSQL
│   │   ├── migrations/              ← DDL del esquema
│   │   └── seeds/                   ← Datos de prueba
│   └── types/                       ← Interfaces TypeScript (Modelo)
│       └── index.ts                 ← Usuario, OKR, Matching, etc.
```

### 2.2 Tabla de Correspondencia MVC

| Capa MVC | Archivos en Nexus | Responsabilidad |
|----------|------------------|-----------------|
| **Model** | `backend/src/types/index.ts` | Interfaces TypeScript que definen la estructura de los datos del dominio |
| **Model** | `backend/src/schemas/*.ts` | Esquemas Zod que validan y tipan la entrada del usuario |
| **Model** | `backend/src/db/pool.ts` | Connection pool a PostgreSQL (acceso a datos) |
| **Model** | `backend/src/db/migrations/*.sql` | DDL del esquema relacional (4 migraciones) |
| **Model** | `frontend/src/types/index.ts` | Interfaces que reflejan el modelo en el cliente |
| **Model** | `frontend/src/services/api.ts` | Proxy del modelo via servicios Axios |
| **Controller** | `backend/src/controllers/*.ts` | 12 controladores con logica de negocio |
| **Controller** | `backend/src/routes/*.ts` | 12 archivos de enrutamiento que mapean URL a controladores |
| **Controller** | `backend/src/middleware/*.ts` | Middleware transversal (auth, validacion, errores) |
| **Controller** | `frontend/src/hooks/*.tsx` | Custom hooks que orquestan estado + servicios |
| **View** | `frontend/src/pages/*.tsx` | 11 paginas que renderizan la interfaz |
| **View** | `frontend/src/components/**` | Componentes reutilizables de UI |
| **View** | `frontend/src/App.tsx` | Componente raiz con enrutamiento y providers |

---

## 3. Capa Model (Modelo)

### 3.1 Interfaces TypeScript (Dominio)

El modelo del dominio se define en `backend/src/types/index.ts` con interfaces tipadas:

```typescript
// Ejemplo: Entidad Usuario
export interface Usuario {
  usuario_id: string;
  nombres: string;
  apellidos: string;
  email: string;
  contrasena_hash: string;
  rol: Rol;           // 'Padawan' | 'Jedi' | 'Admin'
  fecha_registro: Date;
  activo: boolean;
}

// Ejemplo: Entidad OKR con maquina de estados
export type EstadoOKR = 'Pendiente' | 'EnProgreso' | 'Completado' | 'Cancelado';

export interface OKR {
  okr_id: string;
  sesion_id: string;
  descripcion: string;
  indicador: string | null;
  valor_meta: number;
  valor_actual: number;
  estado: EstadoOKR;
  fecha_limite: Date | null;
  fecha_actualizacion: Date;
}
```

**Evidencia de MVC:** Las interfaces definen la estructura del dominio sin logica de presentacion ni de controlador. Son contratos puros que ambas capas (Controller y View) consumen.

### 3.2 Schemas de Validacion (Zod)

Los schemas Zod en `backend/src/schemas/` actuan como **guardians del modelo**, validando que los datos entrantes cumplan las reglas de negocio antes de llegar al controlador:

```typescript
// auth.schema.ts
export const registerSchema = z.object({
  nombres: z.string().min(2).max(100),
  apellidos: z.string().min(2).max(100),
  email: z.string().email().max(150),
  contrasena: z.string().min(8).max(100),
  rol: z.enum(['Padawan', 'Jedi']),
});
```

### 3.3 Acceso a Datos (Database Pool)

El acceso a la base de datos se centraliza en `backend/src/db/pool.ts`:

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                      // Connection pooling
  idleTimeoutMillis: 30000,     // Limpieza de conexiones ociosas
  connectionTimeoutMillis: 5000, // Timeout de conexion
  ssl: isLocalDB ? false : { rejectUnauthorized: false },
});
```

### 3.4 Esquema Relacional (Migraciones)

El modelo de datos se define en 4 migraciones SQL:
- `001_init.sql` — Tablas core: usuario, perfil_aprendiz, mentor, habilidad, matching, sesion_mentoria, okr, empresa, vacante
- `002_onboarding.sql` — Extension para flujo de onboarding
- `003_notifications.sql` — Sistema de notificaciones
- `004_classroom.sql` — Aula virtual con posts, comentarios, recursos y chat

---

## 4. Capa View (Vista)

### 4.1 Paginas (Views Principales)

Cada pagina en `frontend/src/pages/` es una **Vista** que renderiza la interfaz del usuario. No contiene logica de negocio; delega al controlador (hooks) y consume datos del modelo (services/types):

```typescript
// Ejemplo simplificado: LoginPage.tsx
const LoginPage = () => {
  const { login } = useAuth();          // ← Usa el Controller (hook)
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, contrasena);      // ← Delega al Controller
  };

  return (
    <form onSubmit={handleSubmit}>        {/* ← Solo presentacion */}
      <input value={email} onChange={...} />
      <input value={contrasena} onChange={...} />
      <button type="submit">Iniciar Sesion</button>
    </form>
  );
};
```

### 4.2 Componentes Reutilizables

Los componentes UI en `frontend/src/components/` son piezas de presentacion puras:

| Componente | Proposito |
|-----------|-----------|
| `Modal` | Ventana flotante con backdrop blur |
| `Dropdown` | Select personalizado (Portal + fixed positioning) |
| `DatePicker` | Calendario con react-day-picker |
| `Badge` | Etiqueta para categorias/estados |
| `ProgressBar` | Barra de progreso con gradientes |
| `LoadingSpinner` | Spinner de carga animado |
| `EmptyState` | Estado vacio con icono y CTA |
| `ProfileSkills` | Grid de habilidades con glassmorphism |
| `AddSkillModal` | Formulario modal para agregar skills |

### 4.3 Routing (App.tsx)

`App.tsx` orquesta las vistas con `react-router-dom`, implementando proteccion de rutas:

```typescript
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};
```

---

## 5. Capa Controller (Controlador)

### 5.1 Backend: Routes + Controllers

El flujo de control en el backend sigue el patron:

```
Request HTTP → Route → Middleware(s) → Controller → Response HTTP
```

**Ejemplo concreto: Registrar habilidad**

```
POST /api/v1/profile/skills
    │
    ├── auth.middleware.ts      → Verifica JWT
    ├── validate.middleware.ts  → Valida con addSkillSchema (Zod)
    └── profile.controller.ts  → addSkill()
         ├── Verifica rol == Padawan
         ├── Busca perfil_id del usuario
         ├── Verifica duplicados
         ├── INSERT/UPDATE en perfil_habilidad
         └── Responde 201 con resultado
```

**Archivo de rutas** (`profile.routes.ts`):
```typescript
const router = Router();

router.get('/profile/me', authMiddleware, getMyProfile);
router.put('/profile/me', authMiddleware, validate(updateProfileSchema), updateMyProfile);
router.get('/profile/skills', authMiddleware, listSkills);
router.post('/profile/skills', authMiddleware, validate(addSkillSchema), addSkill);
router.delete('/profile/skills/:habilidadId', authMiddleware, removeSkill);
```

**Controlador** (`profile.controller.ts`):
```typescript
export const addSkill = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // 1. Verificar autenticacion
  if (!req.user) { res.status(401).json({...}); return; }

  // 2. Verificar rol
  if (req.user.rol !== 'Padawan') { res.status(403).json({...}); return; }

  // 3. Obtener perfil_id (query al Modelo)
  const perfilResult = await pool.query(
    'SELECT perfil_id FROM perfil_aprendiz WHERE usuario_id = $1', [req.user.userId]
  );

  // 4. Verificar duplicados
  const existing = await pool.query(
    'SELECT ph_id FROM perfil_habilidad WHERE perfil_id = $1 AND habilidad_id = $2',
    [perfil_id, habilidad_id]
  );

  // 5. INSERT o UPDATE segun caso
  if (existing.rows.length > 0) {
    await pool.query('UPDATE perfil_habilidad SET nivel = $1 ...', [...]);
  } else {
    await pool.query('INSERT INTO perfil_habilidad ...', [...]);
  }

  // 6. Responder
  res.status(201).json({ success: true, message: 'Habilidad registrada' });
};
```

### 5.2 Frontend: Custom Hooks como Controllers

En el frontend, los **custom hooks** cumplen la funcion de controlador, encapsulando logica de estado y comunicacion con el backend:

**`useAuth.tsx`** — Controlador de autenticacion:
```typescript
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('nexus_token'));

  const login = async (email: string, contrasena: string) => {
    const res = await authService.login({ email, contrasena });  // ← Llama al Model
    localStorage.setItem('nexus_token', newToken);
    setToken(newToken);      // ← Actualiza estado
    setUser(newUser);        // ← Notifica a la Vista
  };

  const logout = () => {
    localStorage.removeItem('nexus_token');
    setToken(null);
    setUser(null);
  };
  // ...
};
```

### 5.3 Middleware como Extension del Controller

Los middleware son **extensiones transversales del controlador** que ejecutan logica antes de que la request llegue al controller de negocio:

| Middleware | Archivo | Funcion |
|-----------|---------|---------|
| Autenticacion | `auth.middleware.ts` | Verifica JWT, inyecta `req.user` |
| Autorizacion por rol | `auth.middleware.ts` | `requireRole('Padawan', 'Jedi')` |
| Validacion | `validate.middleware.ts` | Valida body/params/query con Zod |
| Manejo de errores | `error.middleware.ts` | Captura errores, genera correlationId |

---

## 6. Tacticas de Calidad Aplicadas

### 6.1 Tactica: Integridad de Datos (Transacciones ACID)

**Atributo de calidad:** Confiabilidad / Integridad

Nexus implementa transacciones ACID explicitas en operaciones criticas. Ejemplo en `completeOKR()`:

```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');                           // ← BEGIN

  await client.query('UPDATE okr SET estado = ...');     // ← Paso 1
  await client.query('INSERT INTO okr_historial ...');   // ← Paso 2 (audit)
  await client.query('UPDATE perfil_aprendiz SET score_empleabilidad = ...'); // ← Paso 3

  await client.query('COMMIT');                          // ← COMMIT
} catch (err) {
  await client.query('ROLLBACK');                        // ← ROLLBACK en error
  next(err);
} finally {
  client.release();                                      // ← Liberar conexion
}
```

**Donde se evidencia:**
- `auth.controller.ts` — Registro de usuario (INSERT usuario + INSERT perfil en transaccion)
- `okr.controller.ts` — `completeOKR()` (UPDATE okr + INSERT historial + UPDATE score)
- `profile.controller.ts` — `updateMyProfile()` (UPDATE usuario + UPDATE perfil_aprendiz/mentor)

### 6.2 Tactica: Autenticacion y Autorizacion (Seguridad)

**Atributo de calidad:** Seguridad

```typescript
// auth.middleware.ts — Verificacion JWT
export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET);   // ← Verifica firma
  req.user = decoded;                               // ← Inyecta identidad
  next();
};

// Restriccion por rol
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.rol)) {
    res.status(403).json({ error: 'No tiene permisos', code: 'FORBIDDEN' });
    return;
  }
  next();
};
```

**Evidencia concreta:**
- Todas las rutas protegidas usan `authMiddleware` antes del controller
- `addSkill()` verifica `req.user.rol !== 'Padawan'` ademas del middleware
- `completeOKR()` verifica propiedad del OKR (que el usuario sea mentor o padawan del matching)
- Frontend: Interceptor Axios redirige a `/login` ante 401

### 6.3 Tactica: Validacion de Entrada (Integridad)

**Atributo de calidad:** Integridad / Robustez

```typescript
// validate.middleware.ts — Middleware generico con Zod
export const validate = (schema: ZodSchema, target = 'body') => (req, res, next) => {
  try {
    const parsed = schema.parse(req[target]);
    req[target] = parsed;   // ← Reemplaza con datos limpios y tipados
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        error: 'Error de validacion',
        code: 'VALIDATION_ERROR',
        details: err.errors.map(e => ({ campo: e.path.join('.'), mensaje: e.message })),
      });
    }
  }
};
```

### 6.4 Tactica: Manejo Centralizado de Errores (Disponibilidad)

**Atributo de calidad:** Disponibilidad / Mantenibilidad

```typescript
// error.middleware.ts
export const errorMiddleware = (err, _req, res, _next) => {
  const correlationId = crypto.randomUUID();    // ← ID unico para trazabilidad
  const statusCode = err.statusCode || 500;

  console.error(`[ERROR] ${correlationId}:`, { message: err.message, stack: err.stack });

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Error interno del servidor' : err.message,
    code: err.code || 'INTERNAL_ERROR',
    correlationId,    // ← El cliente puede reportar este ID
  });
};
```

### 6.5 Tactica: Separacion de Responsabilidades (Mantenibilidad)

**Atributo de calidad:** Mantenibilidad / Modificabilidad

La separacion estricta en capas permite modificar cada capa de forma independiente:

| Escenario de cambio | Capa afectada | Capas NO afectadas |
|---------------------|---------------|-------------------|
| Cambiar color de un boton | View (componente) | Controller, Model |
| Agregar campo al registro | Model (schema) + Controller + View | Otras entidades |
| Migrar de PostgreSQL a MySQL | Model (pool.ts, migrations) | Controller, View |
| Agregar endpoint nuevo | Controller (route + controller) | View existente, Model |
| Cambiar regla de score | Controller (okr.controller) | View, Model |

### 6.6 Resumen de Tacticas

| Tactica | Atributo de Calidad | Archivos que la Evidencian |
|---------|--------------------|-----------------------------|
| Transacciones ACID | Confiabilidad / Integridad | `auth.controller.ts`, `okr.controller.ts`, `profile.controller.ts` |
| Autenticacion JWT | Seguridad | `auth.middleware.ts`, `api.ts` (interceptor) |
| Autorizacion por rol | Seguridad | `auth.middleware.ts` (`requireRole`), controllers |
| Validacion con Zod | Integridad | `validate.middleware.ts`, `schemas/*.ts` |
| Manejo centralizado de errores | Disponibilidad | `error.middleware.ts` |
| Correlation ID en errores | Trazabilidad | `error.middleware.ts` |
| Connection pooling | Rendimiento | `db/pool.ts` |
| Separacion en capas MVC | Mantenibilidad | Estructura completa del proyecto |

---

## 7. Guia de Demostracion en Vivo

### 7.1 Prerrequisitos

Antes de la demostracion, asegurate de tener:

- [ ] Docker Desktop instalado y corriendo
- [ ] El repositorio clonado localmente
- [ ] Puerto 5432 libre (PostgreSQL)
- [ ] Puerto 3001 libre (Backend)
- [ ] Puerto 5174 libre (Frontend)

### 7.2 Levantar el Entorno (2 minutos)

```bash
# Desde la raiz del proyecto
cd nexus

# Levantar todo con Docker Compose
docker-compose up --build

# Esperar a ver estos mensajes:
# [DB] New client connected to PostgreSQL
# Server running on port 3001
# Frontend → http://localhost:5174
```

### 7.3 Script de Demostracion (15-20 minutos)

#### Paso 1: Mostrar la Arquitectura (3 min)

1. Abrir `arquitectura_nexus.puml` y mostrar los diagramas C4
2. Explicar brevemente cada nivel:
   - **Nivel 1 (Contexto):** Padawan y Jedi interactuan con Nexus
   - **Nivel 2 (Contenedores):** Frontend SPA, Backend API, PostgreSQL
   - **Nivel 3 (Componentes Backend):** Routes → Middleware → Controllers → DB Pool
   - **Nivel 3 (Componentes Frontend):** Pages → Components → Hooks → Services

3. Abrir la estructura de carpetas en el IDE y señalar:
   - `backend/src/controllers/` — "Estos son los controladores, 12 archivos"
   - `backend/src/routes/` — "Las rutas mapean URLs a controladores"
   - `backend/src/middleware/` — "Middleware transversal: auth, validacion, errores"
   - `frontend/src/pages/` — "Las vistas, 11 paginas"
   - `frontend/src/hooks/` — "Los hooks actuan como controllers del frontend"
   - `frontend/src/services/api.ts` — "El proxy del modelo hacia la API"

#### Paso 2: Demostrar el Flujo MVC Completo — Registro (4 min)

1. Abrir el navegador en `http://localhost:5174/register`
2. Abrir DevTools (F12) → pestaña Network
3. Llenar el formulario:
   - Nombres: `Carlos`
   - Apellidos: `Garcia`
   - Email: `carlos@demo.com`
   - Contrasena: `Demo1234!`
   - Rol: `Padawan`
4. Click en "Registrarse"
5. Mostrar en DevTools:
   - Request: `POST /api/v1/auth/register` (Controller)
   - Request Body: datos validados por Zod (Model schema)
   - Response: `201` con token JWT + datos del usuario

6. **Explicar el flujo MVC:**
   - **Vista:** `RegisterPage.tsx` captura los datos del formulario
   - **Controller (frontend):** `useAuth.register()` invoca `authService.register()`
   - **Controller (backend):** `auth.routes.ts` → `validate(registerSchema)` → `auth.controller.ts:register()`
   - **Model:** `registerSchema` valida, `pool.query()` ejecuta INSERT, transaccion ACID (INSERT usuario + INSERT perfil_aprendiz)
   - **Vista:** Redirige a `/dashboard` tras exito

7. **Mostrar el codigo** en el IDE:
   - Abrir `frontend/src/hooks/useAuth.tsx` → funcion `register()`
   - Abrir `backend/src/routes/auth.routes.ts` → linea del POST
   - Abrir `backend/src/controllers/auth.controller.ts` → funcion `register()`
   - Señalar `BEGIN`, `INSERT usuario`, `INSERT perfil_aprendiz`, `COMMIT`

#### Paso 3: Demostrar Tactica de Validacion (3 min)

1. Usar Postman o curl para enviar datos invalidos:

```bash
curl -X POST http://localhost:3001/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"nombres\":\"\",\"email\":\"no-es-email\",\"contrasena\":\"123\",\"rol\":\"Invalido\"}"
```

2. Mostrar la respuesta `400 VALIDATION_ERROR` con detalles de cada campo:
```json
{
  "error": "Error de validacion",
  "code": "VALIDATION_ERROR",
  "details": [
    {"campo": "nombres", "mensaje": "Nombres debe tener al menos 2 caracteres"},
    {"campo": "apellidos", "mensaje": "Required"},
    {"campo": "email", "mensaje": "Email invalido"},
    {"campo": "contrasena", "mensaje": "La contrasena debe tener al menos 8 caracteres"},
    {"campo": "rol", "mensaje": "Rol debe ser Padawan o Jedi"}
  ]
}
```

3. **Explicar:** "El middleware `validate.middleware.ts` usa Zod para validar ANTES de que la request llegue al controller. Esto es una tactica de integridad de datos."

#### Paso 4: Demostrar Tactica de Seguridad — JWT (3 min)

1. Intentar acceder sin token:
```bash
curl http://localhost:3001/api/v1/profile/me
```
→ Respuesta: `401 AUTH_REQUIRED`

2. Hacer login y obtener token:
```bash
curl -X POST http://localhost:3001/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"carlos@demo.com\",\"contrasena\":\"Demo1234!\"}"
```

3. Acceder con token:
```bash
curl http://localhost:3001/api/v1/profile/me ^
  -H "Authorization: Bearer <TOKEN_OBTENIDO>"
```
→ Respuesta: `200` con datos del perfil

4. **Explicar:** "El `authMiddleware` verifica el JWT en cada request protegida. Si el token es invalido o expiro, responde 401. En el frontend, el interceptor de Axios detecta el 401 y redirige al login."

#### Paso 5: Demostrar Transaccion ACID (4 min)

1. Navegar a una sesion de mentoria con OKRs (si hay datos seed)
2. O demostrar via API:

```bash
# Agregar habilidad (Transaccion 1)
curl -X POST http://localhost:3001/api/v1/profile/skills ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -d "{\"habilidad_id\":\"<ID>\",\"nivel\":\"Intermedio\"}"
```

3. **Abrir el codigo de `okr.controller.ts:completeOKR()`** y señalar:
   - Linea: `await client.query('BEGIN')` — "Aqui inicia la transaccion"
   - Linea: `UPDATE okr SET estado = 'Completado'` — "Paso 1"
   - Linea: `INSERT INTO okr_historial` — "Paso 2: audit trail"
   - Linea: `UPDATE perfil_aprendiz SET score_empleabilidad` — "Paso 3: score"
   - Linea: `COMMIT` — "Si todo sale bien"
   - Linea: `ROLLBACK` en el catch — "Si algo falla, se revierte TODO"

4. **Explicar:** "Esto garantiza que o se ejecutan las 3 operaciones juntas, o ninguna. Es la propiedad de atomicidad de ACID. Si el UPDATE del score falla, el OKR tampoco se marca como completado."

#### Paso 6: Demostrar Manejo de Errores (2 min)

1. Provocar un error 404:
```bash
curl http://localhost:3001/api/v1/ruta-que-no-existe
```
→ `404 NOT_FOUND`

2. **Explicar:** "El `errorMiddleware` captura cualquier error no manejado, genera un `correlationId` unico y responde con un JSON estandarizado. Este ID permite rastrear el error en los logs del servidor."

#### Paso 7: Demostrar la App Completa en el Navegador (3 min)

1. Navegar por la aplicacion:
   - **Dashboard** — Mostrar habilidades, score de empleabilidad
   - **Perfil** — Editar datos personales
   - **Sesiones** — Ver sesiones de mentoria
   - **OKRs** — Mostrar listado y estados
   - **Vacantes** — Filtrar por modalidad

2. Abrir DevTools y mostrar las peticiones HTTP que salen a la API, señalando como la Vista (React) siempre se comunica con el Controller (API) que a su vez accede al Model (PostgreSQL).

### 7.4 Preguntas Frecuentes del Profesor

| Pregunta | Respuesta |
|----------|-----------|
| "¿Donde esta el Modelo?" | En `backend/src/types/` (interfaces), `backend/src/schemas/` (validacion), `backend/src/db/` (persistencia) y `frontend/src/types/` + `services/api.ts` (proxy del modelo en el cliente) |
| "¿Donde esta la Vista?" | En `frontend/src/pages/` y `frontend/src/components/`. Son componentes React que solo se encargan de la presentacion |
| "¿Donde esta el Controlador?" | En `backend/src/controllers/` (12 controladores) y `backend/src/routes/` (enrutamiento). En el frontend, los hooks de `frontend/src/hooks/` actuan como controladores locales |
| "¿Que tactica de calidad usan?" | Transacciones ACID, autenticacion JWT, validacion Zod, manejo centralizado de errores con correlation ID, connection pooling, y separacion en capas MVC |
| "¿Es MVC puro?" | Es una adaptacion de MVC para una arquitectura web moderna SPA + API REST. El Model tiene una representacion en ambos lados (backend: DB + types, frontend: services + types). El Controller se distribuye entre backend (routes + controllers + middleware) y frontend (hooks). La Vista esta completamente en React |
| "¿Por que no usan un ORM?" | Se usa SQL directo con el driver `pg` para tener control total sobre las transacciones ACID y las queries de negocio. Esto es una decision deliberada para maximizar el control sobre la capa de datos |

### 7.5 Checklist Final Pre-Demo

- [ ] Docker Compose levantado sin errores
- [ ] Frontend accesible en http://localhost:5174
- [ ] Backend accesible en http://localhost:3001/api/v1/health
- [ ] Base de datos con datos seed cargados
- [ ] Navegador con DevTools abierto (pestaña Network)
- [ ] IDE abierto con los archivos clave listos
- [ ] Postman/curl listo para las pruebas de API
- [ ] Este documento abierto como referencia
