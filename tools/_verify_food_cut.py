# -*- coding: utf-8 -*-
# 验收 17 张饭菜系抠图：四角 alpha、主体占比、半透明柔和像素数（投影是否保留）
import numpy as np
from PIL import Image
import os

PROC = "D:/WB/smallfigure.com/processed"
names = ["food_ramen_t","food_burger_t","food_pizza_t","food_cake_t","food_dumpling_t",
         "food_friedrice_t","food_sushi_t","food_hotpot_t","food_skewer_t","food_wonton_t",
         "food_mapo_t","foodjar-1","foodjar-2","foodjar-3","foodjar-4","foodjar-5","foodjar-6"]

for n in names:
    p = os.path.join(PROC, n + ".png")
    im = Image.open(p).convert("RGBA")
    a = np.array(im)[:,:,3].astype(int)
    H, W = a.shape
    # 四角 alpha
    corners = [a[0,0], a[0,W-1], a[H-1,0], a[H-1,W-1]]
    # 主体占比
    ratio = int((a >= 250).sum()) / a.size * 100
    # 半透明柔和像素（alpha 1..200）：保留投影时外圈会有一圈柔边
    soft = int(((a>0)&(a<200)).sum())
    # 透明像素（纯背景）
    trans = int((a==0).sum())
    print("%-18s corner=%s ratio=%5.1f%% softAlpha=%6d transp=%6.1f%%" % (
        n, corners, ratio, soft, trans/a.size*100))
