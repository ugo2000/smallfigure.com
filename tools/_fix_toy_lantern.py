# -*- coding: utf-8 -*-
# 批次三十一：走马灯误吃修复（目视判定版）
# 背景：灯笼纸面是淡奶黄（RGB≈243,229,198），与奶油底 (241,230,209) 色距仅 ~10，
#       tol40 把纸面也当成背景抠掉 → 纸面破洞。
# 判定依据（目视确认）：
#   顶部提手拱内的大空洞 (x457-567, y72-151) = 装饰框架镂空，原图该处就是底色 → 保留透明
#   其余 5 块（面板/下层筒内）原图是有花纹的纸面 → 误吃，从原图带色还原 (RGB=原图, alpha=255)
import glob
import numpy as np
from PIL import Image
from scipy import ndimage

src = glob.glob("generated-images/toy-lantern/*.png")[0]
outp = "processed/toy-lantern.png"

raw = np.array(Image.open(src).convert("RGB")).astype(np.uint8)
out = np.array(Image.open(outp).convert("RGBA")).copy()
al = out[:, :, 3]

trans = al < 20
lab, n = ndimage.label(trans)
border = set(lab[0].tolist()) | set(lab[-1].tolist()) | \
    set(lab[:, 0].tolist()) | set(lab[:, -1].tolist())
sizes = ndimage.sum(trans, lab, range(1, n + 1))

# 目视确认的合法镂空（提手装饰拱内）
KEEP_TRANSPARENT = [(457, 567, 72, 151)]

restored = 0
for i, s in enumerate(sizes):
    id = i + 1
    if id in border or s < 60:
        continue
    cell = lab == id
    ys, xs = np.where(cell)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    if any(kx0 <= x0 and x1 <= kx1 and ky0 <= y0 and y1 <= ky1
           for kx0, kx1, ky0, ky1 in KEEP_TRANSPARENT):
        print("  [镂空保留] size=%5d x[%d..%d] y[%d..%d]" % (s, x0, x1, y0, y1))
        continue
    out[cell, 0:3] = raw[cell, 0:3]
    out[cell, 3] = 255
    restored += int(cell.sum())
    print("  [还原] size=%5d x[%d..%d] y[%d..%d] meanRGB=%s" %
          (s, x0, x1, y0, y1, [int(v) for v in raw[cell].astype(float).mean(axis=0)]))

Image.fromarray(out).save(outp)
print("restored px:", restored)
