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

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: Nome completo do usuário
 *           example: "Carlos Silva"
 *         email:
 *           type: string
 *           format: email
 *           description: Endereço de e-mail do usuário
 *           example: "carlos@exemplo.com"
 *         password:
 *           type: string
 *           format: password
 *           description: Senha com no mínimo 6 caracteres
 *           example: "senha123"
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Endereço de e-mail cadastrado
 *           example: "carlos@exemplo.com"
 *         password:
 *           type: string
 *           format: password
 *           description: Senha da conta
 *           example: "senha123"
 *
 *     ForgotPasswordRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "carlos@exemplo.com"
 *
 *     UserResponse:
 *       type: object
 *       properties:
 *         uid:
 *           type: string
 *           example: "1"
 *         name:
 *           type: string
 *           example: "Carlos Silva"
 *         email:
 *           type: string
 *           example: "carlos@exemplo.com"
 *         photoURL:
 *           type: string
 *           example: "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
 *         isFirstLogin:
 *           type: boolean
 *           description: Indica se o usuário ainda não concluiu o tutorial de onboarding
 *           example: true
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Autenticação realizada com sucesso!"
 *         token:
 *           type: string
 *           description: Token JWT de autenticação Bearer
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           $ref: '#/components/schemas/UserResponse'
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Criar nova conta de usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Conta criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Dados inválidos ou e-mail já cadastrado
 */
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

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autenticar usuário com E-mail e Senha
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Autenticado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: E-mail ou senha incorretos
 */
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

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Solicitar e-mail de redefinição de senha
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: E-mail de redefinição enviado com sucesso
 *       400:
 *         description: E-mail não fornecido
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'O e-mail é obrigatório.' });
  }

  // Sem serviço de e-mail configurado neste projeto — apenas confirma o
  // recebimento da solicitação (não revela se o e-mail existe ou não).
  res.json({ message: `Instruções enviadas com sucesso para o e-mail: ${email}` });
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obter dados do perfil do usuário atualmente autenticado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do perfil do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Não autorizado (Token Ausente ou Inválido)
 */
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

/**
 * @swagger
 * /auth/onboarding:
 *   put:
 *     summary: Marcar o tutorial de onboarding (primeiro login) como concluído
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Flag isFirstLogin atualizada para false
 *       401:
 *         description: Não autorizado (Token Ausente ou Inválido)
 */
router.put('/onboarding', authenticate, async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_first_login = false WHERE id = $1', [req.user.uid]);
    res.json({ message: 'Onboarding concluído.' });
  } catch (error) {
    console.error('Erro ao atualizar onboarding:', error);
    res.status(500).json({ message: 'Erro ao atualizar onboarding.' });
  }
});

/**
 * @swagger
 * /auth/avatar:
 *   put:
 *     summary: Atualizar a foto de perfil do usuário autenticado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               photoURL:
 *                 type: string
 *                 description: URL da imagem ou data URI (base64) da nova foto de perfil
 *     responses:
 *       200:
 *         description: Foto de perfil atualizada com sucesso
 *       400:
 *         description: photoURL ausente ou inválida
 *       401:
 *         description: Não autorizado (Token Ausente ou Inválido)
 */
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
