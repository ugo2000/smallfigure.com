# -*- coding: utf-8 -*-
"""
smallfigure.com 素材构建脚本
============================
把 game-ball1（游戏《音弹》）里的美术图片整理成网站素材：

1. originals/      —— AI 生成的「原图片」原封不动复制到这里（本地单独文件夹，不上网）
2. assets/img/full/   —— 网站展示用大图（最长边压到 1024，PNG）
3. assets/img/thumbs/ —— 网格缩略图（最长边 400，WebP，带透明通道）
4. assets/img/anim/   —— 入场动画精灵图（22 帧纵向拼接，WebP）
5. data/images.json   —— 全站元数据（中英文名称/简介/分类标签、尺寸、字节数、标签、主色）

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

CAT_LABELS = {
    "characters": {"zh": "人物立绘", "en": "Character Art"},
    "badges": {"zh": "小徽章", "en": "Badges"},
}

SUBTITLE = {"zh": "原创小人图鉴 · 立绘 / 小徽章", "en": "Original Little Figure Gallery · Character Art / Badges"}

# 每项：源文件, id, 中文名, 英文名, 分类, 标签, 中文简介, 英文简介, 透明, 动画效果
# 透明立绘的来源：processed/ 下的是用 character-art 技能脚本从 AI 原图重抠的干净版
# （游戏里的旧处理版带奶白 veil 箱子，已弃用；原图在 originals/ 有备份）
ITEMS = [
    # ---- 人物立绘 ----
    {"src": "processed/hero_t.png", "id": "hero-t", "name_zh": "老张 · 立绘", "name_en": "Laozhang · Character Art",
     "cat": "characters", "tags": ["老张", "主角", "立绘", "hero", "透明", "小人"],
     "tags_en": ["Laozhang", "protagonist", "character art", "hero", "transparent", "little figure"],
     "desc_zh": "本站看板小人：棕夹克工装男，AI 生成后抠成透明 PNG，512×512",
     "desc_en": "The mascot of this site: a brown-jacket workwear man, AI-generated and cut out to a transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "img/hero.png", "id": "hero", "name_zh": "老张 · 立绘原图", "name_en": "Laozhang · Original Artwork",
     "cat": "characters", "tags": ["老张", "主角", "立绘", "hero", "原图"],
     "tags_en": ["Laozhang", "protagonist", "character art", "hero", "original"],
     "desc_zh": "AI 原始生成图，浅灰底未抠图（原图在 originals/ 有备份）",
     "desc_en": "Original AI-generated image, light gray background, not cut out (backup kept in originals/)",
     "transparent": False, "effect": None},
    {"src": "processed/alien_t.png", "id": "alien-t", "name_zh": "果克星人 · 立绘", "name_en": "Gucck Alien · Character Art",
     "cat": "characters", "tags": ["果克星人", "外星人", "立绘", "alien", "透明", "小人"],
     "tags_en": ["Gucck Alien", "extraterrestrial", "character art", "transparent", "little figure"],
     "desc_zh": "绿色大头外星小人，透明 PNG，512×512",
     "desc_en": "A green big-headed little alien, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "img/alien.png", "id": "alien", "name_zh": "果克星人 · 立绘原图", "name_en": "Gucck Alien · Original Artwork",
     "cat": "characters", "tags": ["果克星人", "外星人", "alien", "原图"],
     "tags_en": ["Gucck Alien", "extraterrestrial", "original"],
     "desc_zh": "AI 原始生成图，未抠图",
     "desc_en": "Original AI-generated image, not cut out",
     "transparent": False, "effect": None},
    {"src": "processed/hero_new.png", "id": "engineer", "name_zh": "女工程师 · 立绘", "name_en": "Lady Engineer · Character Art",
     "cat": "characters", "tags": ["女工程师", "立绘", "engineer", "透明", "小人"],
     "tags_en": ["Lady Engineer", "character art", "engineer", "transparent", "little figure"],
     "desc_zh": "技能验证时生成的漫画风女工程师，透明 PNG，512×512",
     "desc_en": "A comic-style lady engineer generated during skill validation, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    # ---- 果克星人系列（据张祥前《果克星球奇遇》中的描述 AI 生成后抠图）----
    {"src": "processed/gucck_female_t.png", "id": "gucck-female", "name_zh": "女果克星人 · 立绘", "name_en": "Gucck Woman · Character Art",
     "cat": "characters", "tags": ["果克星人", "外星人", "女性", "立绘", "透明", "小人"],
     "tags_en": ["Gucck Woman", "extraterrestrial", "female", "character art", "transparent", "little figure"],
     "desc_zh": "据张祥前描述创作：雪青螺旋发、钻石大眼、粉白发光肌肤，虚拟光膜裙，透明 PNG，512×512",
     "desc_en": "Created from Zhang Xiangqian's account: spiral lilac hair, diamond-bright eyes, pale glowing skin and a virtual light-film dress, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/gucck_male_t.png", "id": "gucck-male", "name_zh": "男果克星人 · 立绘", "name_en": "Gucck Man · Character Art",
     "cat": "characters", "tags": ["果克星人", "外星人", "男性", "立绘", "透明", "小人"],
     "tags_en": ["Gucck Man", "extraterrestrial", "male", "character art", "transparent", "little figure"],
     "desc_zh": "据张祥前描述创作：黑亮贴头皮短发、大薄尖耳、粉白精致肌肤，透明 PNG，512×512",
     "desc_en": "Created from Zhang Xiangqian's account: sleek glossy hair, large thin pointed ears and fine pale skin, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/gucck_neutral_t.png", "id": "gucck-neutral", "name_zh": "中性果克星人 · 立绘", "name_en": "Gucck Neutral · Character Art",
     "cat": "characters", "tags": ["果克星人", "外星人", "中性人", "立绘", "透明", "小人"],
     "tags_en": ["Gucck Neutral", "extraterrestrial", "androgynous", "character art", "transparent", "little figure"],
     "desc_zh": "据张祥前描述创作：长相介于男女之间的中性人，无皱粉白肌肤，透明 PNG，512×512",
     "desc_en": "Created from Zhang Xiangqian's account: an androgynous Gucck neutral with wrinkle-free pale skin, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/gucck_virtual_t.png", "id": "gucck-virtual", "name_zh": "虚拟人 · 立绘", "name_en": "Gucck Virtual · Character Art",
     "cat": "characters", "tags": ["果克星人", "虚拟人", "全息", "立绘", "透明", "小人"],
     "tags_en": ["Gucck Virtual", "hologram", "extraterrestrial", "character art", "transparent", "little figure"],
     "desc_zh": "据张祥前描述创作：人工场生成的虚拟人，只显上半身的全息投影，透明 PNG，512×512",
     "desc_en": "Created from Zhang Xiangqian's account: a field-generated virtual being, a holographic upper-body projection, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    {"src": "processed/gucck_splitter_t.png", "id": "gucck-splitter", "name_zh": "拆分人 · 立绘", "name_en": "Gucck Splitter · Character Art",
     "cat": "characters", "tags": ["果克星人", "拆分人", "立绘", "透明", "小人"],
     "tags_en": ["Gucck Splitter", "extraterrestrial", "character art", "transparent", "little figure"],
     "desc_zh": "据张祥前描述创作：身体可拆成碧玉蓝条状、又能迅速复原的拆分人，透明 PNG，512×512",
     "desc_en": "Created from Zhang Xiangqian's account: a splitter whose body breaks into jade-blue segments and reassembles, transparent PNG, 512×512",
     "transparent": True, "effect": None},
    # ---- 小徽章 ----
    {"src": "img/zone_bass.png", "id": "zone-bass", "name_zh": "徽章 · 低音核", "name_en": "Badge · Bass Core",
     "cat": "badges", "tags": ["徽章", "低音核", "bass", "透明", "小图"],
     "tags_en": ["badge", "bass core", "bass", "transparent", "small"],
     "desc_zh": "霓虹线稿小徽章，音区标识之一",
     "desc_en": "Neon line-art badge, one of the zone markers",
     "transparent": True, "effect": None},
    {"src": "img/zone_bell.png", "id": "zone-bell", "name_zh": "徽章 · 晶铃", "name_en": "Badge · Crystal Bell",
     "cat": "badges", "tags": ["徽章", "晶铃", "bell", "透明", "小图"],
     "tags_en": ["badge", "crystal bell", "bell", "transparent", "small"],
     "desc_zh": "霓虹线稿小徽章，音区标识之一",
     "desc_en": "Neon line-art badge, one of the zone markers",
     "transparent": True, "effect": None},
    {"src": "img/zone_lead.png", "id": "zone-lead", "name_zh": "徽章 · 等离子", "name_en": "Badge · Plasma",
     "cat": "badges", "tags": ["徽章", "等离子", "lead", "透明", "小图"],
     "tags_en": ["badge", "plasma", "lead", "transparent", "small"],
     "desc_zh": "霓虹线稿小徽章，音区标识之一",
     "desc_en": "Neon line-art badge, one of the zone markers",
     "transparent": True, "effect": None},
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
    for it in ITEMS:
        src_rel, iid = it["src"], it["id"]
        cat, tags = it["cat"], it["tags"]
        src = resolve_src(src_rel)
        if not os.path.exists(src):
            print("  [缺失]", src_rel)
            sys.exit(1)
        im = Image.open(src)
        w, h = im.size

        full = resize_max(im.convert("RGBA" if it["transparent"] else "RGB"), FULL_MAX)
        full_path = os.path.join(OUT_FULL, os.path.splitext(os.path.basename(src_rel))[0] + ".png")
        full.save(full_path, optimize=True)

        thumb = resize_max(im, THUMB_MAX)
        thumb_name = os.path.splitext(os.path.basename(src_rel))[0] + ".webp"
        thumb_path = os.path.join(OUT_THUMB, thumb_name)
        thumb.convert("RGBA").save(thumb_path, "WEBP", quality=82, method=6)

        color = dominant_color(im)
        images.append({
            "id": iid,
            "name": it["name_zh"],
            "nameEn": it["name_en"],
            "category": cat,
            "categoryLabel": CAT_LABELS[cat]["zh"],
            "categoryLabelEn": CAT_LABELS[cat]["en"],
            "file": "assets/img/full/" + os.path.basename(full_path),
            "thumb": "assets/img/thumbs/" + thumb_name,
            "width": full.size[0],
            "height": full.size[1],
            "srcWidth": w,
            "srcHeight": h,
            "bytes": os.path.getsize(full_path),
            "transparent": it["transparent"],
            "animated": it["effect"] is not None,
            "effect": it["effect"],
            "color": color,
            "tags": tags,
            "tagsEn": it["tags_en"],
            "desc": it["desc_zh"],
            "descEn": it["desc_en"],
        })
        print("  %-28s %4dx%-4d full=%3dKB thumb=%3dKB %s" % (
            os.path.basename(src_rel), full.size[0], full.size[1],
            os.path.getsize(full_path) // 1024, os.path.getsize(thumb_path) // 1024, color))

    # ---------- 3. 元数据 ----------
    meta = {
        "site": "smallfigure.com",
        "subtitle": SUBTITLE["zh"],
        "subtitleEn": SUBTITLE["en"],
        "generated": datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds"),
        "source": "game-ball1（游戏《音弹》角色美术）+ 果克星人系列（据张祥前《果克星球奇遇》描述 AI 生成）",
        "count": len(images),
        "categories": [{"key": k, "label": v["zh"], "labelEn": v["en"]} for k, v in CAT_LABELS.items()],
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
