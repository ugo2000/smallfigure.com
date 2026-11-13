#!/usr/bin/env bash
# 把站点根目录的文件同步进 _site（部署目录）：只含站点文件，不含 originals/ tools/ .workbuddy/
#
# 【加固点】2026-10-29 事故复盘：
#   旧版用一条 cp 复制全部文件，一旦清单里某个文件缺失（例如 og-1200x630.jpg 未入库），
#   cp 直接报错退出；配合 set -e，整段同步被中断，_site 停在旧内容，
#   随后部署就把「旧 _site」推上线 —— 线上被静默回滚（359 项覆盖 365 项），
#   用户看到素材消失、灯箱内容不对。
#   现在：单文件逐个复制（必需文件缺失才报错，可选文件缺失只告警），
#   收尾强制校验 _site/data/images.json 的条目数与源一致，不一致直接失败。
set -euo pipefail
cd "$(dirname "$0")/.."

PY="C:/Users/Administrator/.workbuddy/binaries/python/envs/default/Scripts/python.exe"

REQUIRED=(index.html styles.css item.css app.js i18n.js _headers)
OPTIONAL=(404.html tcg.html og-1200x630.jpg README.md)

mkdir -p _site
for f in "${REQUIRED[@]}"; do
  if [ ! -f "$f" ]; then
    echo "[sync] 致命：必需文件缺失 $f" >&2
    exit 1
  fi
  cp -f "$f" _site/
done
for f in "${OPTIONAL[@]}"; do
  if [ -f "$f" ]; then
    cp -f "$f" _site/
  else
    echo "[sync] 告警：可选文件不存在，已跳过 $f"
  fi
done

rm -rf _site/data _site/assets _site/functions
cp -r data assets _site/
cp -r functions _site/functions

# 收尾校验：_site 的数据条目数必须与源一致，否则说明同步没生效，绝不能拿去部署
SRC_N=$("$PY" -c "import json;print(json.load(open('data/images.json',encoding='utf-8'))['count'])" 2>/dev/null || echo 0)
DST_N=$("$PY" -c "import json;print(json.load(open('_site/data/images.json',encoding='utf-8'))['count'])" 2>/dev/null || echo 0)
if [ "${SRC_N}" != "${DST_N}" ]; then
  echo "[sync] 致命：_site 条目数 $DST_N != 源 $SRC_N，同步未生效" >&2
  exit 1
fi

# 收尾校验 2：index.html 里引用的本地静态资源必须真实存在于 _site。
#   背景 2026-11-13：TCG 浮窗引用的 assets/tcg/*.png 当时没入库，
#   线上显示的是 14 小时前的陈旧缓存，一旦重新部署就集体 404（裂图）。
#   这里做一次「引用 vs 实体」对账，缺一个就中止部署。
MISSING=$("$PY" - <<'PYEOF'
import os, re
site = '_site'
html = open(os.path.join(site, 'index.html'), encoding='utf-8').read()
refs = set(re.findall(r'(?:src|href)="(?!https?:|//|#|mailto:|data:)([^"?]+)', html))
missing = []
for r in sorted(refs):
    p = os.path.join(site, r.lstrip('/')) if r.startswith('/') else os.path.join(site, r)
    if not os.path.exists(p):
        missing.append(r)
print('\n'.join(missing))
PYEOF
)
if [ -n "$MISSING" ]; then
  echo "[sync] 致命：index.html 引用的本地资源在 _site 中不存在，绝不能部署：" >&2
  echo "$MISSING" | sed 's/^/    缺失：/' >&2
  exit 1
fi

echo "[sync] _site 已更新（$SRC_N 项，静态资源引用校验通过）："
ls _site _site/functions/api
