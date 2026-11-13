# -*- coding: utf-8 -*-
"""生成上架用封面图（Poki / CrazyGames / itch.io / OG 卡片）。

用法：python tools/make_game_cover.py
输出：outputs/cover-1200x630.png、outputs/cover-630x500.png
素材全部来自 game/sprites/，纯本地生成，无外部图片。
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SPRITES = ROOT / "game" / "sprites"
OUT = ROOT / "outputs"
OUT.mkdir(parents=True, exist_ok=True)

FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_REG = "C:/Windows/Fonts/segoeui.ttf"

PAPER = "#f7f1e4"
INK = "#2d2a26"
SOFT = "#7b7263"
ACCENT = "#c2603f"


def font(path, size):
    return ImageFont.truetype(path, size)


def tracked(draw, xy, text, fnt, fill, spacing=6):
    """PIL has no letter-spacing: draw character by character."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + spacing
    return x


def paper(w, h):
    im = Image.new("RGB", (w, h), PAPER)
    d = ImageDraw.Draw(im)
    for y in range(14, h, 30):
        for x in range(14, w, 30):
            d.ellipse((x, y, x + 1.5, y + 1.5), fill="#e9dec8")
    return im


def paste_folk(base, key, x, y, height):
    """Paste a trimmed sprite at (x,y) with a soft ground shadow underneath."""
    src = Image.open(SPRITES / (key + ".webp")).convert("RGBA")
    ratio = height / src.height
    w = round(src.width * ratio)
    src = src.resize((w, height), Image.LANCZOS)
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sy = y + height - round(height * 0.06)
    sd.ellipse((x + w * 0.12, sy - 8, x + w * 0.88, sy + 10), fill=(90, 70, 45, 38))
    base.alpha_composite(shadow)
    base.alpha_composite(src, (x, y))


def wide():
    w, h = 1200, 630
    im = paper(w, h).convert("RGBA")
    d = ImageDraw.Draw(im)
    d.ellipse((700, 45, 1160, 505), fill="#efe3cb")
    d.ellipse((720, 65, 1140, 485), outline="#e0d0b2", width=2)

    paste_folk(im, "l10", 700, 95, 190)   # Gucck Alien
    paste_folk(im, "l7", 810, 150, 320)   # Alien Gentleman
    paste_folk(im, "l2", 720, 330, 190)   # Flame Imp
    paste_folk(im, "l11", 980, 215, 270)  # Old Zhang
    paste_folk(im, "l3", 955, 425, 140)   # Ramen

    d = ImageDraw.Draw(im)
    d.text((70, 168), "Smallfigure", font=font(FONT_BOLD, 82), fill=INK)
    tracked(d, (74, 272), "MERGE MUSEUM", font(FONT_BOLD, 24), ACCENT, 9)
    d.text((72, 340), "Drop. Merge. Collect 11", font=font(FONT_REG, 30), fill=SOFT)
    d.text((72, 380), "original tiny folks.", font=font(FONT_REG, 30), fill=SOFT)
    d.line((72, 448, 300, 448), fill="#d9cdb6", width=2)
    d.text((72, 470), "A puzzle game from smallfigure.com", font=font(FONT_REG, 21), fill=SOFT)
    d.text((72, 558), "ENGLISH  /  OPTIONAL CHINESE", font=font(FONT_BOLD, 15), fill=ACCENT)
    im.convert("RGB").save(OUT / "cover-1200x630.png", optimize=True)
    return OUT / "cover-1200x630.png"


def square():
    w, h = 630, 500
    im = paper(w, h).convert("RGBA")
    d = ImageDraw.Draw(im)
    d.ellipse((95, 170, 535, 460), fill="#efe3cb")

    title = font(FONT_BOLD, 58)
    tw = d.textlength("Smallfigure", font=title)
    d.text(((w - tw) / 2, 42), "Smallfigure", font=title, fill=INK)
    sub = font(FONT_BOLD, 17)
    x0 = (w - (d.textlength("MERGE MUSEUM", font=sub) + 8 * 11)) / 2
    tracked(d, (x0, 116), "MERGE MUSEUM", sub, ACCENT, 8)

    paste_folk(im, "l2", 55, 265, 155)
    paste_folk(im, "l7", 195, 185, 235)
    paste_folk(im, "l11", 400, 215, 205)

    d = ImageDraw.Draw(im)
    tag = "DROP · MERGE · COLLECT"
    f = font(FONT_BOLD, 15)
    tw = d.textlength(tag, font=f)
    d.text(((w - tw) / 2, 456), tag, font=f, fill=SOFT)
    im.convert("RGB").save(OUT / "cover-630x500.png", optimize=True)
    return OUT / "cover-630x500.png"


if __name__ == "__main__":
    for p in (wide(), square()):
        print(f"{p.name}: {p.stat().st_size // 1024} KB")
