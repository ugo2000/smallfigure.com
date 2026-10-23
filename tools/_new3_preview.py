# -*- coding: utf-8 -*-
"""本轮 12 张透明 PNG 合成到站点深色底，分三组拼图"""
import os
from PIL import Image

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GROUPS = [
  ("弹药", ["ammo_shell", "ammo_shotgun", "ammo_shell_cannon", "ammo_energy"]),
  ("农人", ["figure_farmer_male_sickle", "figure_farmer_female_hoe",
            "figure_farmer_male_pitchfork", "figure_farmer_female_pole"]),
  ("载具", ["veh_spaceship", "veh_propeller", "veh_robot", "veh_engine"]),
]
CELL, PAD, BG = 400, 10, (13, 17, 23)

for label, names in GROUPS:
    canvas = Image.new("RGB", (CELL*4 + PAD*5, CELL + PAD*2), BG)
    for idx, n in enumerate(names):
        im = Image.open(os.path.join(BASE, "processed", "%s_t.png" % n)).convert("RGBA")
        im.thumbnail((CELL, CELL), Image.LANCZOS)
        tile = Image.new("RGBA", (CELL, CELL), BG + (255,))
        tile.alpha_composite(im, ((CELL-im.width)//2, (CELL-im.height)//2))
        canvas.paste(tile.convert("RGB"), (PAD + idx*(CELL+PAD), PAD))
    out = os.path.join(BASE, "processed/_new3_prev_%s.png" % label)
    canvas.save(out); print(out, canvas.size)
