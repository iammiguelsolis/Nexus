import { Response, NextFunction } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../types';

/**
 * UC-26: Recibir notificaciones
 * GET /api/v1/notifications
 */
export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const result = await pool.query(
      `SELECT * FROM notificacion
       WHERE usuario_id = $1
       ORDER BY fecha_creacion DESC
       LIMIT 50`,
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/notifications/unread-count
 */
export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as total FROM notificacion WHERE usuario_id = $1 AND leida = false`,
      [req.user?.userId]
    );
    res.json({ success: true, data: { unread: parseInt(result.rows[0].total) } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/notifications/:notificationId/read
 */
export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { notificationId } = req.params;
  try {
    const result = await pool.query(
      `UPDATE notificacion SET leida = true WHERE notificacion_id = $1 AND usuario_id = $2 RETURNING *`,
      [notificationId, req.user?.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Notificación no encontrada', code: 'NOT_FOUND' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/notifications/read-all
 */
export const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await pool.query(
      `UPDATE notificacion SET leida = true WHERE usuario_id = $1 AND leida = false`,
      [req.user?.userId]
    );
    res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
  } catch (err) {
    next(err);
  }
};
