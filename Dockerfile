# Frontend Dockerfile - React + Vite
FROM node:20-bookworm AS builder

WORKDIR /app

# Copy package.json only (NOT package-lock.json)
COPY package.json ./

# Fresh install on Linux - this will get correct native binaries
RUN npm install

# Copy source code (excluding package-lock.json via .dockerignore)
COPY . .

# Build the application
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine AS production

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
