-- ============================================================
-- NEXUS — Migration 003: Notificaciones
-- UC-26: Sistema de notificaciones
-- ============================================================

CREATE TABLE IF NOT EXISTS notificacion (
  notificacion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuario(usuario_id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
    'nueva_sesion', 'sesion_cancelada', 'sesion_realizada',
    'okr_creado', 'okr_completado', 'okr_feedback',
    'matching_nuevo', 'matching_aceptado', 'matching_rechazado',
    'riesgo_abandono', 'vacante_nueva', 'postulacion_recibida',
    'sistema'
  )),
  titulo VARCHAR(200) NOT NULL,
  mensaje TEXT,
  leida BOOLEAN DEFAULT false,
  referencia_id UUID,
  referencia_tipo VARCHAR(50),
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificacion_usuario ON notificacion(usuario_id, leida, fecha_creacion DESC);
