import express from 'express';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';

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
 *     GoogleAuthRequest:
 *       type: object
 *       required:
 *         - idToken
 *       properties:
 *         idToken:
 *           type: string
 *           description: Token de ID emitido pelo Google Identity Services
 *           example: "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
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
 *           example: "usr_abc123xyz"
 *         name:
 *           type: string
 *           example: "Carlos Silva"
 *         email:
 *           type: string
 *           example: "carlos@exemplo.com"
 *         photoURL:
 *           type: string
 *           example: "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
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
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
  }

  const token = `jwt_${JWT_SECRET}_${Date.now()}`;
  const user = {
    uid: 'usr_' + Date.now(),
    name,
    email,
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
  };

  res.status(201).json({
    message: 'Conta criada com sucesso!',
    token,
    user,
  });
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
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
  }

  const token = `jwt_${JWT_SECRET}_${Date.now()}`;
  const user = {
    uid: 'usr_login_123',
    name: email.split('@')[0],
    email,
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
  };

  res.json({
    message: 'Autenticado com sucesso!',
    token,
    user,
  });
});

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Autenticar ou cadastrar via Google Provider
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoogleAuthRequest'
 *     responses:
 *       200:
 *         description: Autenticação via Google realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Token do Google inválido
 */
router.post('/google', (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'O idToken do Google é obrigatório.' });
  }

  const token = `google_jwt_${JWT_SECRET}_${Date.now()}`;
  const user = {
    uid: 'google_user_999',
    name: 'Usuário Google',
    email: 'usuario.google@gmail.com',
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
  };

  res.json({
    message: 'Autenticação via Google efetuada com sucesso!',
    token,
    user,
  });
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
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'O e-mail é obrigatório.' });
  }
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
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de autenticação ausente ou inválido.' });
  }

  res.json({
    uid: 'usr_logged_in_current',
    name: 'Usuário Ativo Stream Music',
    email: 'usuario.stream@music.com',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
  });
});

export default router;
