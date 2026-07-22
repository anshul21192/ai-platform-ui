# -----------------------------
# Stage 1: Build React App
# -----------------------------
FROM node:lts-slim AS builder

WORKDIR /app

# Install pnpm (pin version instead of latest)
RUN corepack enable && corepack prepare pnpm@11.15.1 --activate

# Copy dependency files first
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

ENV CI=true

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
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]