import express from 'express';

const router = express.Router();

// Base de dados em memória para demonstração
let songs = [
  {
    id: '1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    coverUrl: 'https://images.unsplash.com/photo-1614113489855-66422ad300a4?w=300&h=300&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 200,
  },
  {
    id: '2',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    coverUrl: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=300&h=300&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 203,
  },
  {
    id: '3',
    title: 'Stay',
    artist: 'The Kid LAROI & Justin Bieber',
    album: 'F*CK LOVE 3',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 141,
  },
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Song:
 *       type: object
 *       required:
 *         - title
 *         - artist
 *         - coverUrl
 *         - audioUrl
 *         - duration
 *       properties:
 *         id:
 *           type: string
 *           description: ID gerado automaticamente para a música
 *         title:
 *           type: string
 *           description: Título da música
 *         artist:
 *           type: string
 *           description: Nome do artista ou banda
 *         album:
 *           type: string
 *           description: Nome do álbum
 *         coverUrl:
 *           type: string
 *           description: URL da capa do álbum
 *         audioUrl:
 *           type: string
 *           description: URL do arquivo de áudio (MP3)
 *         duration:
 *           type: integer
 *           description: Duração em segundos
 *       example:
 *         id: "1"
 *         title: "Blinding Lights"
 *         artist: "The Weeknd"
 *         album: "After Hours"
 *         coverUrl: "https://images.unsplash.com/photo-1614113489855-66422ad300a4?w=300&h=300&fit=crop"
 *         audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
 *         duration: 200
 */

/**
 * @swagger
 * /songs:
 *   get:
 *     summary: Retorna a lista de todas as músicas
 *     tags: [Songs]
 *     responses:
 *       200:
 *         description: Lista de músicas retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Song'
 */
router.get('/', (req, res) => {
  res.json(songs);
});

/**
 * @swagger
 * /songs/{id}:
 *   get:
 *     summary: Obtém uma música pelo ID
 *     tags: [Songs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da música
 *     responses:
 *       200:
 *         description: Detalhes da música
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Song'
 *       404:
 *         description: Música não encontrada
 */
router.get('/:id', (req, res) => {
  const song = songs.find((s) => s.id === req.params.id);
  if (!song) {
    return res.status(404).json({ message: 'Música não encontrada' });
  }
  res.json(song);
});

/**
 * @swagger
 * /songs:
 *   post:
 *     summary: Adiciona uma nova música
 *     tags: [Songs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Song'
 *     responses:
 *       201:
 *         description: Música criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Song'
 */
router.post('/', (req, res) => {
  const { title, artist, album, coverUrl, audioUrl, duration } = req.body;
  const newSong = {
    id: (songs.length + 1).toString(),
    title,
    artist,
    album: album || 'Single',
    coverUrl,
    audioUrl,
    duration: Number(duration) || 180,
  };
  songs.push(newSong);
  res.status(201).json(newSong);
});

/**
 * @swagger
 * /songs/{id}:
 *   delete:
 *     summary: Remove uma música pelo ID
 *     tags: [Songs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da música a ser removida
 *     responses:
 *       200:
 *         description: Música removida com sucesso
 *       404:
 *         description: Música não encontrada
 */
router.delete('/:id', (req, res) => {
  const songIndex = songs.findIndex((s) => s.id === req.params.id);
  if (songIndex === -1) {
    return res.status(404).json({ message: 'Música não encontrada' });
  }
  const deletedSong = songs.splice(songIndex, 1);
  res.json({ message: 'Música removida com sucesso', song: deletedSong[0] });
});

export default router;
