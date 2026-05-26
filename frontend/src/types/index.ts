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

// Profile & Skill Types
export type NivelHabilidad = 'Basico' | 'Intermedio' | 'Avanzado';
export type CategoriaHabilidad = 'Tecnica' | 'Blanda' | 'Certificacion';

export interface Skill {
  habilidad_id: string;
  nombre: string;
  categoria: CategoriaHabilidad;
  descripcion?: string;
  ph_id?: string;
  nivel?: NivelHabilidad;
  fecha_adquisicion?: string;
}

export interface ProfileData extends User {
  habilidades: Skill[];
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

// Classroom Types
export interface ClassroomPost {
  post_id: string;
  matching_id: string;
  autor_id: string;
  tipo: 'anuncio' | 'material' | 'enlace';
  titulo: string | null;
  contenido: string | null;
  url_enlace: string | null;
  fijado: boolean;
  fecha_creacion: string;
  autor_nombres: string;
  autor_apellidos: string;
  autor_rol: string;
  comentarios: ClassroomComment[] | null;
  recursos: ClassroomResource[] | null;
}

export interface ClassroomComment {
  comentario_id: string;
  contenido: string;
  fecha_creacion: string;
  autor_id: string;
  autor_nombres: string;
  autor_apellidos: string;
  autor_rol: string;
}

export interface ClassroomResource {
  recurso_id: string;
  nombre: string;
  url: string;
  tipo: string;
}

export interface ClassroomPeople {
  mentor_usuario_id: string;
  mentor_nombres: string;
  mentor_apellidos: string;
  mentor_email: string;
  especialidades: string;
  anios_experiencia: number;
  bio_profesional: string;
  calificacion_promedio: number;
  padawan_usuario_id: string;
  padawan_nombres: string;
  padawan_apellidos: string;
  padawan_email: string;
  resumen_bio: string;
  score_empleabilidad: number;
  url_portafolio: string;
  score_afinidad: number;
  fecha_asignacion: string;
}

export interface ChatMessage {
  mensaje_id: string;
  matching_id: string;
  emisor_id: string;
  contenido: string;
  leido: boolean;
  fecha_envio: string;
  emisor_nombres: string;
  emisor_apellidos: string;
  emisor_rol: string;
}
