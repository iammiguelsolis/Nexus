import { Response, NextFunction } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../types';

// Preguntas de la evaluación diagnóstica
const DIAGNOSTIC_QUESTIONS = [
  { id: 'q1', text: '¿Cuánto tiempo llevas programando?', options: ['Menos de 6 meses', '6-12 meses', '1-2 años', 'Más de 2 años'] },
  { id: 'q2', text: '¿Qué lenguaje dominas mejor?', options: ['JavaScript', 'Python', 'Java', 'TypeScript', 'Otro'] },
  { id: 'q3', text: '¿Has trabajado con bases de datos?', options: ['No', 'SQL básico', 'SQL avanzado', 'SQL + NoSQL'] },
  { id: 'q4', text: '¿Conoces algún framework frontend?', options: ['Ninguno', 'React', 'Vue', 'Angular', 'Varios'] },
  { id: 'q5', text: '¿Has usado control de versiones (Git)?', options: ['No', 'Comandos básicos', 'Branches y PRs', 'Git avanzado'] },
  { id: 'q6', text: '¿Tienes experiencia con APIs REST?', options: ['No', 'He consumido APIs', 'He creado APIs', 'APIs complejas'] },
  { id: 'q7', text: '¿Cuál es tu objetivo profesional principal?', options: ['Frontend Developer', 'Backend Developer', 'Full Stack', 'DevOps/Cloud', 'Data/IA'] },
  { id: 'q8', text: '¿Qué área te gustaría reforzar?', options: ['Algoritmos', 'Diseño de sistemas', 'Habilidades blandas', 'Portafolio', 'Entrevistas'] },
];

/**
 * GET /api/v1/onboarding/diagnostic
 * UC-07: Obtener preguntas + estado de evaluación
 */
export const getDiagnostic = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }

    const existing = await pool.query(
      'SELECT * FROM evaluacion_diagnostica WHERE usuario_id = $1', [req.user.userId]
    );

    res.json({
      success: true,
      data: {
        questions: DIAGNOSTIC_QUESTIONS,
        completed: existing.rows.length > 0,
        evaluation: existing.rows[0] || null,
      },
    });
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/onboarding/diagnostic
 * UC-07: Enviar respuestas de evaluación diagnóstica
 */
export const submitDiagnostic = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }

    const { respuestas } = req.body;

    // Calcular nivel general basado en respuestas
    const nivel = calculateLevel(respuestas);
    const areas = analyzeAreas(respuestas);

    // Upsert evaluación
    const result = await pool.query(
      `INSERT INTO evaluacion_diagnostica (usuario_id, respuestas, nivel_general, areas_fuertes, areas_mejora)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (usuario_id)
       DO UPDATE SET respuestas = $2, nivel_general = $3, areas_fuertes = $4, areas_mejora = $5, fecha_evaluacion = NOW()
       RETURNING *`,
      [req.user.userId, JSON.stringify(respuestas), nivel, areas.fuertes, areas.mejora]
    );

    console.log(`[ONBOARDING] Diagnostic submitted for: ${req.user.email} — Level: ${nivel}`);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * GET /api/v1/onboarding/learning-path
 * UC-08: Obtener ruta de aprendizaje
 */
export const getLearningPath = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }

    const result = await pool.query(
      'SELECT * FROM learning_path WHERE usuario_id = $1', [req.user.userId]
    );

    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/onboarding/learning-path
 * UC-08: Generar ruta de aprendizaje basada en evaluación
 */
export const generateLearningPath = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }

    // Obtener evaluación
    const evalResult = await pool.query(
      'SELECT * FROM evaluacion_diagnostica WHERE usuario_id = $1', [req.user.userId]
    );
    if (evalResult.rows.length === 0) {
      res.status(400).json({ error: 'Debes completar la evaluación diagnóstica primero', code: 'EVAL_REQUIRED' }); return;
    }

    const evaluation = evalResult.rows[0];
    const path = buildLearningPath(evaluation);

    const result = await pool.query(
      `INSERT INTO learning_path (usuario_id, evaluacion_id, titulo, descripcion, metas, sprints)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (usuario_id)
       DO UPDATE SET evaluacion_id = $2, titulo = $3, descripcion = $4, metas = $5, sprints = $6, fecha_actualizacion = NOW()
       RETURNING *`,
      [req.user.userId, evaluation.evaluacion_id, path.titulo, path.descripcion,
       JSON.stringify(path.metas), JSON.stringify(path.sprints)]
    );

    console.log(`[ONBOARDING] Learning path generated for: ${req.user.email}`);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// ── Helpers ──

function calculateLevel(respuestas: Record<string, string>): string {
  const advancedAnswers = ['Más de 2 años', 'SQL + NoSQL', 'Varios', 'Git avanzado', 'APIs complejas'];
  const intermediateAnswers = ['1-2 años', 'SQL avanzado', 'Branches y PRs', 'He creado APIs'];

  let score = 0;
  for (const answer of Object.values(respuestas)) {
    if (advancedAnswers.includes(answer)) score += 2;
    else if (intermediateAnswers.includes(answer)) score += 1;
  }

  if (score >= 8) return 'Avanzado';
  if (score >= 4) return 'Intermedio';
  return 'Principiante';
}

