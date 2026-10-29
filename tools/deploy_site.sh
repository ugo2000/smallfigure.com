#!/usr/bin/env bash
# 安全部署管线（防「旧构建把线上回滚」）
#
# 背景：多会话共用一个仓库时，谁最后 deploy 谁说了算——哪怕那份 _site 是从
# 更旧的分支状态构建的，就会把线上较新的内容整批回滚（2026-10-29 就发生过：
# 359 项构建覆盖 365 项构建，用户看到素材消失 / 灯箱内容不对）。
#
# 本脚本加三道闸：
#   闸1 线上项数 > 本地项数  -> 直接中止，拒绝用旧构建回滚线上
#   闸2 远端有本地没有的提交  -> 直接中止，要求先合并（否则会回滚别人的改动：
#                                 app.js 版本号、stories.json、404 修复等）
#   闸3 部署后校验线上项数    -> 不一致则重试并明确报错
#
# 用法：bash tools/deploy_site.sh
set -euo pipefail
cd "$(dirname "$0")/.."

BASE_URL="${BASE_URL:-https://smallfigure.pages.dev}"
PROJECT="${PROJECT:-smallfigure}"
NODE="C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-6/node.exe"
WRANGLER="C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/wrangler/bin/wrangler.js"
PY="C:/Users/Administrator/.workbuddy/binaries/python/envs/default/Scripts/python.exe"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
PROXY="http://127.0.0.1:7897"

json_count() {
  "$PY" -c "import json,sys;print(json.load(open(sys.argv[1],encoding='utf-8'))['count'])" "$1"
}
live_count() {
  curl -sS -A "$UA" --max-time 25 "$BASE_URL/data/images.json" 2>/dev/null \
    | "$PY" -c "import json,sys;print(json.load(sys.stdin)['count'])" 2>/dev/null || echo 0
}

EXPECT="$(json_count data/images.json)"
LIVE="$(live_count)"
echo "[deploy] 本地 $EXPECT 项 / 线上 $LIVE 项"

# ---- 闸 1：线上比本地新，说明本地是旧构建，中止 ----
if [ "$LIVE" -gt "$EXPECT" ]; then
  echo "[deploy] 中止：线上已有 $LIVE 项，本地只有 $EXPECT 项。"
  echo "          用旧构建部署会把线上回滚。请先 git pull / git merge origin/main 再部署。"
  exit 2
fi

# ---- 闸 2：远端有本地没有的提交，会回滚别人的改动，中止 ----
if git -c http.proxy="$PROXY" fetch origin main >/dev/null 2>&1; then
  if ! git merge-base --is-ancestor origin/main HEAD; then
    echo "[deploy] 中止：远端 origin/main 有本地没有的提交。"
    git log --oneline HEAD..origin/main | sed 's/^/          /'
    echo "          先合并远端再部署，否则会回滚别人的改动（app.js 版本号 / stories.json / 404 修复等）。"
    exit 3
  fi
  echo "[deploy] 远端已包含在本地提交内，闸 2 通过"
else
  echo "[deploy] 警告：git fetch 失败（网络/代理），跳过闸 2 校验"
fi

# ---- 同步 + 构建 + 部署（tools/deploy.sh 内含 sync / 详情页 / SEO 构建）----
bash tools/deploy.sh

# ---- 闸 3：部署后校验线上项数（别名切换有延迟，最多等 ~1 分钟）----
for i in $(seq 1 10); do
  sleep 6
  NOW="$(live_count)"
  if [ "$NOW" = "$EXPECT" ]; then
    echo "[deploy] 校验通过：线上 $NOW 项 = 本地 $EXPECT 项"
    exit 0
  fi
  echo "[deploy] 等待线上切换… 当前 $NOW / 期望 $EXPECT"
done

echo "[deploy] 校验失败：线上 $(live_count) 项 != 期望 $EXPECT 项"
echo "          可能是另一个会话同时部署（部署历史：wrangler pages deployment list --project-name=$PROJECT）"
exit 4
