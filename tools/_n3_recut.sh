#!/usr/bin/env bash
# 本轮 12 张统一抠图：--bg-ref --no-soft --tol 55
# 关键点：
#  - --no-soft：软过渡公式 a=(d-8)/46*255 在渐变背景上会留整片半透明雾
#  - --tol 55：默认 42 时原图的地面投影色偏超出容差 → 洪水填充进不去，投影连同噪点一起残留
set -e
cd "$(dirname "$0")/.."
PY=C:/Users/Administrator/.workbuddy/binaries/python/envs/default/Scripts/python.exe
MK=C:/Users/Administrator/.workbuddy/skills/character-art/scripts/make_transparent.py
for f in "$@"; do
  $PY $MK key "originals/raw/${f}_raw.png" "processed/${f}_t.png" \
     --target-w 1024 --bg-ref --no-soft --tol 55 --remove-spots 0.70,0.82,1.0,1.0 --spots-max 0.05
done
