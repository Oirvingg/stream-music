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

router.get('/', (req, res) => {
  res.json(songs);
});

router.get('/:id', (req, res) => {
  const song = songs.find((s) => s.id === req.params.id);
  if (!song) {
    return res.status(404).json({ message: 'Música não encontrada' });
  }
  res.json(song);
});

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

router.delete('/:id', (req, res) => {
  const songIndex = songs.findIndex((s) => s.id === req.params.id);
  if (songIndex === -1) {
    return res.status(404).json({ message: 'Música não encontrada' });
  }
  const deletedSong = songs.splice(songIndex, 1);
  res.json({ message: 'Música removida com sucesso', song: deletedSong[0] });
});

export default router;
