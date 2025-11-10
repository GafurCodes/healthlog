FROM node:20-slim AS builder
WORKDIR /app

# Install build tools needed for native modules like sharp
RUN apt-get update && apt-get install -y build-essential

COPY package.json ./
# Remove lock file to ensure fresh dependency resolution for the target platform
RUN rm -f package-lock.json
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y dumb-init curl && rm -rf /var/lib/apt/lists/*

COPY package.json ./
# Remove lock file to ensure fresh dependency resolution for the target platform
RUN rm -f package-lock.json
# Using npm install for production dependencies
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

USER nodejs
EXPOSE 4000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]