import { useState, useEffect } from 'react';
import { profileService } from '../services/api';

export interface Skill {
  habilidad_id: string;
  nombre: string;
  categoria: 'Tecnica' | 'Blanda' | 'Certificacion';
  descripcion: string;
}

export interface ProfileSkill {
  ph_id: string;
  perfil_id: string;
  habilidad_id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  nivel: 'Basico' | 'Intermedio' | 'Avanzado';
  fecha_adquisicion?: string;
  validado_por?: string;
}

interface AddSkillPayload {
  habilidad_id: string;
  nivel: 'Basico' | 'Intermedio' | 'Avanzado';
  fecha_adquisicion?: string;
}

export const useProfileSkills = (profileId: string | null) => {
  const [skills, setSkills] = useState<ProfileSkill[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);

  // Load profile skills
  const loadProfileSkills = async () => {
    if (!profileId) return;
    try {
      setLoading(true);
      const response = await profileService.getSkills(profileId);
      setSkills(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar las habilidades');
      console.error('Error loading profile skills:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load available skills
  const loadAvailableSkills = async (categoria?: string) => {
    try {
      const response = await profileService.listAvailableSkills(categoria);
      setAvailableSkills(response.data.data);
    } catch (err: any) {
      console.error('Error loading available skills:', err);
    }
  };

  // Add skill to profile
  const addSkill = async (payload: AddSkillPayload) => {
    if (!profileId) return;
    try {
      setLoading(true);
      const response = await profileService.addSkill(profileId, payload);
      setScore(response.data.score_actualizado);
      await loadProfileSkills();
      setError(null);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error al agregar la habilidad';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Remove skill from profile
  const removeSkill = async (skillId: string) => {
    if (!profileId) return;
    try {
      setLoading(true);
      const response = await profileService.removeSkill(profileId, skillId);
      setScore(response.data.score_actualizado);
      await loadProfileSkills();
      setError(null);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error al remover la habilidad';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Load skills on mount or when profileId changes
  useEffect(() => {
    if (profileId) {
      loadProfileSkills();
      loadAvailableSkills();
    }
  }, [profileId]);

  return {
    skills,
    availableSkills,
    loading,
    error,
    score,
    addSkill,
    removeSkill,
    loadProfileSkills,
    loadAvailableSkills,
    setError,
  };
};
