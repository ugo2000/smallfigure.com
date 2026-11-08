# -*- coding: utf-8 -*-
# 批次三十三：8 枚奇想徽章，character-art 进阶抠图 + 量化验收 + 深底拼图
import sys, os, glob
sys.path.insert(0, r"C:\Users\Administrator\.workbuddy\skills\character-art\scripts")
import advanced_cutout as AC
from PIL import Image
import numpy as np

# key -> 原图目录（hiveclock 用 v2：v1 钟面被 AI 画了罗马数字）
DIRS = {
    "cloudwhale": "badge-cloudwhale",
    # v1 深色主体与深板岩底距离过近被 tol55 整片吃掉，v2 改浅奶油底 + 高饱和深色主体
    "bottledstorm": "badge-bottledstorm-v2",
    "hiveclock": "badge-hiveclock-v2",  # v1 钟面被画了罗马数字
    "eyekey": "badge-eyekey",
    "windupplanet": "badge-windupplanet-v2",
    "mothcandle": "badge-mothcandle",
    "keyholegarden": "badge-keyholegarden",
    "moonsnail": "badge-moonsnail",
}


def cleanup_watermark(path):
    """清右下角水印残影：徽章外接圆半径 < 0.32*w，(0.70w,0.82h) 之后必在主体之外"""
    im = Image.open(path).convert("RGBA")
    a = np.array(im)
    h, w = a.shape[:2]
    y0, x0 = int(h * 0.82), int(w * 0.70)
    a[y0:, x0:, :] = 0
    Image.fromarray(a).save(path)

os.makedirs("processed", exist_ok=True)
sheet = Image.new("RGB", (1360, 680), (24, 34, 56))

for i, (key, d) in enumerate(DIRS.items()):
    raws = sorted(glob.glob(os.path.join("generated-images", d, "*.png")))
    if not raws:
        raise SystemExit("缺少原图目录: " + d)
    out = "processed/emblem-%s.png" % key
    # 器物/徽章类必加 no-fill-pockets：避免封闭背景口袋自动填误吃内部设计
    AC.process(raws[0], out, tol=55, fill_pockets=False)
    cleanup_watermark(out)

    a = np.array(Image.open(out).convert("RGBA"))
    al = a[:, :, 3]
    h, w = al.shape
    opaque = (al > 200).mean() * 100
    corners = [int(al[0, 0]), int(al[0, -1]), int(al[-1, 0]), int(al[-1, -1])]
    wm = int((al[int(h * .82):, int(w * .70):] > 0).sum())
    yy, xx = np.ogrid[:h, :w]
    disc = ((xx - w / 2) ** 2 + (yy - h / 2) ** 2) < 200 ** 2
    hole = (al[disc] == 0).mean() * 100
    flag = "  <<< 疑似误吃" if hole > 20 else ""
    print("  %-16s opaque=%5.1f%% corners=%s 右下角残留=%d 中心圆透明=%4.1f%%%s" % (
        key, opaque, corners, wm, hole, flag))

    im = Image.open(out).convert("RGBA").resize((320, 320), Image.LANCZOS)
    bg = Image.new("RGBA", (340, 340), (24, 34, 56, 255))
    bg.alpha_composite(im, (10, 10))
    sheet.paste(bg.convert("RGB"), ((i % 4) * 340, (i // 4) * 340))

sheet.save("outputs/_badges_final_sheet.png")
print("== 拼图 outputs/_badges_final_sheet.png 已生成 ==")
