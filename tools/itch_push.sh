#!/usr/bin/env bash
# Smallfigure: Merge Museum —— itch.io 一键发布
# 前置：
#   1) tools/butler/butler.exe 已就位（build_game 流程已下载）
#   2) 仓库根目录 .itch_token 内含一行 itch.io API key（已被 .gitignore 忽略，绝不入库）
# 用法：
#   ITCH_USER=ugo2000 ITCH_SLUG=smallfigure-merge-museum bash tools/itch_push.sh
# 说明：
#   - 项目（game）需先在 itch.io 网页建好（API key 无法新建项目，只能推送构建）。
#   - 推送目标频道固定为 html；版本号取自 .itch.toml 的 version。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUTLER="$ROOT/tools/butler/butler.exe"
TOKEN="$ROOT/.itch_token"
ZIP="$ROOT/outputs/smallfigure-merge-museum-web.zip"

if [ ! -x "$BUTLER" ]; then echo "✗ 找不到 butler：$BUTLER"; exit 1; fi
if [ ! -f "$TOKEN" ]; then echo "✗ 缺少 $TOKEN，请放入 itch.io API key（一行）"; exit 1; fi
if [ ! -f "$ZIP" ]; then echo "✗ 缺少游戏包：$ZIP（先跑 python tools/build_game.py）"; exit 1; fi

API_KEY="$(tr -d '[:space:]' < "$TOKEN")"
USER="${ITCH_USER:-ugo2000}"
SLUG="${ITCH_SLUG:-smallfigure-merge-museum}"
CHANNEL="${ITCH_CHANNEL:-html}"
VERSION="$(grep -m1 '^version' "$ROOT/tools/.itch.toml" | sed -E 's/.*"([^"]+)".*/\1/')"

echo "▶ 推送 $ZIP -> $USER/$SLUG:$CHANNEL @ $VERSION"
# BUTLER_API_KEY 让 butler 免交互使用 key，key 不出现在进程参数里
BUTLER_API_KEY="$API_KEY" "$BUTLER" push "$ZIP" "$USER/$SLUG:$CHANNEL" \
  --userversion "$VERSION" --fix-permissions --verbose
echo "✓ 完成。访问 https://$USER.itch.io/$SLUG"
