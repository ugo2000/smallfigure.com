# -*- coding: utf-8 -*-
"""去掉抠图后残留的孤立小碎块（与主体不相连的小连通域），保留最大主体。

用法: python _despeckle.py 输入.png 输出.png [最小像素数]
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

src = sys.argv[1]
dst = sys.argv[2]
min_px = int(sys.argv[3]) if len(sys.argv) > 3 else 400

im = Image.open(src).convert("RGBA")
a = np.array(im).copy()
al = a[:, :, 3]
op = al >= 40
lab, n = ndimage.label(op, structure=np.ones((3, 3)))
if n == 0:
    Image.fromarray(a).save(dst)
    print("no opaque pixels")
    sys.exit(0)

sizes = ndimage.sum(op, lab, range(1, n + 1))
keep = int(np.argmax(sizes)) + 1
removed = 0
for i in range(1, n + 1):
    if i == keep:
        continue
    if sizes[i - 1] < min_px:
        cell = lab == i
        # 已经是透明的部分保持透明，残余像素清掉
        a[cell & (al > 0), 3] = 0
        removed += int((cell & (al > 0)).sum())

# 主体内部与主体颜色接近但被误判的孤立像素：把小于 min_px 的域整体清掉
for i in range(1, n + 1):
    if i == keep:
        continue
    if sizes[i - 1] < min_px:
        a[lab == i, 3] = 0

Image.fromarray(a).save(dst)
total_op = int(op.sum())
print("连通域 %d  最大 %d px  清除碎块像素 %d  剩余不透明 %d (%.1f%%)" % (
    n, int(sizes.max()), removed, total_op, 100.0 * total_op / op.size))
