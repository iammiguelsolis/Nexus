-- ============================================================
-- NEXUS — Seed de datos de prueba
-- ============================================================
-- CREDENCIALES:
--   Padawan: padawan@nexus.test  / Test1234!
--   Jedi:    jedi@nexus.test     / Test1234!
--   Admin:   admin@nexus.test    / Test1234!
--
-- Hash bcrypt de "Test1234!" (12 rounds):
-- $2a$12$7lYKC9tTDazcOFCCTp7O4OEEqyjReX66OdprQooXkDjnsOvnpFfNe
-- ============================================================

-- Agregar columna notas a OKR si no existe (necesaria para feedback del Jedi)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'okr' AND column_name = 'notas'
  ) THEN
    ALTER TABLE okr ADD COLUMN notas TEXT;
  END IF;
END $$;

-- ============================================================
-- USUARIOS DE PRUEBA
-- ============================================================

-- Padawan (Aprendiz): Diego Adawon Solis
INSERT INTO usuario (usuario_id, nombres, apellidos, email, contrasena_hash, rol)
VALUES (
  'aa000000-0000-4000-a000-000000000001',
  'Diego', 'Adawon Solis',
  'padawan@nexus.test',
  '$2a$12$7lYKC9tTDazcOFCCTp7O4OEEqyjReX66OdprQooXkDjnsOvnpFfNe',
  'Padawan'
) ON CONFLICT (email) DO NOTHING;

-- Jedi (Mentor): Maestro Jedi Kenobi
INSERT INTO usuario (usuario_id, nombres, apellidos, email, contrasena_hash, rol)
VALUES (
  'aa000000-0000-4000-a000-000000000002',
  'Maestro Jedi', 'Kenobi',
  'jedi@nexus.test',
  '$2a$12$7lYKC9tTDazcOFCCTp7O4OEEqyjReX66OdprQooXkDjnsOvnpFfNe',
  'Jedi'
) ON CONFLICT (email) DO NOTHING;

-- Admin
INSERT INTO usuario (usuario_id, nombres, apellidos, email, contrasena_hash, rol)
VALUES (
  'aa000000-0000-4000-a000-000000000003',
  'Admin', 'Nexus',
  'admin@nexus.test',
  '$2a$12$7lYKC9tTDazcOFCCTp7O4OEEqyjReX66OdprQooXkDjnsOvnpFfNe',
  'Admin'
) ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- PERFIL DE APRENDIZ (Padawan)
-- ============================================================

INSERT INTO perfil_aprendiz (perfil_id, usuario_id, resumen_bio, score_empleabilidad, url_portafolio)
VALUES (
  'bb000000-0000-4000-a000-000000000001',
  'aa000000-0000-4000-a000-000000000001',
  'Estudiante de Ingenieria de Software. Apasionado por React, Node.js y el desarrollo full-stack. Busco crecer con la guia de un mentor.',
  18.00,
  'https://github.com/diego-adawon'
) ON CONFLICT (usuario_id) DO NOTHING;

-- ============================================================
-- PERFIL DE MENTOR (Jedi)
-- ============================================================

INSERT INTO mentor (mentor_id, usuario_id, especialidades, anios_experiencia, calificacion_promedio, bio_profesional)
VALUES (
  'bb000000-0000-4000-a000-000000000002',
  'aa000000-0000-4000-a000-000000000002',
  'React, Node.js, TypeScript, System Design, Clean Architecture',
  10,
  4.90,
  'Senior Engineer con 10 anios de experiencia en desarrollo web. He mentoreado a mas de 30 juniors en su camino profesional.'
) ON CONFLICT (usuario_id) DO NOTHING;

-- ============================================================
-- HABILIDADES DEL PADAWAN
-- ============================================================

INSERT INTO perfil_habilidad (perfil_id, habilidad_id, nivel, fecha_adquisicion)
SELECT 'bb000000-0000-4000-a000-000000000001', habilidad_id, 'Intermedio', '2026-01-15'
FROM habilidad WHERE nombre IN ('JavaScript', 'React', 'Git')
ON CONFLICT DO NOTHING;

INSERT INTO perfil_habilidad (perfil_id, habilidad_id, nivel, fecha_adquisicion)
SELECT 'bb000000-0000-4000-a000-000000000001', habilidad_id, 'Basico', '2026-03-01'
FROM habilidad WHERE nombre IN ('TypeScript', 'Node.js', 'PostgreSQL')
ON CONFLICT DO NOTHING;

