# -*- coding: utf-8 -*-
"""
smallfigure.com 主页宣传背景图生成器
====================================
用站内原创小人（assets/img/full/ 的透明 PNG）拼一张「星空收集册」风格的
横幅背景图：深色夜空 + 光晕 + 星尘 + 小人们漂浮成星座，底部渐隐进页面底色，
让下方的素材网格无缝接上。文字不烤进图里（中英双语文案由 index.html 的
hero 区块负责，切语言不掉链子）。

产出：
  originals/hero/hero_bg.png      桌面版母版 2400x860（本地存档，不进仓库）
  originals/hero/hero_bg_m.png    移动版母版 1100x1180（本地存档，不进仓库）
  assets/img/hero_bg.webp         桌面版（站点用）
  assets/img/hero_bg_m.webp       移动版（站点用）

用法：
    python tools/make_hero_bg.py
"""
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FULL = os.path.join(ROOT, "assets/img/full")
OUT_SITE = os.path.join(ROOT, "assets/img")
OUT_MASTER = os.path.join(ROOT, "originals", "hero")

BG_TOP = (16, 20, 33)     # 夜空顶
BG_BOT = (11, 14, 20)     # 页面底色 #0b0e14，底部渐隐到它
TEAL = (94, 234, 212)
PINK = (244, 114, 182)
BLUE = (125, 211, 252)

DW, DH = 2400, 860        # 桌面版
MW, MH = 1100, 1180       # 移动版

# 白底不透明的原图版素材（站点图库里的展示图，海报里用前先裁底）
WHITE_BG = {"alien.png"}

# 每项: (文件, cx, cy, h, rot, alpha)  cx/cy/h 均为画幅比例；图均为 512/1024 方形
DESKTOP = [
    # 背景层：两枚巨大的暗淡星球徽志
    ("planet_eye_t.png",          .720, .520, .78,  0, .13),
    ("planet_shard_ring_t.png",   .300, .230, .42,  0, .10),
    # 主角们（右侧成星座，左侧留白给 HTML 文案）
    ("hero_t.png",                .600, .575, .50, -2, 1.0),     # 老张（看板小人）
    ("alien.png",                 .820, .300, .35,  2, 1.0),     # 果克星人
    ("figure_witch_mushroom_t.png", .770, .660, .25, -3, 1.0),   # 蘑菇帽巫女
    ("figure_robot_t.png",        .930, .600, .24,  2, 1.0),     # 小机器人
    ("figure_fairy_lattice_t.png", .860, .875, .17,  2, 1.0),    # 晶格小精灵
    ("figure_grandpa_t.png",      .454, .720, .25,  3, 1.0),     # 老爷爷
    ("figure_musician_t.png",     .530, .190, .26, -2, 1.0),     # 吉他女孩
    ("figure_elf_woodland_t.png", .705, .150, .26,  3, 1.0),     # 林地精灵
    ("figure_chef_t.png",         .800, .880, .20, -2, 1.0),     # 厨师（沉进底部渐隐）
    ("gucck_male_t.png",          .240, .840, .17, -4, 1.0),     # 果克星人（小只）
    ("gucck_female_t.png",        .292, .907, .16,  3, 1.0),
    ("cr_cat_t.png",              .320, .230, .15, -3, 1.0),     # 黑猫
    ("cr_raven_t.png",            .945, .780, .15,  2, 1.0),     # 渡鸦
    ("potion_teal_round_t.png",   .950, .100, .15,  0, 1.0),     # 药水
    ("tech_holo_t.png",           .785, .075, .18, -2, 1.0),     # 全息投影仪
    ("food_dumpling_t.png",       .650, .900, .14,  0, 1.0),     # 小包子
    ("xeno-prism-stalker_t.png",  .440, .300, .15, -2, 1.0),     # 棱晶潜猎者
    # 三枚霓虹徽章
    ("zone_bass.png",             .420, .100, .19,  0, 1.0),     # 低音核
    ("zone_bell.png",             .967, .380, .14,  0, 1.0),     # 晶铃
    ("zone_lead.png",             .220, .620, .15,  0, 1.0),     # 等离子
]

