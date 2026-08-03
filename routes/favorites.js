import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Favoritos
 *   description: Músicas curtidas pelo usuário autenticado, persistidas no PostgreSQL
 */

/**
 * @swagger
 * /api/user/favorites:
 *   get:
 *     summary: Lista as músicas curtidas pelo usuário autenticado
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de faixas favoritas
 *       401:
 *         description: Não autenticado
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT track FROM favorites WHERE user_id = $1 ORDER BY added_at DESC',
      [req.user.uid]
    );
    res.json(rows.map((row) => row.track));
  } catch (error) {
    console.error('Erro ao listar favoritos:', error);
    res.status(500).json({ message: 'Erro ao buscar favoritos.' });
  }
});

/**
 * @swagger
 * /api/user/favorites:
 *   post:
 *     summary: Adiciona uma faixa aos favoritos do usuário autenticado
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Faixa adicionada aos favoritos
 *       400:
 *         description: Faixa inválida
 */
router.post('/', async (req, res) => {
  const { track } = req.body;

  if (!track || !track.id) {
    return res.status(400).json({ message: 'A faixa (track) é obrigatória.' });
  }

  try {
    await pool.query(
      `INSERT INTO favorites (user_id, track_id, track)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, track_id) DO UPDATE SET track = EXCLUDED.track`,
      [req.user.uid, String(track.id), JSON.stringify(track)]
    );
    res.status(201).json({ message: 'Faixa adicionada aos favoritos.', track });
  } catch (error) {
    console.error('Erro ao adicionar favorito:', error);
    res.status(500).json({ message: 'Erro ao adicionar favorito.' });
  }
});

/**
 * @swagger
 * /api/user/favorites/{trackId}:
 *   delete:
 *     summary: Remove uma faixa dos favoritos do usuário autenticado
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Faixa removida dos favoritos
 */
router.delete('/:trackId', async (req, res) => {
  try {
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND track_id = $2', [
      req.user.uid,
      req.params.trackId,
    ]);
    res.json({ message: 'Faixa removida dos favoritos.' });
  } catch (error) {
    console.error('Erro ao remover favorito:', error);
    res.status(500).json({ message: 'Erro ao remover favorito.' });
  }
});

export default router;
