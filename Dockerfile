# syntax=docker/dockerfile:1.7

# ---------- Stage 1: build do front-end (Vite, produção) ----------
FROM node:18-alpine AS frontend-build
WORKDIR /app

# Instala TODAS as dependências (inclui devDependencies: vite, tailwindcss, etc.).
# Importante: NÃO definir NODE_ENV=production aqui, senão o npm omite devDependencies.
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund \
    || npm install --no-audit --no-fund

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}

COPY index.html vite.config.ts tsconfig.json postcss.config.js tailwind.config.js ./
COPY public ./public
COPY src ./src

RUN npm run build

# ---------- Stage 2: dev (front-end com hot-reload) ----------
# Mesma base, mas mantém node_modules com devDependencies no container.
FROM node:18-alpine AS frontend-dev
WORKDIR /app

# Em dev precisamos do vite e de todas as devDependencies — nunca use
# --production / --omit=dev aqui.
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund \
    || npm install --no-audit --no-fund

# Código-fonte é montado via bind mount no docker-compose, mas copiamos
# os arquivos de config para o caso de rodar o container standalone.
COPY index.html vite.config.ts tsconfig.json postcss.config.js tailwind.config.js ./
COPY public ./public
COPY src ./src

EXPOSE 5173

# npx garante que use o vite local de node_modules/.bin mesmo se o PATH
# não estiver apontando para lá.
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]

# ---------- Stage 3: runtime (backend + estático) ----------
FROM node:18-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Aqui, em produção, tudo bem omitir devDependencies.
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund \
    || npm install --omit=dev --no-audit --no-fund

COPY --from=frontend-build /app/dist ./dist
COPY server.js db.js ./
COPY routes ./routes
COPY middleware ./middleware
COPY scripts ./scripts
COPY public ./public

EXPOSE 3000

CMD ["node", "server.js"]
