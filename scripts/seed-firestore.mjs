/**
 * Seed do Firestore — Stream Music
 * ---------------------------------------------------------------------------
 * Cria as coleções `songs`, `playlists` e `categories` com documentos de
 * exemplo cuja estrutura segue EXATAMENTE a interface Track consumida pelo
 * front-end React (ver src/types/music.ts):
 *
 *   interface Track {
 *     id: string;
 *     title: string;
 *     artist: Artist | string;   // aqui salvamos como string p/ simplicidade
 *     album?: string;
 *     coverUrl: string;
 *     audioUrl: string;
 *     duration: number;           // em segundos
 *   }
 *
 * USO:
 *   1) Baixe a chave da conta de serviço no Console do Firebase:
 *        Projeto stream-music-c3d43 -> Configurações do projeto ->
 *        Contas de serviço -> Gerar nova chave privada -> JSON
 *   2) Salve esse JSON na raiz do projeto como
 *        `serviceAccountKey.json`
 *   3) Rode:
 *        npm run seed
 *
 * O script usa o Admin SDK, que grava direto no Firestore ignorando as
 * regras de segurança — perfeito para popular o banco uma única vez.
 */

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// 1) Dados de exemplo
// ---------------------------------------------------------------------------

/** @typedef {{ title: string, artist: string, album: string, coverUrl: string, audioUrl: string, duration: number }} SongSeed */

