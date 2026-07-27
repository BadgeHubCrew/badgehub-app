FROM node:26.5.0-bookworm-slim

# First install dependencies without any source code affecting the docker cache
WORKDIR /home/node/app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN mkdir -p ./packages/backend ./packages/frontend
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

RUN corepack enable
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy the rest of the source code and build the application
COPY . .
RUN pnpm run build

# Setup env and dirs for running the application
WORKDIR packages/backend
RUN mkdir -p /home/node/.pm2 logs pids && chown -R node:node /home/node/.pm2 logs pids
USER node
EXPOSE 8081
ENV NODE_ENV=production
CMD ["pnpm", "run", "start:pm2"]
