# -*- coding: utf-8 -*-
"""清除 AI 图右下角浅色水印（"AI生成 / WORKBUDDY" 标记）。

原理：水印笔画是「比周围背景更亮」的浅色文字。
在已抠好的 RGBA 上：
  1. 取右下角区域所有不透明像素的**每通道中位数**作背景基准（抗单点干扰）
  2. 找出比基准亮 BRIGHT 以上的像素，做连通域分析
  3. 面积 >= MIN_BLOB 的块判为水印 → alpha 归零
只处理右下角区域，不碰主体。
"""
import os
import sys
from collections import deque

sys.path.insert(0, 'C:/Users/Administrator/.workbuddy/skills/character-art/scripts')
from make_transparent import decode, write_png

BRIGHT = 8    # 比背景中位数亮多少算水印笔画
MIN_BLOB = 6  # 连通块最小像素数，低于此视为噪点


def strip_watermark(path, x0f=0.70, y0f=0.80):
    W, H, nch, rows = decode(path)
    if nch != 4:
        print('  跳过（非 RGBA）:', path)
        return 0
    out = [bytearray(r) for r in rows]
    x0, y0 = int(W * x0f), int(H * y0f)
    # 收集右下角区域的不透明像素
    samples = []
    for y in range(y0, H):
        for x in range(x0, W):
            o = x * 4
            if rows[y][o + 3] > 0:
                samples.append((x, y, rows[y][o], rows[y][o + 1], rows[y][o + 2]))
    if not samples:
        print('  %-34s 右下无像素' % os.path.basename(path))
        return 0
    med = []
    for c in (2, 3, 4):
        vals = sorted(s[c] for s in samples)
        med.append(vals[len(vals) // 2])
    cand = set()
    for x, y, r, g, b in samples:
        if r - med[0] > BRIGHT and g - med[1] > BRIGHT and b - med[2] > BRIGHT:
            cand.add((x, y))
    if not cand:
        print('  %-34s 未检出浅色水印' % os.path.basename(path))
        return 0
    removed = 0
    seen = set()
    for start in cand:
        if start in seen:
            continue
        q = deque([start]); seen.add(start)
        blob = []
        while q:
            cx, cy = q.popleft()
            blob.append((cx, cy))
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nb = (cx + dx, cy + dy)
                if nb in cand and nb not in seen:
                    seen.add(nb); q.append(nb)
        if len(blob) < MIN_BLOB:
            continue
        for cx, cy in blob:
            out[cy][cx * 4 + 3] = 0
            removed += 1
    if removed:
        write_png(path, W, H, [bytes(r) for r in out])
    print('  %-34s 清除浅色水印 %6d 像素' % (os.path.basename(path), removed))
    return removed


if __name__ == '__main__':
    for p in sys.argv[1:]:
        strip_watermark(p)
