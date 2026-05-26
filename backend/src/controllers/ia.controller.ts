import { Response, NextFunction } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../types';

/**
 * UC-25: Detectar riesgo de abandono (IA)
 * GET /api/v1/ia/riesgo-abandono
 * Analiza la actividad del Padawan y calcula un score de riesgo.
 */
export const detectarRiesgoAbandono = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;

    // Factor 1: Días desde última sesión
    const ultimaSesion = await pool.query(
      `SELECT MAX(sm.fecha_sesion) as ultima_sesion
       FROM sesion_mentoria sm
       JOIN matching m ON sm.matching_id = m.matching_id
       JOIN perfil_aprendiz pa ON m.padawan_id = pa.perfil_id
       WHERE pa.usuario_id = $1`,
      [userId]
    );

    // Factor 2: OKRs pendientes sin progreso
    const okrsSinProgreso = await pool.query(
      `SELECT COUNT(*) as total
       FROM okr o
       JOIN sesion_mentoria sm ON o.sesion_id = sm.sesion_id
       JOIN matching m ON sm.matching_id = m.matching_id
       JOIN perfil_aprendiz pa ON m.padawan_id = pa.perfil_id
       WHERE pa.usuario_id = $1
         AND o.estado IN ('Pendiente', 'EnProgreso')
         AND o.valor_actual = 0
         AND o.fecha_actualizacion < NOW() - INTERVAL '7 days'`,
      [userId]
    );

    // Factor 3: Sesiones canceladas vs realizadas
    const estadoSesiones = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE sm.estado = 'Cancelada') as canceladas,
         COUNT(*) FILTER (WHERE sm.estado = 'Realizada') as realizadas,
         COUNT(*) as total
       FROM sesion_mentoria sm
       JOIN matching m ON sm.matching_id = m.matching_id
       JOIN perfil_aprendiz pa ON m.padawan_id = pa.perfil_id
       WHERE pa.usuario_id = $1`,
      [userId]
    );

    // Factor 4: Días desde el registro
    const registro = await pool.query(
      'SELECT fecha_registro FROM usuario WHERE usuario_id = $1',
      [userId]
    );

    // Calcular score de riesgo (0-100)
    let scoreRiesgo = 0;
    const alertas: string[] = [];

    // F1: Sin sesiones recientes
    const ultimaFecha = ultimaSesion.rows[0]?.ultima_sesion;
    if (!ultimaFecha) {
      scoreRiesgo += 30;
      alertas.push('No tiene sesiones de mentoría registradas.');
    } else {
      const diasSinSesion = Math.floor((Date.now() - new Date(ultimaFecha).getTime()) / (1000 * 60 * 60 * 24));
      if (diasSinSesion > 14) {
        scoreRiesgo += 25;
        alertas.push(`Lleva ${diasSinSesion} días sin sesiones de mentoría.`);
      } else if (diasSinSesion > 7) {
        scoreRiesgo += 10;
        alertas.push(`Lleva ${diasSinSesion} días sin sesiones.`);
      }
    }

    // F2: OKRs estancados
    const okrsEstancados = parseInt(okrsSinProgreso.rows[0]?.total || '0');
    if (okrsEstancados >= 3) {
      scoreRiesgo += 25;
      alertas.push(`Tiene ${okrsEstancados} OKRs sin progreso en más de 7 días.`);
    } else if (okrsEstancados >= 1) {
      scoreRiesgo += 10;
      alertas.push(`Tiene ${okrsEstancados} OKR(s) sin avance reciente.`);
    }

    // F3: Ratio de cancelaciones
    const canceladas = parseInt(estadoSesiones.rows[0]?.canceladas || '0');
    const totalSesiones = parseInt(estadoSesiones.rows[0]?.total || '0');
    if (totalSesiones > 0) {
      const ratioCancelacion = canceladas / totalSesiones;
      if (ratioCancelacion > 0.5) {
        scoreRiesgo += 20;
        alertas.push(`${Math.round(ratioCancelacion * 100)}% de sus sesiones fueron canceladas.`);
      } else if (ratioCancelacion > 0.25) {
        scoreRiesgo += 10;
        alertas.push(`${Math.round(ratioCancelacion * 100)}% de cancelaciones en sesiones.`);
      }
    }

    // F4: Score de empleabilidad bajo
    const perfil = await pool.query(
      'SELECT score_empleabilidad FROM perfil_aprendiz WHERE usuario_id = $1',
      [userId]
    );
    const score = parseFloat(perfil.rows[0]?.score_empleabilidad || '0');
    const diasRegistro = registro.rows[0]
      ? Math.floor((Date.now() - new Date(registro.rows[0].fecha_registro).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (score < 20 && diasRegistro > 14) {
      scoreRiesgo += 20;
      alertas.push(`Score de empleabilidad muy bajo (${score}) después de ${diasRegistro} días.`);
    }

    scoreRiesgo = Math.min(scoreRiesgo, 100);

    // Determinar nivel de riesgo
    let nivel: 'bajo' | 'medio' | 'alto' | 'critico';
    if (scoreRiesgo >= 70) nivel = 'critico';
    else if (scoreRiesgo >= 45) nivel = 'alto';
    else if (scoreRiesgo >= 20) nivel = 'medio';
    else nivel = 'bajo';

    console.log(`[IA] Riesgo de abandono para ${req.user?.email}: ${scoreRiesgo} (${nivel})`);

    res.json({
      success: true,
      data: {
        score_riesgo: scoreRiesgo,
        nivel,
        alertas,
        factores: {
          dias_sin_sesion: ultimaFecha
            ? Math.floor((Date.now() - new Date(ultimaFecha).getTime()) / (1000 * 60 * 60 * 24))
            : null,
          okrs_estancados: okrsEstancados,
          ratio_cancelacion: totalSesiones > 0 ? (canceladas / totalSesiones) : 0,
          score_empleabilidad: score,
          dias_registrado: diasRegistro,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/ia/riesgo-abandono/all
 * Admin/Jedi: Ver todos los padawans con riesgo de abandono.
 */
export const listarRiesgosAbandono = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT
         u.usuario_id, u.nombres, u.apellidos, u.email, u.fecha_registro,
         pa.score_empleabilidad,
         (SELECT MAX(sm.fecha_sesion) FROM sesion_mentoria sm
          JOIN matching m2 ON sm.matching_id = m2.matching_id
          WHERE m2.padawan_id = pa.perfil_id) as ultima_sesion,
         (SELECT COUNT(*) FROM okr o
          JOIN sesion_mentoria sm ON o.sesion_id = sm.sesion_id
          JOIN matching m2 ON sm.matching_id = m2.matching_id
          WHERE m2.padawan_id = pa.perfil_id
            AND o.estado IN ('Pendiente','EnProgreso')
            AND o.valor_actual = 0) as okrs_estancados
       FROM usuario u
       JOIN perfil_aprendiz pa ON u.usuario_id = pa.usuario_id
       WHERE u.rol = 'Padawan' AND u.activo = true
       ORDER BY pa.score_empleabilidad ASC`
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};
