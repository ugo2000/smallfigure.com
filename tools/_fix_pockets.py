# -*- coding: utf-8 -*-
"""修复抠图后残留的「封闭背景口袋」：轮廓包围住的背景色区域，
边界洪水填充够不到（比如两腿之间）。从指定种子点泛洪，
只抠掉与背景基准色接近的像素（软过渡与主抠图一致）。

用法：
  python _fix_pockets.py 输入.png 输出.png --seed 0.50,0.60 --region 0.35,0.45,0.65,0.90 [--tol 45]

seed/region 均为比例坐标（左上原点）。可多次 --seed。
"""
import argparse
import os
import sys
from collections import deque

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                '..', '..', '.workbuddy', 'skills', 'character-art', 'scripts'))
try:
    from make_transparent import decode, write_png, bg_ref_color, color_dist
except ImportError:
    sys.path.insert(0, 'C:/Users/Administrator/.workbuddy/skills/character-art/scripts')
    from make_transparent import decode, write_png, bg_ref_color, color_dist


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--seed', action='append', help='种子点 x,y（比例，可多次）；与 --scan 二选一')
    ap.add_argument('--scan', action='store_true', help='只扫描并列出所有封闭背景色连通块，不修改')
    ap.add_argument('--region', default=None, help='约束区域 x0,y0,x1,y1（比例）')
    ap.add_argument('--tol', type=int, default=45)
    a = ap.parse_args()

    W, H, nch, rows = decode(a.src)
    if nch != 4:
        print('输入须是 RGBA PNG'); sys.exit(1)
    ref = bg_ref_color(rows, W, H, nch)

    if a.scan:
        # 找所有「与背景色接近、但不与图片边缘连通」的封闭连通块
        isbg = [[color_dist(rows[y][x * 4:x * 4 + 3], ref) < a.tol for x in range(W)] for y in range(H)]
        edge_connected = [[False] * W for _ in range(H)]
        q = deque()
        for x in range(W):
            for y in (0, H - 1):
                if isbg[y][x] and not edge_connected[y][x]:
                    edge_connected[y][x] = True; q.append((x, y))
        for y in range(H):
            for x in (0, W - 1):
                if isbg[y][x] and not edge_connected[y][x]:
                    edge_connected[y][x] = True; q.append((x, y))
        while q:
            x, y = q.popleft()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and isbg[ny][nx] and not edge_connected[ny][nx]:
                    edge_connected[ny][nx] = True; q.append((nx, ny))
        comp = [[-1] * W for _ in range(H)]
        n_comp = 0
        for y in range(H):
            for x in range(W):
                if isbg[y][x] and not edge_connected[y][x] and comp[y][x] == -1:
                    qq = deque([(x, y)]); comp[y][x] = n_comp
                    while qq:
                        cx, cy = qq.popleft()
                        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                            nx, ny = cx + dx, cy + dy
                            if 0 <= nx < W and 0 <= ny < H and comp[ny][nx] == -1 \
                               and isbg[ny][nx] and not edge_connected[ny][nx]:
                                comp[ny][nx] = n_comp; qq.append((nx, ny))
                    n_comp += 1
        stats = {}
        for y in range(H):
            for x in range(W):
                c = comp[y][x]
                if c == -1:
                    continue
                st = stats.setdefault(c, {'n': 0, 'x0': W, 'y0': H, 'x1': 0, 'y1': 0, 'sr': 0, 'sg': 0, 'sb': 0})
                st['n'] += 1
                st['x0'] = min(st['x0'], x); st['y0'] = min(st['y0'], y)
                st['x1'] = max(st['x1'], x); st['y1'] = max(st['y1'], y)
                st['sr'] += rows[y][x * 4]; st['sg'] += rows[y][x * 4 + 1]; st['sb'] += rows[y][x * 4 + 2]
        print('ref=%s tol=%d 封闭背景色连通块（不与边缘连通）:' % (ref, a.tol))
        for c, st in sorted(stats.items(), key=lambda kv: -kv[1]['n']):
            if st['n'] < 30:
                continue
            print('  #%d  %5d px  bbox x %.3f-%.3f  y %.3f-%.3f  均色 rgb(%d,%d,%d)' % (
                c, st['n'], st['x0'] / W, st['x1'] / W, st['y0'] / H, st['y1'] / H,
                st['sr'] // st['n'], st['sg'] // st['n'], st['sb'] // st['n']))
        return

    if not a.seed or not a.region:
        print('需要 --seed 和 --region（或用 --scan）'); sys.exit(1)
    rx0, ry0, rx1, ry1 = [float(v) for v in a.region.split(',')]
    rx0, ry1 = int(rx0 * W), int(ry1 * H)
    rx1, ry0 = int(rx1 * W), int(ry0 * H)

    out = [bytearray(r) for r in rows]
    seen = [[False] * W for _ in range(H)]
    q = deque()
    for s in a.seed:
        sx, sy = float(s.split(',')[0]) * W, float(s.split(',')[1]) * H
        sx, sy = int(sx), int(sy)
        px = rows[sy][sx * 4:sx * 4 + 3]
        if rows[sy][sx * 4 + 3] < 100:
            print('  [跳过] 种子点已是透明像素: (%.3f,%.3f)' % (sx / W, sy / H))
            continue
        if color_dist(px, ref) >= a.tol:
            print('  [跳过] 种子点颜色不像背景: %s' % (tuple(px),))
            continue
        if not seen[sy][sx]:
            seen[sy][sx] = True
            q.append((sx, sy))
    filled = 0
    while q:
        x, y = q.popleft()
        o = x * 4
        d = color_dist(rows[y][o:o + 3], ref)
        alpha = int(max(0, min(255, (d - 8) / 46.0 * 255)))
        out[y][o + 3] = min(out[y][o + 3], alpha)
        filled += 1
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            # 只在不透明像素间传播：透明像素的 RGB 仍是背景色，
            # 穿过去会从另一侧漏进角色本体（踩过的坑）
            if rx0 <= nx < rx1 and ry0 <= ny < ry1 and not seen[ny][nx] and rows[ny][nx * 4 + 3] >= 100:
                if color_dist(rows[ny][nx * 4:nx * 4 + 3], ref) < a.tol:
                    seen[ny][nx] = True
                    q.append((nx, ny))
    write_png(a.dst, W, H, [bytes(r) for r in out])
    print('  %s -> %s  口袋填充 %d 像素 (ref=%s tol=%d)' %
          (os.path.basename(a.src), os.path.basename(a.dst), filled, ref, a.tol))


if __name__ == '__main__':
    main()
