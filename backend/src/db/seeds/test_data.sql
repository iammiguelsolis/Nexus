-- ============================================================
-- NEXUS — Seed de datos de prueba
-- Cuentas pre-creadas con contraseñas hasheadas (bcrypt)
-- Contraseña para TODAS las cuentas: Test1234!
-- ============================================================

-- Hash bcrypt de "Test1234!" generado con 10 rounds
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

-- ============================================================
-- USUARIOS DE PRUEBA
-- ============================================================

-- Padawan 1: María García
INSERT INTO usuario (usuario_id, nombres, apellidos, email, contrasena_hash, rol)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-000000000001',
  'María', 'García',
  'maria.padawan@test.com',
  '$2a$10$ibApptG6TU6VhmkmwlSeSuIiVeGNUoxOl582CI8YbuYioe3.9PwE.',
  'Padawan'
) ON CONFLICT (email) DO NOTHING;

-- Padawan 2: Carlos López
INSERT INTO usuario (usuario_id, nombres, apellidos, email, contrasena_hash, rol)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-000000000002',
  'Carlos', 'López',
  'carlos.padawan@test.com',
  '$2a$10$ibApptG6TU6VhmkmwlSeSuIiVeGNUoxOl582CI8YbuYioe3.9PwE.',
  'Padawan'
) ON CONFLICT (email) DO NOTHING;

-- Mentor Jedi 1: Ana Torres
INSERT INTO usuario (usuario_id, nombres, apellidos, email, contrasena_hash, rol)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-000000000003',
  'Ana', 'Torres',
  'ana.jedi@test.com',
  '$2a$10$ibApptG6TU6VhmkmwlSeSuIiVeGNUoxOl582CI8YbuYioe3.9PwE.',
  'Jedi'
) ON CONFLICT (email) DO NOTHING;

-- Mentor Jedi 2: Roberto Díaz
INSERT INTO usuario (usuario_id, nombres, apellidos, email, contrasena_hash, rol)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-000000000004',
  'Roberto', 'Díaz',
  'roberto.jedi@test.com',
  '$2a$10$ibApptG6TU6VhmkmwlSeSuIiVeGNUoxOl582CI8YbuYioe3.9PwE.',
  'Jedi'
) ON CONFLICT (email) DO NOTHING;

-- Admin: Laura Admin
INSERT INTO usuario (usuario_id, nombres, apellidos, email, contrasena_hash, rol)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-000000000005',
  'Laura', 'Admin',
  'admin@test.com',
  '$2a$10$ibApptG6TU6VhmkmwlSeSuIiVeGNUoxOl582CI8YbuYioe3.9PwE.',
  'Admin'
) ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- PERFILES DE APRENDIZ
-- ============================================================

INSERT INTO perfil_aprendiz (perfil_id, usuario_id, resumen_bio, score_empleabilidad, url_portafolio)
VALUES (
  'b1b2c3d4-e5f6-7890-abcd-000000000001',
  'a1b2c3d4-e5f6-7890-abcd-000000000001',
  'Desarrolladora frontend apasionada por React y TypeScript. Busco mentoría en arquitectura de software.',
  35.00,
  'https://maria-garcia.dev'
) ON CONFLICT (usuario_id) DO NOTHING;

INSERT INTO perfil_aprendiz (perfil_id, usuario_id, resumen_bio, score_empleabilidad, url_portafolio)
VALUES (
  'b1b2c3d4-e5f6-7890-abcd-000000000002',
  'a1b2c3d4-e5f6-7890-abcd-000000000002',
  'Backend developer con interés en microservicios y DevOps.',
  12.00,
  'https://carlos-lopez.dev'
) ON CONFLICT (usuario_id) DO NOTHING;

-- ============================================================
-- PERFILES DE MENTOR
-- ============================================================

INSERT INTO mentor (mentor_id, usuario_id, especialidades, anios_experiencia, calificacion_promedio)
VALUES (
  'c1b2c3d4-e5f6-7890-abcd-000000000001',
  'a1b2c3d4-e5f6-7890-abcd-000000000003',
  'Frontend & React', 8, 4.80
) ON CONFLICT (usuario_id) DO NOTHING;

INSERT INTO mentor (mentor_id, usuario_id, especialidades, anios_experiencia, calificacion_promedio)
VALUES (
  'c1b2c3d4-e5f6-7890-abcd-000000000002',
  'a1b2c3d4-e5f6-7890-abcd-000000000004',
  'Backend & Cloud', 12, 4.90
) ON CONFLICT (usuario_id) DO NOTHING;

-- ============================================================
-- MATCHING ACTIVO (María <-> Ana)
-- ============================================================

INSERT INTO matching (matching_id, padawan_id, mentor_id, estado, score_afinidad)
VALUES (
  'd1b2c3d4-e5f6-7890-abcd-000000000001',
  'b1b2c3d4-e5f6-7890-abcd-000000000001',
  'c1b2c3d4-e5f6-7890-abcd-000000000001',
  'Activo', 0.8550
) ON CONFLICT DO NOTHING;

-- ============================================================
-- SESIÓN DE MENTORÍA
-- ============================================================

INSERT INTO sesion_mentoria (sesion_id, matching_id, titulo, fecha_sesion, duracion_min, estado, notas)
VALUES (
  'e1b2c3d4-e5f6-7890-abcd-000000000001',
  'd1b2c3d4-e5f6-7890-abcd-000000000001',
  'Introducción a Patrones de Diseño',
  NOW() - INTERVAL '3 days',
  60,
  'Realizada',
  'Se revisaron los patrones Observer, Strategy y Factory.'
) ON CONFLICT DO NOTHING;

INSERT INTO sesion_mentoria (sesion_id, matching_id, titulo, fecha_sesion, duracion_min, estado)
VALUES (
  'e1b2c3d4-e5f6-7890-abcd-000000000002',
  'd1b2c3d4-e5f6-7890-abcd-000000000001',
  'Revisión de Código React',
  NOW() + INTERVAL '2 days',
  45,
  'Programada'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- OKRs
-- ============================================================

INSERT INTO okr (okr_id, sesion_id, descripcion, indicador, valor_meta, valor_actual, estado, fecha_limite)
VALUES (
  'f1b2c3d4-e5f6-7890-abcd-000000000001',
  'e1b2c3d4-e5f6-7890-abcd-000000000001',
  'Refactorizar componentes usando custom hooks',
  'Componentes refactorizados',
  3, 2, 'EnProgreso',
  NOW() + INTERVAL '10 days'
) ON CONFLICT DO NOTHING;

INSERT INTO okr (okr_id, sesion_id, descripcion, indicador, valor_meta, valor_actual, estado, fecha_limite)
VALUES (
  'f1b2c3d4-e5f6-7890-abcd-000000000002',
  'e1b2c3d4-e5f6-7890-abcd-000000000001',
  'Implementar tests unitarios para servicios',
  'Tests escritos',
  5, 0, 'Pendiente',
  NOW() + INTERVAL '14 days'
) ON CONFLICT DO NOTHING;
