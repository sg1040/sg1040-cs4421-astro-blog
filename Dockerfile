FROM node:24-bookworm-slim

WORKDIR /app

ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY dist ./dist

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
