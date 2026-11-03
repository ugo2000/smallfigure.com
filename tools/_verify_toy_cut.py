# -*- coding: utf-8 -*-
# 批次三十一：20 张玩具抠图量化验收 + 深蓝底目检拼图
import os
import numpy as np
from PIL import Image

KEYS = ["diabolo", "spinningtop", "jianzi", "kite", "lantern", "ninerings",
        "tangram", "lubanlock", "pelletdrum", "tumbler", "paperflip",
        "bamboodragonfly", "pinwheel", "clothtiger", "rabbitlord", "nigugu",
        "sugarfigure", "klotski", "slingshot", "zongren"]

CELL = 320
sheet = Image.new("RGB", (5 * CELL, 4 * CELL), (26, 42, 86))
print("%-18s %4sx%-4s corners  ratio   bbox(w,h)  avgRGB  bottom_px" % ("file", "w", "h"))
for i, k in enumerate(KEYS):
    f = "processed/toy-%s.png" % k
    im = Image.open(f).convert("RGBA")
    a = np.array(im)
    al = a[:, :, 3]
    h, w = al.shape
    corners = [int(al[2, 2]), int(al[2, w - 3]), int(al[h - 3, 2]), int(al[h - 3, w - 3])]
    opaque = int((al >= 200).sum())
    ratio = opaque / (h * w) * 100
    ys, xs = np.where(al >= 200)
    if len(xs):
        bw = int(xs.max() - xs.min()); bh = int(ys.max() - ys.min())
        rgb = [int(v) for v in a[ys, xs, :3].mean(axis=0)]
    else:
        bw = bh = 0; rgb = None
    # 底部 6% 区域的非透明像素（投影残留探针）
    bottom = int((al[int(h * 0.94):, :] > 10).sum())
    print("%-18s %4dx%-4d %-22s %5.1f%%  %4dx%-4d  %s  %d" % (
        "toy-" + k, w, h, corners, ratio, bw, bh, rgb, bottom))
    t = im.copy()
    t.thumbnail((CELL - 12, CELL - 12))
    sheet.paste(t, ((i % 5) * CELL + 6, (i // 5) * CELL + 6), t)

sheet.save("outputs/_toys_cut_sheet.png")
print("sheet -> outputs/_toys_cut_sheet.png")
