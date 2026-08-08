#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SESSION="ylika-web-dev"
TMUX_CONF="/exec-daemon/tmux.portal.conf"
TMUX=(tmux)
[[ -f "$TMUX_CONF" ]] && TMUX=(tmux -f "$TMUX_CONF")

"${TMUX[@]}" has-session -t "=$SESSION" 2>/dev/null || \
  "${TMUX[@]}" new-session -d -s "$SESSION" -c "$ROOT" -- "${SHELL:-bash}" -l

if ! curl -sf -o /dev/null http://localhost:3000/login; then
  "${TMUX[@]}" send-keys -t "$SESSION:0.0" C-c || true
  sleep 1
  "${TMUX[@]}" send-keys -t "$SESSION:0.0" "cd '$ROOT' && npm run dev -- -p 3000" C-m
  for i in $(seq 1 30); do
    if curl -sf -o /dev/null http://localhost:3000/login; then
      echo "Dev server OK on :3000"
      exit 0
    fi
    sleep 1
  done
  echo "Dev server failed to start" >&2
  exit 1
fi
echo "Dev server already up on :3000"
