import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';

/**
 * Middleware de autenticação — valida o token JWT emitido em `/auth/login`
 * ou `/auth/register`, enviado no cabeçalho `Authorization: Bearer <token>`,
 * e popula `req.user` com os dados do usuário autenticado (uid, email, name).
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de autenticação ausente ou inválido.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      name: decoded.name || null,
    };
    next();
  } catch (error) {
    console.error('Falha ao verificar o token JWT:', error.message);
    res.status(401).json({ message: 'Token de autenticação inválido ou expirado.' });
  }
}