function analyzeAreas(respuestas: Record<string, string>): { fuertes: string; mejora: string } {
  const fuertes: string[] = [];
  const mejora: string[] = [];

  if (['TypeScript', 'JavaScript'].includes(respuestas.q2)) fuertes.push('Programación web');
  else mejora.push('Programación web');

  if (['SQL avanzado', 'SQL + NoSQL'].includes(respuestas.q3)) fuertes.push('Bases de datos');
  else mejora.push('Bases de datos');

  if (['Branches y PRs', 'Git avanzado'].includes(respuestas.q5)) fuertes.push('Control de versiones');
  else mejora.push('Control de versiones');

  if (['He creado APIs', 'APIs complejas'].includes(respuestas.q6)) fuertes.push('Backend / APIs');
  else mejora.push('Backend / APIs');

  return { fuertes: fuertes.join(', ') || 'Por evaluar', mejora: mejora.join(', ') || 'Ninguna detectada' };
}

function buildLearningPath(evaluation: Record<string, unknown>) {
  const nivel = evaluation.nivel_general as string;
  const respuestas = (typeof evaluation.respuestas === 'string' ? JSON.parse(evaluation.respuestas) : evaluation.respuestas) as Record<string, string>;
  const objetivo = respuestas.q7 || 'Full Stack';

  const PATHS: Record<string, { titulo: string; descripcion: string; metas: { titulo: string; descripcion: string }[]; sprints: { sprint: number; titulo: string; tareas: string[] }[] }> = {
    Principiante: {
      titulo: `Ruta ${objetivo} — Nivel Principiante`,
      descripcion: `Camino personalizado para convertirte en ${objetivo}. Enfocado en construir fundamentos sólidos.`,
      metas: [
        { titulo: 'Dominar fundamentos', descripcion: 'Aprender las bases de programación y herramientas esenciales' },
        { titulo: 'Primer proyecto', descripcion: 'Construir un proyecto funcional para tu portafolio' },
        { titulo: 'Preparar perfil', descripcion: 'Tener un perfil competitivo para postular a vacantes junior' },
      ],
      sprints: [
        { sprint: 1, titulo: 'Fundamentos', tareas: ['Completar curso de Git', 'Configurar entorno de desarrollo', 'Resolver 5 ejercicios básicos'] },
        { sprint: 2, titulo: 'Lenguaje principal', tareas: ['Dominar tipos y estructuras', 'Funciones y módulos', 'Proyecto mini: calculadora web'] },
        { sprint: 3, titulo: 'Proyecto portafolio', tareas: ['Diseñar proyecto personal', 'Implementar funcionalidades core', 'Desplegar en la nube'] },
        { sprint: 4, titulo: 'Preparación laboral', tareas: ['Actualizar portafolio', 'Practicar entrevistas', 'Postular a 3 vacantes'] },
      ],
    },
    Intermedio: {
      titulo: `Ruta ${objetivo} — Nivel Intermedio`,
      descripcion: `Camino para especializarte como ${objetivo}. Enfocado en patrones avanzados y experiencia real.`,
      metas: [
        { titulo: 'Especialización técnica', descripcion: 'Profundizar en tecnologías del stack elegido' },
        { titulo: 'Proyecto complejo', descripcion: 'Construir una aplicación full-stack completa' },
        { titulo: 'Entrevistas técnicas', descripcion: 'Prepararte para entrevistas de nivel mid-level' },
      ],
      sprints: [
        { sprint: 1, titulo: 'Patrones avanzados', tareas: ['Design patterns aplicados', 'Testing automatizado', 'CI/CD básico'] },
        { sprint: 2, titulo: 'Arquitectura', tareas: ['Clean architecture', 'Microservicios vs monolito', 'Bases de datos avanzadas'] },
        { sprint: 3, titulo: 'Proyecto full-stack', tareas: ['API RESTful completa', 'Frontend con estado global', 'Autenticación y autorización'] },
        { sprint: 4, titulo: 'Preparación laboral', tareas: ['System design básico', 'LeetCode mediums', 'Mock interviews'] },
      ],
    },
    Avanzado: {
      titulo: `Ruta ${objetivo} — Nivel Avanzado`,
      descripcion: `Camino para posicionarte como ${objetivo} senior. Enfocado en liderazgo técnico y system design.`,
      metas: [
        { titulo: 'Liderazgo técnico', descripcion: 'Dominar arquitectura de sistemas y mentoring' },
        { titulo: 'Open source', descripcion: 'Contribuir a proyectos de código abierto relevantes' },
        { titulo: 'Senior readiness', descripcion: 'Prepararte para roles senior con salarios competitivos' },
      ],
      sprints: [
        { sprint: 1, titulo: 'System Design', tareas: ['Diseño de sistemas distribuidos', 'Escalabilidad y performance', 'Caso de estudio real'] },
        { sprint: 2, titulo: 'Contribución OS', tareas: ['Elegir proyecto open source', 'Resolver 3 issues', 'Crear PR significativo'] },
        { sprint: 3, titulo: 'Liderazgo', tareas: ['Mentorear a un junior', 'Documentar decisiones técnicas', 'Tech talk interna'] },
        { sprint: 4, titulo: 'Posicionamiento', tareas: ['Blog técnico o portfolio avanzado', 'Networking profesional', 'Negociación salarial'] },
      ],
    },
  };

  return PATHS[nivel] || PATHS.Principiante;
}
