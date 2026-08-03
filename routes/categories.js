import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categorias
 *   description: Categorias de músicas/moods cadastradas no PostgreSQL
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Lista as categorias cadastradas no PostgreSQL
 *     tags: [Categorias]
 *     responses:
 *       200:
 *         description: Lista de categorias retornada com sucesso
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, color FROM categories ORDER BY id');
    const categories = rows.map((row) => ({ id: String(row.id), name: row.name, color: row.color }));
    res.json(categories);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ message: 'Erro ao buscar categorias.' });
  }
});

export default router;
