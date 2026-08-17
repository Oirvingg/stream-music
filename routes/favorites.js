import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, user_id, item_type, item_id, item_data, added_at FROM favorites WHERE user_id = $1 ORDER BY added_at DESC',
      [req.user.uid]
    );
    res.json(rows.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      itemType: row.item_type,
      itemId: row.item_id,
      itemData: row.item_data,
      addedAt: row.added_at,
    })));
  } catch (error) {
    console.error('Erro ao listar favoritos:', error);
    res.status(500).json({ message: 'Erro ao buscar favoritos.' });
  }
});

router.post('/', async (req, res) => {
  const { itemType, itemId, itemData } = req.body;

  if (!itemType || !itemId || !itemData) {
    return res.status(400).json({ message: 'itemType, itemId e itemData são obrigatórios.' });
  }

  if (!['song', 'album', 'playlist'].includes(itemType)) {
    return res.status(400).json({ message: 'itemType deve ser: song, album ou playlist.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO favorites (user_id, item_type, item_id, item_data)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, item_type, item_id) DO UPDATE SET item_data = EXCLUDED.item_data
       RETURNING id, user_id, item_type, item_id, item_data, added_at`,
      [req.user.uid, itemType, String(itemId), JSON.stringify(itemData)]
    );
    const row = rows[0];
    res.status(201).json({
      id: String(row.id),
      userId: String(row.user_id),
      itemType: row.item_type,
      itemId: row.item_id,
      itemData: row.item_data,
      addedAt: row.added_at,
    });
  } catch (error) {
    console.error('Erro ao adicionar favorito:', error);
    res.status(500).json({ message: 'Erro ao adicionar favorito.' });
  }
});

router.delete('/:itemId', async (req, res) => {
  const { itemType } = req.query;

  if (!itemType || !['song', 'album', 'playlist'].includes(itemType)) {
    return res.status(400).json({ message: 'Query param itemType obrigatório (song, album, playlist).' });
  }

  try {
    await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND item_type = $2 AND item_id = $3',
      [req.user.uid, itemType, req.params.itemId]
    );
    res.json({ message: 'Favorito removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover favorito:', error);
    res.status(500).json({ message: 'Erro ao remover favorito.' });
  }
});

export default router;
