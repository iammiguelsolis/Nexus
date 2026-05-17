-- ============================================================
-- Migration 002: Onboarding & Matching enhancements
-- UC-07: Evaluación diagnóstica
-- UC-10/UC-11: Matching con estado Pendiente
-- ============================================================

-- Tabla para evaluación diagnóstica del Padawan (UC-07)
CREATE TABLE IF NOT EXISTS evaluacion_diagnostica (
  evaluacion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID UNIQUE REFERENCES usuario(usuario_id) ON DELETE CASCADE,
  respuestas JSON NOT NULL,
  nivel_general VARCHAR(20) CHECK (nivel_general IN ('Principiante','Intermedio','Avanzado')),
  areas_fuertes TEXT,
  areas_mejora TEXT,
  fecha_evaluacion TIMESTAMP DEFAULT NOW()
);

-- Tabla para la ruta de aprendizaje generada por IA (UC-08)
CREATE TABLE IF NOT EXISTS learning_path (
  path_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID UNIQUE REFERENCES usuario(usuario_id) ON DELETE CASCADE,
  evaluacion_id UUID REFERENCES evaluacion_diagnostica(evaluacion_id),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  metas JSON,
  sprints JSON,
  generado_por VARCHAR(50) DEFAULT 'sistema',
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Agregar estado 'Pendiente' al matching para UC-11
ALTER TABLE matching DROP CONSTRAINT IF EXISTS matching_estado_check;
ALTER TABLE matching ADD CONSTRAINT matching_estado_check
  CHECK (estado IN ('Pendiente','Activo','Completado','Cancelado'));
