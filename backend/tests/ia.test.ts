import request from 'supertest';
import app from '../src/app';
import pool from '../src/db/pool';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

let padawanToken: string;
let jediToken: string;
let padawanUserId: string;

beforeAll(async () => {
  await pool.query(`DELETE FROM usuario WHERE email LIKE '%@iatest.com'`);

  const hash = await bcrypt.hash('Test1234!', 10);

  // Padawan
  const pad = await pool.query(
    `INSERT INTO usuario (nombres, apellidos, email, contrasena_hash, rol)
     VALUES ('IA', 'Padawan', 'pad@iatest.com', $1, 'Padawan') RETURNING usuario_id`, [hash]
  );
  padawanUserId = pad.rows[0].usuario_id;
  await pool.query(`INSERT INTO perfil_aprendiz (usuario_id) VALUES ($1)`, [padawanUserId]);

  // Jedi
  const jed = await pool.query(
    `INSERT INTO usuario (nombres, apellidos, email, contrasena_hash, rol)
     VALUES ('IA', 'Jedi', 'jedi@iatest.com', $1, 'Jedi') RETURNING usuario_id`, [hash]
  );

  padawanToken = jwt.sign({ userId: padawanUserId, email: 'pad@iatest.com', rol: 'Padawan' }, JWT_SECRET, { expiresIn: '1h' });
  jediToken = jwt.sign({ userId: jed.rows[0].usuario_id, email: 'jedi@iatest.com', rol: 'Jedi' }, JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  await pool.query(`DELETE FROM usuario WHERE email LIKE '%@iatest.com'`);
  await pool.end();
});

describe('UC-25: GET /api/v1/ia/riesgo-abandono', () => {
  it('retorna score de riesgo para Padawan autenticado', async () => {
    const res = await request(app)
      .get('/api/v1/ia/riesgo-abandono')
      .set('Authorization', `Bearer ${padawanToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.score_riesgo).toBeDefined();
    expect(res.body.data.nivel).toBeDefined();
    expect(['bajo', 'medio', 'alto', 'critico']).toContain(res.body.data.nivel);
    expect(Array.isArray(res.body.data.alertas)).toBe(true);
    expect(res.body.data.factores).toBeDefined();
  });

  it('retorna 401 sin autenticación', async () => {
    const res = await request(app).get('/api/v1/ia/riesgo-abandono');
    expect(res.status).toBe(401);
  });
});

describe('UC-25: GET /api/v1/ia/riesgo-abandono/all', () => {
  it('permite al Jedi ver todos los riesgos', async () => {
    const res = await request(app)
      .get('/api/v1/ia/riesgo-abandono/all')
      .set('Authorization', `Bearer ${jediToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('retorna 403 si Padawan intenta ver todos', async () => {
    const res = await request(app)
      .get('/api/v1/ia/riesgo-abandono/all')
      .set('Authorization', `Bearer ${padawanToken}`);

    expect(res.status).toBe(403);
  });
});
