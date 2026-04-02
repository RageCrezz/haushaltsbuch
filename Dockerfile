# --- Dev environment ---
FROM node:22-alpine AS dev
WORKDIR /app

RUN apk add --no-cache bash libc6-compat openssl
COPY package.json package-lock.json ./

RUN npm ci
COPY . .
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3333
CMD ["sh", "/app/docker-entrypoint.sh"]
