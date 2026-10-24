# -*- coding: utf-8 -*-
"""新批次 processed 透明图验收：每分类 3 张贴深色底拼一横排。"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATS = ["cur", "sym", "ship", "wp", "boot", "shield", "eblk", "mmon", "tel"]
CELL = 400
BG = (13, 17, 23)

for cat in CATS:
    cells = []
    for i in (1, 2, 3):
        p = os.path.join(ROOT, "processed/%s-%d.png" % (cat, i))
        im = Image.open(p).convert("RGBA")
        im.thumbnail((CELL, CELL), Image.LANCZOS)
        bg = Image.new("RGB", (CELL, CELL), BG)
        bg.paste(im, ((CELL - im.width) // 2, (CELL - im.height) // 2), im)
        cells.append(bg)
    sheet = Image.new("RGB", (CELL * 3 + 20, CELL), BG)
    for idx, c in enumerate(cells):
        sheet.paste(c, (idx * (CELL + 10), 0))
    out = os.path.join(ROOT, "tools/_nb_proc_%s.png" % cat)
    sheet.save(out)
    print("saved", out)
