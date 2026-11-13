#!/usr/bin/env bash
# Cloudflare Pages API 当前 503（上游故障，非本地问题）。轮询重试，一旦 API 恢复即完成部署。
set -uo pipefail
cd "$(dirname "$0")/.."
NODE="C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-6/node.exe"
WRANGLER="C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/wrangler/bin/wrangler.js"
LOG="tools/itch_shots/deploy_retry.log"
: > "$LOG"

for i in $(seq 1 40); do
  echo "[$(date +%H:%M:%S)] === attempt $i ===" >> "$LOG"
  OUT=$("$NODE" "$WRANGLER" pages deploy _site --project-name=smallfigure --branch=main --commit-dirty=true 2>&1)
  echo "$OUT" >> "$LOG"
  if echo "$OUT" | grep -q "Deployment complete! Take a peek"; then
    echo "[$(date +%H:%M:%S)] DEPLOY_OK" >> "$LOG"
    URL=$(echo "$OUT" | grep -oE 'https://[a-z0-9]+\.smallfigure\.pages\.dev' | head -1)
    echo "DEPLOY_URL=$URL" >> "$LOG"
    # 校验线上
    sleep 20
    for k in 1 2 3 4 5 6; do
      H=$(curl -s --max-time 25 "https://smallfigure.com/game/" | grep -c 'itch\.io/smallfigure-merge-museum' || true)
      G=$(curl -s --max-time 25 "https://smallfigure.com/" | grep -c 'itch\.io/smallfigure-merge-museum' || true)
      echo "[$(date +%H:%M:%S)] verify $k: game=$H home=$G" >> "$LOG"
      if [ "$H" -gt 0 ] && [ "$G" -gt 0 ]; then
        echo "LIVE_OK" >> "$LOG"
        break
      fi
      sleep 30
    done
    break
  fi
  sleep 45
done
echo "RETRY_LOOP_END" >> "$LOG"
