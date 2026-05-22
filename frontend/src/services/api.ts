import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nexus_token');
      localStorage.removeItem('nexus_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ============ Auth Service ============
export const authService = {
  register: (data: { nombres: string; apellidos: string; email: string; contrasena: string; rol: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; contrasena: string }) =>
    api.post('/auth/login', data),

  getMe: () => api.get('/auth/me'),
};

// ============ Sessions Service ============
export const sessionService = {
  getMySessions: () => api.get('/sessions/my-sessions'),

  listByMatching: (matchingId: string) =>
    api.get(`/matchings/${matchingId}/sessions`),

  create: (matchingId: string, data: { titulo: string; fecha_sesion: string; duracion_min?: number; notas?: string }) =>
    api.post(`/matchings/${matchingId}/sessions`, data),

  update: (sesionId: string, data: Record<string, unknown>) =>
    api.put(`/sessions/${sesionId}`, data),

  delete: (sesionId: string) => api.delete(`/sessions/${sesionId}`),
};

// ============ OKR Service ============
export const okrService = {
  listBySession: (sesionId: string) =>
    api.get(`/sessions/${sesionId}/okrs`),

  create: (sesionId: string, data: { descripcion: string; indicador?: string; valor_meta: number; fecha_limite?: string }) =>
    api.post(`/sessions/${sesionId}/okrs`, data),

  update: (okrId: string, data: Record<string, unknown>) =>
    api.put(`/okrs/${okrId}`, data),

  delete: (okrId: string) => api.delete(`/okrs/${okrId}`),

  complete: (okrId: string, data: { valor_actual: number; nota_cierre: string }) =>
    api.patch(`/okrs/${okrId}/complete`, data),
};

// ============ Vacancies Service ============
export const vacancyService = {
  list: (modalidad?: string) =>
    api.get('/vacancies', { params: modalidad ? { modalidad } : {} }),

  getById: (vacancyId: string) =>
    api.get(`/vacancies/${vacancyId}`),

  create: (data: Record<string, unknown>) =>
    api.post('/vacancies', data),

  update: (vacancyId: string, data: Record<string, unknown>) =>
    api.put(`/vacancies/${vacancyId}`, data),

  apply: (vacancyId: string, mensaje?: string) =>
    api.post(`/vacancies/${vacancyId}/apply`, { mensaje }),

  getMyApplications: () =>
    api.get('/vacancies/my-applications'),
};

// ============ Profile Service ============
export const profileService = {
  getSkills: (profileId: string) =>
    api.get(`/profiles/${profileId}/skills`),

  addSkill: (profileId: string, data: { habilidad_id: string; nivel: string; fecha_adquisicion?: string }) =>
    api.post(`/profiles/${profileId}/skills`, data),

  removeSkill: (profileId: string, skillId: string) =>
    api.delete(`/profiles/${profileId}/skills/${skillId}`),

  listAvailableSkills: (categoria?: string) =>
    api.get('/profiles/habilidades', { params: categoria ? { categoria } : {} }),
};
