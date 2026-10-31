# -*- coding: utf-8 -*-
import os
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
files = [f"../processed/gizmos-{i}.png" for i in range(1, 7)]
imgs = [Image.open(os.path.join(BASE, f)).convert("RGBA") for f in files]
cell = 350
cols, rows = 3, 2
sheet = Image.new("RGBA", (cols * cell, rows * cell), (18, 26, 46, 255))
for idx, im in enumerate(imgs):
    im.thumbnail((320, 320), Image.LANCZOS)
    x = (idx % cols) * cell + (cell - im.width) // 2
    y = (idx // cols) * cell + (cell - im.height) // 2
    sheet.alpha_composite(im, (x, y))
out = os.path.join(BASE, "../outputs/gizmos_contact.png")
sheet.convert("RGB").save(out)
print("saved", out, sheet.size)
