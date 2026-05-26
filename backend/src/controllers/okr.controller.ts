import { Response, NextFunction } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../types';

/**
 * POST /api/v1/sessions/:sesionId/okrs
 */
export const createOKR = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { sesionId } = req.params;
  const { descripcion, indicador, valor_meta, fecha_limite } = req.body;

  try {
    const sessionCheck = await pool.query(
      'SELECT sesion_id FROM sesion_mentoria WHERE sesion_id = $1', [sesionId]
    );
    if (sessionCheck.rows.length === 0) {
      res.status(404).json({ error: 'Sesión no encontrada', code: 'SESSION_NOT_FOUND' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO okr (sesion_id, descripcion, indicador, valor_meta, fecha_limite)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [sesionId, descripcion, indicador || null, valor_meta, fecha_limite || null]
    );

    console.log(`[OKR] Created OKR for session ${sesionId}`);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/sessions/:sesionId/okrs
 */
export const listOKRs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { sesionId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM okr WHERE sesion_id = $1 ORDER BY fecha_actualizacion DESC`,
      [sesionId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/okrs/:okrId
 */
export const updateOKR = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { okrId } = req.params;
  const fields = req.body;
  const updates: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined) {
      updates.push(`${key} = $${idx++}`);
      values.push(val);
    }
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No se proporcionaron campos', code: 'NO_FIELDS' });
    return;
  }

  updates.push(`fecha_actualizacion = NOW()`);
  values.push(okrId);

  try {
    const result = await pool.query(
      `UPDATE okr SET ${updates.join(', ')} WHERE okr_id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'OKR no encontrado', code: 'OKR_NOT_FOUND' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/okrs/:okrId — Soft cancel
 */
export const deleteOKR = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { okrId } = req.params;

  try {
    const result = await pool.query(
      `UPDATE okr SET estado = 'Cancelado', fecha_actualizacion = NOW()
       WHERE okr_id = $1 AND estado != 'Cancelado' RETURNING *`,
      [okrId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'OKR no encontrado o ya cancelado', code: 'OKR_NOT_FOUND' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/okrs/:okrId/complete
 * ACID TRANSACTION — The critical business transaction.
 */
export const completeOKR = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { okrId } = req.params;
  const { valor_actual, nota_cierre } = req.body;
  const userId = req.user?.userId;

  const client = await pool.connect();
  try {
    // RN-01: Verify ownership — now the MENTOR grades
    const ownerCheck = await client.query(
      `SELECT o.okr_id, o.estado, o.valor_meta, o.valor_actual as valor_previo,
              mt.usuario_id as mentor_usuario_id,
              pa.usuario_id as padawan_usuario_id, pa.perfil_id
       FROM okr o
       JOIN sesion_mentoria sm ON o.sesion_id = sm.sesion_id
       JOIN matching m ON sm.matching_id = m.matching_id
       JOIN mentor mt ON m.mentor_id = mt.mentor_id
       JOIN perfil_aprendiz pa ON m.padawan_id = pa.perfil_id
       WHERE o.okr_id = $1`,
      [okrId]
    );

    if (ownerCheck.rows.length === 0) {
      res.status(404).json({ error: 'OKR no encontrado', code: 'OKR_NOT_FOUND' });
      return;
    }

    const okr = ownerCheck.rows[0];

    // Allow both mentor and padawan to complete
    if (okr.mentor_usuario_id !== userId && okr.padawan_usuario_id !== userId) {
      res.status(403).json({
        error: 'No autorizado para calificar este OKR',
        code: 'FORBIDDEN',
      });
      return;
    }

    // RN-02: Verify state is EnProgreso (submitted by student)
    if (okr.estado !== 'EnProgreso') {
      res.status(409).json({
        error: `El OKR debe estar entregado (EnProgreso) para poder calificarse`,
        code: 'INVALID_STATE_TRANSITION',
        details: {
          estadoActual: okr.estado,
          transicionesValidas: ['EnProgreso → Completado'],
        },
      });
      return;
    }

    // BEGIN TRANSACTION
    await client.query('BEGIN');

    // UPDATE okr
    await client.query(
      `UPDATE okr SET estado = 'Completado', valor_actual = $1,
       fecha_actualizacion = NOW() WHERE okr_id = $2`,
      [valor_actual, okrId]
    );

    // RN-04: INSERT audit trail
    await client.query(
      `INSERT INTO okr_historial
       (okr_id, estado_anterior, estado_nuevo, valor_actual_registrado, usuario_id, ip_origen)
       VALUES ($1, 'EnProgreso', 'Completado', $2, $3, $4)`,
      [okrId, valor_actual, userId, req.ip]
    );

    // RN-05: Update employability score (+12 per OKR, capped at 100)
    await client.query(
      `UPDATE perfil_aprendiz
       SET score_empleabilidad = LEAST(100, score_empleabilidad + 12),
           fecha_actualizacion = NOW()
       WHERE usuario_id = $1`,
      [okr.padawan_usuario_id]
    );

    // RN-06: COMMIT
    await client.query('COMMIT');

    // RN-07: Async notification (simulated for MVP)
    setImmediate(() => {
      console.log(
        `[ASYNC] Notificar mentor del padawan ${userId} — OKR ${okrId} completado. Nota: ${nota_cierre}`
      );
    });

    // Fetch updated data
    const { rows } = await client.query(
      `SELECT o.*, pa.score_empleabilidad as nuevo_score
       FROM okr o
       JOIN sesion_mentoria sm ON o.sesion_id = sm.sesion_id
       JOIN matching m ON sm.matching_id = m.matching_id
       JOIN perfil_aprendiz pa ON m.padawan_id = pa.perfil_id
       WHERE o.okr_id = $1`,
      [okrId]
    );

    res.status(200).json({ success: true, okr: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * PATCH /api/v1/okrs/:okrId/feedback
 * UC-19: Mentor da feedback sobre un OKR completado.
 */
export const feedbackOKR = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { okrId } = req.params;
  const { accion, comentario } = req.body; // 'aprobar' | 'revisar'
  const userId = req.user?.userId;

  try {
    if (req.user?.rol !== 'Jedi') {
      res.status(403).json({ error: 'Solo el Mentor Jedi puede dar feedback', code: 'FORBIDDEN' });
      return;
    }

    if (!['aprobar', 'revisar'].includes(accion)) {
      res.status(400).json({ error: 'Acción debe ser "aprobar" o "revisar"' });
      return;
    }

    // Verify OKR belongs to this mentor's matching
    const check = await pool.query(
      `SELECT o.okr_id, o.estado
       FROM okr o
       JOIN sesion_mentoria sm ON o.sesion_id = sm.sesion_id
       JOIN matching m ON sm.matching_id = m.matching_id
       JOIN mentor mt ON m.mentor_id = mt.mentor_id
       WHERE o.okr_id = $1 AND mt.usuario_id = $2`,
      [okrId, userId]
    );

    if (check.rows.length === 0) {
      res.status(404).json({ error: 'OKR no encontrado o no autorizado', code: 'OKR_NOT_FOUND' });
      return;
    }

    if (accion === 'aprobar') {
      // Insert audit trail
      await pool.query(
        `INSERT INTO okr_historial (okr_id, estado_anterior, estado_nuevo, valor_actual_registrado, usuario_id, ip_origen)
         VALUES ($1, $2, 'Completado', 0, $3, $4)`,
        [okrId, check.rows[0].estado, userId, req.ip]
      );

      const result = await pool.query(
        `UPDATE okr SET notas = COALESCE(notas, '') || E'\n[Feedback Mentor]: ' || $1, fecha_actualizacion = NOW()
         WHERE okr_id = $2 RETURNING *`,
        [comentario || 'Aprobado ✓', okrId]
      );

      console.log(`[OKR] Feedback approved: ${okrId} by ${req.user?.email}`);
      res.json({ success: true, data: result.rows[0] });
    } else {
      // Revert to EnProgreso for revision
      await pool.query(
        `INSERT INTO okr_historial (okr_id, estado_anterior, estado_nuevo, valor_actual_registrado, usuario_id, ip_origen)
         VALUES ($1, 'Completado', 'EnProgreso', 0, $2, $3)`,
        [okrId, userId, req.ip]
      );

      const result = await pool.query(
        `UPDATE okr SET estado = 'EnProgreso', notas = COALESCE(notas, '') || E'\n[Revisión Mentor]: ' || $1, fecha_actualizacion = NOW()
         WHERE okr_id = $2 RETURNING *`,
        [comentario || 'Requiere revisión', okrId]
      );

      console.log(`[OKR] Feedback revision requested: ${okrId} by ${req.user?.email}`);
      res.json({ success: true, data: result.rows[0] });
    }
  } catch (err) {
    next(err);
  }
};
