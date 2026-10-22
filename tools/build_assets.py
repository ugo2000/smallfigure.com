# -*- coding: utf-8 -*-
"""
smallfigure.com 素材构建脚本
============================
把 game-ball1（游戏《音弹》）里的美术图片整理成网站素材：

1. originals/      —— AI 生成的「原图片」原封不动复制到这里（本地单独文件夹，不上网）
2. assets/img/full/   —— 网站展示用大图（最长边压到 1024，PNG）
3. assets/img/thumbs/ —— 网格缩略图（最长边 400，WebP，带透明通道）
4. assets/img/anim/   —— 入场动画精灵图（22 帧纵向拼接，WebP）
5. data/images.json   —— 全站元数据（名称/分类/尺寸/字节数/标签/主色）

可重复跑：幂等，输出覆盖旧文件。用法：
    python tools/build_assets.py
"""
import json
import os
import shutil
import sys
from datetime import datetime, timezone, timedelta

from PIL import Image

SRC = "D:/WB/game-ball1"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_FULL = os.path.join(ROOT, "assets/img/full")
OUT_THUMB = os.path.join(ROOT, "assets/img/thumbs")
OUT_ANIM = os.path.join(ROOT, "assets/img/anim")
OUT_ORIG = os.path.join(ROOT, "originals")
OUT_DATA = os.path.join(ROOT, "data")

THUMB_MAX = 400
FULL_MAX = 1024
BG_RGB = (13, 17, 23)  # 站点暗色底色，用于算主色和合成预览

CAT_LABEL = {
    "characters": "人物立绘",
    "badges": "小徽章",
}

# (源文件, id, 中文名, 分类, 标签, 简介, 透明, 动画效果)
# 透明立绘的来源：processed/ 下的是用 character-art 技能脚本从 AI 原图重抠的干净版
# （游戏里的旧处理版带奶白 veil 箱子，已弃用；原图在 originals/ 有备份）
ITEMS = [
    # ---- 人物立绘 ----
    ("processed/hero_t.png", "hero-t", "老张 · 立绘", "characters",
     ["老张", "主角", "立绘", "hero", "透明", "小人"], "本站看板小人：棕夹克工装男，AI 生成后抠成透明 PNG，512×512", True, None),
    ("img/hero.png", "hero", "老张 · 立绘原图", "characters",
     ["老张", "主角", "立绘", "hero", "原图"], "AI 原始生成图，浅灰底未抠图（原图在 originals/ 有备份）", False, None),
    ("processed/alien_t.png", "alien-t", "果克星人 · 立绘", "characters",
     ["果克星人", "外星人", "立绘", "alien", "透明", "小人"], "绿色大头外星小人，透明 PNG，512×512", True, None),
    ("img/alien.png", "alien", "果克星人 · 立绘原图", "characters",
     ["果克星人", "外星人", "alien", "原图"], "AI 原始生成图，未抠图", False, None),
    ("processed/hero_new.png", "engineer", "女工程师 · 立绘", "characters",
     ["女工程师", "立绘", "engineer", "透明", "小人"], "技能验证时生成的漫画风女工程师，透明 PNG，512×512", True, None),
    # ---- 小徽章 ----
    ("img/zone_bass.png", "zone-bass", "徽章 · 低音核", "badges",
     ["徽章", "低音核", "bass", "透明", "小图"], "霓虹线稿小徽章，音区标识之一", True, None),
    ("img/zone_bell.png", "zone-bell", "徽章 · 晶铃", "badges",
     ["徽章", "晶铃", "bell", "透明", "小图"], "霓虹线稿小徽章，音区标识之一", True, None),
    ("img/zone_lead.png", "zone-lead", "徽章 · 等离子", "badges",
     ["徽章", "等离子", "lead", "透明", "小图"], "霓虹线稿小徽章，音区标识之一", True, None),
]

# 原图片（AI 生成）→ originals/ 单独存放，网站不直接用这些文件
ORIGINALS = [
    ("img/hero.png", "hero_原始图.png"),
    ("img/cover.png", "cover_原始图.png"),
    ("img/alien.png", "alien_原始图.png"),
    ("img/raw/Neon_line_art_emblem_of_a_face_2026-10-22T00-48-41.png", "raw/徽章_低音核_原始提示词名.png"),
    ("img/raw/Neon_line_art_emblem_of_a_heav_2026-10-22T00-44-25.png", "raw/徽章_晶铃_原始提示词名.png"),
    ("img/raw/Neon_line_art_emblem_of_a_plas_2026-10-22T00-58-59.png", "raw/徽章_等离子_原始提示词名.png"),
    ("img/raw/Vintage_American_comic_book_po_2026-10-22T03-39-02.png", "raw/漫画背景_原始提示词名.png"),
    ("img/raw/skilltest/Full_body_character_illustrati_2026-10-22T10-01-06.png", "raw/skilltest_女工程师_原始图.png"),
]


