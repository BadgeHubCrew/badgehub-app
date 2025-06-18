# Build Stage
FROM node:22-bookworm-slim AS build

# First install dependencies without any source code affecting the docker cache
WORKDIR /home/node/app
COPY package*.json ./

RUN mkdir ./packages
RUN mkdir ./packages/backend
COPY packages/backend/package.json ./packages/backend/
RUN mkdir ./packages/frontend
COPY packages/frontend/package.json ./packages/frontend/

RUN npm ci --ignore-scripts

# Copy the rest of the source code and build the application
COPY . .
RUN npm run build

# Setup env and dirs for running the application
WORKDIR packages/backend
RUN mkdir -p /home/node/.pm2 logs pids && chown -R node:node /home/node/.pm2 logs pids
USER node
EXPOSE 8081
ENV NODE_ENV=production
CMD ["npm", "run", "start:pm2"]
