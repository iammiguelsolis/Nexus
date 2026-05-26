import { Response, NextFunction } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../types';

/**
 * GET /api/v1/matchings/me
 * UC-10: Obtener mis matchings (Padawan ve sus mentores, Jedi ve sus padawans)
 */
export const getMyMatchings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }

    let query: string;
    const params = [req.user.userId];

    if (req.user.rol === 'Padawan') {
      query = `
        SELECT m.matching_id, m.score_afinidad, m.fecha_asignacion, m.estado,
               u.nombres AS mentor_nombres, u.apellidos AS mentor_apellidos,
               mt.especialidades, mt.anios_experiencia, mt.calificacion_promedio,
               mt.usuario_id AS mentor_usuario_id
        FROM matching m
        JOIN perfil_aprendiz pa ON m.padawan_id = pa.perfil_id
        JOIN mentor mt ON m.mentor_id = mt.mentor_id
        JOIN usuario u ON mt.usuario_id = u.usuario_id
        WHERE pa.usuario_id = $1
        ORDER BY m.fecha_asignacion DESC`;
    } else {
      query = `
        SELECT m.matching_id, m.score_afinidad, m.fecha_asignacion, m.estado,
               u.nombres AS padawan_nombres, u.apellidos AS padawan_apellidos,
               pa.resumen_bio, pa.score_empleabilidad,
               pa.usuario_id AS padawan_usuario_id
        FROM matching m
        JOIN mentor mt ON m.mentor_id = mt.mentor_id
        JOIN perfil_aprendiz pa ON m.padawan_id = pa.perfil_id
        JOIN usuario u ON pa.usuario_id = u.usuario_id
        WHERE mt.usuario_id = $1
        ORDER BY m.fecha_asignacion DESC`;
    }

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/matchings/generate
 * UC-10: Generar matching automático para un Padawan
 */
export const generateMatching = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    if (req.user.rol !== 'Padawan') {
      res.status(403).json({ error: 'Solo los Padawans pueden solicitar matching' }); return;
    }

    // Obtener perfil del Padawan
    const perfilResult = await pool.query(
      'SELECT perfil_id FROM perfil_aprendiz WHERE usuario_id = $1', [req.user.userId]
    );
    if (perfilResult.rows.length === 0) {
      res.status(404).json({ error: 'Perfil no encontrado' }); return;
    }
    const perfilId = perfilResult.rows[0].perfil_id;

    // Verificar si ya tiene matching activo o pendiente
    const existing = await pool.query(
      "SELECT matching_id FROM matching WHERE padawan_id = $1 AND estado IN ('Pendiente','Activo')",
      [perfilId]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Ya tienes un matching activo o pendiente', code: 'MATCHING_EXISTS' }); return;
    }

    // Obtener habilidades del Padawan
    const padawanSkills = await pool.query(
      'SELECT habilidad_id FROM perfil_habilidad WHERE perfil_id = $1', [perfilId]
    );
    const padawanSkillIds = padawanSkills.rows.map((r: { habilidad_id: string }) => r.habilidad_id);

    // Buscar mentores disponibles y calcular afinidad
    const mentorsResult = await pool.query(
      `SELECT mt.mentor_id, mt.especialidades, mt.anios_experiencia, mt.calificacion_promedio,
              u.nombres, u.apellidos
       FROM mentor mt
       JOIN usuario u ON mt.usuario_id = u.usuario_id
       WHERE u.activo = true
       AND mt.mentor_id NOT IN (
         SELECT mentor_id FROM matching WHERE padawan_id = $1 AND estado IN ('Pendiente','Activo')
       )
       ORDER BY mt.calificacion_promedio DESC`,
      [perfilId]
    );

    if (mentorsResult.rows.length === 0) {
      res.status(404).json({ error: 'No hay mentores disponibles en este momento', code: 'NO_MENTORS' }); return;
    }

    // Algoritmo simple de scoring
    const bestMentor = mentorsResult.rows[0];
    const scoreBase = (bestMentor.calificacion_promedio / 5) * 0.4 + Math.min(bestMentor.anios_experiencia / 10, 1) * 0.3;
    const skillBonus = padawanSkillIds.length > 0 ? 0.3 : 0.1;
    const score = Math.min(Number((scoreBase + skillBonus).toFixed(4)), 1.0);

    // Crear matching con estado Pendiente
    const matchResult = await pool.query(
      `INSERT INTO matching (padawan_id, mentor_id, score_afinidad, estado)
       VALUES ($1, $2, $3, 'Pendiente') RETURNING *`,
      [perfilId, bestMentor.mentor_id, score]
    );

    console.log(`[MATCHING] Generated: Padawan=${req.user.email}, Mentor=${bestMentor.nombres} ${bestMentor.apellidos}, Score=${score}`);
    res.status(201).json({
      success: true,
      data: { ...matchResult.rows[0], mentor_nombres: bestMentor.nombres, mentor_apellidos: bestMentor.apellidos },
    });
  } catch (err) { next(err); }
};

/**
 * PATCH /api/v1/matchings/:matchingId/respond
 * UC-11: Aceptar o rechazar un matching (Mentor Jedi)
 */
export const respondMatching = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    if (req.user.rol !== 'Jedi') {
      res.status(403).json({ error: 'Solo los Mentores pueden responder matchings' }); return;
    }

    const { matchingId } = req.params;
    const { accion } = req.body; // 'aceptar' o 'rechazar'

    if (!['aceptar', 'rechazar'].includes(accion)) {
      res.status(400).json({ error: 'Acción debe ser "aceptar" o "rechazar"' }); return;
    }

    // Verificar que el matching es del mentor
    const matchResult = await pool.query(
      `SELECT m.* FROM matching m
       JOIN mentor mt ON m.mentor_id = mt.mentor_id
       WHERE m.matching_id = $1 AND mt.usuario_id = $2 AND m.estado = 'Pendiente'`,
      [matchingId, req.user.userId]
    );

    if (matchResult.rows.length === 0) {
      res.status(404).json({ error: 'Matching no encontrado o ya procesado', code: 'MATCHING_NOT_FOUND' }); return;
    }

    const nuevoEstado = accion === 'aceptar' ? 'Activo' : 'Cancelado';

    const updated = await pool.query(
      'UPDATE matching SET estado = $1 WHERE matching_id = $2 RETURNING *',
      [nuevoEstado, matchingId]
    );

    console.log(`[MATCHING] ${accion}: ${matchingId} by ${req.user.email}`);
    res.json({ success: true, data: updated.rows[0] });
  } catch (err) { next(err); }
};
