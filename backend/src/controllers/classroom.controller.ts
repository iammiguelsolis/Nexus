import { Response, NextFunction } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../types';

/** Verify user belongs to matching */
const verifyAccess = async (matchingId: string, userId: string): Promise<boolean> => {
  const r = await pool.query(
    `SELECT m.matching_id FROM matching m
     LEFT JOIN mentor mt ON m.mentor_id = mt.mentor_id
     LEFT JOIN perfil_aprendiz pa ON m.padawan_id = pa.perfil_id
     WHERE m.matching_id = $1 AND m.estado = 'Activo'
       AND (mt.usuario_id = $2 OR pa.usuario_id = $2)`,
    [matchingId, userId]
  );
  return r.rows.length > 0;
};

/** GET /api/v1/classroom/:matchingId/feed */
export const getClassroomFeed = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { matchingId } = req.params;
  try {
    if (!(await verifyAccess(matchingId, req.user!.userId))) {
      res.status(403).json({ error: 'No autorizado', code: 'FORBIDDEN' }); return;
    }
    const posts = await pool.query(
      `SELECT p.*, u.nombres as autor_nombres, u.apellidos as autor_apellidos, u.rol as autor_rol,
        (SELECT json_agg(json_build_object(
          'comentario_id', c.comentario_id, 'contenido', c.contenido,
          'fecha_creacion', c.fecha_creacion, 'autor_id', c.autor_id,
          'autor_nombres', uc.nombres, 'autor_apellidos', uc.apellidos, 'autor_rol', uc.rol
        ) ORDER BY c.fecha_creacion ASC)
        FROM aula_comentario c JOIN usuario uc ON c.autor_id = uc.usuario_id WHERE c.post_id = p.post_id) as comentarios,
        (SELECT json_agg(json_build_object(
          'recurso_id', r.recurso_id, 'nombre', r.nombre, 'url', r.url, 'tipo', r.tipo
        )) FROM aula_recurso r WHERE r.post_id = p.post_id) as recursos
       FROM aula_post p JOIN usuario u ON p.autor_id = u.usuario_id
       WHERE p.matching_id = $1
       ORDER BY p.fijado DESC, p.fecha_creacion DESC`,
      [matchingId]
    );
    res.json({ success: true, data: posts.rows });
  } catch (err) { next(err); }
};

/** POST /api/v1/classroom/:matchingId/posts */
export const createPost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { matchingId } = req.params;
  const { tipo, titulo, contenido, url_enlace } = req.body;
  try {
    if (!(await verifyAccess(matchingId, req.user!.userId))) {
      res.status(403).json({ error: 'No autorizado', code: 'FORBIDDEN' }); return;
    }
    const result = await pool.query(
      `INSERT INTO aula_post (matching_id, autor_id, tipo, titulo, contenido, url_enlace)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [matchingId, req.user!.userId, tipo, titulo || null, contenido, url_enlace || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/** DELETE /api/v1/classroom/posts/:postId */
export const deletePost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { postId } = req.params;
  try {
    const check = await pool.query('SELECT autor_id FROM aula_post WHERE post_id = $1', [postId]);
    if (check.rows.length === 0) { res.status(404).json({ error: 'Post no encontrado' }); return; }
    if (check.rows[0].autor_id !== req.user!.userId && req.user!.rol !== 'Jedi') {
      res.status(403).json({ error: 'No autorizado' }); return;
    }
    await pool.query('DELETE FROM aula_post WHERE post_id = $1', [postId]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

/** PATCH /api/v1/classroom/posts/:postId/pin */
export const togglePin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (req.user!.rol !== 'Jedi') { res.status(403).json({ error: 'Solo mentores pueden fijar' }); return; }
  try {
    const result = await pool.query(
      'UPDATE aula_post SET fijado = NOT fijado WHERE post_id = $1 RETURNING *', [req.params.postId]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Post no encontrado' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/** POST /api/v1/classroom/posts/:postId/comments */
export const addComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pool.query(
      `INSERT INTO aula_comentario (post_id, autor_id, contenido) VALUES ($1, $2, $3) RETURNING *`,
      [req.params.postId, req.user!.userId, req.body.contenido]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/** DELETE /api/v1/classroom/comments/:commentId */
export const deleteComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const check = await pool.query('SELECT autor_id FROM aula_comentario WHERE comentario_id = $1', [req.params.commentId]);
    if (check.rows.length === 0) { res.status(404).json({ error: 'No encontrado' }); return; }
    if (check.rows[0].autor_id !== req.user!.userId && req.user!.rol !== 'Jedi') {
      res.status(403).json({ error: 'No autorizado' }); return;
    }
    await pool.query('DELETE FROM aula_comentario WHERE comentario_id = $1', [req.params.commentId]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

/** POST /api/v1/classroom/posts/:postId/resources */
export const addResource = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { nombre, url, tipo } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO aula_recurso (post_id, nombre, url, tipo) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.postId, nombre, url, tipo || 'otro']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/** GET /api/v1/classroom/:matchingId/people */
export const getClassroomPeople = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { matchingId } = req.params;
  try {
    if (!(await verifyAccess(matchingId, req.user!.userId))) {
      res.status(403).json({ error: 'No autorizado' }); return;
    }
    const result = await pool.query(
      `SELECT
         u_mentor.usuario_id as mentor_usuario_id, u_mentor.nombres as mentor_nombres,
         u_mentor.apellidos as mentor_apellidos, u_mentor.email as mentor_email,
         mt.especialidades, mt.anios_experiencia, mt.bio_profesional, mt.calificacion_promedio,
         u_padawan.usuario_id as padawan_usuario_id, u_padawan.nombres as padawan_nombres,
         u_padawan.apellidos as padawan_apellidos, u_padawan.email as padawan_email,
         pa.resumen_bio, pa.score_empleabilidad, pa.url_portafolio,
         m.score_afinidad, m.fecha_asignacion
       FROM matching m
       JOIN mentor mt ON m.mentor_id = mt.mentor_id
       JOIN usuario u_mentor ON mt.usuario_id = u_mentor.usuario_id
       JOIN perfil_aprendiz pa ON m.padawan_id = pa.perfil_id
       JOIN usuario u_padawan ON pa.usuario_id = u_padawan.usuario_id
       WHERE m.matching_id = $1`, [matchingId]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'No encontrado' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};
