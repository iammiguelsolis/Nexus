import request from 'supertest';
import app from '../src/app';
import pool from '../src/db/pool';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

let padawanToken: string;
let adminToken: string;
let padawanUserId: string;
let vacancyId: string;

beforeAll(async () => {
  await pool.query(`DELETE FROM usuario WHERE email LIKE '%@vactest.com'`);

  const hash = await bcrypt.hash('Test1234!', 10);

  // Padawan
  const pad = await pool.query(
    `INSERT INTO usuario (nombres, apellidos, email, contrasena_hash, rol)
     VALUES ('Vac', 'Padawan', 'pad@vactest.com', $1, 'Padawan') RETURNING usuario_id`, [hash]
  );
  padawanUserId = pad.rows[0].usuario_id;
  await pool.query(`INSERT INTO perfil_aprendiz (usuario_id) VALUES ($1)`, [padawanUserId]);

  // Admin
  const adm = await pool.query(
    `INSERT INTO usuario (nombres, apellidos, email, contrasena_hash, rol)
     VALUES ('Vac', 'Admin', 'admin@vactest.com', $1, 'Admin') RETURNING usuario_id`, [hash]
  );

  padawanToken = jwt.sign({ userId: padawanUserId, email: 'pad@vactest.com', rol: 'Padawan' }, JWT_SECRET, { expiresIn: '1h' });
  adminToken = jwt.sign({ userId: adm.rows[0].usuario_id, email: 'admin@vactest.com', rol: 'Admin' }, JWT_SECRET, { expiresIn: '1h' });

  // Empresa for vacancy
  const empresaExists = await pool.query(`SELECT empresa_id FROM empresa LIMIT 1`);
  if (empresaExists.rows.length === 0) {
    await pool.query(
      `INSERT INTO empresa (empresa_id, nombre, sector, descripcion)
       VALUES (gen_random_uuid(), 'TestCorp', 'Tecnología', 'Empresa de prueba')`
    );
  }
});

afterAll(async () => {
  if (vacancyId) {
    await pool.query(`DELETE FROM postulacion WHERE vacante_id = $1`, [vacancyId]);
    await pool.query(`DELETE FROM vacante WHERE vacante_id = $1`, [vacancyId]);
  }
  await pool.query(`DELETE FROM usuario WHERE email LIKE '%@vactest.com'`);
  await pool.end();
});

describe('UC-21: POST /api/v1/vacancies (publicar vacante)', () => {
  it('crea una vacante como Admin', async () => {
    const empresa = await pool.query(`SELECT empresa_id FROM empresa LIMIT 1`);
    const res = await request(app)
      .post('/api/v1/vacancies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        empresa_id: empresa.rows[0].empresa_id,
        titulo: 'Frontend Developer Test',
        descripcion: 'Desarrollador React con experiencia en TypeScript.',
        salario_min: 3000,
        salario_max: 5000,
        modalidad: 'Remoto',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.titulo).toBe('Frontend Developer Test');
    vacancyId = res.body.data.vacante_id;
  });

  it('retorna 403 si Padawan intenta crear', async () => {
    const empresa = await pool.query(`SELECT empresa_id FROM empresa LIMIT 1`);
    const res = await request(app)
      .post('/api/v1/vacancies')
      .set('Authorization', `Bearer ${padawanToken}`)
      .send({
        empresa_id: empresa.rows[0].empresa_id,
        titulo: 'No debería',
        modalidad: 'Remoto',
      });

    expect(res.status).toBe(403);
  });
});

describe('UC-22: GET /api/v1/vacancies (buscar vacantes)', () => {
  it('lista vacantes activas', async () => {
    const res = await request(app).get('/api/v1/vacancies');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('filtra por modalidad', async () => {
    const res = await request(app).get('/api/v1/vacancies?modalidad=Remoto');

    expect(res.status).toBe(200);
    res.body.data.forEach((v: { modalidad: string }) => {
      expect(v.modalidad).toBe('Remoto');
    });
  });
});

describe('UC-23: POST /api/v1/vacancies/:id/apply (postularse)', () => {
  it('permite al Padawan postularse', async () => {
    const res = await request(app)
      .post(`/api/v1/vacancies/${vacancyId}/apply`)
      .set('Authorization', `Bearer ${padawanToken}`)
      .send({ mensaje: 'Me interesa mucho esta posición.' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('retorna 409 si ya está postulado', async () => {
    const res = await request(app)
      .post(`/api/v1/vacancies/${vacancyId}/apply`)
      .set('Authorization', `Bearer ${padawanToken}`)
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ALREADY_APPLIED');
  });
});

describe('UC-24: PUT /api/v1/vacancies/:id (gestionar)', () => {
  it('actualiza vacante como Admin', async () => {
    const res = await request(app)
      .put(`/api/v1/vacancies/${vacancyId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ titulo: 'Senior Frontend Developer', salario_max: 7000 });

    expect(res.status).toBe(200);
    expect(res.body.data.titulo).toBe('Senior Frontend Developer');
  });

  it('desactiva vacante', async () => {
    const res = await request(app)
      .put(`/api/v1/vacancies/${vacancyId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ activa: false });

    expect(res.status).toBe(200);
    expect(res.body.data.activa).toBe(false);
  });

  it('reactiva vacante', async () => {
    const res = await request(app)
      .put(`/api/v1/vacancies/${vacancyId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ activa: true });

    expect(res.status).toBe(200);
    expect(res.body.data.activa).toBe(true);
  });
});
