import { Response, NextFunction } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../types';

/**
 * GET /api/v1/profile/me
 * UC-04 / UC-05: Obtener mi perfil completo con habilidades
 */
export const getMyProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado', code: 'AUTH_REQUIRED' }); return; }

    const userResult = await pool.query(
      `SELECT u.usuario_id, u.nombres, u.apellidos, u.email, u.rol, u.fecha_registro,
              pa.perfil_id, pa.resumen_bio, pa.score_empleabilidad, pa.url_portafolio,
              m.mentor_id, m.especialidades, m.anios_experiencia, m.calificacion_promedio, m.bio_profesional
       FROM usuario u
       LEFT JOIN perfil_aprendiz pa ON u.usuario_id = pa.usuario_id
       LEFT JOIN mentor m ON u.usuario_id = m.usuario_id
       WHERE u.usuario_id = $1 AND u.activo = true`,
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado', code: 'USER_NOT_FOUND' }); return;
    }

    const profile = userResult.rows[0];

    // Obtener habilidades si es Padawan
    let habilidades: unknown[] = [];
    if (profile.perfil_id) {
      const skillsResult = await pool.query(
        `SELECT ph.ph_id, ph.nivel, ph.fecha_adquisicion,
                h.habilidad_id, h.nombre, h.categoria, h.descripcion
         FROM perfil_habilidad ph
         JOIN habilidad h ON ph.habilidad_id = h.habilidad_id
         WHERE ph.perfil_id = $1
         ORDER BY h.categoria, h.nombre`,
        [profile.perfil_id]
      );
      habilidades = skillsResult.rows;
    }

    res.json({ success: true, data: { ...profile, habilidades } });
  } catch (err) { next(err); }
};

/**
 * PUT /api/v1/profile/me
 * UC-05: Actualizar perfil profesional (Padawan o Jedi)
 */
