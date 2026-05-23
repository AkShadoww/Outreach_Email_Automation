FROM node:22-bookworm-slim

# Install Chromium directly from Debian's repo and skip Puppeteer's own
# Chromium download. This makes the build deterministic — no dependency on
# storage.googleapis.com being reachable during `npm ci`, and no version
# drift between puppeteer's bundled Chromium and the system one. The apt
# package also pulls in every shared library Chromium needs at runtime,
# so we don't have to enumerate them by hand.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    chromium-common \
    chromium-sandbox \
    ca-certificates \
    fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
