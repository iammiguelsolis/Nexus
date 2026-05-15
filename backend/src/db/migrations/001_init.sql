-- ============================================================
-- NEXUS — Transformación del Talento
-- Migration 001: Initial Schema + Full Seed Data
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USUARIOS
CREATE TABLE usuario (
  usuario_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  contrasena_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('Padawan','Jedi','Admin')),
  fecha_registro TIMESTAMP DEFAULT NOW(),
  activo BOOLEAN DEFAULT true
);

-- PERFIL DEL APRENDIZ
CREATE TABLE perfil_aprendiz (
  perfil_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID UNIQUE REFERENCES usuario(usuario_id) ON DELETE CASCADE,
  resumen_bio TEXT,
  score_empleabilidad DECIMAL(5,2) DEFAULT 0,
  url_portafolio VARCHAR(255),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- CATÁLOGO DE HABILIDADES
CREATE TABLE habilidad (
  habilidad_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  categoria VARCHAR(20) CHECK (categoria IN ('Tecnica','Blanda','Certificacion')),
  descripcion TEXT
);

-- HABILIDADES DEL APRENDIZ (M:N)
CREATE TABLE perfil_habilidad (
  ph_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID REFERENCES perfil_aprendiz(perfil_id) ON DELETE CASCADE,
  habilidad_id UUID REFERENCES habilidad(habilidad_id),
  nivel VARCHAR(20) CHECK (nivel IN ('Basico','Intermedio','Avanzado')),
  fecha_adquisicion DATE,
  validado_por UUID
);

-- PERFIL MENTOR
CREATE TABLE mentor (
  mentor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID UNIQUE REFERENCES usuario(usuario_id) ON DELETE CASCADE,
  especialidades TEXT,
  anios_experiencia INT DEFAULT 0,
  calificacion_promedio DECIMAL(3,2) DEFAULT 0,
  disponibilidad JSON,
  bio_profesional TEXT
);

-- MATCHING mentor-aprendiz
CREATE TABLE matching (
  matching_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  padawan_id UUID REFERENCES perfil_aprendiz(perfil_id),
  mentor_id UUID REFERENCES mentor(mentor_id),
  score_afinidad DECIMAL(5,4),
  fecha_asignacion TIMESTAMP DEFAULT NOW(),
  estado VARCHAR(20) DEFAULT 'Activo' CHECK (estado IN ('Activo','Completado','Cancelado'))
);

-- SESIONES DE MENTORÍA
CREATE TABLE sesion_mentoria (
  sesion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matching_id UUID REFERENCES matching(matching_id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  fecha_sesion TIMESTAMP NOT NULL,
  duracion_min INT DEFAULT 60,
  estado VARCHAR(20) DEFAULT 'Programada' CHECK (estado IN ('Programada','Realizada','Cancelada')),
  url_grabacion VARCHAR(255),
  notas TEXT
);

-- OKRs POR SESIÓN
CREATE TABLE okr (
  okr_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id UUID REFERENCES sesion_mentoria(sesion_id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  indicador TEXT,
  valor_meta DECIMAL(10,2),
  valor_actual DECIMAL(10,2) DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','EnProgreso','Completado','Cancelado')),
  fecha_limite DATE,
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- HISTORIAL DE AUDITORÍA (append-only)
CREATE TABLE okr_historial (
  historial_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id UUID REFERENCES okr(okr_id),
  estado_anterior VARCHAR(20),
  estado_nuevo VARCHAR(20),
  valor_actual_registrado DECIMAL(10,2),
  usuario_id UUID REFERENCES usuario(usuario_id),
  ip_origen VARCHAR(45),
  timestamp_utc TIMESTAMP DEFAULT NOW()
);

-- EMPRESAS ALIADAS
CREATE TABLE empresa (
  empresa_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  ruc VARCHAR(20) UNIQUE,
  sector VARCHAR(100),
  contacto_email VARCHAR(150),
  descripcion TEXT,
  logo_url VARCHAR(255)
);

-- VACANTES
CREATE TABLE vacante (
  vacante_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(empresa_id),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  salario_min DECIMAL(10,2),
  salario_max DECIMAL(10,2),
  modalidad VARCHAR(20) CHECK (modalidad IN ('Presencial','Remoto','Hibrido')),
  fecha_publicacion TIMESTAMP DEFAULT NOW(),
  activa BOOLEAN DEFAULT true
);

-- POSTULACIONES
CREATE TABLE postulacion (
  postulacion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacante_id UUID REFERENCES vacante(vacante_id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuario(usuario_id) ON DELETE CASCADE,
  mensaje TEXT,
  estado VARCHAR(20) DEFAULT 'Enviada' CHECK (estado IN ('Enviada','EnRevision','Aceptada','Rechazada')),
  fecha_postulacion TIMESTAMP DEFAULT NOW(),
  UNIQUE(vacante_id, usuario_id)
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Habilidades
INSERT INTO habilidad (nombre, categoria) VALUES
  ('JavaScript','Tecnica'),('TypeScript','Tecnica'),('React','Tecnica'),
  ('Node.js','Tecnica'),('PostgreSQL','Tecnica'),('Docker','Tecnica'),
  ('Python','Tecnica'),('Git','Tecnica'),('Comunicación efectiva','Blanda'),
  ('Trabajo en equipo','Blanda'),('Resolución de problemas','Blanda');

-- Empresas
INSERT INTO empresa (nombre, ruc, sector, contacto_email, descripcion) VALUES
  ('TechStartup Lima','20123456789','Fintech','jobs@techstartup.pe','Startup fintech en crecimiento exponencial. Stack moderno, equipo joven.'),
  ('DevShop Peru','20987654321','Software','hr@devshop.pe','Consultora de desarrollo software con clientes internacionales.'),
  ('CloudCorp','20111222333','Cloud','talent@cloudcorp.pe','Servicios cloud para empresas Fortune 500. Certificaciones AWS y Azure.');

-- Vacantes
INSERT INTO vacante (empresa_id, titulo, descripcion, salario_min, salario_max, modalidad)
SELECT empresa_id, 'Junior React Developer',
  'Buscamos junior con conocimientos en React y TypeScript. Proyectos reales desde el primer día. Mentoría con seniors y code reviews diarios.',
  2500, 3500, 'Hibrido'
FROM empresa WHERE nombre = 'TechStartup Lima';

INSERT INTO vacante (empresa_id, titulo, descripcion, salario_min, salario_max, modalidad)
SELECT empresa_id, 'Backend Node.js Junior',
  'Desarrollo de APIs REST con Node.js y PostgreSQL. Equipo ágil con sprints de 2 semanas. Mentoría interna incluida.',
  2800, 4000, 'Remoto'
FROM empresa WHERE nombre = 'DevShop Peru';

INSERT INTO vacante (empresa_id, titulo, descripcion, salario_min, salario_max, modalidad)
SELECT empresa_id, 'DevOps Engineer Trainee',
  'Aprende Docker, Kubernetes y CI/CD en proyectos enterprise. Certificaciones AWS patrocinadas por la empresa.',
  3000, 4500, 'Presencial'
FROM empresa WHERE nombre = 'CloudCorp';

INSERT INTO vacante (empresa_id, titulo, descripcion, salario_min, salario_max, modalidad)
SELECT empresa_id, 'Full Stack Developer Jr',
  'React + Node.js en productos fintech. Impacto directo en la experiencia de miles de usuarios.',
  3200, 4800, 'Remoto'
FROM empresa WHERE nombre = 'TechStartup Lima';

INSERT INTO vacante (empresa_id, titulo, descripcion, salario_min, salario_max, modalidad)
SELECT empresa_id, 'QA Automation Junior',
  'Automatización de pruebas con Playwright y Jest. Ambiente de aprendizaje continuo con pair programming.',
  2500, 3800, 'Hibrido'
FROM empresa WHERE nombre = 'DevShop Peru';

-- ============================================================
-- USUARIOS DE DEMO
-- Contraseña para todos: Test1234!
-- Hash bcryptjs de "Test1234!" con 12 rounds
-- ============================================================

-- Padawan (aprendiz)
INSERT INTO usuario (usuario_id, nombres, apellidos, email, contrasena_hash, rol)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'María', 'García López',
  'padawan@gmail.com',
  '$2a$12$7lYKC9tTDazcOFCCTp7O4OEEqyjReX66OdprQooXkDjnsOvnpFfNe',
  'Padawan'
);

-- Jedi (mentor)
INSERT INTO usuario (usuario_id, nombres, apellidos, email, contrasena_hash, rol)
VALUES (
  'b2222222-2222-2222-2222-222222222222',
  'Carlos', 'Ramírez Torres',
  'jedi@gmail.com',
  '$2a$12$7lYKC9tTDazcOFCCTp7O4OEEqyjReX66OdprQooXkDjnsOvnpFfNe',
  'Jedi'
);

-- Perfil aprendiz
INSERT INTO perfil_aprendiz (perfil_id, usuario_id, resumen_bio, score_empleabilidad, url_portafolio)
VALUES (
  'ea111111-1111-1111-1111-111111111111',
  'a1111111-1111-1111-1111-111111111111',
  'Estudiante de Ingeniería de Sistemas en la UNMSM. Apasionada por React y el desarrollo web.',
  24.00,
  'https://github.com/maria-garcia'
);

-- Perfil mentor
INSERT INTO mentor (mentor_id, usuario_id, especialidades, anios_experiencia, calificacion_promedio, bio_profesional)
VALUES (
  'fb222222-2222-2222-2222-222222222222',
  'b2222222-2222-2222-2222-222222222222',
  'React, Node.js, System Design, Career Growth',
  8,
  4.85,
  'Senior Software Engineer en empresa Fortune 500. 8 años de experiencia en desarrollo web full-stack. Mentor de más de 20 juniors.'
);

-- Habilidades del padawan
INSERT INTO perfil_habilidad (perfil_id, habilidad_id, nivel, fecha_adquisicion)
SELECT 'ea111111-1111-1111-1111-111111111111', habilidad_id, 'Intermedio', '2025-06-01'
FROM habilidad WHERE nombre IN ('JavaScript', 'React', 'Git');

INSERT INTO perfil_habilidad (perfil_id, habilidad_id, nivel, fecha_adquisicion)
SELECT 'ea111111-1111-1111-1111-111111111111', habilidad_id, 'Basico', '2025-09-01'
FROM habilidad WHERE nombre IN ('TypeScript', 'Node.js');

-- MATCHING activo entre Padawan y Jedi
INSERT INTO matching (matching_id, padawan_id, mentor_id, score_afinidad, estado)
VALUES (
  'fc333333-3333-3333-3333-333333333333',
  'ea111111-1111-1111-1111-111111111111',
  'fb222222-2222-2222-2222-222222222222',
  0.9200,
  'Activo'
);

-- SESIONES DE MENTORÍA
INSERT INTO sesion_mentoria (sesion_id, matching_id, titulo, fecha_sesion, duracion_min, estado, notas) VALUES
  ('d1000001-0000-0000-0000-000000000001', 'fc333333-3333-3333-3333-333333333333',
   'Introducción al Mentoring', '2026-05-01 10:00:00', 60, 'Realizada',
   'Primera sesión. Se definieron expectativas y objetivos del programa.'),
  ('d1000002-0000-0000-0000-000000000002', 'fc333333-3333-3333-3333-333333333333',
   'Code Review: Proyecto React', '2026-05-08 10:00:00', 90, 'Realizada',
   'Revisión de código del portafolio. Se identificaron mejoras en manejo de estado.'),
  ('d1000003-0000-0000-0000-000000000003', 'fc333333-3333-3333-3333-333333333333',
   'TypeScript Avanzado y Patrones', '2026-05-15 10:00:00', 60, 'Programada',
   NULL),
  ('d1000004-0000-0000-0000-000000000004', 'fc333333-3333-3333-3333-333333333333',
   'Preparación de Entrevistas', '2026-05-22 10:00:00', 90, 'Programada',
   NULL),
  ('d1000005-0000-0000-0000-000000000005', 'fc333333-3333-3333-3333-333333333333',
   'System Design Basics', '2026-05-29 10:00:00', 60, 'Programada',
   NULL);

-- OKRs para sesión 1 (Realizada) — algunos completados
INSERT INTO okr (sesion_id, descripcion, indicador, valor_meta, valor_actual, estado, fecha_limite) VALUES
  ('d1000001-0000-0000-0000-000000000001',
   'Configurar entorno de desarrollo completo (Node, React, Docker)',
   'Herramientas configuradas', 3, 3, 'Completado', '2026-05-05'),
  ('d1000001-0000-0000-0000-000000000001',
   'Crear repositorio Git con estructura de proyecto limpia',
   'Commits realizados', 1, 1, 'Completado', '2026-05-05');

-- OKRs para sesión 2 (Realizada)
INSERT INTO okr (sesion_id, descripcion, indicador, valor_meta, valor_actual, estado, fecha_limite) VALUES
  ('d1000002-0000-0000-0000-000000000002',
   'Refactorizar componentes React usando custom hooks',
   'Componentes refactorizados', 5, 5, 'Completado', '2026-05-12'),
  ('d1000002-0000-0000-0000-000000000002',
   'Implementar manejo de errores global con ErrorBoundary',
   'ErrorBoundaries implementados', 2, 1, 'EnProgreso', '2026-05-14');

-- OKRs para sesión 3 (Programada) — pendientes
INSERT INTO okr (sesion_id, descripcion, indicador, valor_meta, valor_actual, estado, fecha_limite) VALUES
  ('d1000003-0000-0000-0000-000000000003',
   'Migrar 3 componentes JavaScript a TypeScript estricto',
   'Componentes migrados', 3, 0, 'Pendiente', '2026-05-20'),
  ('d1000003-0000-0000-0000-000000000003',
   'Implementar genéricos en los servicios de API',
   'Servicios tipados', 4, 0, 'Pendiente', '2026-05-20');

-- OKRs para sesión 4 (Programada)
INSERT INTO okr (sesion_id, descripcion, indicador, valor_meta, valor_actual, estado, fecha_limite) VALUES
  ('d1000004-0000-0000-0000-000000000004',
   'Completar 3 ejercicios de LeetCode (Easy/Medium)',
   'Ejercicios resueltos', 3, 0, 'Pendiente', '2026-05-25'),
  ('d1000004-0000-0000-0000-000000000004',
   'Preparar elevator pitch personal (2 minutos)',
   'Pitch grabado', 1, 0, 'Pendiente', '2026-05-25');

-- Postulación demo
INSERT INTO postulacion (vacante_id, usuario_id, mensaje, estado)
SELECT v.vacante_id, 'a1111111-1111-1111-1111-111111111111',
  'Soy estudiante de la UNMSM con experiencia en React. Me encantaría ser parte de su equipo.',
  'EnRevision'
FROM vacante v JOIN empresa e ON v.empresa_id = e.empresa_id
WHERE v.titulo = 'Junior React Developer' AND e.nombre = 'TechStartup Lima';