/** @type {SongSeed[]} */
const songs = [
  { title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', coverUrl: 'https://api.deezer.com/album/241842472/image', audioUrl: 'https://cdns-preview-1.dzcdn.net/stream/1', duration: 200 },
  { title: 'Shape of You', artist: 'Ed Sheeran', album: '÷ (Divide)', coverUrl: 'https://api.deezer.com/album/116335532/image', audioUrl: 'https://cdns-preview-2.dzcdn.net/stream/2', duration: 233 },
  { title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', coverUrl: 'https://api.deezer.com/album/165841702/image', audioUrl: 'https://cdns-preview-3.dzcdn.net/stream/3', duration: 203 },
  { title: 'Bad Habits', artist: 'Ed Sheeran', album: '=', coverUrl: 'https://api.deezer.com/album/204235872/image', audioUrl: 'https://cdns-preview-4.dzcdn.net/stream/4', duration: 226 },
  { title: 'Watermelon Sugar', artist: 'Harry Styles', album: "Fine Line", coverUrl: 'https://api.deezer.com/album/126201872/image', audioUrl: 'https://cdns-preview-5.dzcdn.net/stream/5', duration: 174 },
  { title: 'Drivers License', artist: 'Olivia Rodrigo', album: 'SOUR', coverUrl: 'https://api.deezer.com/album/184323532/image', audioUrl: 'https://cdns-preview-6.dzcdn.net/stream/6', duration: 242 },
  { title: 'Stay', artist: 'The Kid LAROI, Justin Bieber', album: 'F*CK LOVE 3', coverUrl: 'https://api.deezer.com/album/241842472/image', audioUrl: 'https://cdns-preview-7.dzcdn.net/stream/7', duration: 141 },
  { title: 'Good 4 U', artist: 'Olivia Rodrigo', album: 'SOUR', coverUrl: 'https://api.deezer.com/album/184323532/image', audioUrl: 'https://cdns-preview-8.dzcdn.net/stream/8', duration: 178 },
  { title: 'Peaches', artist: 'Justin Bieber', album: 'Justice', coverUrl: 'https://api.deezer.com/album/181354452/image', audioUrl: 'https://cdns-preview-9.dzcdn.net/stream/9', duration: 198 },
  { title: 'Montero', artist: 'Lil Nas X', album: 'Montero', coverUrl: 'https://api.deezer.com/album/203252672/image', audioUrl: 'https://cdns-preview-a.dzcdn.net/stream/a', duration: 137 },
];

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

/**
 * Playlists prontas. Cada playlist referencia IDs de músicas criadas acima.
 * O campo `tracks` é um array de strings com os IDs dos documentos da
 * coleção `songs` — o front-end resolve esses IDs localmente (ou via busca).
 */
const playlistDefs = [
  { title: 'Em Alta 2026', description: 'Os maiores hits do momento', songIndexes: [0, 1, 2, 3, 4] },
  { title: 'Foco Total', description: 'Para estudar e trabalhar', songIndexes: [5, 6, 7, 8, 9] },
  { title: 'Sextou!', description: 'Energia para a festa', songIndexes: [0, 2, 4, 6, 9] },
];

// ---------------------------------------------------------------------------
// 2) Inicialização do Admin SDK
// ---------------------------------------------------------------------------

async function initAdmin() {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  const keyPath = resolve(rootDir, 'serviceAccountKey.json');

  if (!projectId) {
    throw new Error(
      'ProjectId do Firebase não encontrado. Defina VITE_FIREBASE_PROJECT_ID no .env ou passe GCLOUD_PROJECT.',
    );
  }

  let credential;
  let serviceAccount;
  try {
    const raw = await readFile(keyPath, 'utf8');
    serviceAccount = JSON.parse(raw);
    credential = cert(serviceAccount);
  } catch (err) {
    // Tenta Application Default Credentials (gcloud auth application-default login)
    // como fallback automatico. Se tambem nao houver ADC configurada, o
    // initializeApp ira disparar um erro claro do proprio Admin SDK.
    credential = undefined;
    if (err.code === 'ENOENT') {
      console.warn(
        '\n⚠️  serviceAccountKey.json nao encontrado na raiz do projeto.\n' +
        '    Tentando usar Application Default Credentials (ADC).\n' +
        '    Se nao funcionar, rode: gcloud auth application-default login\n' +
        '    ou baixe a chave em:\n' +
        '    Console Firebase > Configuracoes > Contas de serviço > Gerar nova\n' +
        '    chave privada e salve como ./serviceAccountKey.json\n',
      );
    } else {
      throw new Error(`Erro ao ler serviceAccountKey.json: ${err.message}`);
    }
  }

  const appOptions = { projectId };
  if (credential) appOptions.credential = credential;
  return initializeApp(appOptions, 'firestore-seed');
}

// ---------------------------------------------------------------------------
// 3) Escrita em batch
// ---------------------------------------------------------------------------

async function seed() {
  const app = await initAdmin();
  const db = getFirestore(app);

  console.log(`\nProjeto: ${process.env.VITE_FIREBASE_PROJECT_ID}`);
  console.log('Conectando ao Firestore...\n');

  // ---- songs ----
  const songsRef = db.collection('songs');
  const batch = db.batch();
  const songDocRefs = [];

  songs.forEach((s, i) => {
    const ref = songsRef.doc(`song_${i + 1}`);
    batch.set(ref, { ...s, createdAt: new Date().toISOString() });
    songDocRefs.push(ref);
  });

  // ---- categories ----
  categories.forEach((c, i) => {
    const ref = db.collection('categories').doc(`category_${i + 1}`);
    batch.set(ref, c);
  });

  // ---- playlists (usam IDs das songs criadas acima) ----
  playlistDefs.forEach((pl, i) => {
    const ref = db.collection('playlists').doc(`playlist_${i + 1}`);
    const trackIds = pl.songIndexes.map((idx) => songDocRefs[idx].id);
    batch.set(ref, {
      title: pl.title,
      description: pl.description,
      coverUrl: songs[pl.songIndexes[0]].coverUrl,
      trackIds,
      createdAt: new Date().toISOString(),
    });
  });

  await batch.commit();

  console.log('✅ Seed concluído com sucesso!');
  console.log(`   • ${songs.length} documentos em "songs"`);
  console.log(`   • ${categories.length} documentos em "categories"`);
  console.log(`   • ${playlistDefs.length} documentos em "playlists"`);
  console.log('\nAbra o Console do Firebase > Firestore para ver os dados.');
}

seed().catch((err) => {
  console.error('\n❌ Falha no seed:', err.message);
  if (err.stack) console.error('\n[stack]\n' + err.stack);
  console.error('\nVerifique se:');
  console.error('  1) serviceAccountKey.json existe na raiz (veja topo do script)');
  console.error('  2) O projectId no .env está correto:', process.env.VITE_FIREBASE_PROJECT_ID);
  process.exit(1);
});
