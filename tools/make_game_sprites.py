# -*- coding: utf-8 -*-
"""从站内缩略图生成 Smallfigure Merge Museum 用的紧凑透明 sprite。

用法：python tools/make_game_sprites.py
输出：game/sprites/l1.webp ... l11.webp（192x192，主体居中填满，透明底）
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "img" / "thumbs"
OUT = ROOT / "game" / "sprites"
OUT.mkdir(parents=True, exist_ok=True)

# 合成链：小徽章 -> 小鬼 -> 食物 -> 仙童 -> 都市人 -> 童话人
#          -> 盛装外星人 -> 巨人 -> 工程师 -> 果克星人 -> 老张
CHAIN = [
    ("zone_bell.webp", "l1"),
    ("imp-1.webp", "l2"),
    ("food_ramen_t.webp", "l3"),
    ("fairykid-1.webp", "l4"),
    ("mod-1.webp", "l5"),
    ("fairytale-1.webp", "l6"),
    ("alienfolk-1.webp", "l7"),
    ("giantfolk-1.webp", "l8"),
    ("hero_new.webp", "l9"),
    ("alien_t.webp", "l10"),
    ("hero_t.webp", "l11"),
]

SIZE = 192
FILL = 0.90  # 主体占画布比例


def clean_checker(im: Image.Image) -> Image.Image:
    """The Old Zhang source art has a grey/white checkerboard patch baked between the legs.
    Knock those near-grey pixels out; the white shirt sits above 55% height and is untouched.
    """
    px = im.load()
    w, h = im.size
    for y in range(int(h * 0.55), h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a and min(r, g, b) > 180 and max(r, g, b) - min(r, g, b) < 22:
                px[x, y] = (r, g, b, 0)
    return im


def trim_alpha(im: Image.Image) -> Image.Image:
    alpha = im.getchannel("A")
    mask = alpha.point(lambda p: 255 if p > 12 else 0)
    box = mask.getbbox()
    return im.crop(box) if box else im


def main() -> None:
    total = 0
    for src_name, key in CHAIN:
        src = SRC / src_name
        if not src.exists():
            raise SystemExit(f"缺少素材：{src}")
        im = trim_alpha(Image.open(src).convert("RGBA"))
        if key == "l11":
            im = clean_checker(im)
        w, h = im.size
        scale = min(SIZE * FILL / w, SIZE * FILL / h)
        nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
        im = im.resize((nw, nh), Image.LANCZOS)
        canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        canvas.paste(im, ((SIZE - nw) // 2, (SIZE - nh) // 2), im)
        dst = OUT / f"{key}.webp"
        canvas.save(dst, "WEBP", quality=88, method=4)
        total += dst.stat().st_size
        print(f"{key:>4} <- {src_name:<24} {w}x{h} -> {nw}x{nh}  {dst.stat().st_size // 1024} KB")
    # 本地 favicon：避免浏览器自动请求 /favicon.ico 造成 404，也不引入外部请求
    icon = Image.open(OUT / "l2.webp").convert("RGBA").resize((48, 48), Image.LANCZOS)
    icon.save(ROOT / "game" / "favicon.webp", "WEBP", quality=85, method=4)
    print(f"\n共 {len(CHAIN)} 张 + favicon，合计 {total / 1024:.0f} KB，输出目录 {OUT}")


if __name__ == "__main__":
    main()
