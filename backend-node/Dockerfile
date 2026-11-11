# syntax=docker/dockerfile:1
# Pulse — Backend A (NestJS). Multi-stage: deps → build → test (opcional) → runtime.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

# `docker build --target test backend-node` ejecuta la suite de Jest.
FROM build AS test
RUN npm run test

FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
RUN mkdir -p uploads/audio && chown -R node:node uploads
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
