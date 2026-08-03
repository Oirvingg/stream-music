/**
 * Pool de conexão centralizado com o PostgreSQL — usado por todas as rotas
 * do backend (auth, playlists, favoritos, categorias) para executar queries
 * SQL. Lê as credenciais das variáveis de ambiente (.env).
 */
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === 'production';

// Provedores em nuvem (Render, Neon, Supabase) geralmente expõem uma única
// DATABASE_URL; localmente usamos as variáveis DB_* individuais.
const connectionOptions = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
    };

// Bancos gerenciados na nuvem (Neon/Supabase/Render) exigem SSL mesmo quando
// acessados a partir da máquina local (ex: rodando scripts de setup/seed),
// e usam certificados que o driver `pg` não reconhece por padrão — daí a
// necessidade de desativar a validação. Ativa sempre que houver DATABASE_URL,
// e também em produção (caso o DB seja acessado por DB_HOST/DB_USER/etc).
export const pool = new Pool({
  ...connectionOptions,
  ssl: process.env.DATABASE_URL || isProduction ? { rejectUnauthorized: false } : false,
});

export const query = (text, params) => pool.query(text, params);
