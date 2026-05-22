import { Response } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../types';

export const profileController = {
  /**
   * Agregar una habilidad al perfil del aprendiz
   * POST /api/v1/profiles/:profileId/skills
   */
  async addSkillToProfile(req: AuthRequest, res: Response) {
    try {
      const { profileId } = req.params;
      const { habilidad_id, nivel, fecha_adquisicion } = req.body;
      const userId = req.user!.userId;

      // 1. Verificar que el usuario es un Padawan
      const userResult = await pool.query(
        'SELECT usuario_id, rol FROM usuario WHERE usuario_id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND',
          statusCode: 404,
        });
      }

      const user = userResult.rows[0];
      if (user.rol !== 'Padawan') {
        return res.status(403).json({
          error: 'Solo los Padawans pueden agregar habilidades',
          code: 'FORBIDDEN_ROLE',
          statusCode: 403,
        });
      }

      // 2. Verificar que el perfil pertenece al usuario
      const profileResult = await pool.query(
        'SELECT perfil_id, usuario_id FROM perfil_aprendiz WHERE perfil_id = $1',
        [profileId]
      );

      if (profileResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Perfil no encontrado',
          code: 'PROFILE_NOT_FOUND',
          statusCode: 404,
        });
      }

      const profile = profileResult.rows[0];
      if (profile.usuario_id !== userId) {
        return res.status(403).json({
          error: 'No tienes permiso para modificar este perfil',
          code: 'FORBIDDEN_PROFILE',
          statusCode: 403,
        });
      }

      // 3. Verificar que la habilidad existe
      const skillResult = await pool.query(
        'SELECT habilidad_id, nombre, categoria FROM habilidad WHERE habilidad_id = $1',
        [habilidad_id]
      );

      if (skillResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Habilidad no encontrada',
          code: 'SKILL_NOT_FOUND',
          statusCode: 404,
        });
      }

      const skill = skillResult.rows[0];

      // 4. Verificar que no exista un registro duplicado
      const duplicateResult = await pool.query(
        'SELECT ph_id FROM perfil_habilidad WHERE perfil_id = $1 AND habilidad_id = $2',
        [profileId, habilidad_id]
      );

      if (duplicateResult.rows.length > 0) {
        return res.status(409).json({
          error: `Ya tienes registrada la habilidad "${skill.nombre}"`,
          code: 'SKILL_ALREADY_EXISTS',
          statusCode: 409,
        });
      }

      // 5. Insertar la habilidad en el perfil
      const insertResult = await pool.query(
        `INSERT INTO perfil_habilidad (perfil_id, habilidad_id, nivel, fecha_adquisicion, validado_por)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING ph_id, perfil_id, habilidad_id, nivel, fecha_adquisicion, validado_por`,
        [profileId, habilidad_id, nivel, fecha_adquisicion || null, null]
      );

      const nuevaHabilidad = insertResult.rows[0];

      // 6. Recalcular el score_empleabilidad del perfil
      const scoreResult = await pool.query(
        `SELECT 
           COUNT(CASE WHEN nivel = 'Basico' THEN 1 END) * 5 +
           COUNT(CASE WHEN nivel = 'Intermedio' THEN 1 END) * 10 +
           COUNT(CASE WHEN nivel = 'Avanzado' THEN 1 END) * 15 AS total_score
         FROM perfil_habilidad
         WHERE perfil_id = $1`,
        [profileId]
      );

      let nuevoScore = scoreResult.rows[0]?.total_score || 0;
      nuevoScore = Math.min(100, nuevoScore); // Cap a 100

      // 7. Actualizar el score en el perfil
      await pool.query(
        'UPDATE perfil_aprendiz SET score_empleabilidad = $1 WHERE perfil_id = $2',
        [nuevoScore, profileId]
      );

      // 8. Log de auditoría
      console.log(`[PROFILE] User ${userId} agregó la habilidad "${skill.nombre}" (${nivel}) a su perfil. Score actualizado a ${nuevoScore}%`);

      return res.status(201).json({
        message: 'Habilidad agregada exitosamente',
        data: {
          ...nuevaHabilidad,
          nombre_habilidad: skill.nombre,
          categoria_habilidad: skill.categoria,
        },
        score_actualizado: nuevoScore,
      });
    } catch (error) {
      console.error('[PROFILE] Error al agregar habilidad:', error);
      return res.status(500).json({
        error: 'Error al registrar la habilidad',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  },

  /**
   * Obtener todas las habilidades del perfil del aprendiz
   * GET /api/v1/profiles/:profileId/skills
   */
  async getProfileSkills(req: AuthRequest, res: Response) {
    try {
      const { profileId } = req.params;

      const result = await pool.query(
        `SELECT 
           ph.ph_id,
           ph.perfil_id,
           ph.habilidad_id,
           h.nombre,
           h.categoria,
           h.descripcion,
           ph.nivel,
           ph.fecha_adquisicion,
           ph.validado_por
         FROM perfil_habilidad ph
         JOIN habilidad h ON ph.habilidad_id = h.habilidad_id
         WHERE ph.perfil_id = $1
         ORDER BY h.nombre`,
        [profileId]
      );

      return res.status(200).json({
        data: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error('[PROFILE] Error al obtener habilidades:', error);
      return res.status(500).json({
        error: 'Error al obtener las habilidades',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  },

  /**
   * Eliminar una habilidad del perfil
   * DELETE /api/v1/profiles/:profileId/skills/:skillId
   */
  async removeSkillFromProfile(req: AuthRequest, res: Response) {
    try {
      const { profileId, skillId } = req.params;
      const userId = req.user!.userId;

      // 1. Verificar que el perfil pertenece al usuario
      const profileResult = await pool.query(
        'SELECT perfil_id, usuario_id FROM perfil_aprendiz WHERE perfil_id = $1',
        [profileId]
      );

      if (profileResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Perfil no encontrado',
          code: 'PROFILE_NOT_FOUND',
          statusCode: 404,
        });
      }

      const profile = profileResult.rows[0];
      if (profile.usuario_id !== userId) {
        return res.status(403).json({
          error: 'No tienes permiso para modificar este perfil',
          code: 'FORBIDDEN_PROFILE',
          statusCode: 403,
        });
      }

      // 2. Obtener información de la habilidad antes de eliminarla
      const skillResult = await pool.query(
        `SELECT h.nombre FROM perfil_habilidad ph
         JOIN habilidad h ON ph.habilidad_id = h.habilidad_id
         WHERE ph.ph_id = $1 AND ph.perfil_id = $2`,
        [skillId, profileId]
      );

      if (skillResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Habilidad no encontrada en el perfil',
          code: 'SKILL_NOT_FOUND',
          statusCode: 404,
        });
      }

      const skillName = skillResult.rows[0].nombre;

      // 3. Eliminar la habilidad
      await pool.query(
        'DELETE FROM perfil_habilidad WHERE ph_id = $1 AND perfil_id = $2',
        [skillId, profileId]
      );

      // 4. Recalcular el score_empleabilidad
      const scoreResult = await pool.query(
        `SELECT 
           COUNT(CASE WHEN nivel = 'Basico' THEN 1 END) * 5 +
           COUNT(CASE WHEN nivel = 'Intermedio' THEN 1 END) * 10 +
           COUNT(CASE WHEN nivel = 'Avanzado' THEN 1 END) * 15 AS total_score
         FROM perfil_habilidad
         WHERE perfil_id = $1`,
        [profileId]
      );

      let nuevoScore = scoreResult.rows[0]?.total_score || 0;
      nuevoScore = Math.min(100, nuevoScore);

      // 5. Actualizar el score
      await pool.query(
        'UPDATE perfil_aprendiz SET score_empleabilidad = $1 WHERE perfil_id = $2',
        [nuevoScore, profileId]
      );

      // 6. Log de auditoría
      console.log(`[PROFILE] User ${userId} removió la habilidad "${skillName}" de su perfil. Score actualizado a ${nuevoScore}%`);

      return res.status(200).json({
        message: 'Habilidad removida exitosamente',
        score_actualizado: nuevoScore,
      });
    } catch (error) {
      console.error('[PROFILE] Error al remover habilidad:', error);
      return res.status(500).json({
        error: 'Error al remover la habilidad',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  },

  /**
   * Obtener todas las habilidades disponibles
   * GET /api/v1/habilidades
   */
  async listSkills(req: AuthRequest, res: Response) {
    try {
      const { categoria } = req.query;

      let query = 'SELECT * FROM habilidad';
      const params = [];

      if (categoria) {
        query += ' WHERE categoria = $1';
        params.push(categoria);
      }

      query += ' ORDER BY nombre';

      const result = await pool.query(query, params);

      return res.status(200).json({
        data: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error('[PROFILE] Error al obtener habilidades:', error);
      return res.status(500).json({
        error: 'Error al obtener las habilidades',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  },
};
