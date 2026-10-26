# -*- coding: utf-8 -*-
"""「旧时百工」8 张定版成品拼图（贴深色底），用于交付预览。"""
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BG = (13, 17, 23)
TILE = 420
COLS = 4
PAD = 16

tiles = []
for i in range(1, 9):
    im = Image.open(os.path.join(ROOT, 'processed', 'trades-%d.png' % i)).convert('RGBA')
    im.thumbnail((TILE - PAD * 2, TILE - PAD * 2), Image.LANCZOS)
    canvas = Image.new('RGBA', (TILE, TILE), BG + (255,))
    canvas.paste(im, ((TILE - im.width) // 2, (TILE - im.height) // 2), im)
    tiles.append(canvas.convert('RGB'))

rows = (len(tiles) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * TILE + (COLS + 1) * PAD, rows * TILE + (rows + 1) * PAD), BG)
for idx, t in enumerate(tiles):
    r, c = divmod(idx, COLS)
    sheet.paste(t, (PAD + c * (TILE + PAD), PAD + r * (TILE + PAD)))

out = os.path.join(ROOT, 'processed', '_trades_sheet.jpg')
sheet.save(out, 'JPEG', quality=90)
print('拼图已生成:', out, sheet.size)
