FROM node:24-bookworm-slim AS marketing-build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY next.config.ts next-env.d.ts tsconfig.json ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM node:24-bookworm-slim AS pahchaan-build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY Pahchaan/package.json Pahchaan/package-lock.json ./
RUN npm ci
COPY Pahchaan/next.config.ts Pahchaan/tsconfig.json Pahchaan/postcss.config.mjs ./
COPY Pahchaan/src ./src
COPY Pahchaan/public ./public
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN npm run build

FROM node:24-bookworm-slim AS pahchaan
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=pahchaan-build --chown=node:node /app/.next/standalone ./
COPY --from=pahchaan-build --chown=node:node /app/.next/static ./.next/static
COPY --from=pahchaan-build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]

FROM node:24-bookworm-slim AS worker
WORKDIR /app
COPY deploy/job-worker.mjs ./job-worker.mjs
USER node
CMD ["node", "job-worker.mjs"]

FROM nginx:1.28-alpine AS gateway
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=marketing-build /app/out /usr/share/nginx/html
EXPOSE 80
