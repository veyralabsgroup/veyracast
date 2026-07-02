# Build stage
FROM node:20-slim AS build
ENV PUPPETEER_SKIP_DOWNLOAD=true
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages ./packages
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @veyracast/api build

# Runtime stage
FROM node:20-slim AS runtime
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true
WORKDIR /app
RUN corepack enable
COPY --from=build /app /app

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "build/index.js"]
