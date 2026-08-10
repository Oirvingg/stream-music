/**
 * Rota de administração para limpeza de dados de usuários
 * Protegida por token JWT com verificação de admin
 * 
 * POST /admin/cleanup-users
 */
import express from 'express';
import { pool } from '../db.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

// Middleware para verificar se é admin (uid = 1 ou adicionar campo role)
const requireAdmin = (req, res, next) => {
  const userId = req.user?.uid;
  if (userId !== '1') {
    return res.status(403).json({ error: 'Acesso negado. Apenas admin.' });
  }
  next();
};

/**
 * @swagger
 * /admin/cleanup-users:
 *   post:
 *     tags:
 *       - Administração
 *     summary: Limpeza completa de dados de usuários
 *     description: Remove todos os usuários, playlists, favoritos e sessões (IRREVERSÍVEL)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Limpeza realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedRecords:
 *                   type: object
 *       403:
 *         description: Acesso negado (não é admin)
 *       500:
 *         description: Erro ao limpar dados
 */
router.post('/cleanup-users', authenticate, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await client.query('SET session_replication_role = replica;');

    // Trunca na ordem inversa de dependência
    const result1 = await client.query('TRUNCATE TABLE favorites CASCADE;');
    const result2 = await client.query('TRUNCATE TABLE playlists CASCADE;');
    const result3 = await client.query('TRUNCATE TABLE users CASCADE;');

    await client.query('SET session_replication_role = DEFAULT;');
    await client.query('COMMIT');

    console.log('🗑️  Dados de usuários removidos via admin endpoint');

    res.json({
      success: true,
      message: 'Todos os dados de usuários foram removidos',
      deletedRecords: {
        favorites: 'TRUNCATED',
        playlists: 'TRUNCATED',
        users: 'TRUNCATED',
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao limpar dados:', error);
    res.status(500).json({ error: 'Falha ao limpar dados de usuários' });
  } finally {
    client.release();
  }
});

export default router;
