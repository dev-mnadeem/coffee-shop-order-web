#!/bin/sh
# Rewrite the runtime configuration the page reads before nginx starts.
#
# nginx:alpine runs every executable in /docker-entrypoint.d before handing
# over to the CMD, which is how one image serves more than one environment:
# the bundle is built once and API_BASE_URL is supplied per container.
set -eu

CONFIG_FILE=/usr/share/nginx/html/config.js
API_BASE_URL="${API_BASE_URL:-}"

if [ -n "$API_BASE_URL" ]; then
  printf 'window.__APP_CONFIG__ = { apiBaseUrl: "%s" };\n' "$API_BASE_URL" > "$CONFIG_FILE"
  echo "app-config: API base URL set to $API_BASE_URL"
else
  echo "app-config: API_BASE_URL not set, using the value baked in at build time"
fi