def resolve_src(src_rel):
    """processed/ 开头 → 站点自己的重抠版（character-art 技能脚本产出）；其余 → game-ball1"""
    if src_rel.startswith("processed/"):
        return os.path.join(ROOT, src_rel)
    return os.path.join(SRC, src_rel)


def resize_max(im, mx):
    w, h = im.size
    m = max(w, h)
    if m <= mx:
        return im
    s = mx / m
    return im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)


def dominant_color(im):
    """合成到暗色底后取平均色，返回 #rrggbb"""
    rgba = im.convert("RGBA")
    bg = Image.new("RGBA", rgba.size, BG_RGB + (255,))
    flat = Image.alpha_composite(bg, rgba).convert("RGB")
    small = flat.resize((1, 1), Image.LANCZOS)
    r, g, b = small.getpixel((0, 0))
    return "#%02x%02x%02x" % (r, g, b)


def main():
    for d in (OUT_FULL, OUT_THUMB, OUT_ANIM, OUT_ORIG, OUT_DATA):
        os.makedirs(d, exist_ok=True)

    # 清掉上一轮的产物，保证目录里只剩当前清单内的文件（站点不放的图不会被残留发布）
    for d in (OUT_FULL, OUT_THUMB, OUT_ANIM):
        for fn in os.listdir(d):
            fp = os.path.join(d, fn)
            if os.path.isfile(fp):
                os.remove(fp)

    # ---------- 1. 原图片进 originals/ ----------
    print("== 复制原图片到 originals/ ==")
    for src_rel, dst_name in ORIGINALS:
        src = os.path.join(SRC, src_rel)
        dst = os.path.join(OUT_ORIG, dst_name)
        if not os.path.exists(src):
            print("  [跳过] 不存在:", src_rel)
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        print("  %s -> originals/%s (%d KB)" % (src_rel, dst_name, os.path.getsize(dst) // 1024))

    # ---------- 2. 单图处理 ----------
    print("== 处理网站图片 ==")
    images = []
    for src_rel, iid, name, cat, tags, desc, transparent, effect in ITEMS:
        src = resolve_src(src_rel)
        if not os.path.exists(src):
            print("  [缺失]", src_rel)
            sys.exit(1)
        im = Image.open(src)
        w, h = im.size

        full = resize_max(im.convert("RGBA" if transparent else "RGB"), FULL_MAX)
        full_path = os.path.join(OUT_FULL, os.path.splitext(os.path.basename(src_rel))[0] + ".png")
        full.save(full_path, optimize=True)

        thumb = resize_max(im, THUMB_MAX)
        thumb_name = os.path.splitext(os.path.basename(src_rel))[0] + ".webp"
        thumb_path = os.path.join(OUT_THUMB, thumb_name)
        thumb.convert("RGBA").save(thumb_path, "WEBP", quality=82, method=6)

        color = dominant_color(im)
        images.append({
            "id": iid,
            "name": name,
            "category": cat,
            "categoryLabel": CAT_LABEL[cat],
            "file": "assets/img/full/" + os.path.basename(full_path),
            "thumb": "assets/img/thumbs/" + thumb_name,
            "width": full.size[0],
            "height": full.size[1],
            "srcWidth": w,
            "srcHeight": h,
            "bytes": os.path.getsize(full_path),
            "transparent": transparent,
            "animated": effect is not None,
            "effect": effect,
            "color": color,
            "tags": tags,
            "desc": desc,
        })
        print("  %-28s %4dx%-4d full=%3dKB thumb=%3dKB %s" % (
            os.path.basename(src_rel), full.size[0], full.size[1],
            os.path.getsize(full_path) // 1024, os.path.getsize(thumb_path) // 1024, color))

    # ---------- 3. 元数据 ----------
    meta = {
        "site": "smallfigure.com",
        "subtitle": "原创小人图鉴 · 立绘 / 小徽章",
        "generated": datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds"),
        "source": "game-ball1（游戏《音弹》角色美术，本站只收单体小人与徽章）",
        "count": len(images),
        "categories": [{"key": k, "label": v} for k, v in CAT_LABEL.items()],
        "images": images,
    }
    data_path = os.path.join(OUT_DATA, "images.json")
    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    total = sum(i["bytes"] for i in images)
    print("== 完成: %d 项, JSON %dKB, 大图合计 %.1fMB ==" % (
        len(images), os.path.getsize(data_path) // 1024, total / 1048576))


if __name__ == "__main__":
    main()
