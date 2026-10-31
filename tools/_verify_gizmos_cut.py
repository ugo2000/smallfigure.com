# -*- coding: utf-8 -*-
import os
import numpy as np
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
files = [os.path.join(BASE, f"../processed/gizmos-{i}.png") for i in range(1, 7)]
for f in files:
    im = Image.open(f).convert("RGBA")
    a = np.array(im)
    alpha = a[:, :, 3]
    h, w = alpha.shape
    corners = [int(alpha[2, 2]), int(alpha[2, w - 3]), int(alpha[h - 3, 2]), int(alpha[h - 3, w - 3])]
    opaque = int((alpha >= 200).sum())
    ratio = opaque / (h * w)
    ys, xs = np.where(alpha >= 200)
    if len(xs) > 0:
        bbox = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
        bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
        rgb = a[ys, xs, :3].mean(axis=0)
    else:
        bbox, rgb = None, None
    print("%-40s %4dx%-4d corners=%s ratio=%5.1f%% bbox=%s avgRGB=%s" % (
        os.path.basename(f), w, h, corners, ratio * 100, bbox,
        [int(v) for v in rgb] if rgb is not None else None))
