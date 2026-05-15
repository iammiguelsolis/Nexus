import request from 'supertest';
import app from '../src/app';
import pool from '../src/db/pool';

afterAll(async () => {
  await pool.query(`DELETE FROM usuario WHERE email LIKE '%@authtest.com'`);
  await pool.end();
});

describe('POST /api/v1/auth/register', () => {
  it('registra un nuevo Padawan correctamente', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nombres: 'Carlos',
        apellidos: 'García',
        email: 'carlos@authtest.com',
        contrasena: 'SecurePass123!',
        rol: 'Padawan',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.rol).toBe('Padawan');
  });

  it('retorna 409 cuando el email ya existe', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nombres: 'Duplicado',
        apellidos: 'Test',
        email: 'carlos@authtest.com',
        contrasena: 'SecurePass123!',
        rol: 'Padawan',
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_DUPLICATE');
  });

  it('retorna 400 con datos inválidos', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'notvalid', contrasena: '123' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('retorna JWT con credenciales válidas', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'carlos@authtest.com', contrasena: 'SecurePass123!' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it('retorna 401 con contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'carlos@authtest.com', contrasena: 'WrongPass' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('retorna datos del usuario autenticado', async () => {
    // Login first
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'carlos@authtest.com', contrasena: 'SecurePass123!' });

    const token = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('carlos@authtest.com');
  });

  it('retorna 401 sin token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
