# --- Dev environment ---
FROM node:22-alpine AS dev
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache bash libc6-compat openssl
COPY package.json package-lock.json ./

RUN pnpm install
COPY . .

EXPOSE 3000
CMD ["pnpm", "run", "dev"]
