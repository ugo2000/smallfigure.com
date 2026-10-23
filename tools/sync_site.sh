#!/usr/bin/env bash
# 把站点根目录的文件同步进 _site（部署目录）：只含站点文件，不含 originals/ tools/ .workbuddy/
set -euo pipefail
cd "$(dirname "$0")/.."

cp index.html styles.css app.js i18n.js _headers README.md _site/
rm -rf _site/data _site/assets _site/functions
cp -r data assets _site/
cp -r functions _site/functions
echo "[sync] _site 已更新："
ls _site _site/functions/api
