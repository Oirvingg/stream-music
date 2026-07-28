# 🎵 Stream Music - Plataforma de Streaming de Áudio

<p align="center">
  <img src="./src/assets/preview.png" alt="Stream Music Interface" width="100%">
</p>

O **Stream Music** é uma aplicação Full-Stack inspirada em plataformas modernas como YouTube Music e Spotify. O projeto foi desenvolvido com foco em alta performance, UI/UX refinada em Dark Mode, controle global de áudio, sincronização de letras e documentação interativa de API.

---

## 🚀 Tecnologias Utilizadas

### Front-End
- **React.js** (com Vite)
- **TypeScript**
- **Tailwind CSS**
- **Lucide React** (Ícones)

### Back-End
- **Node.js + Express**
- **Firebase Auth** (Autenticação de usuários e Google Provider)
- **Swagger UI / OpenAPI 3.0** (Documentação interativa da API)

---

## ✨ Funcionalidades Principais

- 🎧 **Player de Áudio Global:** Reprodução contínua ao navegar pelas páginas.
- 🎤 **Lyrics View:** Visualização de letras de música com destaque da estrofe atual.
- 🔐 **Autenticação Completa:** Modal de Login, Cadastro, Recuperação de Senha e Login com Google.
- 📄 **API Documentada:** Swagger UI integrado para testar todas as rotas REST (`/songs`, `/auth`).
- 🎨 **Interface Dark Mode:** Layout responsivo, moderno e otimizado.

---

## 📑 Documentação da API (Swagger UI)

A API conta com documentação interativa OpenAPI 3.0. Para testar as rotas localmente, acesse:
`http://localhost:3000/api-docs`

---

## 🔧 Como Rodar o Projeto Localmente

### Pré-requisitos
- Node.js instalado (v18+)
- Git

### Passo a passo

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/osujo/stream-music.git](https://github.com/osujo/stream-music.git)
   cd stream-music