import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/pool';
import { AuthRequest, JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const SALT_ROUNDS = 12;

/**
 * POST /api/v1/auth/register
 * Creates a new user. If role is Padawan, also creates perfil_aprendiz.
 */
export const register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { nombres, apellidos, email, contrasena, rol } = req.body;
  const client = await pool.connect();

  try {
    // Check if email already exists
    const existing = await client.query('SELECT usuario_id FROM usuario WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'El email ya está registrado', code: 'EMAIL_DUPLICATE' });
      return;
    }

    const contrasenaHash = await bcrypt.hash(contrasena, SALT_ROUNDS);

    await client.query('BEGIN');

    // Insert user
    const userResult = await client.query(
      `INSERT INTO usuario (nombres, apellidos, email, contrasena_hash, rol)
       VALUES ($1, $2, $3, $4, $5) RETURNING usuario_id, nombres, apellidos, email, rol, fecha_registro`,
      [nombres, apellidos, email, contrasenaHash, rol]
    );

    const user = userResult.rows[0];

    // If Padawan, create apprentice profile
    if (rol === 'Padawan') {
      await client.query(
        `INSERT INTO perfil_aprendiz (usuario_id) VALUES ($1)`,
        [user.usuario_id]
      );
    }

    // If Jedi, create mentor profile
    if (rol === 'Jedi') {
      await client.query(
        `INSERT INTO mentor (usuario_id) VALUES ($1)`,
        [user.usuario_id]
      );
    }

    await client.query('COMMIT');

    // Generate JWT
    const payload: JwtPayload = { userId: user.usuario_id, email: user.email, rol: user.rol };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    console.log(`[AUTH] New user registered: ${email} (${rol})`);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          usuario_id: user.usuario_id,
          nombres: user.nombres,
          apellidos: user.apellidos,
          email: user.email,
          rol: user.rol,
          fecha_registro: user.fecha_registro,
        },
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * POST /api/v1/auth/login
 * Authenticates user and returns JWT.
 */
export const login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { email, contrasena } = req.body;

  try {
    const result = await pool.query(
      'SELECT usuario_id, nombres, apellidos, email, contrasena_hash, rol, activo FROM usuario WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Credenciales inválidas', code: 'INVALID_CREDENTIALS' });
      return;
    }

    const user = result.rows[0];

    if (!user.activo) {
      res.status(401).json({ error: 'Cuenta desactivada', code: 'ACCOUNT_DISABLED' });
      return;
    }

    const isValid = await bcrypt.compare(contrasena, user.contrasena_hash);
    if (!isValid) {
      res.status(401).json({ error: 'Credenciales inválidas', code: 'INVALID_CREDENTIALS' });
      return;
    }

    const payload: JwtPayload = { userId: user.usuario_id, email: user.email, rol: user.rol };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    console.log(`[AUTH] User logged in: ${email}`);

    res.json({
      success: true,
      data: {
        token,
        user: {
          usuario_id: user.usuario_id,
          nombres: user.nombres,
          apellidos: user.apellidos,
          email: user.email,
          rol: user.rol,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user's data.
 */
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado', code: 'AUTH_REQUIRED' });
      return;
    }

    const result = await pool.query(
      `SELECT u.usuario_id, u.nombres, u.apellidos, u.email, u.rol, u.fecha_registro,
              pa.perfil_id, pa.score_empleabilidad, pa.resumen_bio, pa.url_portafolio,
              m.mentor_id, m.especialidades, m.anios_experiencia, m.calificacion_promedio, m.bio_profesional
       FROM usuario u
       LEFT JOIN perfil_aprendiz pa ON u.usuario_id = pa.usuario_id
       LEFT JOIN mentor m ON u.usuario_id = m.usuario_id
       WHERE u.usuario_id = $1 AND u.activo = true`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado', code: 'USER_NOT_FOUND' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};
