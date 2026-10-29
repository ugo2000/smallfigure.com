#!/usr/bin/env bash
# 一键部署：同步 _site → 生成详情页/分类页 → SEO/GEO 构建注入 → Cloudflare Pages 直传
#
# 【加固点】2026-10-29：
#   npx wrangler 在本机不可用 —— registry.npmjs.org 走不通，npx 会零输出无限挂死。
#   必须直调本地已安装的 wrangler（node <path>/wrangler/bin/wrangler.js）。
set -euo pipefail
cd "$(dirname "$0")/.."

NODE="C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-6/node.exe"
WRANGLER="C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/wrangler/bin/wrangler.js"

bash tools/sync_site.sh
"$NODE" tools/build_item_pages.mjs
"$NODE" tools/build-seo.mjs
"$NODE" "$WRANGLER" pages deploy _site --project-name=smallfigure --branch=main
