#!/usr/bin/env bash
# Cloudflare Pages API 间歇性 503（服务端局部故障）。
# 策略：探活命中 200 后，立即密集重试部署（利用恢复窗口，最多 8 次，间隔 8s）；
#       部署成功后校验生产域名三处内容。
set -uo pipefail
cd "$(dirname "$0")/.."
NODE="C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-6/node.exe"
WRANGLER="C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/wrangler/bin/wrangler.js"
LOG="tools/itch_shots/deploy_retry.log"
ACCOUNT="40c232b7d826cb8cef7de637e8dc96ed"
PROJECT="smallfigure"
TOKEN=$(grep -oE 'oauth_token = "[^"]+"' /c/Users/Administrator/.wrangler/config/default.toml 2>/dev/null | head -1 | sed 's/oauth_token = "//; s/"//')

probe() {
  curl -s -o /dev/null -w "%{http_code}" --max-time 20 \
    -H "Authorization: Bearer $TOKEN" \
    "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/pages/projects/$PROJECT"
}

for round in $(seq 1 40); do
  CODE=$(probe)
  echo "[$(date +%H:%M:%S)] round $round probe -> $CODE" >> "$LOG"
  if [ "$CODE" = "200" ]; then
    for r in 1 2 3 4 5 6 7 8; do
      echo "[$(date +%H:%M:%S)]   deploy try $r" >> "$LOG"
      OUT=$("$NODE" "$WRANGLER" pages deploy _site --project-name="$PROJECT" --branch=main --commit-dirty=true 2>&1)
      if echo "$OUT" | grep -q "Deployment complete"; then
        echo "[$(date +%H:%M:%S)] DEPLOY_OK" >> "$LOG"
        echo "$OUT" | tail -6 >> "$LOG"
        echo "$OUT" | grep -oE 'https://[a-z0-9]+\.smallfigure\.pages\.dev' | head -1 >> "$LOG"
        sleep 20
        for k in $(seq 1 12); do
          H=$(curl -s --max-time 25 "https://smallfigure.com/game/" | grep -c 'itch\.io/smallfigure-merge-museum' || true)
          G=$(curl -s --max-time 25 "https://smallfigure.com/" | grep -c 'itch\.io/smallfigure-merge-museum' || true)
          I=$(curl -s --max-time 20 "https://smallfigure.com/i18n.js" | grep -c 'footer\.itch' || true)
          echo "[$(date +%H:%M:%S)] verify $k: game=$H home=$G i18n=$I" >> "$LOG"
          if [ "$H" -gt 0 ] && [ "$G" -gt 0 ] && [ "$I" -gt 0 ]; then
            echo "LIVE_OK" >> "$LOG"
            exit 0
          fi
          sleep 25
        done
        exit 0
      fi
      echo "[$(date +%H:%M:%S)]   try $r failed" >> "$LOG"
      sleep 8
    done
  fi
  sleep 12
done
echo "RETRY_LOOP_END" >> "$LOG"
