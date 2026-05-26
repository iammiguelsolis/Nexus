import request from 'supertest';
import app from '../src/app';
import pool from '../src/db/pool';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

let padawanToken: string;
let jediToken: string;
let padawanUserId: string;
let jediUserId: string;
let matchingId: string;
let sessionId: string;

beforeAll(async () => {
  await pool.query(`DELETE FROM usuario WHERE email LIKE '%@sessiontest.com'`);

  const hash = await bcrypt.hash('Test1234!', 10);

  // Padawan
  const pad = await pool.query(
    `INSERT INTO usuario (nombres, apellidos, email, contrasena_hash, rol)
     VALUES ('Ses', 'Padawan', 'pad@sessiontest.com', $1, 'Padawan') RETURNING usuario_id`, [hash]
  );
  padawanUserId = pad.rows[0].usuario_id;
  const perfil = await pool.query(
    `INSERT INTO perfil_aprendiz (usuario_id) VALUES ($1) RETURNING perfil_id`, [padawanUserId]
  );

  // Jedi
  const jed = await pool.query(
    `INSERT INTO usuario (nombres, apellidos, email, contrasena_hash, rol)
     VALUES ('Ses', 'Jedi', 'jedi@sessiontest.com', $1, 'Jedi') RETURNING usuario_id`, [hash]
  );
  jediUserId = jed.rows[0].usuario_id;
  const mentor = await pool.query(
    `INSERT INTO mentor (usuario_id) VALUES ($1) RETURNING mentor_id`, [jediUserId]
  );

  // Matching
  const mat = await pool.query(
    `INSERT INTO matching (padawan_id, mentor_id, estado, score_afinidad)
     VALUES ($1, $2, 'Activo', 0.8000) RETURNING matching_id`,
    [perfil.rows[0].perfil_id, mentor.rows[0].mentor_id]
  );
  matchingId = mat.rows[0].matching_id;

  padawanToken = jwt.sign({ userId: padawanUserId, email: 'pad@sessiontest.com', rol: 'Padawan' }, JWT_SECRET, { expiresIn: '1h' });
  jediToken = jwt.sign({ userId: jediUserId, email: 'jedi@sessiontest.com', rol: 'Jedi' }, JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  await pool.query(`
    DELETE FROM matching
    WHERE padawan_id IN (SELECT perfil_id FROM perfil_aprendiz pa JOIN usuario u ON pa.usuario_id = u.usuario_id WHERE u.email LIKE '%@sessiontest.com')
  `);
  await pool.query(`DELETE FROM usuario WHERE email LIKE '%@sessiontest.com'`);
  await pool.end();
});

describe('UC-12: POST /api/v1/matchings/:matchingId/sessions', () => {
  it('crea una sesión correctamente', async () => {
    const res = await request(app)
      .post(`/api/v1/matchings/${matchingId}/sessions`)
      .set('Authorization', `Bearer ${jediToken}`)
      .send({ titulo: 'Sesión de prueba', fecha_sesion: new Date(Date.now() + 86400000).toISOString(), duracion_min: 60 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.titulo).toBe('Sesión de prueba');
    sessionId = res.body.data.sesion_id;
  });

  it('retorna 401 sin autenticación', async () => {
    const res = await request(app)
      .post(`/api/v1/matchings/${matchingId}/sessions`)
      .send({ titulo: 'Sin auth', fecha_sesion: new Date().toISOString() });
    expect(res.status).toBe(401);
  });
});

describe('UC-13: PUT /api/v1/sessions/:sesionId (completar)', () => {
  it('marca sesión como Realizada con notas', async () => {
    const res = await request(app)
      .put(`/api/v1/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${jediToken}`)
      .send({ estado: 'Realizada', notas: 'Excelente sesión, se cubrieron todos los temas.' });

    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe('Realizada');
    expect(res.body.data.notas).toContain('Excelente sesión');
  });
});

describe('UC-14: DELETE /api/v1/sessions/:sesionId (cancelar)', () => {
  it('cancela una sesión programada', async () => {
    // Crear nueva sesión para cancelar
    const create = await request(app)
      .post(`/api/v1/matchings/${matchingId}/sessions`)
      .set('Authorization', `Bearer ${jediToken}`)
      .send({ titulo: 'Para cancelar', fecha_sesion: new Date(Date.now() + 86400000).toISOString() });

    const res = await request(app)
      .delete(`/api/v1/sessions/${create.body.data.sesion_id}`)
      .set('Authorization', `Bearer ${jediToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe('Cancelada');
  });
});

describe('UC-15: GET /api/v1/sessions/my-sessions', () => {
  it('retorna historial de sesiones del usuario', async () => {
    const res = await request(app)
      .get('/api/v1/sessions/my-sessions')
      .set('Authorization', `Bearer ${padawanToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
