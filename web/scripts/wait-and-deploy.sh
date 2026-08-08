#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
LOG=/tmp/vercel-deploy-auto.log
exec > >(tee -a "$LOG") 2>&1

echo "[$(date -Is)] Waiting for vercel login…"
for i in $(seq 1 120); do
  if [[ -f "$HOME/.local/share/com.vercel.cli/auth.json" ]]; then
    WHO=$(npx vercel whoami 2>/dev/null || true)
    if [[ -n "$WHO" && "$WHO" != *"Visit"* && "$WHO" != *"Waiting"* ]]; then
      echo "[$(date -Is)] Logged in as: $WHO"
      break
    fi
  fi
  if grep -qiE 'Congratulations|Success|Logged in' /tmp/vercel-login.log 2>/dev/null; then
    sleep 2
    WHO=$(npx vercel whoami 2>/dev/null || true)
    echo "[$(date -Is)] Login log success, whoami=$WHO"
    break
  fi
  sleep 5
done

WHO=$(npx vercel whoami 2>/dev/null || true)
if [[ -z "$WHO" || "$WHO" == *"Visit"* || "$WHO" == *"Waiting"* ]]; then
  echo "[$(date -Is)] Still not authenticated. Abort."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.local
set +a
AUTH_SECRET_PROD="${AUTH_SECRET:-$(openssl rand -base64 32)}"
# Prefer a strong prod secret
AUTH_SECRET_PROD=$(openssl rand -base64 32)

echo "[$(date -Is)] Linking…"
npx vercel link --yes --project ylika-ops --scope "$(npx vercel whoami)" 2>&1 || \
  npx vercel link --yes --project ylika-ops 2>&1

echo "[$(date -Is)] First deploy to get URL…"
URL=$(npx vercel deploy --prod --yes 2>&1 | tee /tmp/vercel-deploy-out.txt | tail -n 1)
# Parse URL from output more carefully
URL=$(grep -Eo 'https://[a-zA-Z0-9.-]+\.vercel\.app' /tmp/vercel-deploy-out.txt | tail -n 1 || true)
echo "URL=$URL"

echo "[$(date -Is)] Setting env…"
add_env() {
  local key="$1" val="$2" envn="$3"
  printf '%s' "$val" | npx vercel env add "$key" "$envn" --force --yes 2>&1 || \
  printf '%s' "$val" | npx vercel env add "$key" "$envn" --force 2>&1 || true
}

for ENVN in production preview; do
  add_env DATABASE_URL "$DATABASE_URL" "$ENVN"
  add_env AUTH_SECRET "$AUTH_SECRET_PROD" "$ENVN"
  if [[ -n "${URL:-}" ]]; then
    add_env AUTH_URL "$URL" "$ENVN"
    add_env NEXT_PUBLIC_APP_URL "$URL" "$ENVN"
  fi
done

echo "[$(date -Is)] Redeploy with env…"
npx vercel deploy --prod --yes 2>&1 | tee /tmp/vercel-deploy-out2.txt
URL2=$(grep -Eo 'https://[a-zA-Z0-9.-]+\.vercel\.app' /tmp/vercel-deploy-out2.txt | tail -n 1 || true)
echo "$URL2" | tee /tmp/ylika-vercel-url.txt
echo "[$(date -Is)] FINAL=$URL2"
