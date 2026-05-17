import request from 'supertest';
import app from '../src/app';
import pool from '../src/db/pool';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

let userToken: string;
let userId: string;

beforeAll(async () => {
  // Create notificacion table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notificacion (
      notificacion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id UUID NOT NULL REFERENCES usuario(usuario_id) ON DELETE CASCADE,
      tipo VARCHAR(50) NOT NULL,
      titulo VARCHAR(200) NOT NULL,
      mensaje TEXT,
      leida BOOLEAN DEFAULT false,
      referencia_id UUID,
      referencia_tipo VARCHAR(50),
      fecha_creacion TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`DELETE FROM usuario WHERE email LIKE '%@notiftest.com'`);

  const hash = await bcrypt.hash('Test1234!', 10);
  const user = await pool.query(
    `INSERT INTO usuario (nombres, apellidos, email, contrasena_hash, rol)
     VALUES ('Notif', 'User', 'user@notiftest.com', $1, 'Padawan') RETURNING usuario_id`, [hash]
  );
  userId = user.rows[0].usuario_id;
  userToken = jwt.sign({ userId, email: 'user@notiftest.com', rol: 'Padawan' }, JWT_SECRET, { expiresIn: '1h' });

  // Seed some notifications
  await pool.query(
    `INSERT INTO notificacion (usuario_id, tipo, titulo, mensaje, leida) VALUES
     ($1, 'sistema', 'Bienvenido a NEXUS', 'Tu cuenta ha sido creada.', false),
     ($1, 'nueva_sesion', 'Nueva sesión programada', 'Tienes una sesión el viernes.', false),
     ($1, 'okr_creado', 'Nuevo OKR asignado', 'Tu mentor te asignó un OKR.', true)`,
    [userId]
  );
});

afterAll(async () => {
  await pool.query(`DELETE FROM notificacion WHERE usuario_id = $1`, [userId]);
  await pool.query(`DELETE FROM usuario WHERE email LIKE '%@notiftest.com'`);
  await pool.end();
});

describe('UC-26: GET /api/v1/notifications', () => {
  it('lista notificaciones del usuario', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(3);
  });

  it('retorna 401 sin token', async () => {
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(401);
  });
});

describe('UC-26: GET /api/v1/notifications/unread-count', () => {
  it('retorna conteo de no leídas', async () => {
    const res = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.unread).toBe(2); // 2 not read, 1 read
  });
});

describe('UC-26: PATCH /api/v1/notifications/:id/read', () => {
  it('marca una notificación como leída', async () => {
    // Get first unread
    const list = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${userToken}`);

    const unread = list.body.data.find((n: { leida: boolean }) => !n.leida);

    const res = await request(app)
      .patch(`/api/v1/notifications/${unread.notificacion_id}/read`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.leida).toBe(true);
  });
});

describe('UC-26: PATCH /api/v1/notifications/read-all', () => {
  it('marca todas como leídas', async () => {
    const res = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);

    // Verify
    const count = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);

    expect(count.body.data.unread).toBe(0);
  });
});
