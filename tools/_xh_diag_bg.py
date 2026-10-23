# -*- coding: utf-8 -*-
"""区分两类残留：①真正没清干净的「开放背景」（该清，渐变暗角导致）
vs ②生物自身的浅色部位 / 封闭口袋（不该动）。

判据：真纸色 = 抠后透明像素对应的原图像素的中位色。
把「透明」或「与原图纸色接近的不透明像素」合并成 free 集合，从边框洪水扩散；
能扩散到的纸色不透明像素 = 与边缘连通的开放背景（渐变残留）→ 该清；
扩散不到的 = 被生物包围（封闭口袋或生物本体）→ 不动。
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAMES = ['xeno-prism-stalker', 'xeno-rib-lurker', 'xeno-mycelial-weaver',
         'flora-pulse-pod', 'flora-gland-stake', 'xeno-strike-scene']


def main():
    for n in NAMES:
        raw = np.array(Image.open(os.path.join(BASE, 'originals', 'raw',
                                               n + '_raw.png')).convert('RGB')).astype(np.float32)
        cut = np.array(Image.open(os.path.join(BASE, 'processed', n + '_t.png')).convert('RGBA'))
        H, W, _ = raw.shape
        al = cut[:, :, 3]
        paper = raw[al < 10]
        if len(paper) < 100:
            print('%-24s 无可判定背景' % n); continue
        P = np.median(paper.reshape(-1, 3), axis=0)
        d = np.sqrt(((raw - P) ** 2).sum(axis=2))
        paper_opaque = (al >= 250) & (d < 15)          # 纸色不透明 = 没清掉的背景
        free = (al < 10) | paper_opaque                # 可走通道
        # 从边框扩散
        lab = ndimage.label(free)[0]
        border = np.zeros_like(lab, bool)
        border[0] = free[0]; border[-1] = free[-1]
        border[:, 0] = free[:, 0]; border[:, -1] = free[:, -1]
        reached = np.isin(lab, np.unique(lab[border]))
        open_residue = int((paper_opaque & reached).sum())     # 开放背景残留（该清）
        enclosed = int((paper_opaque & ~reached).sum())         # 封闭口袋/生物本体（不动）
        # 开放残留的 bbox（判断是不是居中大块渐变残留）
        if open_residue:
            ys, xs = np.where(paper_opaque & reached)
            box = 'x %.2f-%.2f y %.2f-%.2f' % (xs.min()/W, xs.max()/W, ys.min()/H, ys.max()/H)
        else:
            box = '-'
        print('%-24s 开放背景残留 %7d  封闭 %7d  残留bbox %s' % (n, open_residue, enclosed, box))


if __name__ == '__main__':
    sys.path.insert(0, 'C:/Users/Administrator/.workbuddy/skills/character-art/scripts')
    main()
