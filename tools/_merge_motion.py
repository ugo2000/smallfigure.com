# 仅把 3 个「小人动图」资产生成进 assets/ 并合并进 data/images.json，不重跑全部 100 张
# 动图条目：WebP 本体进 assets/img/anim/，动作帧海报生成缩略图（复用 build_assets.process_motion_item）
import os, sys, json
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_assets as B

OUT_THUMB = B.OUT_THUMB
OUT_ANIM = B.OUT_ANIM
OUT_DATA = B.OUT_DATA
for d in (OUT_THUMB, OUT_ANIM, OUT_DATA):
    os.makedirs(d, exist_ok=True)

data_path = os.path.join(OUT_DATA, "images.json")
with open(data_path, encoding="utf-8") as f:
    meta = json.load(f)
images = list(meta.get("images", []))

added = 0
for it in B.ITEMS:
    if it["cat"] != "motion":
        continue
    # 去重：若已存在同 id 则替换
    images = [x for x in images if x.get("id") != it["id"]]
    entry = B.process_motion_item(it)
    images.append(entry)
    added += 1
    print("  %-28s %4dx%-4d anim=%3dKB thumb=%3dKB %s" % (
        os.path.basename(it["src"]), entry["width"], entry["height"],
        entry["bytes"] // 1024, os.path.getsize(os.path.join(OUT_THUMB, os.path.basename(entry["thumb"]))) // 1024,
        entry["color"]))

# 修补元数据，使其与新 build_assets 一致（含 motion 分类、更新 subtitle/source）
meta["site"] = "smallfigure.com"
meta["subtitle"] = B.SUBTITLE["zh"]
meta["subtitleEn"] = B.SUBTITLE["en"]
meta["source"] = B.SOURCE
meta["generated"] = datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds")
meta["categories"] = [{"key": k, "label": v["zh"], "labelEn": v["en"]} for k, v in B.CAT_LABELS.items()]
meta["count"] = len(images)
meta["images"] = images

with open(data_path, "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=False, indent=1)

total = sum(i["bytes"] for i in images)
print("== 合并完成: 新增 %d 项, 总计 %d 项, JSON %dKB, 大图合计 %.1fMB ==" % (
    added, len(images), os.path.getsize(data_path) // 1024, total / 1048576))
