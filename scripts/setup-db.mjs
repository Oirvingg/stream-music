/**
 * Cria (ou verifica) as tabelas do Stream Music no PostgreSQL a partir de
 * scripts/schema.sql.
 *
 * USO:
 *   npm run setup-db
 */
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function setup() {
  const schema = await readFile(resolve(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('✅ Tabelas criadas/verificadas com sucesso no PostgreSQL.');
}

setup()
  .catch((err) => {
    console.error('❌ Falha ao criar tabelas:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
