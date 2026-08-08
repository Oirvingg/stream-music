# 🎵 Stream Music

Uma aplicação web moderna de streaming de música, com player em tempo real, busca de faixas, playlists, letras e autenticação.

<p align="left">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Zustand-State%20Management-orange" alt="Zustand" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## 📌 Sumário

- [Sobre o Projeto](#-sobre-o-projeto)
- [Demonstração das Funcionalidades](#-demonstração-das-funcionalidades)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Arquitetura e Integrações Externas](#-arquitetura-e-integrações-externas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Como Executar Localmente](#-como-executar-localmente)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Documentação da API](#-documentação-da-api)
- [Atalhos de Teclado](#-atalhos-de-teclado)
- [Roadmap](#-roadmap)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

---

## 🚀 Sobre o Projeto

O **Stream Music** é um projeto full-stack pessoal, inspirado na interface do YouTube Music, desenvolvido para colocar em prática habilidades de front-end moderno, gerenciamento de estado, consumo de múltiplas APIs externas e construção de uma API REST própria com autenticação.

A aplicação permite pesquisar músicas em catálogos reais (Deezer e Last.fm), montar e reproduzir playlists, visualizar letras e autenticar-se via e-mail/senha, com dados persistidos em PostgreSQL.

## ✨ Demonstração das Funcionalidades

- 🎧 **Player de áudio completo** — play/pause, próxima/anterior, barra de progresso interativa, controle de volume e visualizador de áudio animado.
- 🔍 **Busca e descoberta de músicas** — integração com a API pública do **Deezer** (busca e faixas em alta) e com a API do **Last.fm** (trending global).
- 📃 **Letras de música** — busca automática de letras via API pública de lyrics.
- 🗂️ **Playlists personalizadas** — criação, edição, exclusão e reordenação de faixas por *drag and drop*.
- 🔐 **Autenticação de usuários** — cadastro, login com e-mail/senha e recuperação de senha, com uma **API própria em Node.js/Express** (bcrypt + JWT) e usuários persistidos em **PostgreSQL**.
- 📱 **Interface responsiva** — layout adaptado para desktop (sidebar) e mobile (barra de navegação inferior), com modais, dropdowns de contexto e menus de faixa.
- ⌨️ **Atalhos de teclado globais** — controle do player sem precisar usar o mouse.
- 📖 **Documentação de API interativa** — Swagger/OpenAPI integrado ao servidor Express.

## 🛠️ Tecnologias Utilizadas

### Front-end
- **React 18** com **TypeScript**
- **Vite 6** como bundler e servidor de desenvolvimento (com proxy embutido para contornar CORS)
- **Tailwind CSS 3** para estilização utilitária e tema customizado (paleta inspirada no YouTube Music)
- **Zustand** para gerenciamento de estado global (player, autenticação, playlists)
- **TanStack React Query** para cache e sincronização de dados assíncronos
- **Lucide React** para ícones

### Back-end
- **Node.js** com **Express 5**
- **PostgreSQL** (driver `pg`) para persistência de usuários, playlists, favoritos e categorias
- **bcryptjs** e **jsonwebtoken** para autenticação (hash de senha e emissão/verificação de JWT)
- **CORS** e **dotenv** para configuração de ambiente
- **Swagger (swagger-jsdoc + swagger-ui-express)** para documentação interativa da API (OpenAPI 3.0)
- Estrutura de rotas modular (`/auth`, `/songs`, `/api/playlists`, `/api/user/favorites`, `/api/categories`)

### APIs e Integrações Externas
- **Deezer API** — busca de faixas, prévias de áudio e capas de álbum
- **Last.fm API** — ranking de músicas em alta (trending global)
- **Lyrics.ovh API** — busca de letras das músicas

### Ferramentas e Qualidade
- **TypeScript** (tipagem estática em todo o front-end)
- **PostCSS** e **Autoprefixer**
- **ESLint/tsc** para checagem de tipos no build
- **Git** para versionamento

## 🏗️ Arquitetura e Integrações Externas

O projeto é dividido em duas partes que rodam de forma independente:

1. **Cliente (SPA em React/Vite)** — responsável por toda a interface, reprodução de áudio e chamadas às APIs externas (Deezer, Last.fm, Lyrics.ovh) e à API própria.
2. **Servidor (Node.js/Express)** — expõe uma API REST própria (`/auth`, `/songs`, `/api/playlists`, `/api/user/favorites`, `/api/categories`) com documentação Swagger, autenticação via JWT e persistência em PostgreSQL.

```
┌────────────────────┐        ┌─────────────────────┐
│   React + Vite      │──────▶│  Deezer / Last.fm    │
│  (Interface + Player)│        │  Lyrics.ovh          │
└─────────┬────────────┘        └─────────────────────┘
          │
          ▼
┌────────────────────┐        ┌─────────────────────┐
│  API própria (Express)│──────▶│     PostgreSQL        │
│  /auth  /songs  /api  │        │ users, playlists,     │
│                       │        │ favorites, categories │
└────────────────────┘        └─────────────────────┘
```

## 📁 Estrutura do Projeto

```
stream-music-main/
├── src/
│   ├── components/       # Componentes de UI (Player, Sidebar, Modais, Cards, etc.)
│   ├── pages/             # Páginas (Home, Explore, Library, Auth)
│   ├── hooks/             # Hooks customizados (player de áudio, queries, atalhos de teclado)
│   ├── services/          # Integrações externas (Deezer, Last.fm, Lyrics, API própria)
│   ├── store/              # Estado global com Zustand (player e autenticação)
│   ├── types/              # Tipagens TypeScript
│   └── data/                # Dados estáticos/mockados
├── routes/
│   ├── auth.js             # Rotas de autenticação (register, login, forgot-password, me)
│   ├── playlists.js        # Playlists do usuário (PostgreSQL)
│   ├── favorites.js        # Faixas favoritas do usuário (PostgreSQL)
│   ├── categories.js       # Categorias/moods (PostgreSQL)
│   └── songs.js            # Rotas do catálogo de músicas (CRUD simplificado, em memória)
├── middleware/
│   └── authenticate.js     # Middleware que valida o token JWT
├── scripts/
│   ├── schema.sql           # Schema das tabelas do PostgreSQL
│   ├── setup-db.mjs         # Cria/verifica as tabelas (npm run setup-db)
│   └── seed-postgres.mjs    # Popula a tabela de categorias (npm run seed)
├── db.js                    # Pool de conexão centralizado com o PostgreSQL
├── server.js               # Servidor Express + configuração do Swagger
├── vite.config.ts          # Configuração do Vite (proxy para API do Deezer e para o backend)
├── tailwind.config.js       # Tema customizado do Tailwind
├── .env.example              # Modelo de variáveis de ambiente
└── package.json
```

## ⚙️ Como Executar Localmente

**Pré-requisitos:** Node.js 18+ e npm instalados.

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/stream-music.git
cd stream-music-main

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# preencha o arquivo .env com suas chaves e credenciais do PostgreSQL (veja a seção abaixo)

# 4. Crie as tabelas no PostgreSQL e (opcional) popule as categorias
npm run setup-db
npm run seed

# 5. Rode o front-end (Vite)
npm run dev

# 6. Em outro terminal, rode o back-end (Express)
npm run server
```

A aplicação front-end estará disponível em `http://localhost:5173` e a API em `http://localhost:3000`.

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:

```env
# Configuração do Servidor (Backend)
PORT=3000
JWT_SECRET=sua_chave_secreta

# Configuração do Last.fm
VITE_LASTFM_API_KEY=

# Configuração do PostgreSQL (Backend)
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
DB_NAME=
```

## 📜 Scripts Disponíveis

| Comando            | Descrição                                              |
|--------------------|---------------------------------------------------------|
| `npm run dev`      | Inicia o front-end em modo de desenvolvimento (Vite)     |
| `npm run server`   | Inicia o back-end Express (`server.js`)                  |
| `npm run setup-db` | Cria/verifica as tabelas do PostgreSQL (`scripts/schema.sql`) |
| `npm run seed`     | Popula a tabela `categories` com dados de exemplo         |
| `npm run build`    | Verifica os tipos (`tsc`) e gera o build de produção     |
| `npm run preview`  | Serve o build de produção localmente                      |

## 📖 Documentação da API

Com o servidor back-end em execução (`npm run server`), a documentação interativa gerada pelo Swagger fica disponível em:

```
http://localhost:3000/api-docs
```

Principais endpoints:

| Método   | Rota                     | Descrição                                  |
|----------|--------------------------|----------------------------------------------|
| `POST`   | `/auth/register`         | Cria uma nova conta de usuário                 |
| `POST`   | `/auth/login`             | Autentica com e-mail e senha                    |
| `POST`   | `/auth/forgot-password`  | Solicita redefinição de senha                    |
| `GET`    | `/auth/me`                | Retorna dados do usuário autenticado (Bearer)     |
| `GET`    | `/api/playlists`           | Lista as playlists do usuário autenticado           |
| `POST`   | `/api/playlists`           | Cria uma nova playlist                               |
| `GET`    | `/api/user/favorites`     | Lista as faixas favoritas do usuário autenticado      |
| `GET`    | `/api/categories`          | Lista as categorias/moods                              |
| `GET`    | `/songs`                   | Lista todas as músicas do catálogo                  |
| `GET`    | `/songs/:id`               | Retorna uma música específica pelo ID                |
| `POST`   | `/songs`                   | Adiciona uma nova música ao catálogo                  |
| `DELETE` | `/songs/:id`                | Remove uma música do catálogo                          |

## ⌨️ Atalhos de Teclado

| Tecla         | Ação                          |
|---------------|-------------------------------|
| `Espaço`      | Play / Pause                   |
| `→` / `←`     | Próxima faixa / faixa anterior |
| `↑` / `↓`     | Aumentar / diminuir volume     |
| `M`            | Mudo / restaurar volume         |

## 🗺️ Roadmap

- [ ] Persistência real do catálogo de músicas em PostgreSQL (hoje ainda em memória)
- [ ] Upload de faixas próprias
- [ ] Sistema de curtidas e histórico de reprodução
- [ ] Testes automatizados (unitários e de integração)
- [ ] Deploy do back-end e front-end em produção

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Faça commit das suas alterações (`git commit -m 'feat: minha nova feature'`)
4. Faça push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

<p align="center">Desenvolvido com 💜 para estudo e prática de desenvolvimento full-stack.</p>
