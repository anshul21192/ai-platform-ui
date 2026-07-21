# -----------------------------
# Stage 1: Build React App
# -----------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm (pin version instead of latest)
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy dependency files first
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy application source
COPY . .

# Build application
RUN pnpm build

# -----------------------------
# Stage 2: Serve with Nginx
# -----------------------------
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]