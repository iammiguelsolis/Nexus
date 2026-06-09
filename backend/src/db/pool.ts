import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);
const databaseUrl = process.env.DATABASE_URL;
const isLocalDB = !databaseUrl
  || databaseUrl.includes('localhost')
  || databaseUrl.includes('127.0.0.1')
  || databaseUrl.includes('db:');

const pool = new Pool({
  connectionString: databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: isLocalDB ? false : { rejectUnauthorized: false },
});

pool.on('error', (err: Error) => {
  console.error('[DB] Unexpected error on idle client:', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('[DB] New client connected to PostgreSQL');
});

export default pool;
