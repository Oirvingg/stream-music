import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, image_url, created_at FROM categories ORDER BY name');
    const categories = rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      imageUrl: row.image_url,
      createdAt: row.created_at,
    }));
    res.json(categories);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ message: 'Erro ao buscar categorias.' });
  }
});

export default router;
