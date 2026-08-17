# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

**Front-end:** React 18 + TypeScript, Vite 6, Tailwind CSS 3, Zustand (estado global), TanStack React Query (cache/async), Lucide React (ícones).
**Back-end:** Node.js + Express 5, PostgreSQL (driver `pg`), bcryptjs + jsonwebtoken (auth), Swagger (OpenAPI 3.0).
**APIs externas:** Deezer (busca/faixas), Last.fm (trending), Lyrics.ovh (letras).

## Users

O usuário principal é um **desenvolvedor ou recrutador** que acessa o Stream Music como **portfólio técnico** — navegando a aplicação para avaliar qualidade de código, arquitetura e domínio de front-end moderno. O end-user real (quem loga, busca e organiza músicas) existe para dar vida ao app, mas o "visitante de sucesso" é quem inspeciona o produto como demonstração de capacidade full-stack.

## Product Purpose

O Stream Music é um projeto de portfólio full-stack que demonstra, num único produto coeso, o domínio de: SPA em React/TypeScript com arquitetura modular, gerenciamento de estado global (Zustand), cache de dados assíncronos (React Query), consumo de múltiplas APIs externas (Deezer, Last.fm, Lyrics.ovh), construção de uma API REST própria com autenticação JWT (Node/Express/PostgreSQL) e interface responsiva inspirada no YouTube Music. O sucesso significa: o visitante consegue navegar, reproduzir músicas, criar playlists e avaliar a qualidade técnica sem obstáculos.

## Positioning

Diferencia-se de projetos de portfólio genéricos pela combinação de: (1) player de áudio completo e funcional com prévias reais do Deezer, (2) autenticação própria com persistência real em PostgreSQL (não mock/sessão local), (3) três APIs externas integradas num único fluxo contínuo, e (4) interface fiel a um padrão de mercado reconhecido (YouTube Music), não um tema genérico.

## Operating Context

O visitante abre o app no navegador (desktop ou mobile), opcionalmente cria uma conta (e-mail/senha), busca músicas por gênero/artista/título, reproduz prévias de 30s via Deezer, lê letras, cria e gerencia playlists personalizadas, e marca favoritos. O servidor Express roda em paralelo ao cliente Vite em desenvolvimento; ambos são necessários para a experiência completa. Atalhos de teclado controlam o player (Espaço, setas, M).

## Capabilities and Constraints

- **Catálogo:** busca real via Deezer API; trending global via Last.fm; letras via Lyrics.ovh. Não há upload de faixas próprias (roadmap).
- **Autenticação:** e-mail/senha com JWT; cadastro, login, recuperação de senha, troca de conta entre sessões salvas no dispositivo. Senhas hasheadas com bcrypt.
- **Persistência:** usuários, playlists, favoritos e categorias em PostgreSQL. O catálogo de músicas (`/songs`) ainda é em memória (roadmap).
- **Player:** play/pause, próxima/anterior, barra de progresso, volume, visualizador de áudio, fila, embaralhar, histórico das últimas 20 faixas.
- **Playlists:** criação, edição, exclusão, reordenação por drag-and-drop.
- **Onboarding:** tour guiado no primeiro login (react-joyride).
- **Responsividade:** desktop com sidebar retrátil (72px / 240px); mobile com bottom nav.
- **Decisões em aberto:** persistência do catálogo `/songs` em PostgreSQL (roadmap); upload de faixas; deploy em produção; testes automatizados.

## Brand Commitments

- **Nome:** Stream Music — logo circular vermelho com ícone de play (SVG inline), seguido da palavra "Music" na lateral / "Stream" no mobile.
- **Voz:** técnica, objetiva, em português (interface e documentação).
- **Referência visual:** YouTube Music como inspiração estrutural e de interação — layout dark, sidebar retrátil, paleta vermelha de acento, player fixo inferior. É referência evolutiva, não cópia exata: a identidade pode migrar a partir dessa base.
- **Paleta:** dark (`#030303` base), vermelho (`#ff0000`) como acento dominante, cinzas escalonados para superfícies e texto secundário.

## Evidence on Hand

- Código-fonte completo e funcional (cliente + servidor) neste repositório.
- README.md detalhado com arquitetura, endpoints, atalhos e roadmap.
- Scripts de setup de banco (`scripts/schema.sql`, `scripts/setup-db.mjs`, `scripts/seed-postgres.mjs`).
- Tailwind config com tema `yt.*` (paleta YouTube Music) e animações customizadas (fadeIn, shake).
- **Ausências que trabalho futuro não deve fabricar:** não há casos de clientes, depoimentos, benchmarks de uso nem métricas de produção reais; o app é projeto de estudo, não produto comercial ativo.

## Product Principles

1. **Fiel a um padrão reconhecível** — a interface deve operar dentro da gramática visual do YouTube Music; desvios são evoluções, não rupturas arbitrárias.
2. **Realismo sobre mockagem** — dados, áudio e autenticação reais (não mocks) para que o visitante de portfólio veja capacidade técnica completa.
3. **Responsividade como cidadão de primeira classe** — desktop e mobile não são adaptadores, são superfícies projetadas; a sidebar retrátil e a bottom nav são fluxos distintos, não o mesmo fluxo redimensionado.
4. **Transparência de domínio** — código modular, tipado, documentado (JSDoc nos utilitários, Swagger na API), para que o avaliador encontre a qualidade sem escavadeira.
5. **Português como língua do produto** — interface, copy e documentação em pt-BR; o código segue convenções universais de nomenclatura em inglês.

## Accessibility & Inclusion

Boas práticas gerais: contraste adequado (paleta dark com texto ≥4.5:1), navegação por teclado (atalhos globais do player + tab order funcional), aria-labels em botões de ícone, targets de toque ≥44px no mobile (Bottom Nav). Sem padrão formal estabelecido (não WCAG 2.1 AA obrigatório), mas a intenção de qualidade de acesso é parte do projeto.
