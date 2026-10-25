#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""smallfigure.com 社交分享图（OG image）生成器

产出：og-1200x630.jpg（站点根目录，1200×630）
构图：左侧深色底 + 站点文字（站名 / 主张 / 数据），右侧 hero 背景图渐隐切入。
用法：python tools/make_og_image.py
"""
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERO = os.path.join(ROOT, "assets", "img", "hero_bg.webp")
OUT = os.path.join(ROOT, "og-1200x630.jpg")

W, H = 1200, 630
BG_TOP = (11, 14, 20)
BG_BOTTOM = (16, 20, 33)
ACCENT = (94, 234, 212)   # #5eead4
TEXT = (232, 238, 247)    # #e8eef7
MUTED = (139, 150, 169)   # #8b96a9

FONT_DIR = "C:/Windows/Fonts"


def font(name, size):
    for cand in (name, "msyh.ttc", "simhei.ttf"):
        try:
            return ImageFont.truetype(os.path.join(FONT_DIR, cand), size)
        except Exception:
            continue
    return ImageFont.load_default()


def gradient_bg():
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        t = y / (H - 1)
        c = tuple(int(BG_TOP[i] + (BG_BOTTOM[i] - BG_TOP[i]) * t) for i in range(3))
        for x in range(W):
            px[x, y] = c
    return img


def main():
    base = gradient_bg()

    # 右侧 hero 图：裁成 580×630 竖条，左侧做渐隐融入底色
    if os.path.exists(HERO):
        hero = Image.open(HERO).convert("RGB")
        art_w = 580
        target = art_w / H
        sw = int(hero.height * target)
        sx = (hero.width - sw) // 2
        hero = hero.crop((sx, 0, sx + sw, hero.height)).resize((art_w, H), Image.LANCZOS)
        mask = Image.new("L", (art_w, H))
        mp = mask.load()
        for x in range(art_w):
            # 左 180px 渐隐：0 → 255
            a = 0 if x < 180 else min(255, int((x - 180) / 200 * 255))
            for y in range(H):
                mp[x, y] = a
        base.paste(hero, (W - art_w, 0), mask)

    draw = ImageDraw.Draw(base)
    x = 64
    max_w = 560

    # 顶部细 accent 线 + kicker
    draw.rectangle([x, 96, x + 56, 100], fill=ACCENT)
    draw.text((x, 122), "原创素材图鉴 · ORIGINAL ASSET GALLERY",
              font=font("msyh.ttc", 24), fill=ACCENT)

    # 站名
    draw.text((x, 176), "smallfigure", font=font("msyhbd.ttc", 92), fill=TEXT)

    # 主张
    draw.text((x, 300), "万物皆都有自己的故事", font=font("msyh.ttc", 42), fill=TEXT)
    draw.text((x, 362), "Every little figure has a story",
              font=font("msyh.ttc", 26), fill=MUTED)

    # 数据行（由 images.json 实读）
    import json
    with open(os.path.join(ROOT, "data", "images.json"), encoding="utf-8") as f:
        d = json.load(f)
    info = "%d 件原创素材 · %d 个分类 · 透明 PNG · 免费下载" % (d["count"], len(d["categories"]))
    draw.text((x, 452), info, font=font("msyh.ttc", 27), fill=MUTED)

    # 底部域名
    draw.text((x, 540), "smallfigure.com", font=font("msyhbd.ttc", 28), fill=ACCENT)

    base.save(OUT, "JPEG", quality=88)
    print("[og] %s 已生成（%d×%d）" % (OUT, W, H))


if __name__ == "__main__":
    main()
