# syntax=docker/dockerfile:1.7

# ---------- Stage 1: build do front-end (Vite) ----------
FROM node:18-alpine AS frontend-build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}

COPY index.html vite.config.ts tsconfig.json postcss.config.js tailwind.config.js ./
COPY public ./public
COPY src ./src

RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:18-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Dependências de produção (inclui express, pg, etc.) + ferramentas de dev
# necessárias para o Vite (vite, @vitejs/plugin-react, tailwindcss...).
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund \
    && npm install --no-audit --no-fund vite@^6.0.5 @vitejs/plugin-react@^4.3.4

COPY --from=frontend-build /app/dist ./dist
COPY server.js db.js ./
COPY routes ./routes
COPY middleware ./middleware
COPY scripts ./scripts
COPY public ./public
COPY index.html vite.config.ts tsconfig.json postcss.config.js tailwind.config.js ./
COPY src ./src

EXPOSE 3000 5173

# Sobe backend (3000) e frontend Vite dev server (5173) em paralelo
CMD ["sh", "-c", "node server.js & npm run dev -- --host 0.0.0.0 --port 5173"]
