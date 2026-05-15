import { Request } from 'express';

// ============================================================
// User & Auth Types
// ============================================================
export type Rol = 'Padawan' | 'Jedi' | 'Admin';

export interface Usuario {
  usuario_id: string;
  nombres: string;
  apellidos: string;
  email: string;
  contrasena_hash: string;
  rol: Rol;
  fecha_registro: Date;
  activo: boolean;
}

export interface JwtPayload {
  userId: string;
  email: string;
  rol: Rol;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ============================================================
// Profile Types
// ============================================================
export interface PerfilAprendiz {
  perfil_id: string;
  usuario_id: string;
  resumen_bio: string | null;
  score_empleabilidad: number;
  url_portafolio: string | null;
  fecha_actualizacion: Date;
}

export interface Mentor {
  mentor_id: string;
  usuario_id: string;
  especialidades: string | null;
  anios_experiencia: number;
  calificacion_promedio: number;
  disponibilidad: Record<string, unknown> | null;
  bio_profesional: string | null;
}

// ============================================================
// Skills
// ============================================================
export type CategoriaHabilidad = 'Tecnica' | 'Blanda' | 'Certificacion';
export type NivelHabilidad = 'Basico' | 'Intermedio' | 'Avanzado';

export interface Habilidad {
  habilidad_id: string;
  nombre: string;
  categoria: CategoriaHabilidad;
  descripcion: string | null;
}

// ============================================================
// Matching
// ============================================================
export type EstadoMatching = 'Activo' | 'Completado' | 'Cancelado';

export interface Matching {
  matching_id: string;
  padawan_id: string;
  mentor_id: string;
  score_afinidad: number;
  fecha_asignacion: Date;
  estado: EstadoMatching;
}

// ============================================================
// Sessions
// ============================================================
export type EstadoSesion = 'Programada' | 'Realizada' | 'Cancelada';

export interface SesionMentoria {
  sesion_id: string;
  matching_id: string;
  titulo: string;
  fecha_sesion: Date;
  duracion_min: number;
  estado: EstadoSesion;
  url_grabacion: string | null;
  notas: string | null;
}

// ============================================================
// OKRs
// ============================================================
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

export interface OKRHistorial {
  historial_id: string;
  okr_id: string;
  estado_anterior: string;
  estado_nuevo: string;
  valor_actual_registrado: number;
  usuario_id: string;
  ip_origen: string;
  timestamp_utc: Date;
}

// ============================================================
// Companies & Vacancies
// ============================================================
export type Modalidad = 'Presencial' | 'Remoto' | 'Hibrido';

export interface Empresa {
  empresa_id: string;
  nombre: string;
  ruc: string;
  sector: string | null;
  contacto_email: string | null;
  descripcion: string | null;
  logo_url: string | null;
}

export interface Vacante {
  vacante_id: string;
  empresa_id: string;
  titulo: string;
  descripcion: string | null;
  salario_min: number;
  salario_max: number;
  modalidad: Modalidad;
  fecha_publicacion: Date;
  activa: boolean;
}

// ============================================================
// API Response
// ============================================================
export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data?: T;
}
