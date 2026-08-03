/**
 * Pool de conexão centralizado com o PostgreSQL — usado por todas as rotas
 * do backend (auth, playlists, favoritos, categorias) para executar queries
 * SQL. Lê as credenciais das variáveis de ambiente (.env).
 */
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
});

export const query = (text, params) => pool.query(text, params);
