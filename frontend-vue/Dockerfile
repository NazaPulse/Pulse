# syntax=docker/dockerfile:1
# Pulse — Frontend (vue + Vite). Multi-stage: build → test (opcional) → nginx:alpine.
# El código común vive en /frontend-shared: se inyecta como contexto adicional
# `shared` (ver docker-compose.yml) en la misma posición relativa que en el repo.

FROM node:22-alpine AS build
WORKDIR /app/frontend-vue
COPY package.json package-lock.json ./
RUN npm ci
COPY --from=shared . /app/frontend-shared
COPY . .
# Base de la API en el gateway (p. ej. /api/node o /api/python); se fija al compilar.
ARG VITE_API_BASE_URL=/api/node
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# `docker compose build` no la ejecuta; `docker build --target test` corre Vitest.
FROM build AS test
RUN npm run test

FROM nginx:1.27-alpine AS runtime
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend-vue/dist /usr/share/nginx/html
EXPOSE 80
