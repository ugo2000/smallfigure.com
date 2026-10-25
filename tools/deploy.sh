#!/usr/bin/env bash
# 一键部署：同步 _site → SEO/GEO 构建注入 → Cloudflare Pages 直传
set -euo pipefail
cd "$(dirname "$0")/.."
bash tools/sync_site.sh
node tools/build-seo.mjs
npx wrangler pages deploy _site --project-name=smallfigure --branch=main