-- ============================================================
-- MATCHING ACTIVO: Padawan <-> Jedi
-- ============================================================

INSERT INTO matching (matching_id, padawan_id, mentor_id, score_afinidad, estado)
VALUES (
  'cc000000-0000-4000-a000-000000000001',
  'bb000000-0000-4000-a000-000000000001',
  'bb000000-0000-4000-a000-000000000002',
  0.9350,
  'Activo'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- SESIONES DE MENTORIA (5 sesiones en diferentes estados)
-- ============================================================

-- Sesion 1: REALIZADA (pasada) - OKRs completados
INSERT INTO sesion_mentoria (sesion_id, matching_id, titulo, fecha_sesion, duracion_min, estado, notas)
VALUES (
  'dd000000-0000-4000-a000-000000000001',
  'cc000000-0000-4000-a000-000000000001',
  'Kickoff: Definicion de objetivos y ruta de aprendizaje',
  '2026-05-20 10:00:00', 60, 'Realizada',
  'Primera sesion. Se definieron los objetivos del programa y la ruta de aprendizaje. Diego mostro buen manejo de JavaScript basico.'
) ON CONFLICT DO NOTHING;

-- Sesion 2: REALIZADA (pasada) - OKRs en progreso (para probar completar + feedback)
INSERT INTO sesion_mentoria (sesion_id, matching_id, titulo, fecha_sesion, duracion_min, estado, notas)
VALUES (
  'dd000000-0000-4000-a000-000000000002',
  'cc000000-0000-4000-a000-000000000001',
  'Code Review: Componentes React y Hooks',
  '2026-05-27 10:00:00', 90, 'Realizada',
  'Se revisaron los componentes del proyecto. Diego necesita mejorar en custom hooks y manejo de estado.'
) ON CONFLICT DO NOTHING;

-- Sesion 3: REALIZADA (pasada) - OKRs entregados esperando feedback del Jedi
INSERT INTO sesion_mentoria (sesion_id, matching_id, titulo, fecha_sesion, duracion_min, estado, notas)
VALUES (
  'dd000000-0000-4000-a000-000000000003',
  'cc000000-0000-4000-a000-000000000001',
  'TypeScript: Migracion y tipado estricto',
  '2026-06-03 10:00:00', 60, 'Realizada',
  'Diego entrego los OKRs. Pendiente revision del mentor.'
) ON CONFLICT DO NOTHING;

-- Sesion 4: PROGRAMADA (futura) - OKRs pendientes
INSERT INTO sesion_mentoria (sesion_id, matching_id, titulo, fecha_sesion, duracion_min, estado)
VALUES (
  'dd000000-0000-4000-a000-000000000004',
  'cc000000-0000-4000-a000-000000000001',
  'Node.js: API REST y buenas practicas',
  '2026-06-10 10:00:00', 90, 'Programada'
) ON CONFLICT DO NOTHING;

-- Sesion 5: PROGRAMADA (futura) - OKRs pendientes
INSERT INTO sesion_mentoria (sesion_id, matching_id, titulo, fecha_sesion, duracion_min, estado)
VALUES (
  'dd000000-0000-4000-a000-000000000005',
  'cc000000-0000-4000-a000-000000000001',
  'System Design: Arquitectura de microservicios',
  '2026-06-17 10:00:00', 60, 'Programada'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- OKRs - SESION 1 (Completados - ya pasaron)
-- ============================================================

INSERT INTO okr (okr_id, sesion_id, descripcion, indicador, valor_meta, valor_actual, estado, fecha_limite, notas)
VALUES
  ('ee000000-0000-4000-a000-000000000001',
   'dd000000-0000-4000-a000-000000000001',
   'Configurar entorno de desarrollo local (Node 20, React 18, Docker, VS Code)',
   'Herramientas instaladas y funcionando', 4, 4, 'Completado', '2026-05-25',
   '[Feedback Mentor]: Excelente, todo configurado correctamente.'),

  ('ee000000-0000-4000-a000-000000000002',
   'dd000000-0000-4000-a000-000000000001',
   'Crear repositorio GitHub con estructura profesional (README, .gitignore, linter)',
   'Repositorio con estructura limpia', 1, 1, 'Completado', '2026-05-25',
   '[Feedback Mentor]: Buen repo, solo faltaba el .editorconfig pero lo agregaste rapido.')
ON CONFLICT DO NOTHING;

-- ============================================================
-- OKRs - SESION 2 (En Progreso - Padawan puede completar, Jedi puede dar feedback)
-- ============================================================

INSERT INTO okr (okr_id, sesion_id, descripcion, indicador, valor_meta, valor_actual, estado, fecha_limite)
VALUES
  ('ee000000-0000-4000-a000-000000000003',
   'dd000000-0000-4000-a000-000000000002',
   'Refactorizar 4 componentes React usando custom hooks (useForm, useFetch, useDebounce, useLocalStorage)',
   'Componentes refactorizados con hooks', 4, 3, 'EnProgreso', '2026-06-01'),

  ('ee000000-0000-4000-a000-000000000004',
   'dd000000-0000-4000-a000-000000000002',
   'Implementar manejo de errores con ErrorBoundary y fallback UI',
   'ErrorBoundaries implementados', 2, 1, 'EnProgreso', '2026-06-03')
ON CONFLICT DO NOTHING;

-- ============================================================
-- OKRs - SESION 3 (Completados por Padawan, esperando feedback/correccion del Jedi)
-- Estos son los que el Jedi puede APROBAR o DEVOLVER para revision
-- ============================================================

INSERT INTO okr (okr_id, sesion_id, descripcion, indicador, valor_meta, valor_actual, estado, fecha_limite)
VALUES
  ('ee000000-0000-4000-a000-000000000005',
   'dd000000-0000-4000-a000-000000000003',
   'Migrar 3 componentes de JavaScript a TypeScript con tipado estricto (no any)',
   'Componentes migrados a TS', 3, 3, 'Completado', '2026-06-08'),

  ('ee000000-0000-4000-a000-000000000006',
   'dd000000-0000-4000-a000-000000000003',
   'Implementar genericos en los servicios de API (ApiResponse<T>, useQuery<T>)',
   'Servicios con genericos tipados', 4, 4, 'Completado', '2026-06-08'),

  ('ee000000-0000-4000-a000-000000000007',
   'dd000000-0000-4000-a000-000000000003',
   'Escribir tests unitarios para los custom hooks con Jest y Testing Library',
   'Tests unitarios escritos', 5, 3, 'EnProgreso', '2026-06-10')
ON CONFLICT DO NOTHING;

-- ============================================================
-- OKRs - SESION 4 (Pendientes - sesion futura)
-- ============================================================

INSERT INTO okr (okr_id, sesion_id, descripcion, indicador, valor_meta, valor_actual, estado, fecha_limite)
VALUES
  ('ee000000-0000-4000-a000-000000000008',
   'dd000000-0000-4000-a000-000000000004',
   'Construir API REST con Express y validacion Zod para el modulo de usuarios',
   'Endpoints implementados', 5, 0, 'Pendiente', '2026-06-15'),

  ('ee000000-0000-4000-a000-000000000009',
   'dd000000-0000-4000-a000-000000000004',
   'Implementar autenticacion JWT con refresh tokens',
   'Flujo de auth completo', 1, 0, 'Pendiente', '2026-06-15')
ON CONFLICT DO NOTHING;

-- ============================================================
-- OKRs - SESION 5 (Pendientes - sesion futura)
-- ============================================================

INSERT INTO okr (okr_id, sesion_id, descripcion, indicador, valor_meta, valor_actual, estado, fecha_limite)
VALUES
  ('ee000000-0000-4000-a000-000000000010',
   'dd000000-0000-4000-a000-000000000005',
   'Disenar arquitectura de microservicios para un e-commerce (diagrama C4)',
   'Diagramas completados', 3, 0, 'Pendiente', '2026-06-22'),

  ('ee000000-0000-4000-a000-000000000011',
   'dd000000-0000-4000-a000-000000000005',
   'Documentar decisiones de arquitectura en ADR (Architecture Decision Records)',
   'ADRs escritos', 2, 0, 'Pendiente', '2026-06-22')
ON CONFLICT DO NOTHING;

-- ============================================================
-- HISTORIAL DE AUDITORIA (OKRs completados de sesion 1)
-- ============================================================

INSERT INTO okr_historial (okr_id, estado_anterior, estado_nuevo, valor_actual_registrado, usuario_id, ip_origen)
VALUES
  ('ee000000-0000-4000-a000-000000000001', 'Pendiente', 'EnProgreso', 2, 'aa000000-0000-4000-a000-000000000001', '127.0.0.1'),
  ('ee000000-0000-4000-a000-000000000001', 'EnProgreso', 'Completado', 4, 'aa000000-0000-4000-a000-000000000002', '127.0.0.1'),
  ('ee000000-0000-4000-a000-000000000002', 'Pendiente', 'EnProgreso', 0, 'aa000000-0000-4000-a000-000000000001', '127.0.0.1'),
  ('ee000000-0000-4000-a000-000000000002', 'EnProgreso', 'Completado', 1, 'aa000000-0000-4000-a000-000000000002', '127.0.0.1')
ON CONFLICT DO NOTHING;

-- ============================================================
-- CHAT entre Padawan y Jedi
-- ============================================================

INSERT INTO mensaje_chat (matching_id, emisor_id, contenido, leido) VALUES
  ('cc000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000002',
   'Hola Diego, bienvenido al programa. Ya revise tu perfil y creo que vamos a hacer un gran equipo.', true),
  ('cc000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000001',
   'Gracias maestro! Estoy listo para aprender. Ya tengo el entorno configurado.', true),
  ('cc000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000002',
   'Perfecto. Revisa los OKRs que te asigne para la proxima sesion y me dices si tienes dudas.', true),
  ('cc000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000001',
   'Ya complete los OKRs de TypeScript. Puedes revisarlos cuando quieras.', false),
  ('cc000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000002',
   'Los reviso hoy. Te doy feedback en la plataforma.', false)
ON CONFLICT DO NOTHING;

-- ============================================================
-- POSTS EN AULA VIRTUAL
-- ============================================================

INSERT INTO aula_post (matching_id, autor_id, tipo, titulo, contenido, fijado) VALUES
  ('cc000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000002',
   'anuncio', 'Bienvenido al programa de mentoria',
   'Diego, en este espacio compartiremos recursos, revisaremos tu progreso y trabajaremos juntos en tu crecimiento profesional.', true),
  ('cc000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000002',
   'material', 'Guia de TypeScript para React Developers',
   'Este es el material base que usaremos para las sesiones de TypeScript. Revisalo antes de la proxima sesion.', false),
  ('cc000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000002',
   'enlace', 'Link de sesiones Google Meet',
   'Usaremos este enlace para todas nuestras sesiones virtuales.', false)
ON CONFLICT DO NOTHING;

UPDATE aula_post SET url_enlace = 'https://meet.google.com/nexus-test-meet'
WHERE titulo = 'Link de sesiones Google Meet'
  AND matching_id = 'cc000000-0000-4000-a000-000000000001';

-- ============================================================
-- NOTIFICACIONES
-- ============================================================

INSERT INTO notificacion (usuario_id, tipo, titulo, mensaje, leida, referencia_id, referencia_tipo) VALUES
  ('aa000000-0000-4000-a000-000000000001', 'matching_aceptado', 'Mentor asignado',
   'Se te ha asignado al Maestro Jedi Kenobi como tu mentor. Revisa tu aula virtual.',
   true, 'cc000000-0000-4000-a000-000000000001', 'matching'),

  ('aa000000-0000-4000-a000-000000000001', 'okr_creado', 'Nuevos OKRs asignados',
   'Tu mentor ha creado nuevos OKRs para la sesion de TypeScript. Revisalos.',
   false, 'dd000000-0000-4000-a000-000000000003', 'sesion'),

  ('aa000000-0000-4000-a000-000000000002', 'okr_completado', 'OKR completado por Padawan',
   'Diego ha marcado como completado el OKR de migracion a TypeScript. Pendiente tu revision.',
   false, 'ee000000-0000-4000-a000-000000000005', 'okr'),

  ('aa000000-0000-4000-a000-000000000002', 'nueva_sesion', 'Proxima sesion programada',
   'Tienes una sesion programada: Node.js API REST - 10 Jun 2026 a las 10:00 AM.',
   false, 'dd000000-0000-4000-a000-000000000004', 'sesion')
ON CONFLICT DO NOTHING;

-- ============================================================
-- POSTULACION DE PRUEBA
-- ============================================================

INSERT INTO postulacion (vacante_id, usuario_id, mensaje, estado)
SELECT v.vacante_id, 'aa000000-0000-4000-a000-000000000001',
  'Soy estudiante de Ingenieria de Software con experiencia en React y TypeScript. Me gustaria unirme a su equipo.',
  'Enviada'
FROM vacante v JOIN empresa e ON v.empresa_id = e.empresa_id
WHERE v.titulo = 'Junior React Developer' AND e.nombre = 'TechStartup Lima'
ON CONFLICT DO NOTHING;
