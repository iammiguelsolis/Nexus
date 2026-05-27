import { useState, useEffect } from 'react';
import { profileService } from '../services/api';
import { LoadingSpinner } from '../components/ui';
import api from '../services/api';
import { Target, Trophy, Pin, CalendarDays, CheckCircle2, Bot, AlertTriangle, ArrowLeft, ArrowRight, Circle } from 'lucide-react';

interface Question { id: string; text: string; options: string[]; }
interface Evaluation { evaluacion_id: string; nivel_general: string; areas_fuertes: string; areas_mejora: string; }
interface LearningPath { path_id: string; titulo: string; descripcion: string; metas: { titulo: string; descripcion: string }[]; sprints: { sprint: number; titulo: string; tareas: string[] }[]; }

const OnboardingPage = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0); // current question index

  useEffect(() => {
    Promise.all([
      api.get('/onboarding/diagnostic'),
      api.get('/onboarding/learning-path'),
    ]).then(([diagRes, pathRes]) => {
      const diagData = diagRes.data.data;
      setQuestions(diagData.questions);
      if (diagData.completed) setEvaluation(diagData.evaluation);
      if (pathRes.data.data) setLearningPath(pathRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleAnswer = (qId: string, option: string) => {
    setAnswers({ ...answers, [qId]: option });
    if (step < questions.length - 1) setTimeout(() => setStep(step + 1), 300);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post('/onboarding/diagnostic', { respuestas: answers });
      setEvaluation(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Hubo un error al enviar la evaluación. Intenta nuevamente.');
    }
    finally { setSubmitting(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/onboarding/learning-path');
      const data = res.data.data;
      // Parse JSON strings if needed
      if (typeof data.metas === 'string') data.metas = JSON.parse(data.metas);
      if (typeof data.sprints === 'string') data.sprints = JSON.parse(data.sprints);
      setLearningPath(data);
    } catch { /* handled */ }
    finally { setGenerating(false); }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  // Validar que TODAS las preguntas tengan respuesta
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id]);

  // If already completed everything
  if (evaluation && learningPath) {
    const parsedMetas = typeof learningPath.metas === 'string' ? JSON.parse(learningPath.metas) : learningPath.metas;
    const parsedSprints = typeof learningPath.sprints === 'string' ? JSON.parse(learningPath.sprints) : learningPath.sprints;

    return (
      <div className="animate-fade-in max-w-3xl">
        <h1 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>Tu Ruta de Aprendizaje</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Generada a partir de tu evaluación diagnóstica.</p>

        {/* Nivel */}
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8" style={{ color: 'var(--color-primary-500)' }} />
            <div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tu nivel detectado</p>
              <p className="text-xl font-bold" style={{ color: 'var(--color-primary-700)' }}>{evaluation.nivel_general}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-success-light)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--color-success-dark)' }}>Áreas fuertes</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{evaluation.areas_fuertes}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-warning-light)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--color-warning-dark)' }}>Áreas de mejora</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{evaluation.areas_mejora}</p>
            </div>
          </div>
        </div>

        {/* Path Title */}
        <div className="card p-5 mb-6">
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{learningPath.titulo}</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{learningPath.descripcion}</p>
        </div>

        {/* Metas */}
        <div className="card p-5 mb-6">
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Trophy className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} /> Metas
          </h3>
          <div className="space-y-2">
            {parsedMetas.map((m: { titulo: string; descripcion: string }, i: number) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg items-start" style={{ backgroundColor: 'var(--surface-input)' }}>
                <Pin className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.titulo}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{m.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sprints */}
        <div className="card p-5">
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <CalendarDays className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} /> Sprints
          </h3>
          <div className="space-y-4">
            {parsedSprints.map((s: { sprint: number; titulo: string; tareas: string[] }) => (
              <div key={s.sprint} className="p-4 rounded-lg" style={{ border: '1px solid var(--border-light)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-primary-100)', color: 'var(--color-primary-700)' }}>
                    Sprint {s.sprint}
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.titulo}</span>
                </div>
                <ul className="space-y-2">
                  {s.tareas.map((t, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <Circle className="w-2 h-2 mt-1.5 flex-shrink-0" style={{ color: 'var(--color-neutral-400)' }} /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If evaluation completed but no learning path yet
  if (evaluation && !learningPath) {
    return (
      <div className="animate-fade-in max-w-3xl">
        <h1 className="text-2xl font-bold font-display mb-6" style={{ color: 'var(--text-primary)' }}>Evaluación Completada</h1>
        <div className="card p-6 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-success)' }} />
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Nivel: {evaluation.nivel_general}</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Ahora podemos generar tu ruta de aprendizaje personalizada.</p>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary flex items-center justify-center gap-2 mx-auto">
            {generating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Bot className="w-5 h-5" />}
            {generating ? 'Generando...' : 'Generar mi Learning Path'}
          </button>
        </div>
      </div>
    );
  }

  // Diagnostic test
  const currentQ = questions[step];

  return (
    <div className="animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>Evaluación Diagnóstica</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Responde estas preguntas para que el sistema genere tu ruta de aprendizaje personalizada.</p>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
          <span>Pregunta {step + 1} de {questions.length}</span>
          <span>{Object.keys(answers).length}/{questions.length} respondidas</span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--color-neutral-200)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((step + 1) / questions.length) * 100}%`, backgroundColor: 'var(--color-primary-500)' }} />
        </div>
      </div>

      {/* Question */}
      {currentQ && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{currentQ.text}</h2>
          <div className="space-y-2">
            {currentQ.options.map((opt) => (
              <button key={opt} onClick={() => handleAnswer(currentQ.id, opt)}
                      className="w-full text-left p-3 rounded-lg transition-all text-sm"
                      style={{
                        backgroundColor: answers[currentQ.id] === opt ? 'var(--color-primary-50)' : 'var(--surface-input)',
                        border: `2px solid ${answers[currentQ.id] === opt ? 'var(--color-primary-400)' : 'var(--border-light)'}`,
                        color: answers[currentQ.id] === opt ? 'var(--color-primary-700)' : 'var(--text-primary)',
                        fontWeight: answers[currentQ.id] === opt ? 600 : 400,
                      }}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="flex justify-between mt-4">
        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
                className="btn-ghost text-sm flex items-center gap-1" style={{ opacity: step === 0 ? 0.4 : 1 }}>
          <ArrowLeft className="w-4 h-4" /> Anterior
        </button>
        {step < questions.length - 1 ? (
          <button onClick={() => setStep(step + 1)} className="btn-secondary text-sm flex items-center gap-1" disabled={!answers[currentQ.id]}>
            Siguiente <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          allAnswered ? (
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-sm flex items-center gap-2">
              {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {submitting ? 'Enviando...' : 'Enviar evaluación'}
            </button>
          ) : (
            <div className="flex items-center gap-2" style={{ color: 'var(--color-warning)' }}>
              <AlertTriangle className="w-4 h-4" /> <span className="text-xs">Responde todas las preguntas</span>
            </div>
          )
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg text-sm text-center" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger-dark)' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default OnboardingPage;
