import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import songsRoutes from './routes/songs.js';
import authRoutes from './routes/auth.js';

const app = express();

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
