# Isolated image for the "Michell api test" API.
# Build context is ONLY this folder, so none of the original project's
# poisoned code (server/config/getContract.js, server/middleware/auth.js)
# is ever copied into the image.
FROM node:22-alpine

# npm cache / home redirected to a writable tmp location so the container can
# run with a read-only root filesystem.
ENV NPM_CONFIG_CACHE=/tmp/.npm \
    HOME=/tmp

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Copy the application source (no secrets, no .env).
COPY src ./src
COPY server.js demo.js ./
COPY tests ./tests

# Drop to the unprivileged user shipped with the node image.
USER node

EXPOSE 5050
CMD ["node", "server.js"]
