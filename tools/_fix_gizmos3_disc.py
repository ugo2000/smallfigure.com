# -*- coding: utf-8 -*-
"""gizmos-3 外科修复：圆盘盘面（center 525,391 r=88）内被 tol 误吃的像素
从原图带色还原（RGB=原图, alpha=255）。盘面为实心物件，圆内不应有透明。"""
import os
import numpy as np
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
proc = os.path.join(BASE, "../processed/gizmos-3.png")
orig_p = os.path.join(BASE, "../generated-images/gizmos-3/A_tiny_whimsical_antique_steam_2026-10-31T01-56-25.png")

a = np.array(Image.open(proc).convert("RGBA")).copy()
orig = np.array(Image.open(orig_p).convert("RGB"))
H, W = a.shape[:2]
cy, cx, r = 391, 525, 88
yy, xx = np.mgrid[0:H, 0:W]
circle = (yy - cy) ** 2 + (xx - cx) ** 2 <= r * r
hole = circle & (a[:, :, 3] < 250)
n = int(hole.sum())
a[hole, :3] = orig[hole]
a[hole, 3] = 255
Image.fromarray(a).save(proc)
print("restored", n, "px in disc circle")

# 复核
b = np.array(Image.open(proc).convert("RGBA"))
al = b[:, :, 3]
m = circle & (al < 250)
print("remaining alpha<250 in circle:", int(m.sum()))
