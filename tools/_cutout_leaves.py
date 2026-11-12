# -*- coding: utf-8 -*-
# 批次三十五：8 片异星叶片，进阶抠图 + 水印连通块清理 + 量化验收 + 深底拼图
import sys, os, glob
sys.path.insert(0, r"C:\Users\Administrator\.workbuddy\skills\character-art\scripts")
import advanced_cutout as AC
from PIL import Image
import numpy as np
from scipy import ndimage

KEYS = [
    "starvein", "crystalhoney", "gearclock", "moonphase",
    "lampvein", "doublespiral", "metalscales", "dewlens",
]
# key -> 原图目录（重出版在此覆盖）
DIRS = {k: "leaf-" + k for k in KEYS}
DIRS["moonphase"] = "leaf-moonphase-v2"


def cleanup_watermark(path):
    """清底部两条角落带的水印笔画 + 全局微噪点，绝不切到叶片主体或设计元素。

    这批水印位置不固定：晶格叶的「AI生成」小字落在左下角 x=25..130,y=995..1005，
    其余图的水印是浅色，抠图阶段已被当作背景清掉。灯脉叶上方的光缕、月相叶中部的
    星点都在画面中部，不在底部角落带，因此不会被误删。
    """
    im = Image.open(path).convert("RGBA")
    a = np.array(im)
    h, w = a.shape[:2]
    al = a[:, :, 3]
    lab, n = ndimage.label(al > 0, structure=np.ones((3, 3), dtype=int))
    removed = 0
    for idx in range(1, n + 1):
        ys, xs = np.where(lab == idx)
        sz = len(ys)
        if sz == 0:
            continue
        corner_band = (ys.min() > h * 0.94) and (xs.max() < w * 0.30 or xs.min() > w * 0.70)
        # ① 底部角落带里的孤立小块（水印笔画，最大 ~50px）
        # ② 画面任何位置的 1~6px 抠图微噪点
        if (corner_band and sz < 400) or sz <= 6:
            a[ys, xs, 3] = 0
            removed += sz
    Image.fromarray(a).save(path)
    return removed, n


os.makedirs("processed", exist_ok=True)
CW, CH, COLS = 300, 300, 4
sheet = Image.new("RGB", (CW * COLS, CH * 2), (24, 34, 56))

for i, key in enumerate(KEYS):
    raws = sorted(glob.glob(os.path.join("generated-images", DIRS[key], "*.png")))
    if not raws:
        raise SystemExit("缺少原图目录: " + DIRS[key])
    out = "processed/leaf-%s.png" % key
    AC.process(raws[0], out, tol=55, fill_pockets=False)
    removed, ncomp = cleanup_watermark(out)

    al = np.array(Image.open(out).convert("RGBA"))[:, :, 3]
    h, w = al.shape
    opaque = (al > 200).mean() * 100
    corners = [int(al[0, 0]), int(al[0, -1]), int(al[-1, 0]), int(al[-1, -1])]
    bbox = Image.fromarray((al > 10).astype("uint8") * 255).getbbox()
    wm_r = int((al[int(h * .90):, int(w * .70):] > 0).sum())
    wm_l = int((al[int(h * .90):, :int(w * .30)] > 0).sum())
    core = al[h // 2 - 120:h // 2 + 120, w // 2 - 120:w // 2 + 120]
    hole = (core == 0).mean() * 100
    flag = "  <<< 疑似误吃" if hole > 25 else ("  <<< 占比偏低" if opaque < 12 else "")
    print("  %-14s opaque=%5.1f%% bbox=%s corners=%s 右下残留=%d 左下残留=%d 中心透明=%4.1f%% 清块=%d%s" % (
        key, opaque, bbox, corners, wm_r, wm_l, hole, removed, flag))

    im = Image.open(out).convert("RGBA").resize((280, 280), Image.LANCZOS)
    bg = Image.new("RGBA", (CW, CH), (24, 34, 56, 255))
    bg.alpha_composite(im, ((CW - 280) // 2, (CH - 280) // 2))
    sheet.paste(bg.convert("RGB"), ((i % COLS) * CW, (i // COLS) * CH))

sheet.save("outputs/_leaves_final_sheet.png")
print("== 拼图 outputs/_leaves_final_sheet.png 已生成 ==")
