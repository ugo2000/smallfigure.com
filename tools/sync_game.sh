#!/usr/bin/env bash
# 把可玩的合成游戏生成进 _site/game/（自托管版：零外部请求，含隐私页）。
# 必须先跑 tools/sync_site.sh 生成 _site 主站目录；本脚本只负责 /game 子树。
#
# 单一数据源：所有游戏文件都来自 game/，由 tools/build_game.py 统一产出
# （outputs/ 三个平台 ZIP + _site/game 自托管版），保证三者永远一致。
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -d "_site" ]; then
  echo "[sync_game] 致命：_site 不存在，请先跑 tools/sync_site.sh" >&2
  exit 1
fi

PY="C:/Users/Administrator/.workbuddy/binaries/python/envs/default/Scripts/python.exe"
"$PY" tools/build_game.py >/dev/null

# 校验：自托管版必须存在且零外部请求
SH="_site/game"
if [ ! -f "$SH/index.html" ]; then
  echo "[sync_game] 致命：_site/game/index.html 未生成" >&2
  exit 1
fi
EXT=$(grep -oE 'https?://[^"'"'"' <>]+' "$SH/index.html" "$SH/game.js" "$SH/style.css" 2>/dev/null | grep -v 'www.youtube.com/game_api' || true)
if [ -n "$EXT" ]; then
  echo "[sync_game] 致命：自托管版含外部请求 -> $EXT" >&2
  exit 1
fi
SP=$(ls "$SH/sprites"/*.webp 2>/dev/null | wc -l)
if [ "$SP" -ne 11 ]; then
  echo "[sync_game] 致命：sprite 数量 $SP != 11" >&2
  exit 1
fi

echo "[sync_game] _site/game 已生成：index.html + style.css + game.js + favicon.webp + $SP sprites + privacy.html"
ls "$SH"
