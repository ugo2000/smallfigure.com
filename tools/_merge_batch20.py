# -*- coding: utf-8 -*-
# 仅把「童话人物」新分类的 6 项生成进 assets/ 并合并进 data/images.json
# 保留已有条目的 added 时间戳；新条目写入当前时间
import os, sys, json
from datetime import datetime, timezone, timedelta
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_assets as B

NEW_CATS = ("fairytale",)

OUT_FULL = B.OUT_FULL
OUT_THUMB = B.OUT_THUMB
OUT_DATA = B.OUT_DATA
for d in (OUT_FULL, OUT_THUMB, OUT_DATA):
    os.makedirs(d, exist_ok=True)

now = datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds")

data_path = os.path.join(OUT_DATA, "images.json")
with open(data_path, encoding="utf-8") as f:
    meta = json.load(f)
images = list(meta.get("images", []))

all_ids = [it["id"] for it in B.ITEMS]
dup = [i for i in set(all_ids) if all_ids.count(i) > 1]
if dup:
    print("!! ITEMS 中存在重复 id:", dup); sys.exit(1)

added = 0
for it in B.ITEMS:
    if it["cat"] not in NEW_CATS:
        continue
    cat = it["cat"]
    src = B.resolve_src(it["src"])
    if not os.path.exists(src):
        print("  [缺失]", it["src"]); sys.exit(1)
    im = Image.open(src)
    w, h = im.size

    full = B.resize_max(im.convert("RGBA" if it["transparent"] else "RGB"), B.FULL_MAX)
    full_name = os.path.splitext(os.path.basename(it["src"]))[0] + ".png"
    full_path = os.path.join(OUT_FULL, full_name)
    full.save(full_path, optimize=True)

    thumb = B.resize_max(im, B.THUMB_MAX)
    thumb_name = os.path.splitext(os.path.basename(it["src"]))[0] + ".webp"
    thumb_path = os.path.join(OUT_THUMB, thumb_name)
    thumb.convert("RGBA").save(thumb_path, "WEBP", quality=82, method=6)

    color = B.dominant_color(im)
    images = [x for x in images if x.get("id") != it["id"]]
    images.append({
        "id": it["id"],
        "name": it["name_zh"],
        "nameEn": it["name_en"],
        "category": cat,
        "categoryLabel": B.CAT_LABELS[cat]["zh"],
        "categoryLabelEn": B.CAT_LABELS[cat]["en"],
        "file": "assets/img/full/" + full_name,
        "thumb": "assets/img/thumbs/" + thumb_name,
        "width": full.size[0],
        "height": full.size[1],
        "srcWidth": w,
        "srcHeight": h,
        "bytes": os.path.getsize(full_path),
        "ver": B.file_ver(full_path),
        "transparent": it["transparent"],
        "animated": it["effect"] is not None,
        "effect": it["effect"],
        "color": color,
        "tags": B.zh_tags(it["tags"]),
        "tagsEn": it["tags_en"],
        "desc": B.clean_desc(it["desc_zh"]),
        "descEn": B.clean_desc(it["desc_en"]),
        "added": now,
    })
    added += 1
    print("  %-28s %4dx%-4d full=%3dKB thumb=%3dKB %s" % (
        full_name, full.size[0], full.size[1],
        os.path.getsize(full_path)//1024, os.path.getsize(thumb_path)//1024, color))

meta["site"] = "smallfigure.com"
meta["subtitle"] = B.SUBTITLE["zh"]
meta["subtitleEn"] = B.SUBTITLE["en"]
meta["source"] = B.SOURCE
meta["generated"] = now
meta["categories"] = [{"key": k, "label": v["zh"], "labelEn": v["en"]} for k, v in B.CAT_LABELS.items()]
meta["count"] = len(images)
meta["images"] = images

with open(data_path, "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=False, indent=1)
    f.write("\n")

total = sum(i["bytes"] for i in images)
print("== 合并完成: 新增 %d 项, 总计 %d 项, JSON %dKB, 大图合计 %.1fMB ==" % (
    added, len(images), os.path.getsize(data_path)//1024, total/1048576))
