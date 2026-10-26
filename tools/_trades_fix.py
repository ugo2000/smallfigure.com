# -*- coding: utf-8 -*-
"""「旧时百工」批次抠图后处理：清脚下 halftone 网点投影残留。

背景：AI 画的脚下投影带 halftone 网点，洪水填充时被网点芯切断通道，
抠完只剩一片奶油色碎点或一截浅色残块。
本脚本按「底部带 + 近纸底色 + 不属于主体深色部分」三条件清理，
只清投影碎屑，不动人物本体与实体道具。

用法：python tools/_trades_fix.py 1 2 3 4 5 6 7 8
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def fix(path, band=0.83, near=52, protect=40):
    im = Image.open(path).convert('RGBA')
    a = np.array(im).copy()
    H, W = a.shape[:2]
    rgb = a[:, :, :3].astype(np.float32)
    al = a[:, :, 3]

    # 纸底参考色：四边中位数
    edge = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]], axis=0)
    ref = np.median(edge, axis=0)
    dist = np.sqrt(((rgb - ref) ** 2).sum(axis=2))

    op = al >= 40
    lab, cnt = ndimage.label(op, structure=np.ones((3, 3)))
    if cnt == 0:
        return 0
    sizes = ndimage.sum(op, lab, range(1, cnt + 1))
    main = int(np.argmax(sizes)) + 1
    body = (lab == main)

    zone = np.zeros((H, W), bool)
    zone[int(H * band):, :] = True

    # 近纸底色 → 清透明。主体里真正偏白的部分（alpha 实心且色距 > protect）不动。
    cand = zone & (dist <= near) & (~((al >= 250) & (dist > protect)))
    cand = ndimage.binary_opening(cand, np.ones((2, 2)))

    # 底部带里不与主体相连的独立小块 → 一并清（投影残块、网点碎片）
    loose = zone & op & (~body)
    l2, c2 = ndimage.label(loose, structure=np.ones((3, 3)))
    if c2:
        s2 = ndimage.sum(loose, l2, range(1, c2 + 1))
        cand |= np.isin(l2, [i + 1 for i in range(c2) if s2[i] < 9000])

    hit = cand & (al > 0)
    a[hit, 3] = 0

    # 底部带内的半透明雾也抹平
    haze = zone & (al < 40) & (al > 0)
    a[haze, 3] = 0

    Image.fromarray(a).save(path)
    return int(hit.sum())


if __name__ == '__main__':
    os.chdir(ROOT)
    for n in sys.argv[1:]:
        p = os.path.join('processed', 'trades-%s.png' % n)
        print('trades-%s 清残留 %d px' % (n, fix(p)))
