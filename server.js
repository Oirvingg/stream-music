import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import songsRoutes from './routes/songs.js';
import authRoutes from './routes/auth.js';

const app = express();
const DEEZER_BASE_URL = 'https://api.deezer.com';

// Middlewares para habilitar CORS e aceitar JSON
app.use(cors());
app.use(express.json());

// Configurações do Swagger / OpenAPI 3.0
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Stream Music API',
      version: '1.0.0',
      description: 'API do Stream Music usando Node.js, Express e Firebase Auth',
      contact: {
        name: 'Suporte Stream Music',
        url: 'http://localhost:3000',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor Local de Desenvolvimento',
      },
    ],
    tags: [
      {
        name: 'Autenticação',
        description: 'Endpoints para Login, Cadastro, Autenticação Social com Google e Recuperação de Senha',
      },
      {
        name: 'Songs',
        description: 'Endpoints para consulta e gerenciamento do catálogo de Músicas',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Insira o token JWT retornado no login (ex: "Bearer <seu_token>")',
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Proxy para o Deezer (contorna bloqueio CORS)
app.use('/api/deezer', async (req, res) => {
  const targetPath = req.path || '/';
  const query = new URLSearchParams(req.query).toString();
  const url = `${DEEZER_BASE_URL}${targetPath}${query ? `?${query}` : ''}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao repassar requisição para o Deezer:', error);
    res.status(502).json({ error: 'Falha ao buscar dados do Deezer' });
  }
});

// Uso das rotas na aplicação
app.use('/auth', authRoutes);
app.use('/songs', songsRoutes);

// Rota inicial de verificação
app.get('/', (req, res) => {
  res.send('Servidor do Stream Music rodando com sucesso! 🚀');
});

// Inicialização do Servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`);
  console.log(`📄 Documentação do Swagger disponível em: http://localhost:${PORT}/api-docs`);
});
