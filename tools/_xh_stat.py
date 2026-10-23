# -*- coding: utf-8 -*-
"""本轮 6 张异星猎食素材的抠图量化验收（无视觉依赖）。

报四项：
  opaque  不透明占比（alpha>=250）—— 主体占比，参考区间 12%~70%
  semi    半透明像素数（8<=alpha<250）—— 边缘软过渡，少量正常，几万要查雾
  bgleft  仍与纸底基准色接近的不透明像素数 —— 背景残留（含封闭口袋）
  corner  右下角 0.70,0.82 之后的孤立小块 —— 水印残余
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAMES = ['xeno-prism-stalker', 'xeno-rib-lurker', 'xeno-mycelial-weaver',
         'flora-pulse-pod', 'flora-gland-stake', 'xeno-strike-scene']


def border_ref(arr):
    edge = np.concatenate([arr[0], arr[-1], arr[:, 0], arr[:, -1]], axis=0)
    return np.median(edge.reshape(-1, 3), axis=0)


def stat(path):
    a = np.array(Image.open(path).convert('RGBA')).astype(np.float32)
    H, W, _ = a.shape
    al = a[:, :, 3]
    rgb = a[:, :, :3]
    opaque = al >= 250
    semi = int(((al >= 8) & (al < 250)).sum())
    rgb0 = np.array(Image.open(path).convert('RGB')).astype(np.float32)
    ref = border_ref(rgb0)
    dist = np.sqrt(((rgb - ref) ** 2).sum(axis=2))
    bgleft = int(((dist <= 18) & opaque).sum())
    # 右下角残留连通块
    zone = np.zeros((H, W), bool)
    zone[int(0.82 * H):, int(0.70 * W):] = True
    m = zone & opaque
    lab, n = ndimage.label(m)
    corner = 0
    if n:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        corner = int(sum(s for s in sizes if 5 <= s <= 4000))
    return opaque.mean() * 100, semi, bgleft, corner


def main():
    bad = 0
    for n in NAMES:
        p = os.path.join(BASE, 'processed', n + '_t.png')
        if not os.path.exists(p):
            print('  缺失 %s' % n)
            bad += 1
            continue
        r, s, b, c = stat(p)
        flag = ''
        if not (8 <= r <= 75):
            flag += ' [占比异常]'
        if s > 60000:
            flag += ' [雾多]'
        if b > 8000:
            flag += ' [背景残留]'
        if c > 200:
            flag += ' [水印残余]'
        if flag:
            bad += 1
        print('  %-24s opaque %5.1f%%  semi %6d  bgleft %6d  corner %5d%s'
              % (n, r, s, b, c, flag))
    print('== 异常项 %d ==' % bad)


if __name__ == '__main__':
    main()
