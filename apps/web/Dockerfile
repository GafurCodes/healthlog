FROM node:20-alpine AS builder
WORKDIR /app

# Accept build argument
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public

RUN npm run build

# New final stage using a simple node server
FROM node:20-alpine
WORKDIR /app

# Install 'serve' to host the static files
RUN npm install -g serve

# Copy built assets from the builder stage
COPY --from=builder /app/dist ./public

# Expose the port serve will run on
EXPOSE 3000

# Start the server
CMD ["serve", "-s", "public", "-l", "3000"]