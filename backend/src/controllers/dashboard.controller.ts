import { Response, NextFunction } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../types';

/**
 * GET /api/v1/dashboard
 * UC-09: Ver dashboard de progreso del Padawan
 */
export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }

    const userId = req.user.userId;

    // Score de empleabilidad
    const scoreResult = await pool.query(
      'SELECT score_empleabilidad FROM perfil_aprendiz WHERE usuario_id = $1', [userId]
    );
    const score = scoreResult.rows[0]?.score_empleabilidad || 0;

    // OKRs activos (Pendiente o EnProgreso)
    const okrsResult = await pool.query(
      `SELECT o.okr_id, o.descripcion, o.valor_meta, o.valor_actual, o.estado, o.fecha_limite
       FROM okr o
       JOIN sesion_mentoria s ON o.sesion_id = s.sesion_id
       JOIN matching m ON s.matching_id = m.matching_id
       JOIN perfil_aprendiz pa ON m.padawan_id = pa.perfil_id
       WHERE pa.usuario_id = $1 AND o.estado IN ('Pendiente','EnProgreso')
       ORDER BY o.fecha_limite ASC NULLS LAST
       LIMIT 10`,
      [userId]
    );

    // Próximas sesiones
    const sessionsResult = await pool.query(
      `SELECT s.sesion_id, s.titulo, s.fecha_sesion, s.duracion_min, s.estado,
              u.nombres AS mentor_nombres, u.apellidos AS mentor_apellidos
       FROM sesion_mentoria s
       JOIN matching m ON s.matching_id = m.matching_id
       JOIN perfil_aprendiz pa ON m.padawan_id = pa.perfil_id
       JOIN mentor mt ON m.mentor_id = mt.mentor_id
       JOIN usuario u ON mt.usuario_id = u.usuario_id
       WHERE pa.usuario_id = $1 AND s.estado = 'Programada'
       ORDER BY s.fecha_sesion ASC
       LIMIT 5`,
      [userId]
    );

    // Stats rápidos
    const statsResult = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM okr o
          JOIN sesion_mentoria s ON o.sesion_id = s.sesion_id
          JOIN matching m ON s.matching_id = m.matching_id
          JOIN perfil_aprendiz pa ON m.padawan_id = pa.perfil_id
          WHERE pa.usuario_id = $1 AND o.estado = 'Completado') AS okrs_completados,
         (SELECT COUNT(*) FROM sesion_mentoria s
          JOIN matching m ON s.matching_id = m.matching_id
          JOIN perfil_aprendiz pa ON m.padawan_id = pa.perfil_id
          WHERE pa.usuario_id = $1 AND s.estado = 'Realizada') AS sesiones_realizadas,
         (SELECT COUNT(*) FROM perfil_habilidad ph
          JOIN perfil_aprendiz pa ON ph.perfil_id = pa.perfil_id
          WHERE pa.usuario_id = $1) AS total_habilidades`,
      [userId]
    );

    // Evaluación diagnóstica y learning path
    const evalResult = await pool.query(
      'SELECT evaluacion_id, nivel_general FROM evaluacion_diagnostica WHERE usuario_id = $1', [userId]
    );
    const pathResult = await pool.query(
      'SELECT path_id, titulo FROM learning_path WHERE usuario_id = $1', [userId]
    );

    res.json({
      success: true,
      data: {
        score_empleabilidad: score,
        okrs_activos: okrsResult.rows,
        proximas_sesiones: sessionsResult.rows,
        stats: statsResult.rows[0] || { okrs_completados: 0, sesiones_realizadas: 0, total_habilidades: 0 },
        onboarding: {
          evaluacion_completada: evalResult.rows.length > 0,
          nivel_general: evalResult.rows[0]?.nivel_general || null,
          learning_path_generado: pathResult.rows.length > 0,
          learning_path_titulo: pathResult.rows[0]?.titulo || null,
        },
      },
    });
  } catch (err) { next(err); }
};
