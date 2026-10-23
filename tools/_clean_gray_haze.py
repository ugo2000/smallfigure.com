# -*- coding: utf-8 -*-
"""清除「灰色蒸汽雾」：低饱和、半透明、且不贴着主体的残留。

背景/发光晕在深色底上会显脏。低饱和（灰白烟）与真正有彩色的光晕可以区分开：
  彩色度 = max(r,g,b) - min(r,g,b)
  烟 ≈ 0~20   奶白雾 ≈ 30~45   琥珀光 ≈ 130+
规则：半透明像素中，彩色度 < SAT 且 2px 内没有不透明主体像素 → 判为雾，alpha 归零。
不透明主体（alpha>=250）与贴着主体的软边一律保留。

用法：python tools/_clean_gray_haze.py 处理目录 [--sat 60] [--dist 2]
"""
import os
import sys

sys.path.insert(0, 'C:/Users/Administrator/.workbuddy/skills/character-art/scripts')
from make_transparent import decode, write_png

SAT = 60
DIST = 2


def sat(px):
    return max(px) - min(px)


def clean(path, sat_thr, dist):
    W, H, nch, rows = decode(path)
    if nch != 4:
        return 0
    opaque = [[rows[y][x * 4 + 3] >= 250 for x in range(W)] for y in range(H)]
    # 2px 邻域内有否不透明像素
    near_opaque = [[False] * W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            if not opaque[y][x]:
                continue
            for dy in range(-dist, dist + 1):
                for dx in range(-dist, dist + 1):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < W and 0 <= ny < H:
                        near_opaque[ny][nx] = True
    out = [bytearray(r) for r in rows]
    cleared = 0
    for y in range(H):
        for x in range(W):
            o = x * 4
            a = rows[y][o + 3]
            if a < 8 or a >= 250:
                continue
            if near_opaque[y][x]:
                continue
            if sat(rows[y][o:o + 3]) >= sat_thr:
                continue
            out[y][o + 3] = 0
            cleared += 1
    if cleared:
        write_png(path, W, H, [bytes(r) for r in out])
    print('  %-30s 清除灰色雾 %6d 像素' % (os.path.basename(path), cleared))
    return cleared


def main():
    d = sys.argv[1]
    if '--sat' in sys.argv:
        global SAT
        SAT = int(sys.argv[sys.argv.index('--sat') + 1])
    if '--dist' in sys.argv:
        global DIST
        DIST = int(sys.argv[sys.argv.index('--dist') + 1])
    total = 0
    if os.path.isfile(d):
        total += clean(d, SAT, DIST)
        print('== 合计清除 %d 像素 ==' % total)
        return
    for f in sorted(os.listdir(d)):
        if f.endswith('_t.png'):
            total += clean(os.path.join(d, f), SAT, DIST)
    print('== 合计清除 %d 像素 ==' % total)


if __name__ == '__main__':
    main()
