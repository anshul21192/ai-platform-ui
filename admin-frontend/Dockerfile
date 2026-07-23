# -----------------------------
# Stage 1: Build React App
# -----------------------------
FROM node:lts-slim AS builder

WORKDIR /app

# Install pnpm (pin version instead of latest)
RUN npm i -g pnpm@11.15.1

# Copy dependency files first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY frontend/package.json ./frontend/
COPY admin-frontend/package.json ./admin-frontend/

ENV CI=true

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy application source
COPY admin-frontend/ ./admin-frontend/

# Build application
RUN pnpm --filter admin-frontend exec vite build

# -----------------------------
# Stage 2: Serve with Nginx
# -----------------------------
FROM nginx:stable-alpine

COPY --from=builder /app/admin-frontend/dist /usr/share/nginx/html
COPY admin-frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]