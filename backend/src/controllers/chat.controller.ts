import { Response, NextFunction } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../types';

/** GET /api/v1/chat/:matchingId/messages */
export const getChatMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { matchingId } = req.params;
  const userId = req.user!.userId;
  try {
    const access = await pool.query(
      `SELECT m.matching_id FROM matching m
       LEFT JOIN mentor mt ON m.mentor_id = mt.mentor_id
       LEFT JOIN perfil_aprendiz pa ON m.padawan_id = pa.perfil_id
       WHERE m.matching_id = $1 AND (mt.usuario_id = $2 OR pa.usuario_id = $2)`,
      [matchingId, userId]
    );
    if (access.rows.length === 0) { res.status(403).json({ error: 'No autorizado' }); return; }

    const messages = await pool.query(
      `SELECT mc.*, u.nombres as emisor_nombres, u.apellidos as emisor_apellidos, u.rol as emisor_rol
       FROM mensaje_chat mc JOIN usuario u ON mc.emisor_id = u.usuario_id
       WHERE mc.matching_id = $1 ORDER BY mc.fecha_envio ASC LIMIT 200`,
      [matchingId]
    );

    // Mark messages from other person as read
    await pool.query(
      `UPDATE mensaje_chat SET leido = true
       WHERE matching_id = $1 AND emisor_id != $2 AND leido = false`,
      [matchingId, userId]
    );

    res.json({ success: true, data: messages.rows });
  } catch (err) { next(err); }
};

/** POST /api/v1/chat/:matchingId/messages */
export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { matchingId } = req.params;
  const userId = req.user!.userId;
  try {
    const access = await pool.query(
      `SELECT m.matching_id FROM matching m
       LEFT JOIN mentor mt ON m.mentor_id = mt.mentor_id
       LEFT JOIN perfil_aprendiz pa ON m.padawan_id = pa.perfil_id
       WHERE m.matching_id = $1 AND (mt.usuario_id = $2 OR pa.usuario_id = $2)`,
      [matchingId, userId]
    );
    if (access.rows.length === 0) { res.status(403).json({ error: 'No autorizado' }); return; }

    const result = await pool.query(
      `INSERT INTO mensaje_chat (matching_id, emisor_id, contenido)
       VALUES ($1, $2, $3) RETURNING *`,
      [matchingId, userId, req.body.contenido]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/** GET /api/v1/chat/:matchingId/unread */
export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { matchingId } = req.params;
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int as count FROM mensaje_chat
       WHERE matching_id = $1 AND emisor_id != $2 AND leido = false`,
      [matchingId, req.user!.userId]
    );
    res.json({ success: true, data: { unread: result.rows[0].count } });
  } catch (err) { next(err); }
};
