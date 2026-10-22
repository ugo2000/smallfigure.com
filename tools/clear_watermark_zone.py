# -*- coding: utf-8 -*-
"""
定点清除水印残影（smallfigure.com 女工程师图专用，可参数化复用）
================================================================
背景：AI 图水印「AI生成 WORKBUDDY>」颜色贴近奶油底色，bg-ref 抠图后只剩
alpha 8~200 的淡晕圈；remove-spots 因晕圈连成一个大块（占区域 87%+）被
「块太大当主体」跳过，清不掉。

本脚本对「已验证只含水印、无主体」的矩形区域做整块 alpha 清零：
- 区域边界外的主体/影子一律不碰（本例靴子右沿 0.777、影子淡边 0.78 起）
- 影子淡边 alpha ≤35，切在 0.795 处视觉无损
- 左/上边界做 1px 羽化，理论上不留硬边

用法：
    python tools/clear_watermark_zone.py 输入.png 输出.png \
        --x0 0.795 --y0 0.855 --x1 1.0 --y1 1.0 [--feather 1]

安全报告：打印清除像素数、被清除像素的 alpha 分布。
若出现 alpha>250 的像素被清，说明区域选错碰到了主体，必须中止检查。
"""
import argparse
import os
import sys

from PIL import Image


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--x0", type=float, required=True)
    ap.add_argument("--y0", type=float, required=True)
    ap.add_argument("--x1", type=float, required=True)
    ap.add_argument("--y1", type=float, required=True)
    ap.add_argument("--feather", type=int, default=1)
    a = ap.parse_args()

    im = Image.open(a.src).convert("RGBA")
    w, h = im.size
    px = im.load()

    x0, y0 = int(w * a.x0), int(h * a.y0)
    x1, y1 = min(w, int(w * a.x1)), min(h, int(h * a.y1))

    hist = {"le8": 0, "9_99": 0, "100_199": 0, "200_249": 0, "ge250": 0}
    cleared = 0
    for y in range(y0, y1):
        for x in range(x0, x1):
            al = px[x, y][3]
            if al <= 8:
                hist["le8"] += 1
                continue
            if al >= 250:
                hist["ge250"] += 1
                continue  # 主体像素绝不碰
            k = 9 if al < 100 else (100 if al < 200 else 200)
            hist[{"9": "9_99", "100": "100_199", "200": "200_249"}[str(k)]] += 1
            # 左/上边界 1px 羽化
            f = a.feather
            d = min(x - x0, y - y0)
            if d < f:
                al = int(al * (d + 1) / (f + 1))
            px[x, y] = px[x, y][:3] + (al if d < f else 0,)
            if d >= f:
                cleared += 1

    im.save(a.dst, optimize=True)
    total = sum(v for k, v in hist.items() if k != "le8")
    print("区域: x %.3f-%.3f y %.3f-%.3f (%dx%d px)" % (a.x0, a.x1, a.y0, a.y1, x1 - x0, y1 - y0))
    print("清除统计: 半透明 %d px（其中字心级 100+ : %d px），透明跳过 %d px" % (
        total, hist["100_199"] + hist["200_249"], hist["le8"]))
    print("alpha 分布:", {k: v for k, v in hist.items() if v})
    if hist["ge250"]:
        print("!! 警告：区域内有 %d 个主体级像素(alpha>=250)未清除——区域可能选错，检查！" % hist["ge250"])
        sys.exit(2)
    print("输出:", a.dst, os.path.getsize(a.dst) // 1024, "KB")


if __name__ == "__main__":
    main()
