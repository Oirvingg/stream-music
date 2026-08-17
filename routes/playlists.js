import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

const toPlaylistResponse = (row) => ({
  id: String(row.id),
  userId: String(row.user_id),
  title: row.name,
  description: row.description,
  coverUrl: row.cover_url,
  tracks: row.tracks,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Busca uma playlist pelo ID e garante que ela pertence ao usuário
 * autenticado. Responde 404/403 diretamente e retorna `null` quando a
 * rota já foi finalizada.
 */
async function getOwnedPlaylistOr404(req, res) {
  const { rows } = await pool.query('SELECT * FROM playlists WHERE id = $1', [req.params.id]);
  const playlist = rows[0];

  if (!playlist) {
    res.status(404).json({ message: 'Playlist não encontrada.' });
    return null;
  }

  if (String(playlist.user_id) !== req.user.uid) {
    res.status(403).json({ message: 'Você não tem permissão para acessar esta playlist.' });
    return null;
  }

  return playlist;
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM playlists WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.uid]
    );
    res.json(rows.map(toPlaylistResponse));
  } catch (error) {
    console.error('Erro ao listar playlists:', error);
    res.status(500).json({ message: 'Erro ao buscar playlists.' });
  }
});

router.post('/', async (req, res) => {
  const name = req.body?.name ?? req.body?.title;
  const { description, coverUrl } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'O nome da playlist é obrigatório.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO playlists (user_id, name, description, cover_url, tracks)
       VALUES ($1, $2, $3, $4, '[]'::jsonb)
       RETURNING *`,
      [req.user.uid, name.trim(), description || '', coverUrl || '']
    );
    res.status(201).json(toPlaylistResponse(rows[0]));
  } catch (error) {
    console.error('Erro ao criar playlist:', error.message, error.code);
    res.status(500).json({ message: 'Erro ao criar playlist.', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const playlist = await getOwnedPlaylistOr404(req, res);
    if (!playlist) return;
    res.json(toPlaylistResponse(playlist));
  } catch (error) {
    console.error('Erro ao buscar playlist:', error);
    res.status(500).json({ message: 'Erro ao buscar playlist.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const playlist = await getOwnedPlaylistOr404(req, res);
    if (!playlist) return;

    const name = req.body?.name ?? req.body?.title;
    const { description, coverUrl, tracks } = req.body;

    const { rows } = await pool.query(
      `UPDATE playlists SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         cover_url = COALESCE($3, cover_url),
         tracks = COALESCE($4, tracks),
         updated_at = now()
       WHERE id = $5
       RETURNING *`,
      [
        name !== undefined ? name.trim() : null,
        description !== undefined ? description : null,
        coverUrl !== undefined ? coverUrl : null,
        tracks !== undefined ? JSON.stringify(tracks) : null,
        playlist.id,
      ]
    );

    res.json(toPlaylistResponse(rows[0]));
  } catch (error) {
    console.error('Erro ao atualizar playlist:', error);
    res.status(500).json({ message: 'Erro ao atualizar playlist.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const playlist = await getOwnedPlaylistOr404(req, res);
    if (!playlist) return;

    await pool.query('DELETE FROM playlists WHERE id = $1', [playlist.id]);
    res.json({ message: 'Playlist removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover playlist:', error);
    res.status(500).json({ message: 'Erro ao remover playlist.' });
  }
});

router.post('/:id/tracks', async (req, res) => {
  const { track } = req.body;

  if (!track || !track.id) {
    return res.status(400).json({ message: 'A faixa (track) é obrigatória.' });
  }

  try {
    const playlist = await getOwnedPlaylistOr404(req, res);
    if (!playlist) return;

    const tracks = playlist.tracks || [];
    const alreadyExists = tracks.some((t) => t.id === track.id);
    const updatedTracks = alreadyExists ? tracks : [...tracks, track];

    const { rows } = await pool.query(
      `UPDATE playlists SET tracks = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [JSON.stringify(updatedTracks), playlist.id]
    );

    res.json(toPlaylistResponse(rows[0]));
  } catch (error) {
    console.error('Erro ao adicionar faixa à playlist:', error);
    res.status(500).json({ message: 'Erro ao adicionar faixa à playlist.' });
  }
});

router.delete('/:id/tracks/:trackId', async (req, res) => {
  try {
    const playlist = await getOwnedPlaylistOr404(req, res);
    if (!playlist) return;

    const tracks = playlist.tracks || [];
    const updatedTracks = tracks.filter((t) => t.id !== req.params.trackId);

    const { rows } = await pool.query(
      `UPDATE playlists SET tracks = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [JSON.stringify(updatedTracks), playlist.id]
    );

    res.json(toPlaylistResponse(rows[0]));
  } catch (error) {
    console.error('Erro ao remover faixa da playlist:', error);
    res.status(500).json({ message: 'Erro ao remover faixa da playlist.' });
  }
});

export default router;
