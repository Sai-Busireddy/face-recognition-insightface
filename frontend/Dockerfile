FROM node:20-alpine AS frontend

RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

WORKDIR /app

# lock files → install deps
COPY pnpm-lock.yaml* package.json ./
RUN pnpm install --frozen-lockfile

# full source
COPY . .

ENV NODE_ENV=development
EXPOSE 3000
CMD ["pnpm", "dev", "--hostname", "0.0.0.0", "--port", "3000", "--experimental-https"]
