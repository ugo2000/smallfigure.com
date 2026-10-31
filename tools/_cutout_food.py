# -*- coding: utf-8 -*-
# 一次性抠图 17 张饭菜系（5 food 重做 + 6 新菜 + 6 foodjar），默认 tol 55 保留柔和投影
import subprocess, os

VENV = "C:/Users/Administrator/.workbuddy/binaries/python/envs/default/Scripts/python.exe"
SCRIPT = "C:/Users/Administrator/.workbuddy/skills/character-art/scripts/advanced_cutout.py"
GEN = "D:/WB/smallfigure.com/generated-images"
PROC = "D:/WB/smallfigure.com/processed"

pairs = [
    ("food-ramen",   "A_steaming_bowl_of_tonkotsu_ra_2026-10-31T09-58-11.png", "food_ramen_t.png"),
    ("food-burger",  "Bold_American_comic_book_style_2026-10-31T09-57-21.png", "food_burger_t.png"),
    ("food-pizza",   "A_slice_of_pepperoni_pizza__bo_2026-10-31T09-58-39.png", "food_pizza_t.png"),
    ("food-cake",    "A_three_layer_strawberry_cream_2026-10-31T09-58-57.png", "food_cake_t.png"),
    ("food-dumpling","Six_pleated_soup_dumplings_in__2026-10-31T09-59-18.png", "food_dumpling_t.png"),
    ("food-friedrice","A_bowl_of_golden_egg_fried_ric_2026-10-31T09-59-39.png", "food_friedrice_t.png"),
    ("food-sushi",   "A_sushi_platter_on_a_black_tra_2026-10-31T09-59-59.png", "food_sushi_t.png"),
    ("food-hotpot",  "A_spicy_brass_hot_pot__bold_Am_2026-10-31T10-00-23.png", "food_hotpot_t.png"),
    ("food-skewer",  "Several_skewers_of_cumin_lamb__2026-10-31T10-00-40.png", "food_skewer_t.png"),
    ("food-wonton",  "A_bowl_of_shrimp_wonton_noodle_2026-10-31T10-01-00.png", "food_wonton_t.png"),
    ("food-mapo",    "A_bowl_of_mapo_tofu__bold_Amer_2026-10-31T10-01-19.png", "food_mapo_t.png"),
    ("foodjar-1",    "A_glass_starlight_jar__bold_Am_2026-10-31T10-01-55.png", "foodjar-1.png"),
    ("foodjar-2",    "A_sprouting_ceramic_crock__bol_2026-10-31T10-02-21.png", "foodjar-2.png"),
    ("foodjar-3",    "A_bubbling_jam_bottle__bold_Am_2026-10-31T10-02-37.png", "foodjar-3.png"),
    ("foodjar-4",    "A_cloud_steeping_cast_iron_pot_2026-10-31T10-02-56.png", "foodjar-4.png"),
    ("foodjar-5",    "A_tall_rainbow_bottle__bold_Am_2026-10-31T10-03-27.png", "foodjar-5.png"),
    ("foodjar-6",    "A_frosted_honey_pot__bold_Amer_2026-10-31T10-03-44.png", "foodjar-6.png"),
]

for d, f, out in pairs:
    src = os.path.join(GEN, d, f)
    dst = os.path.join(PROC, out)
    if not os.path.exists(src):
        print("MISSING SRC", out, src); continue
    r = subprocess.run([VENV, SCRIPT, src, dst], capture_output=True, text=True, timeout=120)
    status = "OK" if r.returncode == 0 else "FAIL"
    tail = (r.stdout if r.returncode == 0 else r.stderr)[-240:].replace("\n", " | ")
    print("%-22s %s  %s" % (out, status, tail))
