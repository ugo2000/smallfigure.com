#!/usr/bin/env bash
# 一键部署：同步 _site → Cloudflare Pages 直传
set -euo pipefail
cd "$(dirname "$0")/.."
bash tools/sync_site.sh
npx wrangler pages deploy _site --project-name=smallfigure --branch=main
