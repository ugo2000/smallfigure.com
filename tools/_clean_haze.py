# -*- coding: utf-8 -*-
"""清理抠图后残留的「开放背景奶白雾/竖纹带」。

判定规则（保守）：
  cream  = 颜色接近背景基准色（欧氏距离 < CREAM_D）
  ink    = 完全不透明且颜色明显偏离背景（距离 >= CREAM_D）——即主体墨线/实体
  对每个「cream 且 alpha>0」的连通块：
      若其边界与 ink 像素相邻 → 视为主体细节（玻璃内壁、羊皮纸吊牌、地面投影、软边）→ 保留
      否则 → 视为开放背景残留（雾、竖纹带）→ alpha 归零

用法：python _clean_haze.py 输出目录  (处理该目录下 *_t.png)
"""
import os
import sys
from collections import deque

sys.path.insert(0, 'C:/Users/Administrator/.workbuddy/skills/character-art/scripts')
from make_transparent import decode, write_png, color_dist

CREAM_D = 55.0


def clean(path, ref):
    W, H, nch, rows = decode(path)
    if nch != 4:
        print('  跳过（非 RGBA）:', path)
        return 0
    out = [bytearray(r) for r in rows]
    cream = [[False] * W for _ in range(H)]
    ink = [[False] * W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            o = x * 4
            a = rows[y][o + 3]
            if a == 0:
                continue
            d = color_dist(rows[y][o:o + 3], ref)
            if d < CREAM_D:
                cream[y][x] = True
            elif a >= 250:
                ink[y][x] = True
    seen = [[False] * W for _ in range(H)]
    cleared = 0
    for y in range(H):
        for x in range(W):
            if not cream[y][x] or seen[y][x]:
                continue
            comp = []
            q = deque([(x, y)])
            seen[y][x] = True
            touches_ink = False
            while q:
                cx, cy = q.popleft()
                comp.append((cx, cy))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if not (0 <= nx < W and 0 <= ny < H):
                        continue
                    if ink[ny][nx]:
                        touches_ink = True
                        continue
                    if cream[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = True
                        q.append((nx, ny))
            if touches_ink:
                continue                      # 贴着墨线 = 主体细节，保留
            for cx, cy in comp:
                out[cy][cx * 4 + 3] = 0
            cleared += len(comp)
    if cleared:
        write_png(path, W, H, [bytes(r) for r in out])
    print('  %-34s 清除开放背景残留 %6d 像素' % (os.path.basename(path), cleared))
    return cleared


def main():
    target_dir = sys.argv[1]
    raw_dir = sys.argv[2] if len(sys.argv) > 2 else None
    files = sorted(f for f in os.listdir(target_dir) if f.endswith('_t.png'))
    total = 0
    for f in files:
        p = os.path.join(target_dir, f)
        ref = None
        if raw_dir:
            rp = os.path.join(raw_dir, f.replace('_t.png', '_raw.png'))
            if os.path.exists(rp):
                W2, H2, n2, r2 = decode(rp)
                acc = [0, 0, 0]
                cnt = 0
                for x in range(0, W2, max(1, W2 // 40)):
                    for yy in (0, H2 - 1):
                        o = x * n2
                        acc[0] += r2[yy][o]; acc[1] += r2[yy][o + 1]; acc[2] += r2[yy][o + 2]
                        cnt += 1
                for yy in range(0, H2, max(1, H2 // 40)):
                    for x in (0, W2 - 1):
                        o = x * n2
                        acc[0] += r2[yy][o]; acc[1] += r2[yy][o + 1]; acc[2] += r2[yy][o + 2]
                        cnt += 1
                ref = [a // max(1, cnt) for a in acc]
        if ref is None:
            W3, H3, n3, r3 = decode(p)
            acc = [0, 0, 0]
            cnt = 0
            for x in range(0, W3, max(1, W3 // 40)):
                for yy in (0, H3 - 1):
                    o = x * n3
                    acc[0] += r3[yy][o]; acc[1] += r3[yy][o + 1]; acc[2] += r3[yy][o + 2]
                    cnt += 1
            for yy in range(0, H3, max(1, H3 // 40)):
                for x in (0, W3 - 1):
                    o = x * n3
                    acc[0] += r3[yy][o]; acc[1] += r3[yy][o + 1]; acc[2] += r3[yy][o + 2]
                    cnt += 1
            ref = [a // max(1, cnt) for a in acc]
        total += clean(p, ref)
    print('== 合计清除 %d 像素 ==' % total)


if __name__ == '__main__':
    main()
