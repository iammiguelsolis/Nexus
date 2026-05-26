import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { profileService } from '../services/api';
import { LoadingSpinner, Modal } from '../components/ui';
import type { Skill, ProfileData, NivelHabilidad } from '../types';

const NIVELES: { value: NivelHabilidad; label: string }[] = [
  { value: 'Basico', label: 'Básico' },
  { value: 'Intermedio', label: 'Intermedio' },
  { value: 'Avanzado', label: 'Avanzado' },
];

const NIVEL_COLORS: Record<string, string> = {
  Basico: 'var(--color-warning)',
  Intermedio: 'var(--color-primary-500)',
  Avanzado: 'var(--color-success-dark)',
};

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedNivel, setSelectedNivel] = useState<NivelHabilidad>('Basico');

  // Form state
  const [formData, setFormData] = useState({
    nombres: '', apellidos: '', resumen_bio: '', url_portafolio: '',
    especialidades: '', anios_experiencia: 0, bio_profesional: '',
  });

  const loadProfile = useCallback(async () => {
    try {
      const res = await profileService.getMyProfile();
      const p = res.data.data as ProfileData;
      setProfile(p);
      setFormData({
        nombres: p.nombres || '',
        apellidos: p.apellidos || '',
        resumen_bio: p.resumen_bio || '',
        url_portafolio: p.url_portafolio || '',
        especialidades: p.especialidades || '',
        anios_experiencia: p.anios_experiencia || 0,
        bio_profesional: p.bio_profesional || '',
      });
    } catch { /* handled */ }
  }, []);

  const loadSkills = useCallback(async () => {
    try {
      const res = await profileService.listSkills();
      setAllSkills(res.data.data);
    } catch { /* handled */ }
  }, []);

  useEffect(() => {
    Promise.all([loadProfile(), loadSkills()]).finally(() => setLoading(false));
  }, [loadProfile, loadSkills]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await profileService.updateMyProfile(formData);
      await refreshUser();
      await loadProfile();
      setMessage('Perfil actualizado correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleAddSkill = async () => {
    if (!selectedSkill) return;
    try {
      await profileService.addSkill({ habilidad_id: selectedSkill, nivel: selectedNivel });
      await loadProfile();
      setShowSkillModal(false);
      setSelectedSkill('');
    } catch { /* handled */ }
  };

  const handleRemoveSkill = async (habilidadId: string) => {
    try {
      await profileService.removeSkill(habilidadId);
      await loadProfile();
    } catch { /* handled */ }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const isPadawan = user?.rol === 'Padawan';
  const isJedi = user?.rol === 'Jedi';

  // Skills que aún no tiene el usuario
  const availableSkills = allSkills.filter(
    (s) => !profile?.habilidades?.some((h) => h.habilidad_id === s.habilidad_id)
  );

  return (
    <div className="animate-fade-in max-w-3xl">
      <h1 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>
        Mi Perfil
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        {isPadawan ? 'Completa tu perfil y habilidades para mejorar tu score de empleabilidad.'
                    : 'Actualiza tu información profesional para conectar con aprendices.'}
      </p>

      {/* Mensaje de éxito */}
      {message && (
        <div className="mb-4 p-3 rounded-lg text-sm animate-fade-in"
             style={{
               backgroundColor: message.includes('Error') ? 'var(--color-danger-light)' : 'var(--color-success-light)',
               color: message.includes('Error') ? 'var(--color-danger-dark)' : 'var(--color-success-dark)',
             }}>
          {message}
        </div>
      )}

      {/* Datos personales */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Datos personales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nombres</label>
            <input className="input-field" value={formData.nombres}
                   onChange={(e) => setFormData({ ...formData, nombres: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Apellidos</label>
            <input className="input-field" value={formData.apellidos}
                   onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Bio y portafolio (Padawan) */}
      {isPadawan && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Perfil de Aprendiz
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Bio / Resumen
              </label>
              <textarea className="input-field" rows={3} value={formData.resumen_bio}
                        placeholder="Cuéntanos sobre ti, tus estudios y objetivos..."
                        onChange={(e) => setFormData({ ...formData, resumen_bio: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                URL del Portafolio
              </label>
              <input className="input-field" value={formData.url_portafolio}
                     placeholder="https://github.com/tu-usuario"
                     onChange={(e) => setFormData({ ...formData, url_portafolio: e.target.value })} />
            </div>
            {profile?.score_empleabilidad !== undefined && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--color-primary-700)' }}>
                  ⭐ Score de empleabilidad: <strong>{profile.score_empleabilidad}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Datos de Mentor (Jedi) */}
      {isJedi && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Perfil de Mentor
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Especialidades
              </label>
              <input className="input-field" value={formData.especialidades}
                     placeholder="React, Node.js, System Design..."
                     onChange={(e) => setFormData({ ...formData, especialidades: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Años de experiencia
              </label>
              <input className="input-field" type="number" min={0} max={50} value={formData.anios_experiencia}
                     onChange={(e) => setFormData({ ...formData, anios_experiencia: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Bio profesional
              </label>
              <textarea className="input-field" rows={3} value={formData.bio_profesional}
                        placeholder="Tu experiencia profesional y cómo puedes ayudar..."
                        onChange={(e) => setFormData({ ...formData, bio_profesional: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {/* Botón guardar */}
      <button onClick={handleSave} disabled={saving}
              className="btn-primary flex items-center gap-2 mb-8">
        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>

      {/* Habilidades (solo Padawan) — UC-04 */}
      {isPadawan && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Mis habilidades
            </h2>
            <button onClick={() => setShowSkillModal(true)} className="btn-secondary text-sm">
              + Agregar
            </button>
          </div>

          {profile?.habilidades && profile.habilidades.length > 0 ? (
            <div className="space-y-2">
              {profile.habilidades.map((skill) => (
                <div key={skill.ph_id || skill.habilidad_id}
                     className="flex items-center justify-between p-3 rounded-lg"
                     style={{ backgroundColor: 'var(--surface-input)' }}>
                  <div>
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {skill.nombre}
                    </span>
                    <span className="text-xs ml-2 px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: 'var(--color-neutral-200)',
                            color: 'var(--text-secondary)',
                          }}>
                      {skill.categoria}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: 'var(--color-neutral-100)',
                            color: NIVEL_COLORS[skill.nivel || 'Basico'],
                          }}>
                      {skill.nivel}
                    </span>
                    <button onClick={() => handleRemoveSkill(skill.habilidad_id)}
                            className="text-xs px-2 py-1 rounded transition-colors"
                            style={{ color: 'var(--color-danger)' }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
              No tienes habilidades registradas. Agrega las tuyas para mejorar tu matching.
            </p>
          )}
        </div>
      )}

      {/* Modal agregar habilidad */}
      <Modal isOpen={showSkillModal} onClose={() => setShowSkillModal(false)} title="Agregar habilidad">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Habilidad
            </label>
            <select className="input-field" value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}>
              <option value="">Selecciona una habilidad</option>
              {availableSkills.map((s) => (
                <option key={s.habilidad_id} value={s.habilidad_id}>
                  {s.nombre} ({s.categoria})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Nivel de dominio
            </label>
            <div className="grid grid-cols-3 gap-2">
              {NIVELES.map((n) => (
                <button key={n.value}
                        onClick={() => setSelectedNivel(n.value)}
                        className="py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          backgroundColor: selectedNivel === n.value ? 'var(--color-primary-50)' : 'var(--surface-input)',
                          border: `2px solid ${selectedNivel === n.value ? 'var(--color-primary-400)' : 'var(--border-light)'}`,
                          color: selectedNivel === n.value ? 'var(--color-primary-700)' : 'var(--text-secondary)',
                        }}>
                  {n.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleAddSkill} disabled={!selectedSkill}
                  className="btn-primary w-full">
            Agregar habilidad
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