MOBILE = [
    ("planet_eye_t.png",          .640, .260, .48,  0, .10),
    ("planet_shard_ring_t.png",   .164, .520, .30,  0, .10),
    ("hero_t.png",                .660, .300, .24, -2, 1.0),
    ("alien.png",                 .280, .580, .21,  2, 1.0),
    ("figure_witch_mushroom_t.png", .760, .560, .19, -3, 1.0),
    ("figure_robot_t.png",        .870, .740, .16,  2, 1.0),
    ("figure_grandpa_t.png",      .360, .840, .17,  3, 1.0),
    ("figure_elf_woodland_t.png", .540, .760, .16,  3, 1.0),
    ("figure_musician_t.png",     .170, .440, .15, -2, 1.0),
    ("figure_chef_t.png",         .130, .640, .13, -2, 1.0),
    ("figure_fairy_lattice_t.png", .880, .900, .12,  2, 1.0),
    ("gucck_male_t.png",          .060, .860, .10, -4, 1.0),
    ("gucck_female_t.png",        .150, .910, .095, 3, 1.0),
    ("cr_cat_t.png",              .820, .240, .10, -3, 1.0),
    ("cr_raven_t.png",            .430, .470, .09,  2, 1.0),
    ("potion_teal_round_t.png",   .780, .100, .10,  0, 1.0),
    ("tech_holo_t.png",           .880, .400, .11, -2, 1.0),
    ("food_dumpling_t.png",       .250, .940, .09,  0, 1.0),
    ("xeno-prism-stalker_t.png",  .620, .660, .10, -2, 1.0),
    ("zone_bass.png",             .473, .300, .12,  0, 1.0),
    ("zone_bell.png",             .930, .120, .10,  0, 1.0),
    ("zone_lead.png",             .080, .560, .10,  0, 1.0),
]

# 星座连线（按文件名配对，仅桌面版）
LINKS = [
    ("hero_t.png", "alien.png"),
    ("hero_t.png", "figure_witch_mushroom_t.png"),
    ("alien.png", "figure_robot_t.png"),
    ("figure_witch_mushroom_t.png", "figure_fairy_lattice_t.png"),
    ("cr_cat_t.png", "zone_bass.png"),
    ("figure_musician_t.png", "figure_elf_woodland_t.png"),
    ("gucck_male_t.png", "gucck_female_t.png"),
    ("figure_grandpa_t.png", "hero_t.png"),
]


def load(name, target_h):
    path = os.path.join(FULL, name)
    im = Image.open(path).convert("RGBA")
    # alien.png 等原图版是白底不透明的，海报里用不了：裁掉白底（只动海报副本，不动站点文件）
    if name in WHITE_BG:
        im = cut_white_bg(im, name)
    if im.height != target_h:
        w = max(1, round(im.width * target_h / im.height))
        im = im.resize((w, target_h), Image.LANCZOS)
    return im


