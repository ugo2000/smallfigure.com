# -*- coding: utf-8 -*-
"""扫描 6 张 gizmos 抠图里的「内部透明洞」：不与边框连通、被主体包围的透明连通块。
合法洞（门洞/齿轮缝等设计镂空）vs 被误吃的主体 —— 打印每块的 bbox/面积/原图色，交人眼判断。"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

BASE = os.path.dirname(os.path.abspath(__file__))
RAW = {
    1: "generated-images/gizmos-1/A_tiny_whimsical_antique_brass_2026-10-31T01-55-52.png",
    2: "generated-images/gizmos-2/A_tiny_whimsical_antique_joint_2026-10-31T01-56-09.png",
    3: "generated-images/gizmos-3/A_tiny_whimsical_antique_steam_2026-10-31T01-56-25.png",
    4: "generated-images/gizmos-4/A_tiny_whimsical_antique_self__2026-10-31T01-56-47.png",
    5: "generated-images/gizmos-5/A_tiny_whimsical_antique_foldi_2026-10-31T01-57-06.png",
    6: "generated-images/gizmos-6/A_tiny_whimsical_antique_clock_2026-10-31T01-57-28.png",
}
for i in range(1, 7):
    p = os.path.join(BASE, f"../processed/gizmos-{i}.png")
    a = np.array(Image.open(p).convert("RGBA"))
    al = a[:, :, 3]
    tr = al < 100
    lab, n = ndimage.label(tr)
    border = set(lab[0].tolist()) | set(lab[-1].tolist()) | set(lab[:, 0].tolist()) | set(lab[:, -1].tolist())
    orig = np.array(Image.open(os.path.join(BASE, "..", RAW[i])).convert("RGB"))
    holes = []
    for k in range(1, n + 1):
        if k in border:
            continue
        cell = lab == k
        area = int(cell.sum())
        if area < 60:
            continue
        ys, xs = np.where(cell)
        samp = orig[ys[::max(1, area // 5)], xs[::max(1, area // 5)]]
        holes.append((area, xs.min(), ys.min(), xs.max(), ys.max(), samp.mean(axis=0)))
    holes.sort(reverse=True)
    print(f"gizmos-{i}: 内部洞 {len(holes)} 个")
    for h in holes[:8]:
        print("   area=%6d bbox=(%d,%d,%d,%d) origAvg=%s" % (h[0], h[1], h[2], h[3], h[4], [int(v) for v in h[5]]))
