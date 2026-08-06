FROM node:20-slim

# Chromium for Puppeteer PDF generation
RUN apt-get update && \
    apt-get install -y chromium --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server/ ./server/

EXPOSE 3001

CMD ["node", "server/index.js"]
