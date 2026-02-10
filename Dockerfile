
FROM node:20-alpine AS frontend-build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY angular.json tsconfig*.json ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM node:20-alpine AS backend-deps
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY server/ ./

COPY --from=backend-deps /app/node_modules ./node_modules

COPY --from=frontend-build /app/dist/figma-dashboard/browser ./public

# Персистентные данные
VOLUME ["/app/data", "/app/uploads"]

EXPOSE 3000
CMD ["node", "index.js"]
