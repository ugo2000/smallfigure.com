# -*- coding: utf-8 -*-
import os
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
for n in (2, 3):
    im = Image.open(os.path.join(BASE, f"../processed/gizmos-{n}.png")).convert("RGBA")
    im.thumbnail((760, 760), Image.LANCZOS)
    bg = Image.new("RGBA", (800, 800), (18, 26, 46, 255))
    bg.alpha_composite(im, ((800 - im.width) // 2, (800 - im.height) // 2))
    out = os.path.join(BASE, f"../outputs/gizmos_zoom_{n}.png")
    bg.convert("RGB").save(out)
    print("saved", out)
