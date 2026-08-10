/**
 * Script para resetar o schema — remove tabelas antigas e recria com novo design
 */
import 'dotenv/config';
import { pool } from '../db.js';

async function resetSchema() {
  console.log('🔄 Resetando schema...');
  try {
    // Remove tabelas na ordem reversa de dependência
    await pool.query('DROP TABLE IF EXISTS favorites CASCADE');
    await pool.query('DROP TABLE IF EXISTS playlists CASCADE');
    await pool.query('DROP TABLE IF EXISTS categories CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');

    console.log('✅ Tabelas antigas removidas');
    console.log('🔨 Criando novo schema...');

    // Recria com novo schema
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        is_first_login BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        image_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE playlists (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        cover_url TEXT DEFAULT '',
        tracks JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_playlists_user_id ON playlists(user_id);

      CREATE TABLE favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('song', 'album', 'playlist')),
        item_id VARCHAR(255) NOT NULL,
        item_data JSONB NOT NULL,
        added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(user_id, item_type, item_id)
      );

      CREATE INDEX idx_favorites_user_id ON favorites(user_id);
      CREATE INDEX idx_favorites_item_type ON favorites(item_type);
    `);

    console.log('✅ Novo schema criado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao resetar schema:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

resetSchema();
