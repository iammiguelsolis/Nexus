import { useState } from 'react';
import type { Skill } from '../hooks/useProfileSkills';
import { useProfileSkills } from '../hooks/useProfileSkills';
import { Modal, Dropdown, DatePicker } from './ui';

interface AddSkillModalProps {
  profileId: string;
  isOpen: boolean;
  onClose: () => void;
  onSkillAdded?: (score: number) => void;
}

export const AddSkillModal = ({ profileId, isOpen, onClose, onSkillAdded }: AddSkillModalProps) => {
  const { skills, availableSkills, addSkill, loading, error, setError, score } = useProfileSkills(profileId);
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<'Basico' | 'Intermedio' | 'Avanzado'>('Basico');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState('');
  const [localError, setLocalError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Filter available skills to exclude already added ones
  const skillsNotAdded = availableSkills.filter(
    (skill) => !skills.some((s) => s.habilidad_id === skill.habilidad_id)
  );

  const handleAddSkill = async () => {
    if (!selectedSkillId) {
      setLocalError('Por favor selecciona una habilidad');
      return;
    }

    const skillName = availableSkills.find((s) => s.habilidad_id === selectedSkillId)?.nombre || '';

    try {
      setLocalError('');
      setIsAdding(true);
      await addSkill({
        habilidad_id: selectedSkillId,
        nivel: selectedLevel,
        fecha_adquisicion: selectedDate || undefined,
      });

      setSuccessMsg(`¡"${skillName}" agregada exitosamente!`);
      setSelectedSkillId('');
      setSelectedLevel('Basico');
      setSelectedDate('');

      // Clear success message after 2 seconds
      setTimeout(() => {
        setSuccessMsg('');
        onSkillAdded?.(score);
        onClose();
      }, 2000);
    } catch (err: any) {
      setLocalError(err.message || 'Error al agregar la habilidad');
    } finally {
      setIsAdding(false);
    }
  };

  const selectedSkill = availableSkills.find((s) => s.habilidad_id === selectedSkillId);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Habilidad">
      <div className="space-y-5 animate-fade-in">
        {/* Success Message */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-success-600/15 border border-success-500/40 text-success-300 text-sm animate-fade-in flex items-start gap-3 shadow-lg shadow-success-600/10">
            <span className="text-lg mt-0.5">✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Message */}
        {(localError || error) && (
          <div className="p-4 rounded-xl bg-danger-600/15 border border-danger-500/40 text-danger-300 text-sm animate-fade-in flex items-start gap-3 shadow-lg shadow-danger-600/10">
            <span className="text-lg mt-0.5">⚠️</span>
            <span>{localError || error}</span>
          </div>
        )}

        {/* Skill Selector */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-nexus-400">🎯</span> Habilidad
          </label>
          {skillsNotAdded.length > 0 ? (
            <div>
              <Dropdown
                options={skillsNotAdded.map((skill: Skill) => ({
                  value: skill.habilidad_id,
                  label: `${skill.nombre} • ${skill.categoria}`,
                }))}
                value={selectedSkillId}
                onChange={setSelectedSkillId}
                placeholder="Selecciona una habilidad"
                disabled={isAdding}
              />

              {/* Skill Preview */}
              {selectedSkill && (
                <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-nexus-600/15 to-nexus-600/5 border border-nexus-500/40 animate-fade-in shadow-lg shadow-nexus-600/10">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🔷</div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm leading-tight">{selectedSkill.nombre}</p>
                      <p className="text-dark-300 text-xs mt-1.5 leading-relaxed">{selectedSkill.descripcion}</p>
                      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-nexus-600/30 text-nexus-300 text-xs font-bold border border-nexus-500/30">
                          {selectedSkill.categoria}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-dark-700/40 border border-dark-700/60 text-dark-400 text-sm text-center">
              Ya has registrado todas las habilidades disponibles ✨
            </div>
          )}
        </div>

        {/* Level Selector */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-warning-400">📊</span> Nivel de Dominio
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Basico', 'Intermedio', 'Avanzado'] as const).map((level) => {
              const levelConfig = {
                'Basico': { icon: '🌱', color: 'warning', desc: 'Principiante' },
                'Intermedio': { icon: '🌿', color: 'nexus', desc: 'Intermedio' },
                'Avanzado': { icon: '🌳', color: 'success', desc: 'Experto' },
              };
              const config = levelConfig[level];
              const isSelected = selectedLevel === level;

              return (
                <label
                  key={level}
                  className={`relative p-3 rounded-xl cursor-pointer transition-all border-2 ${
                    isSelected
                      ? `bg-${config.color}-600/20 border-${config.color}-500 shadow-lg shadow-${config.color}-600/20`
                      : `bg-dark-700/40 border-dark-700/60 hover:border-${config.color}-500/50 hover:bg-dark-700/60`
                  } disabled:opacity-50`}
                >
                  <input
                    type="radio"
                    name="level"
                    value={level}
                    checked={isSelected}
                    onChange={(e) => setSelectedLevel(e.target.value as typeof level)}
                    disabled={isAdding}
                    className="absolute opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <span className="text-xl block mb-1">{config.icon}</span>
                    <span className="text-xs font-semibold text-white">{level}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Date Picker (Optional) */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-blue-400">📅</span> Fecha de Adquisición
            <span className="text-xs font-normal text-dark-500">(Opcional)</span>
          </label>
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            placeholder="Selecciona una fecha"
            disabled={isAdding}
          />
          {selectedDate && (
            <p className="text-xs text-dark-400 mt-2">
              📍 {new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-dark-700/40">
          <button
            onClick={onClose}
            disabled={isAdding}
            className="flex-1 px-4 py-3 text-dark-200 border border-dark-600/60 rounded-xl hover:bg-dark-700/40 hover:text-white hover:border-dark-500/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleAddSkill}
            disabled={isAdding || !selectedSkillId || skillsNotAdded.length === 0}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-nexus-600 to-nexus-500 text-white rounded-xl hover:shadow-lg hover:shadow-nexus-600/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm transform hover:scale-105 active:scale-95"
          >
            {isAdding ? '⏳ Agregando...' : '✨ Agregar Habilidad'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
