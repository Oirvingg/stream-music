/**
 * Popula a tabela `categories` com dados de exemplo para a Home. Playlists e
 * favoritos não são semeados — pertencem a um usuário e são criados pelo
 * próprio app depois do cadastro/login.
 *
 * USO:
 *   npm run seed
 */
import 'dotenv/config';
import { pool } from '../db.js';

const categories = [
  { name: 'Podcasts', color: '#8d5a99' },
  { name: 'Para treinar', color: '#e04f4d' },
  { name: 'Festa', color: '#f7a332' },
  { name: 'Energia', color: '#f1853c' },
  { name: 'Relax', color: '#2f8fb5' },
  { name: 'Romance', color: '#c45ec6' },
  { name: 'Triste', color: '#5b6779' },
  { name: 'Positividade', color: '#f4c64d' },
  { name: 'Foco', color: '#3f8655' },
  { name: 'Sertanejo', color: '#c79e3f' },
];

async function seed() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM categories');

  if (rows[0].count > 0) {
    console.log('ℹ️  A tabela "categories" já tem dados — seed ignorado.');
    return;
  }

  for (const category of categories) {
    await pool.query('INSERT INTO categories (name, color) VALUES ($1, $2)', [
      category.name,
      category.color,
    ]);
  }

  console.log(`✅ Seed concluído: ${categories.length} categorias inseridas.`);
}

seed()
  .catch((err) => {
    console.error('❌ Falha no seed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
