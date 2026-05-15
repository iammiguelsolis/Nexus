import { Request, Response, NextFunction } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../types';

/**
 * GET /api/v1/vacancies — Public
 */
export const listVacancies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { modalidad } = req.query;
    let query = `
      SELECT v.*, e.nombre as empresa_nombre, e.sector, e.logo_url
      FROM vacante v
      JOIN empresa e ON v.empresa_id = e.empresa_id
      WHERE v.activa = true`;
    const values: string[] = [];

    if (modalidad && typeof modalidad === 'string') {
      query += ` AND v.modalidad = $1`;
      values.push(modalidad);
    }

    query += ` ORDER BY v.fecha_publicacion DESC`;
    const result = await pool.query(query, values);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/vacancies/:vacancyId — Public
 */
export const getVacancy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { vacancyId } = req.params;
  try {
    const result = await pool.query(
      `SELECT v.*, e.nombre as empresa_nombre, e.sector, e.logo_url, e.descripcion as empresa_descripcion
       FROM vacante v JOIN empresa e ON v.empresa_id = e.empresa_id
       WHERE v.vacante_id = $1`,
      [vacancyId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Vacante no encontrada', code: 'VACANCY_NOT_FOUND' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/vacancies — Admin only
 */
export const createVacancy = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { empresa_id, titulo, descripcion, salario_min, salario_max, modalidad } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO vacante (empresa_id, titulo, descripcion, salario_min, salario_max, modalidad)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [empresa_id, titulo, descripcion, salario_min, salario_max, modalidad]
    );
    console.log(`[VACANCY] Created: ${titulo}`);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/vacancies/:vacancyId — Admin only
 */
export const updateVacancy = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { vacancyId } = req.params;
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
    res.status(400).json({ error: 'No fields to update', code: 'NO_FIELDS' });
    return;
  }
  values.push(vacancyId);

  try {
    const result = await pool.query(
      `UPDATE vacante SET ${updates.join(', ')} WHERE vacante_id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Vacante no encontrada', code: 'VACANCY_NOT_FOUND' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/vacancies/:vacancyId/apply — Padawan only
 * Apply to a vacancy.
 */
export const applyToVacancy = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { vacancyId } = req.params;
  const { mensaje } = req.body;
  const userId = req.user?.userId;

  try {
    // Check vacancy exists
    const vacancy = await pool.query('SELECT vacante_id, titulo FROM vacante WHERE vacante_id = $1 AND activa = true', [vacancyId]);
    if (vacancy.rows.length === 0) {
      res.status(404).json({ error: 'Vacante no encontrada', code: 'VACANCY_NOT_FOUND' });
      return;
    }

    // Check not already applied
    const existing = await pool.query(
      'SELECT postulacion_id FROM postulacion WHERE vacante_id = $1 AND usuario_id = $2',
      [vacancyId, userId]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Ya postulaste a esta vacante', code: 'ALREADY_APPLIED' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO postulacion (vacante_id, usuario_id, mensaje) VALUES ($1, $2, $3) RETURNING *`,
      [vacancyId, userId, mensaje || null]
    );

    console.log(`[VACANCY] User ${userId} applied to "${vacancy.rows[0].titulo}"`);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/vacancies/my-applications — Auth required
 * Get all applications for the authenticated user.
 */
export const getMyApplications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT p.*, v.titulo as vacante_titulo, v.modalidad, v.salario_min, v.salario_max,
              e.nombre as empresa_nombre, e.sector
       FROM postulacion p
       JOIN vacante v ON p.vacante_id = v.vacante_id
       JOIN empresa e ON v.empresa_id = e.empresa_id
       WHERE p.usuario_id = $1
       ORDER BY p.fecha_postulacion DESC`,
      [req.user?.userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};
