# -*- coding: utf-8 -*-
# 批次三十四：20 枚奇想徽章第二辑，进阶抠图 + 水印清理 + 量化验收 + 深底拼图
import sys, os, glob
sys.path.insert(0, r"C:\Users\Administrator\.workbuddy\skills\character-art\scripts")
import advanced_cutout as AC
from PIL import Image
import numpy as np

KEYS = [
    "umbrellajelly", "teacupgalaxy", "matchboxfire", "bookbirds", "lanternfish",
    "clocktree", "keymoon", "bottlesail", "wellstars", "drawerspring",
    "telescopecomet", "birdcagecloud", "hourglassflower", "doorsea", "quillmoon",
    "gearbfly", "envelopeforest", "rainbulb", "chesscastle", "shellrecord",
]
# key -> 原图目录（重出版在此覆盖）
DIRS = {k: "badge2-" + k for k in KEYS}


def cleanup_watermark(path):
    """清右下角 AI 生成水印残影：徽章外接圆 r<0.30w，(0.70w,0.82h) 之后必在主体之外"""
    im = Image.open(path).convert("RGBA")
    a = np.array(im)
    h, w = a.shape[:2]
    a[int(h * 0.82):, int(w * 0.70):, :] = 0
    Image.fromarray(a).save(path)


os.makedirs("processed", exist_ok=True)
CW, CH, COLS = 300, 300, 5
sheet = Image.new("RGB", (CW * COLS, CH * 4), (24, 34, 56))

for i, key in enumerate(KEYS):
    raws = sorted(glob.glob(os.path.join("generated-images", DIRS[key], "*.png")))
    if not raws:
        raise SystemExit("缺少原图目录: " + DIRS[key])
    out = "processed/emblem-%s.png" % key
    AC.process(raws[0], out, tol=55, fill_pockets=False)
    cleanup_watermark(out)

    al = np.array(Image.open(out).convert("RGBA"))[:, :, 3]
    h, w = al.shape
    opaque = (al > 200).mean() * 100
    corners = [int(al[0, 0]), int(al[0, -1]), int(al[-1, 0]), int(al[-1, -1])]
    wm = int((al[int(h * .82):, int(w * .70):] > 0).sum())
    yy, xx = np.ogrid[:h, :w]
    disc = ((xx - w / 2) ** 2 + (yy - h / 2) ** 2) < 200 ** 2
    hole = (al[disc] == 0).mean() * 100
    flag = "  <<< 疑似误吃" if hole > 20 else ("  <<< 占比偏低" if opaque < 25 else "")
    print("  %-17s opaque=%5.1f%% corners=%s 右下残留=%d 中心圆透明=%4.1f%%%s" % (
        key, opaque, corners, wm, hole, flag))

    im = Image.open(out).convert("RGBA").resize((280, 280), Image.LANCZOS)
    bg = Image.new("RGBA", (CW, CH), (24, 34, 56, 255))
    bg.alpha_composite(im, ((CW - 280) // 2, (CH - 280) // 2))
    sheet.paste(bg.convert("RGB"), ((i % COLS) * CW, (i // COLS) * CH))

sheet.save("outputs/_badges2_final_sheet.png")
print("== 拼图 outputs/_badges2_final_sheet.png 已生成 ==")
