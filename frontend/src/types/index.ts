// User & Auth Types
export type Rol = 'Padawan' | 'Jedi' | 'Admin';

export interface User {
  usuario_id: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: Rol;
  fecha_registro?: string;
  perfil_id?: string;
  perfil_aprendiz_id?: string;
  score_empleabilidad?: number;
  resumen_bio?: string;
  url_portafolio?: string;
  mentor_id?: string;
  especialidades?: string;
  anios_experiencia?: number;
  calificacion_promedio?: number;
  bio_profesional?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

// Session Types
export type EstadoSesion = 'Programada' | 'Realizada' | 'Cancelada';

export interface Session {
  sesion_id: string;
  matching_id: string;
  titulo: string;
  fecha_sesion: string;
  duracion_min: number;
  estado: EstadoSesion;
  url_grabacion?: string;
  notas?: string;
  total_okrs?: number;
  okrs_completados?: number;
  mentor_nombres?: string;
  mentor_apellidos?: string;
  padawan_nombres?: string;
  padawan_apellidos?: string;
  matching_estado?: string;
}

// OKR Types
export type EstadoOKR = 'Pendiente' | 'EnProgreso' | 'Completado' | 'Cancelado';

export interface OKR {
  okr_id: string;
  sesion_id: string;
  descripcion: string;
  indicador?: string;
  valor_meta: number;
  valor_actual: number;
  estado: EstadoOKR;
  fecha_limite?: string;
  fecha_actualizacion: string;
  nuevo_score?: number;
}

// Vacancy Types
export type Modalidad = 'Presencial' | 'Remoto' | 'Hibrido';

export interface Vacancy {
  vacante_id: string;
  empresa_id: string;
  titulo: string;
  descripcion?: string;
  salario_min: number;
  salario_max: number;
  modalidad: Modalidad;
  fecha_publicacion: string;
  activa: boolean;
  empresa_nombre: string;
  sector?: string;
  logo_url?: string;
  empresa_descripcion?: string;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
  correlationId?: string;
}
