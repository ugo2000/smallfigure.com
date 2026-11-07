# -*- coding: utf-8 -*-
# 6 张预览小人：抠图 → 清掉原图 halftone 网点地面投影 → 重建统一实心椭圆投影
# 人物类老张漫画渲染路线；只输出预览目录，不接入站点数据层
import subprocess, glob, importlib.util, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

VENV = "C:/Users/Administrator/.workbuddy/binaries/python/envs/default/Scripts/python.exe"
CUT = "C:/Users/Administrator/.workbuddy/skills/character-art/scripts/advanced_cutout.py"
OUT_DIR = "outputs/_figures_preview"
os.makedirs(OUT_DIR, exist_ok=True)

keys = ["diabolo", "jianzi", "kite", "lantern", "drum", "top"]

# 站点现有小人脚下椭圆色（采样自 processed/lil2_child_t.png）
SHADOW_RGB = (198, 120, 111)


def strip_ground(src, cut_png):
    """清掉脚下 halftone 网点地面投影。

    原图这批把地面阴影画成网点（色距 1~150），旧批次是实心椭圆（色距大，被保留）。
    判据（只看画面下半部，保护空中道具与上半身衣摆）：
      ① 非主体最大连通块、且原图近底色（d<150）→ 清（散碎网点）
      ② 任意半透明(alpha<250)且近底色 → 清（软边雾）
      ③ 主体块内贴近脚底、近底色的实心像素 → 保留，交由椭圆覆盖
    深色主体（d>150）与饱和道具一律保留。
    """
    raw = np.array(Image.open(src).convert("RGB")).astype(float)
    bg = raw[3, 3]
    d = np.sqrt(((raw - bg) ** 2).sum(axis=2))
    a = np.array(Image.open(cut_png).convert("RGBA"))
    al = a[:, :, 3]
    h, w = al.shape
    low = np.zeros_like(al, bool)
    low[int(h * 0.62):, :] = True

    solid = al >= 200
    lab, n = ndimage.label(solid)
    if n:
        sizes = ndimage.sum(solid, lab, range(1, n + 1))
        main = (lab == int(np.argmax(sizes)) + 1)
    else:
        main = np.zeros_like(al, bool)

    near = d < 150
    kill = low & (al > 0) & near & ((~main) | (al < 250))

    # 追加：踩在地面上的实心奶油色白条（跟主体连通，上一判据漏掉）。
    # 用成品 RGB 判纸底色，避开粉袍/椭圆这类偏红暗色。
    rgb = a[:, :, :3].astype(int)
    paper = ((rgb[:, :, 0] > 205) & (rgb[:, :, 1] > 185) & (rgb[:, :, 2] > 155)
             & (rgb[:, :, 0] - rgb[:, :, 1] < 50)
             & (rgb[:, :, 1] - rgb[:, :, 2] < 50))
    kill |= low & (al > 0) & paper

    # 脚底 70px 内的浅色地面片（白横条/奶油地面）：低饱和 + 亮度 >160。
    # 只限脚底窄带，避免误伤上半身的粉袍/米色衣摆。
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    lum = rgb.mean(axis=2)
    ys0, _ = np.where(al > 12)
    ymax = int(ys0.max())
    foot = np.zeros_like(al, bool)
    foot[max(0, ymax - 55):, :] = True
    # 地面高光也可能偏饱和（暖黄白条），窄带内一律按亮度清；
    # 深色鞋裤 lum 通常 <120，抬起的白鞋底在窄带之外，不受影响
    kill |= foot & (al > 0) & (lum > 145)

    a[kill, 3] = 0
    Image.fromarray(a).save(cut_png)
    return int(kill.sum()), a


def add_ellipse_shadow(a, dst):
    """在主体脚底重建一个干净的实心椭圆（对齐站点既有小人风格）。"""
    al = a[:, :, 3]
    h, w = al.shape
    ys, xs = np.where(al > 12)
    y1 = int(ys.max())
    x0, x1 = int(xs.min()), int(xs.max())
    cx = (x0 + x1) / 2.0
    rx = (x1 - x0) * 0.62 / 2.0
    ry = max(10.0, (y1 - int(ys.min())) * 0.055)
    cy = y1 - ry * 0.15

    layer = Image.new("L", (w, h), 0)
    dr = ImageDraw.Draw(layer)
    dr.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=170)
    layer = layer.filter(ImageFilter.GaussianBlur(radius=4))
    sh = np.array(layer).astype(float)

    out = a.copy()
    # 只落在背景或半透明处，不覆盖主体
    mask = sh > out[:, :, 3]
    out[mask, 0] = SHADOW_RGB[0]
    out[mask, 1] = SHADOW_RGB[1]
    out[mask, 2] = SHADOW_RGB[2]
    out[mask, 3] = np.maximum(out[mask, 3], sh[mask]).astype(np.uint8)
    Image.fromarray(out).save(dst)
    return int(mask.sum())


for k in keys:
    srcs = glob.glob(f"generated-images/fig-{k}/*.png")
    if not srcs:
        print("NO SOURCE for", k); sys.exit(1)
    src = srcs[0]
    out = f"{OUT_DIR}/fig-{k}.png"
    r = subprocess.run([VENV, CUT, src, out], capture_output=True, text=True)
    print(f"[cut] {k}: rc={r.returncode} {r.stdout.strip()[-90:]}")
    if r.returncode != 0:
        print(r.stdout); print(r.stderr); sys.exit(1)
    n, a = strip_ground(src, out)
    m = add_ellipse_shadow(a, out)
    print(f"      ground_strip={n}px ellipse={m}px")

print("DONE %d cutouts" % len(keys))
