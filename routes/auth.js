import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
const DEFAULT_PHOTO_URL =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop';

const toUserResponse = (user) => ({
  uid: String(user.id),
  name: user.name,
  email: user.email,
  photoURL: user.avatar_url || DEFAULT_PHOTO_URL,
  isFirstLogin: user.is_first_login,
});

const signToken = (user) =>
  jwt.sign({ uid: String(user.id), email: user.email, name: user.name }, JWT_SECRET, {
    expiresIn: '7d',
  });

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Validação de existência e tipo
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Nome é obrigatório e deve ser um texto válido.' });
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ message: 'E-mail é obrigatório e deve ser um texto válido.' });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ message: 'Senha é obrigatória e deve ser um texto válido.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'A senha precisa ter pelo menos 6 caracteres.' });
  }

  // Validação básica de e-mail
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'E-mail inválido. Verifique o formato.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Este e-mail já está sendo utilizado por outra conta.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id, name, email, avatar_url, is_first_login',
      [name.trim(), email, passwordHash, DEFAULT_PHOTO_URL]
    );
    const user = rows[0];

    res.status(201).json({
      message: 'Conta criada com sucesso!',
      token: signToken(user),
      user: toUserResponse(user),
    });
  } catch (error) {
    console.error('❌ Erro ao registrar usuário:', error.message, error.code);
    res.status(500).json({ message: 'Erro ao criar a conta.', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
    }

    res.json({
      message: 'Autenticado com sucesso!',
      token: signToken(user),
      user: toUserResponse(user),
    });
  } catch (error) {
    console.error('❌ Erro ao autenticar usuário:', error.message, error.code);
    res.status(500).json({ message: 'Erro ao autenticar.', error: error.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'O e-mail é obrigatório.' });
  }

  // Sem serviço de e-mail configurado neste projeto — apenas confirma o
  // recebimento da solicitação (não revela se o e-mail existe ou não).
  res.json({ message: `Instruções enviadas com sucesso para o e-mail: ${email}` });
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, avatar_url, is_first_login FROM users WHERE id = $1',
      [req.user.uid]
    );
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.json(toUserResponse(user));
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ message: 'Erro ao buscar perfil.' });
  }
});

router.put('/onboarding', authenticate, async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_first_login = false WHERE id = $1', [req.user.uid]);
    res.json({ message: 'Onboarding concluído.' });
  } catch (error) {
    console.error('Erro ao atualizar onboarding:', error);
    res.status(500).json({ message: 'Erro ao atualizar onboarding.' });
  }
});

router.put('/avatar', authenticate, async (req, res) => {
  const { photoURL } = req.body;

  if (!photoURL || typeof photoURL !== 'string' || !photoURL.startsWith('data:image/')) {
    return res.status(400).json({ message: 'Envie uma imagem válida (data URI).' });
  }

  // ~4MB em base64 (dado que o front-end já reduz a imagem antes de enviar).
  if (photoURL.length > 4_500_000) {
    return res.status(400).json({ message: 'Imagem muito grande. Escolha uma foto menor.' });
  }

  try {
    const { rows } = await pool.query(
      'UPDATE users SET avatar_url = $1, updated_at = now() WHERE id = $2 RETURNING id, name, email, avatar_url, is_first_login',
      [photoURL, req.user.uid]
    );
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.json(toUserResponse(user));
  } catch (error) {
    console.error('Erro ao atualizar foto de perfil:', error);
    res.status(500).json({ message: 'Erro ao atualizar a foto de perfil.' });
  }
});

export default router;
