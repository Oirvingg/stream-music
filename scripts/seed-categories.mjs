/**
 * Seed categorias padrão
 */
import 'dotenv/config';
import { pool } from '../db.js';

async function seedCategories() {
  console.log('🌱 Inserindo categorias padrão...');
  try {
    const categories = [
      { name: 'Rock', image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop' },
      { name: 'Pop', image_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop' },
      { name: 'Hip-Hop', image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop' },
      { name: 'Jazz', image_url: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=300&h=300&fit=crop' },
      { name: 'Eletrônico', image_url: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&h=300&fit=crop' },
      { name: 'Clássico', image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop' },
    ];

    for (const cat of categories) {
      await pool.query(
        'INSERT INTO categories (name, image_url) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [cat.name, cat.image_url]
      );
    }

    console.log('✅ Categorias inseridas');
  } catch (error) {
    console.error('❌ Erro ao seed categorias:', error.message);
  } finally {
    await pool.end();
  }
}

seedCategories();
