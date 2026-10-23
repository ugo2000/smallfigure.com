# -*- coding: utf-8 -*-
"""5 张食物透明 PNG 合成到站点深色底（#0d1117）上，拼一张验收图"""
import os
from PIL import Image

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAMES = ["food_ramen", "food_burger", "food_pizza", "food_cake", "food_dumpling"]
CELL = 400
PAD = 12
BG = (13, 17, 23)

canvas = Image.new("RGB", (CELL * 3 + PAD * 4, CELL * 2 + PAD * 3), BG)
for idx, n in enumerate(NAMES):
    im = Image.open(os.path.join(BASE, "processed", "%s_t.png" % n)).convert("RGBA")
    im.thumbnail((CELL, CELL), Image.LANCZOS)
    tile = Image.new("RGBA", (CELL, CELL), BG + (255,))
    tile.alpha_composite(im, ((CELL - im.width) // 2, (CELL - im.height) // 2))
    r, c = divmod(idx, 3)
    canvas.paste(tile.convert("RGB"), (PAD + c * (CELL + PAD), PAD + r * (CELL + PAD)))
out = os.path.join(BASE, "processed/_food_preview.png")
canvas.save(out)
print(out, canvas.size)
