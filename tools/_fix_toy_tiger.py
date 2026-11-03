# -*- coding: utf-8 -*-
# 批次三十一：布老虎脚下浅色地面纹理清理
# 原图里老虎踩在一片浅灰纹理地面上（RGB≈215,203,177，饱和度仅 38），
# 与橙色布身（饱和度 >55）明显不同 → 用饱和度把地面纹理从主体里分出来清掉。
import glob
import numpy as np
from PIL import Image

src = glob.glob("generated-images/toy-clothtiger/*.png")[0]
outp = "processed/toy-clothtiger.png"

raw = np.array(Image.open(src).convert("RGB")).astype(float)
out = np.array(Image.open(outp).convert("RGBA")).copy()
al = out[:, :, 3]

sat = raw.max(axis=2) - raw.min(axis=2)
reg = np.zeros_like(al, bool)
reg[690:, :] = True
mask = (al > 0) & reg & (sat < 48) & (raw.mean(axis=2) > 170)

ys, xs = np.where(mask)
print("ground texture px:", len(xs))
if len(xs):
    print("bbox x[%d..%d] y[%d..%d]" % (xs.min(), xs.max(), ys.min(), ys.max()))
    out[mask, 3] = 0
    Image.fromarray(out).save(outp)
    print("cleared:", int(mask.sum()))
