#!/usr/bin/env bash
# Cloudflare Pages API 局部 503（/zones 正常，仅 /pages/* 故障）——服务端问题。
# 策略：先用轻量 GET 探活 /pages/projects/<project>，通了才跑完整部署，避免每次浪费 50s 上传。
set -uo pipefail
cd "$(dirname "$0")/.."
NODE="C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-6/node.exe"
WRANGLER="C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/wrangler/bin/wrangler.js"
LOG="tools/itch_shots/deploy_retry.log"
ACCOUNT="40c232b7d826cb8cef7de637e8dc96ed"
PROJECT="smallfigure"
TOKEN=$(grep -oE 'oauth_token = "[^"]+"' /c/Users/Administrator/.wrangler/config/default.toml 2>/dev/null | head -1 | sed 's/oauth_token = "//; s/"//')

for i in $(seq 1 60); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 \
    -H "Authorization: Bearer $TOKEN" \
    "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/pages/projects/$PROJECT")
  echo "[$(date +%H:%M:%S)] probe #$i -> $CODE" >> "$LOG"
  if [ "$CODE" = "200" ]; then
    echo "[$(date +%H:%M:%S)] API ALIVE, deploying..." >> "$LOG"
    OUT=$("$NODE" "$WRANGLER" pages deploy _site --project-name="$PROJECT" --branch=main --commit-dirty=true 2>&1)
    echo "$OUT" >> "$LOG"
    if echo "$OUT" | grep -q "Deployment complete"; then
      echo "[$(date +%H:%M:%S)] DEPLOY_OK" >> "$LOG"
      echo "$OUT" | grep -oE 'https://[a-z0-9]+\.smallfigure\.pages\.dev' | head -1 >> "$LOG"
      sleep 25
      for k in $(seq 1 10); do
        H=$(curl -s --max-time 25 "https://smallfigure.com/game/" | grep -c 'itch\.io/smallfigure-merge-museum' || true)
        G=$(curl -s --max-time 25 "https://smallfigure.com/" | grep -c 'itch\.io/smallfigure-merge-museum' || true)
        I=$(curl -s --max-time 20 "https://smallfigure.com/i18n.js" | grep -c 'footer\.itch' || true)
        echo "[$(date +%H:%M:%S)] verify $k: game=$H home=$G i18n=$I" >> "$LOG"
        if [ "$H" -gt 0 ] && [ "$G" -gt 0 ] && [ "$I" -gt 0 ]; then
          echo "LIVE_OK" >> "$LOG"
          break
        fi
        sleep 30
      done
      break
    fi
  fi
  sleep 30
done
echo "RETRY_LOOP_END" >> "$LOG"
