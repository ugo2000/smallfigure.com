#!/usr/bin/env python3
"""分析 _eng_final.png：alpha 分布 / veil 占比 / 各区域残留，输出棋盘格+暗底+洋红底预览"""
import sys
from PIL import Image
import numpy as np

SRC = sys.argv[1] if len(sys.argv) > 1 else 'tools/_eng_final.png'
im = Image.open(SRC).convert('RGBA')
a = np.asarray(im)
H, W = a.shape[:2]
alpha = a[..., 3].astype(np.int32)
rgb = a[..., :3].astype(np.int32)

print(f'== {SRC}  {W}x{H} ==')
# alpha 直方图（分档）
bins = [(0, 0, '全透明'), (1, 15, '1-15'), (16, 47, '16-47 淡veil'), (48, 99, '48-99'),
        (100, 199, '100-199 过渡'), (200, 255, '200-255 主体')]
for lo, hi, name in bins:
    n = int(((alpha >= lo) & (alpha <= hi)).sum())
    print(f'  alpha {name:14s}: {n:8d}  {n / (H * W) * 100:5.1f}%')

# veil 判定：近奶油底色（亮、低饱和）且 alpha 低
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
mx = np.maximum(np.maximum(r, g), b)
mn = np.minimum(np.minimum(r, g), b)
paperish = (mx > 170) & ((mx - mn) < 45)   # 亮且低饱和 = 纸色
veil = paperish & (alpha >= 1) & (alpha <= 120)
print(f'  近纸色低alpha(veil)像素: {int(veil.sum())}  {veil.sum() / (H * W) * 100:.1f}%')
solid = alpha >= 200
print(f'  主体(alpha>=200)像素:    {int(solid.sum())}  {solid.sum() / (H * W) * 100:.1f}%')

# 关键区域：右下角原水印区 / 影子带
def region(name, x0, y0, x1, y1):
    X0, Y0, X1, Y1 = int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H)
    sub = alpha[Y0:Y1, X0:X1]
    subv = veil[Y0:Y1, X0:X1]
    print(f'  区域[{name}] x{x0}-{x1} y{y0}-{y1}: 非零alpha={int((sub > 0).sum())} '
          f'veil={int(subv.sum())} 最大alpha={int(sub.max())}')

region('右下角(已清水印)', 0.795, 0.855, 1.0, 1.0)
region('水印上沿(疑似晕圈残留)', 0.795, 0.80, 1.0, 0.855)
region('影子左边界带', 0.770, 0.80, 0.795, 0.90)

# 预览：暗底 / 棋盘格 / 洋红底
def preview(bg, path):
    canvas = Image.new('RGBA', im.size, bg)
    canvas.alpha_composite(im)
    canvas.convert('RGB').save(path)

preview((16, 20, 29, 255), 'tools/_pv_eng_dark.png')
preview((255, 0, 255, 255), 'tools/_pv_eng_magenta.png')
# 棋盘格
chk = Image.new('RGBA', im.size)
px = chk.load()
for y in range(H):
    for x in range(W):
        c = (32, 40, 57, 255) if ((x // 11) + (y // 11)) % 2 == 0 else (23, 29, 43, 255)
        px[x, y] = c
chk.alpha_composite(im)
chk.convert('RGB').save('tools/_pv_eng_checker.png')
print('  预览已存: tools/_pv_eng_{dark,magenta,checker}.png')
