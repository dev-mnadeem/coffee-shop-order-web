# syntax=docker/dockerfile:1

# ---- build -----------------------------------------------------------------
# The bundle is produced once, by a toolchain that never ships.
FROM node:20-alpine AS build

WORKDIR /app

# Dependencies are their own layer, so a source-only change does not reinstall.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# A create-react-app build inlines process.env.REACT_APP_* at compile time.
# A default is baked in here for convenience, but the container entrypoint
# rewrites /usr/share/nginx/html/config.js at start-up, and that wins -- so
# this image can be promoted between environments without a rebuild.
ARG REACT_APP_API_BASE_URL=http://localhost:3001/api/v1
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
RUN npm run build

# ---- runtime ---------------------------------------------------------------
# Static files only: no Node, no npm, nothing from the build stage but /build.
FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache curl

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /docker-entrypoint.d/99-app-config.sh
COPY --from=build /app/build /usr/share/nginx/html

# nginx:alpine ships an unprivileged `nginx` user. The few paths the server
# writes to are handed over, the port is moved above 1024, and the process
# drops to that user -- nothing here runs as root.
RUN chmod +x /docker-entrypoint.d/99-app-config.sh \
    && sed -i 's|listen  *80;|listen 8080;|' /etc/nginx/conf.d/default.conf \
    && sed -i '/^user /d' /etc/nginx/nginx.conf \
    && sed -i 's|/var/run/nginx.pid|/tmp/nginx.pid|' /etc/nginx/nginx.conf \
    && chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /etc/nginx/conf.d

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -fsS http://localhost:8080/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
