# -*- coding: utf-8 -*-
"""补齐/重生成 full/thumbs 并按 build_assets.ITEMS 重建 data/images.json。

build_assets.py 整轮跑会重处理全部图片（沙盒里容易被 SIGTERM 掐断），
本脚本分两个阶段，可幂等重跑：
  阶段一（可分批）：生成/重生成 assets/img/full 与 assets/img/thumbs
  阶段二（一次性）：按 ITEMS 重建 data/images.json

用法：
  python tools/_rebuild_json.py --regen --chunk 0 --chunks 5   # 第 1 批重生成
  python tools/_rebuild_json.py --regen --chunk 1 --chunks 5   # ...
  python tools/_rebuild_json.py                               # 重建 JSON
"""
import json
import os
import sys
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_assets as B
from PIL import Image

argv = sys.argv
REGEN = "--regen" in argv
FORCE = "--force" in argv
CHUNK = int(argv[argv.index("--chunk") + 1]) if "--chunk" in argv else None
CHUNKS = int(argv[argv.index("--chunks") + 1]) if "--chunks" in argv else 1


def ensure_assets(it, force):
    base = os.path.splitext(os.path.basename(it["src"]))[0]
    full_path = os.path.join(B.OUT_FULL, base + ".png")
    thumb_path = os.path.join(B.OUT_THUMB, base + ".webp")
    src = B.resolve_src(it["src"])
    if not os.path.exists(src):
        print("  [缺失源文件]", it["src"])
        sys.exit(1)
    if force or not os.path.exists(full_path) or not os.path.exists(thumb_path):
        im = Image.open(src)
        full = B.resize_max(im.convert("RGBA" if it["transparent"] else "RGB"), B.FULL_MAX)
        full.save(full_path, optimize=True)
        thumb = B.resize_max(im, B.THUMB_MAX)
        thumb.convert("RGBA").save(thumb_path, "WEBP", quality=82, method=6)
        print("  [生成]", base)
    return base, full_path, thumb_path


if REGEN:
    for idx, it in enumerate(B.ITEMS):
        if CHUNK is not None and idx % CHUNKS != CHUNK:
            continue
        ensure_assets(it, FORCE)
    print("== 阶段一完成（%s）==" % ("重生成" if FORCE else "补齐"))
    sys.exit(0)

# ---------- 阶段二：重建 JSON ----------
images = []
for it in B.ITEMS:
    base, full_path, thumb_path = ensure_assets(it, False)
    full = Image.open(full_path).convert("RGBA")
    src = B.resolve_src(it["src"])
    sw, sh = Image.open(src).size
    images.append({
        "id": it["id"],
        "name": it["name_zh"],
        "nameEn": it["name_en"],
        "category": it["cat"],
        "categoryLabel": B.CAT_LABELS[it["cat"]]["zh"],
        "categoryLabelEn": B.CAT_LABELS[it["cat"]]["en"],
        "file": "assets/img/full/" + base + ".png",
        "thumb": "assets/img/thumbs/" + base + ".webp",
        "width": full.size[0],
        "height": full.size[1],
        "srcWidth": sw,
        "srcHeight": sh,
        "bytes": os.path.getsize(full_path),
        "transparent": it["transparent"],
        "animated": it["effect"] is not None,
        "effect": it["effect"],
        "color": B.dominant_color(full),
        "tags": it["tags"],
        "tagsEn": it["tags_en"],
        "desc": it["desc_zh"],
        "descEn": it["desc_en"],
    })

meta = {
    "site": "smallfigure.com",
    "subtitle": B.SUBTITLE["zh"],
    "subtitleEn": B.SUBTITLE["en"],
    "generated": datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds"),
    "source": B.SOURCE,
    "count": len(images),
    "categories": [{"key": k, "label": v["zh"], "labelEn": v["en"]} for k, v in B.CAT_LABELS.items()],
    "images": images,
}
os.makedirs(B.OUT_DATA, exist_ok=True)
data_path = os.path.join(B.OUT_DATA, "images.json")
with open(data_path, "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=False, indent=1)
print("== 完成: %d 项, JSON %dKB ==" % (len(images), os.path.getsize(data_path) // 1024))
