# syntax=docker/dockerfile:1

# --- deps (instala dependências com cache) ---
FROM node:20-alpine AS deps
WORKDIR /app

# Necessário para alguns pacotes nativos (caso existam)
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

# --- build ---
FROM node:20-alpine AS builder
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# --- runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# (Opcional) Mantém as envs no runtime da imagem como fallback
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

# Cria usuário não-root
RUN addgroup -S nextjs ; adduser -S nextjs -G nextjs

# Copia apenas o necessário para executar
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Instala apenas dependências de produção
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

USER nextjs

EXPOSE 3000

# Render define PORT. Garante bind 0.0.0.0 dentro do container.
CMD ["sh", "-c", "node ./node_modules/next/dist/bin/next start -H 0.0.0.0 -p ${PORT:-3000}"]
