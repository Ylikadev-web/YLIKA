#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! npx vercel whoami >/dev/null 2>&1; then
  echo "No hay sesión Vercel. Corre: npx vercel login"
  exit 1
fi

# Load local secrets for first-time env push (never printed)
set -a
# shellcheck disable=SC1091
source .env.local
set +a

: "${DATABASE_URL:?Falta DATABASE_URL en .env.local}"
AUTH_SECRET="${AUTH_SECRET:-$(openssl rand -base64 32)}"

echo "Linking project (root = web)…"
npx vercel link --yes --project ylika-ops || true

echo "Setting env vars (production + preview)…"
# Remove old if exist (ignore errors)
for ENV in production preview development; do
  echo "$DATABASE_URL" | npx vercel env add DATABASE_URL "$ENV" --force 2>/dev/null || \
    printf '%s' "$DATABASE_URL" | npx vercel env add DATABASE_URL "$ENV" --force || true
  echo "$AUTH_SECRET" | npx vercel env add AUTH_SECRET "$ENV" --force 2>/dev/null || \
    printf '%s' "$AUTH_SECRET" | npx vercel env add AUTH_SECRET "$ENV" --force || true
done

echo "Deploying production…"
URL=$(npx vercel deploy --prod --yes)
echo "DEPLOY_URL=$URL"

# Set AUTH_URL / NEXT_PUBLIC_APP_URL to the deployment host
HOST="$URL"
echo "$HOST" | npx vercel env add AUTH_URL production --force || true
echo "$HOST" | npx vercel env add NEXT_PUBLIC_APP_URL production --force || true

# Redeploy so AUTH_URL is picked up
URL2=$(npx vercel deploy --prod --yes)
echo "FINAL_URL=$URL2"
echo "$URL2" > /tmp/ylika-vercel-url.txt