export const updateMyProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado', code: 'AUTH_REQUIRED' }); return; }

    const { nombres, apellidos, resumen_bio, url_portafolio, especialidades, anios_experiencia, bio_profesional } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Actualizar datos del usuario si se enviaron
      if (nombres || apellidos) {
        const sets: string[] = [];
        const vals: unknown[] = [];
        let idx = 1;
        if (nombres)   { sets.push(`nombres = $${idx++}`);   vals.push(nombres); }
        if (apellidos) { sets.push(`apellidos = $${idx++}`); vals.push(apellidos); }
        vals.push(req.user.userId);
        await client.query(`UPDATE usuario SET ${sets.join(', ')} WHERE usuario_id = $${idx}`, vals);
      }

      // Actualizar perfil_aprendiz si es Padawan
      if (req.user.rol === 'Padawan') {
        const paFields: string[] = [];
        const paVals: unknown[] = [];
        let pi = 1;
        if (resumen_bio !== undefined)   { paFields.push(`resumen_bio = $${pi++}`);   paVals.push(resumen_bio); }
        if (url_portafolio !== undefined) { paFields.push(`url_portafolio = $${pi++}`); paVals.push(url_portafolio); }
        if (paFields.length > 0) {
          paFields.push(`fecha_actualizacion = NOW()`);
          paVals.push(req.user.userId);
          await client.query(`UPDATE perfil_aprendiz SET ${paFields.join(', ')} WHERE usuario_id = $${pi}`, paVals);
        }
      }

      // Actualizar mentor si es Jedi
      if (req.user.rol === 'Jedi') {
        const mFields: string[] = [];
        const mVals: unknown[] = [];
        let mi = 1;
        if (especialidades !== undefined)    { mFields.push(`especialidades = $${mi++}`);    mVals.push(especialidades); }
        if (anios_experiencia !== undefined)  { mFields.push(`anios_experiencia = $${mi++}`); mVals.push(anios_experiencia); }
        if (bio_profesional !== undefined)    { mFields.push(`bio_profesional = $${mi++}`);   mVals.push(bio_profesional); }
        if (mFields.length > 0) {
          mVals.push(req.user.userId);
          await client.query(`UPDATE mentor SET ${mFields.join(', ')} WHERE usuario_id = $${mi}`, mVals);
        }
      }

      await client.query('COMMIT');

      // Devolver perfil actualizado
      const updated = await pool.query(
        `SELECT u.usuario_id, u.nombres, u.apellidos, u.email, u.rol,
                pa.resumen_bio, pa.score_empleabilidad, pa.url_portafolio,
                m.especialidades, m.anios_experiencia, m.bio_profesional
         FROM usuario u
         LEFT JOIN perfil_aprendiz pa ON u.usuario_id = pa.usuario_id
         LEFT JOIN mentor m ON u.usuario_id = m.usuario_id
         WHERE u.usuario_id = $1`,
        [req.user.userId]
      );

      console.log(`[PROFILE] Updated profile for: ${req.user.email}`);
      res.json({ success: true, data: updated.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
};

/**
 * GET /api/v1/profile/skills
 * UC-04: Listar catálogo de habilidades disponibles
 */
export const listSkills = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT habilidad_id, nombre, categoria, descripcion FROM habilidad ORDER BY categoria, nombre'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/profile/skills
 * UC-04: Agregar habilidad al perfil del Padawan
 */
export const addSkill = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado', code: 'AUTH_REQUIRED' }); return; }
    if (req.user.rol !== 'Padawan') {
      res.status(403).json({ error: 'Solo Padawans pueden agregar habilidades a su perfil', code: 'FORBIDDEN' }); return;
    }

    const { habilidad_id, nivel } = req.body;

    // Obtener perfil_id
    const perfilResult = await pool.query(
      'SELECT perfil_id FROM perfil_aprendiz WHERE usuario_id = $1', [req.user.userId]
    );
    if (perfilResult.rows.length === 0) {
      res.status(404).json({ error: 'Perfil no encontrado', code: 'PROFILE_NOT_FOUND' }); return;
    }
    const perfil_id = perfilResult.rows[0].perfil_id;

    // Verificar que no exista ya
    const existing = await pool.query(
      'SELECT ph_id FROM perfil_habilidad WHERE perfil_id = $1 AND habilidad_id = $2',
      [perfil_id, habilidad_id]
    );
    if (existing.rows.length > 0) {
      // Actualizar nivel
      await pool.query(
        'UPDATE perfil_habilidad SET nivel = $1 WHERE perfil_id = $2 AND habilidad_id = $3',
        [nivel, perfil_id, habilidad_id]
      );
    } else {
      await pool.query(
        `INSERT INTO perfil_habilidad (perfil_id, habilidad_id, nivel, fecha_adquisicion)
         VALUES ($1, $2, $3, CURRENT_DATE)`,
        [perfil_id, habilidad_id, nivel]
      );
    }

    console.log(`[PROFILE] Skill added/updated for user: ${req.user.email}`);
    res.status(201).json({ success: true, message: 'Habilidad registrada' });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/v1/profile/skills/:habilidadId
 * UC-04: Quitar habilidad del perfil
 */
export const removeSkill = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado', code: 'AUTH_REQUIRED' }); return; }

    const perfilResult = await pool.query(
      'SELECT perfil_id FROM perfil_aprendiz WHERE usuario_id = $1', [req.user.userId]
    );
    if (perfilResult.rows.length === 0) {
      res.status(404).json({ error: 'Perfil no encontrado', code: 'PROFILE_NOT_FOUND' }); return;
    }

    await pool.query(
      'DELETE FROM perfil_habilidad WHERE perfil_id = $1 AND habilidad_id = $2',
      [perfilResult.rows[0].perfil_id, req.params.habilidadId]
    );

    res.json({ success: true, message: 'Habilidad eliminada' });
  } catch (err) { next(err); }
};

/**
 * GET /api/v1/profile/user/:userId
 * UC-06: Ver perfil público de otro usuario
 */
export const getUserProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    const userResult = await pool.query(
      `SELECT u.usuario_id, u.nombres, u.apellidos, u.rol, u.fecha_registro,
              pa.resumen_bio, pa.score_empleabilidad, pa.url_portafolio,
              m.especialidades, m.anios_experiencia, m.calificacion_promedio, m.bio_profesional
       FROM usuario u
       LEFT JOIN perfil_aprendiz pa ON u.usuario_id = pa.usuario_id
       LEFT JOIN mentor m ON u.usuario_id = m.usuario_id
       WHERE u.usuario_id = $1 AND u.activo = true`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado', code: 'USER_NOT_FOUND' }); return;
    }

    const profile = userResult.rows[0];

    // Obtener habilidades si es Padawan
    let habilidades: unknown[] = [];
    if (profile.rol === 'Padawan') {
      const skillsResult = await pool.query(
        `SELECT h.nombre, h.categoria, ph.nivel
         FROM perfil_habilidad ph
         JOIN habilidad h ON ph.habilidad_id = h.habilidad_id
         JOIN perfil_aprendiz pa ON ph.perfil_id = pa.perfil_id
         WHERE pa.usuario_id = $1
         ORDER BY h.categoria, h.nombre`,
        [userId]
      );
      habilidades = skillsResult.rows;
    }

    // No exponer email en perfil público
    res.json({ success: true, data: { ...profile, habilidades } });
  } catch (err) { next(err); }
};
