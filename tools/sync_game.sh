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
# 注意：这里只拦「资源加载型外链」（script src / link href / img src / css url() / fetch）。
# 页脚里 <a href="https://ugo2000.itch.io/..."> 是用户点击才发生的导航链接，不属于自动请求，
# 自托管版允许存在这类指向 itch.io 的导流链接。
SH="_site/game"
if [ ! -f "$SH/index.html" ]; then
  echo "[sync_game] 致命：_site/game/index.html 未生成" >&2
  exit 1
fi
EXT=$(grep -oE '(src|href)="https?://[^"]+"|url\(https?://[^)]+\)|fetch\(["'"'"']https?://[^)]+' \
  "$SH/index.html" "$SH/game.js" "$SH/style.css" 2>/dev/null \
  | grep -v 'www.youtube.com/game_api' \
  | grep -vE '(src|href)="https://ugo2000\.itch\.io/' || true)
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
