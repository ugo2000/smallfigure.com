# -*- coding: utf-8 -*-
"""本轮 12 张原图分组拼图，便于目视检查"""
import os, glob
from PIL import Image

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEN = os.path.join(BASE, "originals/raw/_gen")
GROUPS = [
  ("弹药", ["ammo_shell", "ammo_shotgun", "ammo_shell_cannon", "ammo_energy"]),
  ("农人", ["figure_farmer_male_sickle", "figure_farmer_female_hoe",
            "figure_farmer_male_pitchfork", "figure_farmer_female_pole"]),
  ("载具", ["veh_spaceship", "veh_propeller", "veh_robot", "veh_engine"]),
]
CELL, PAD = 400, 10

for label, names in GROUPS:
    canvas = Image.new("RGB", (CELL*4 + PAD*5, CELL + PAD*2), (24, 26, 32))
    for idx, n in enumerate(names):
        f = sorted(glob.glob(os.path.join(GEN, n, "*.png")))[0]
        im = Image.open(f).convert("RGB").resize((CELL, CELL), Image.LANCZOS)
        canvas.paste(im, (PAD + idx*(CELL+PAD), PAD))
    out = os.path.join(BASE, "processed/_new3_%s.png" % label)
    canvas.save(out); print(out, canvas.size)
