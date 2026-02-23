# ── Build stage ──
FROM node:22-alpine AS builder
WORKDIR /app

# Accept build-time env var for API URL
ARG VITE_API_URL=http://localhost:3001/api
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN rm -f package-lock.json && npm install
COPY . .
RUN npm run build

# ── Production stage (Nginx) ──
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
