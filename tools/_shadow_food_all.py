# -*- coding: utf-8 -*-
# 给全部 17 张饭菜系 processed PNG 批量合成柔和投影（调好的参数，直接覆盖）
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _add_shadow import add_shadow

PROC = "D:/WB/smallfigure.com/processed"
names = ["food_ramen_t","food_burger_t","food_pizza_t","food_cake_t","food_dumpling_t",
         "food_friedrice_t","food_sushi_t","food_hotpot_t","food_skewer_t","food_wonton_t",
         "food_mapo_t","foodjar-1","foodjar-2","foodjar-3","foodjar-4","foodjar-5","foodjar-6"]

for n in names:
    p = os.path.join(PROC, n + ".png")
    tmp = p + ".tmp.png"
    add_shadow(p, tmp, peak=48, wr=0.60, hr=0.11, drop=0.045)
    os.replace(tmp, p)
    print("shadowed", n)
print("done")
