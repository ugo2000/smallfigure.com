# -*- coding: utf-8 -*-
"""把 6 张动图素材按主体 bbox 裁紧（pad 4%），锚点换算成裁后相对坐标，
输出到 processed/motion_crop/ 供 Remotion public/ 使用，并更新 _motion_anchors.json"""
import json, os
import numpy as np
from PIL import Image

BASE = "D:/WB/smallfigure.com"
SRC = os.path.join(BASE, "processed")
DST = os.path.join(BASE, "processed", "motion_crop")
os.makedirs(DST, exist_ok=True)
NAMES = ["motion_char_miner", "motion_char_fisher", "motion_char_shooter",
         "motion_prop_pickaxe", "motion_prop_rod", "motion_prop_pistol"]

anchors = json.load(open(os.path.join(BASE, "tools", "_motion_anchors.json"), encoding="utf-8"))
out = {}
for name in NAMES:
    im = Image.open(os.path.join(SRC, name + "_t.png")).convert("RGBA")
    a = np.array(im)
    H, W = a.shape[:2]
    alpha = a[..., 3]
    ys, xs = np.where(alpha > 10)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    bw, bh = x1 - x0 + 1, y1 - y0 + 1
    px, py = int(bw * 0.04), int(bh * 0.04)
    cx0, cy0 = max(x0 - px, 0), max(y0 - py, 0)
    cx1, cy1 = min(x1 + px, W - 1), min(y1 + py, H - 1)
    crop = im.crop((cx0, cy0, cx1 + 1, cy1 + 1))
    cw, ch = crop.size
    crop.save(os.path.join(DST, name + ".png"), optimize=True)

    # 锚点换算：full-rel → crop-rel（兼容标量 front_x 与坐标对）
    conv = {}
    for k, v in anchors[name].get("anchors", {}).items():
        if isinstance(v, (list, tuple)):
            ax, ay = v
            conv[k] = [round(min(max((ax * W - cx0) / cw, 0.0), 1.0), 4),
                       round(min(max((ay * H - cy0) / ch, 0.0), 1.0), 4)]
        else:
            conv[k] = round(min(max((v * W - cx0) / cw, 0.0), 1.0), 4)
    out[name] = {
        "crop_size": [cw, ch],
        "aspect": round(cw / ch, 4),
        "anchors_crop": conv,
        "kb": os.path.getsize(os.path.join(DST, name + ".png")) // 1024,
    }
    print("%-24s crop=%dx%d aspect=%.3f %dKB anchors=%s" % (name, cw, ch, cw / ch, out[name]["kb"], conv))

with open(os.path.join(BASE, "tools", "_motion_anchors_crop.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("\n已写出 processed/motion_crop/*.png 与 tools/_motion_anchors_crop.json")