def cut_white_bg(im, name):
    """边缘洪水填充去掉纯白底， alpha 边缘羽化 1px；结果缓存到 originals/hero/cut/。"""
    cache = os.path.join(OUT_MASTER, "cut", name)
    if os.path.exists(cache):
        return Image.open(cache).convert("RGBA")
    rgb = im.convert("RGB")
    a = np.asarray(rgb).astype(int)
    h, w = a.shape[:2]
    ref = np.mean([a[2, 2], a[2, w - 3], a[h - 3, 2], a[h - 3, w - 3]], axis=0)
    dist = np.abs(a - ref).sum(axis=2)
    near = dist < 90  # 与底色接近的候选像素
    bg = np.zeros((h, w), bool)
    stack = [(0, 0)]
    seeds = [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)]
    for sy, sx in seeds:
        if near[sy, sx] and not bg[sy, sx]:
            bg[sy, sx] = True
            stack.append((sy, sx))
    while stack:
        y, x = stack.pop()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and near[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True
                stack.append((ny, nx))
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    out = np.dstack([np.asarray(rgb).astype(np.uint8), alpha])
    res = Image.fromarray(out, "RGBA")
    # 抗锯齿边缘羽化：alpha 高斯模糊 1px 后按亮度再清理一次近白像素
    soft = res.getchannel("A").filter(ImageFilter.GaussianBlur(1.0))
    res.putalpha(soft)
    arr = np.asarray(res).astype(int)
    near2 = np.abs(arr[..., :3] - ref).sum(axis=2) < 60
    arr[..., 3] = np.where(near2, np.minimum(arr[..., 3], 40), arr[..., 3])
    res = Image.fromarray(arr.astype(np.uint8), "RGBA")
    os.makedirs(os.path.dirname(cache), exist_ok=True)
    res.save(cache)
    kept = (np.asarray(res)[..., 3] > 10).mean()
    print(f"[cut] {name}: 去掉白底，保留不透明像素 {kept:.0%}")
    return res


def paste_item(base, im, cx, cy, rot=0.0, alpha=1.0, shadow=True):
    if rot:
        im = im.rotate(rot, expand=True, resample=Image.BICUBIC)
    if alpha < 1.0:
        a = im.getchannel("A").point(lambda v: int(v * alpha))
        im = im.copy()
        im.putalpha(a)
    x = int(round(cx - im.width / 2))
    y = int(round(cy - im.height / 2))
    if shadow:
        layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
        sil = Image.new("RGBA", im.size, (0, 0, 0, 0))
        sil.putalpha(im.getchannel("A").point(lambda v: int(v * 0.40)))
        layer.paste(sil, (x, y + max(2, int(im.height * 0.028))), sil)
        layer = layer.filter(ImageFilter.GaussianBlur(16))
        base.alpha_composite(layer)
    base.alpha_composite(im, (x, y))
    return (x, y, im.width, im.height)


def add_glow(arr, cx, cy, r, color, amp):
    h, w = arr.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
    a = np.clip(1.0 - d, 0.0, 1.0) ** 2 * amp
    for i in range(3):
        arr[..., i] = np.clip(arr[..., i] + a * color[i], 0, 255)


def build(w, h, layout, links, seed=7):
    # ---- 底色：上深下浅的夜空渐变 ----
    t = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    top = np.array(BG_TOP, dtype=np.float32)
    bot = np.array(BG_BOT, dtype=np.float32)
    arr = (top[None, None, :] * (1 - t[..., None]) + bot[None, None, :] * t[..., None])
    arr = np.repeat(arr, w, axis=1)

    # ---- 大光晕 ----
    add_glow(arr, w * .10, h * .92, w * .55, TEAL, .10)
    add_glow(arr, w * .93, h * .06, w * .50, PINK, .085)
    add_glow(arr, w * .48, h * .02, w * .60, BLUE, .06)
    add_glow(arr, w * .60, h * .55, w * .34, (255, 214, 170), .05)

    img = Image.fromarray(arr.astype(np.uint8), "RGB").convert("RGBA")

    # ---- 星尘 ----
    rnd = random.Random(seed)
    dust = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dd = ImageDraw.Draw(dust)
    palette = [(255, 255, 255), (255, 255, 255), TEAL, BLUE, PINK]
    for _ in range(130):
        x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        r = rnd.uniform(0.8, 2.4)
        c = rnd.choice(palette)
        a = rnd.randint(24, 85)
        dd.ellipse([x - r, y - r, x + r, y + r], fill=c + (a,))
    img.alpha_composite(dust)

    # ---- 先贴背景层（暗淡大星球）----
    boxes = []
    for i, (name, fx, fy, fh, rot, alpha) in enumerate(layout):
        if alpha < 0.5:  # 背景层
            im = load(name, int(h * fh))
            paste_item(img, im, w * fx, h * fy, rot, alpha, shadow=False)
            boxes.append((w * fx, h * fy, im.width, im.height))
        else:
            boxes.append(None)

    # ---- 星座虚线（按文件名配对）----
    idx = {layout[i][0]: i for i in range(len(layout))}
    line = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ld = ImageDraw.Draw(line)
    for na, nb in links:
        a, b = idx.get(na), idx.get(nb)
        if a is None or b is None or not boxes[a] or not boxes[b]:
            continue
        ax, ay = boxes[a][0], boxes[a][1]
        bx, by = boxes[b][0], boxes[b][1]
        steps = max(2, int(np.hypot(bx - ax, by - ay) / 26))
        for s in range(steps + 1):
            f = s / steps
            if s % 2 == 0:
                continue  # 虚线：隔段画点
            px, py = ax + (bx - ax) * f, ay + (by - ay) * f
            ld.ellipse([px - 1.6, py - 1.6, px + 1.6, py + 1.6], fill=BLUE + (46,))
    img.alpha_composite(line)

    # ---- 再贴前景层（小人们），记录包围盒 ----
    for i, (name, fx, fy, fh, rot, alpha) in enumerate(layout):
        if alpha < 0.5:
            continue
        im = load(name, int(h * fh))
        boxes[i] = paste_item(img, im, w * fx, h * fy, rot, alpha)

    # ---- 暗角 ----
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = (xx - w / 2) / (w / 2)
    dy = (yy - h / 2) / (h / 2)
    v = np.clip((dx ** 2 + dy ** 2) - 0.55, 0, 1) * 0.32
    arr = np.asarray(img.convert("RGB")).astype(np.float32)
    arr *= (1 - v[..., None])
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB").convert("RGBA")

    # ---- 顶部/底部渐隐，接回页面底色 ----
    fade_top = int(h * 0.05)
    fade_bot = int(h * 0.24)
    mask = np.zeros((h, w), dtype=np.float32)
    ramp = np.linspace(1, 0, fade_top, dtype=np.float32)
    mask[:fade_top] = ramp[:, None]
    ramp2 = np.linspace(0, 1, fade_bot, dtype=np.float32)
    mask[h - fade_bot:] = np.maximum(mask[h - fade_bot:], ramp2[:, None])
    solid = np.array(BG_BOT, dtype=np.float32)[None, None, :]
    arr = np.asarray(img.convert("RGB")).astype(np.float32)
    arr = arr * (1 - mask[..., None]) + solid * mask[..., None]
    out = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")

    # ---- 重叠自检报告 ----
    report = []
    fg = [(i, b) for i, b in enumerate(boxes) if b and layout[i][5] >= 0.5]
    for i in range(len(fg)):
        for j in range(i + 1, len(fg)):
            (ia, (ax, ay, aw, ah)), (ib, (bx, by, bw, bh)) = fg[i], fg[j]
            ox = max(0, min(ax + aw, bx + bw) - max(ax, bx))
            oy = max(0, min(ay + ah, by + bh) - max(ay, by))
            if ox * oy > 0.30 * min(aw * ah, bw * bh):
                report.append(f"  重叠 {layout[ia][0]} x {layout[ib][0]}  {ox * oy / min(aw * ah, bw * bh):.0%}")
    return out, report


def main():
    os.makedirs(OUT_MASTER, exist_ok=True)
    for tag, (w, h, layout, links) in {
        "desktop": (DW, DH, DESKTOP, LINKS),
        "mobile": (MW, MH, MOBILE, []),
    }.items():
        img, report = build(w, h, layout, links)
        suffix = "" if tag == "desktop" else "_m"
        png = os.path.join(OUT_MASTER, f"hero_bg{suffix}.png")
        webp = os.path.join(OUT_SITE, f"hero_bg{suffix}.webp")
        img.save(png, optimize=True)
        img.save(webp, "WEBP", quality=88, method=6)
        print(f"[{tag}] {w}x{h}  png={os.path.getsize(png)//1024}KB  webp={os.path.getsize(webp)//1024}KB")
        for line in report:
            print(line)


if __name__ == "__main__":
    main()
