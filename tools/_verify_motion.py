# -*- coding: utf-8 -*-
"""动图素材量化验收 + 锚点提取（给 Remotion 用）
输出：每个文件的 不透明/半透明/背景残留/角落水印残检/主体 bbox/各锚点
"""
import json, os
import numpy as np
from PIL import Image

BASE = "D:/WB/smallfigure.com"
NAMES = ["motion_char_miner", "motion_char_fisher", "motion_char_shooter",
         "motion_prop_pickaxe", "motion_prop_rod", "motion_prop_pistol"]

def near_cream(rgb):
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    return (np.minimum(np.minimum(r, g), b) > 218) & ((np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)) < 28)

out = {}
for name in NAMES:
    p = os.path.join(BASE, "processed", name + "_t.png")
    im = Image.open(p).convert("RGBA")
    a = np.array(im)
    H, W = a.shape[:2]
    alpha = a[..., 3]
    rgb = a[..., :3]
    opq = alpha >= 250
    semi = (alpha > 10) & (alpha < 250)
    opq_ratio = opq.mean()
    semi_ratio = semi.mean()

    # 背景残留：不透明且接近奶油/白色
    residue = opq & near_cream(rgb)
    residue_ratio_of_opq = residue.sum() / max(opq.sum(), 1)

    # 主体 bbox（alpha>10）
    ys, xs = np.where(alpha > 10)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    bw, bh = x1 - x0 + 1, y1 - y0 + 1

    # 角落水印残检：主体 bbox 外扩 2% 之外的四个角区（各 16%x16%）里的不透明像素
    mx, my = max(int(bw * 0.02), 4), max(int(bh * 0.02), 4)
    corners = {}
    for cname, (cx0, cy0, cx1, cy1) in {
        "TL": (0, 0, int(W * 0.16), int(H * 0.16)),
        "TR": (int(W * 0.84), 0, W, int(H * 0.16)),
        "BL": (0, int(H * 0.84), int(W * 0.16), H),
        "BR": (int(W * 0.84), int(H * 0.84), W, H),
    }.items():
        junk = 0
        sub = opq[cy0:cy1, cx0:cx1]
        yy, xx = np.where(sub)
        for y, x in zip(yy, xx):
            gx, gy = cx0 + x, cy0 + y
            if gx < x0 - mx or gx > x1 + mx or gy < y0 - my or gy > y1 + my:
                junk += 1
        corners[cname] = int(junk)

    rec = {
        "file": name + "_t.png", "size": [W, H],
        "opaque_%": round(opq_ratio * 100, 2),
        "semi_%": round(semi_ratio * 100, 2),
        "cream_residue_%of_opaque": round(residue_ratio_of_opq * 100, 3),
        "subject_bbox_rel": [round(x0 / W, 3), round(y0 / H, 3), round(x1 / W, 3), round(y1 / H, 3)],
        "subject_px": int(opq.sum()),
        "corner_junk": corners,
    }

    # ---- 锚点（相对整图坐标 0~1，后续 Remotion 里乘画布尺寸）----
    anchors = {}
    if name == "motion_char_miner":
        # 双手举高：取主体最顶 4% 高度内的不透明像素质心
        band = opq[y0:y0 + max(int(bh * 0.04), 6), :]
        yy, xx = np.where(band)
        anchors["hand"] = [round(float((xx.mean()) / W), 4), round(float((y0 + yy.mean()) / H), 4)]
        anchors["head_top"] = [round(float(x0 + bw / 2) / W, 4), round(float(y0) / H, 4)]
    elif name in ("motion_char_fisher", "motion_char_shooter"):
        # 侧身朝右：手臂带 = 主体高度 28%~58%（避开头与腿），取该带最右不透明列的质心
        ry0 = y0 + int(bh * 0.28); ry1 = y0 + int(bh * 0.58)
        band = opq[ry0:ry1, :]
        col_has = band.any(axis=0)
        xs_r = np.where(col_has)[0]
        rx = xs_r.max()
        col = band[:, max(rx - 6, 0):rx + 1]
        yy, xx = np.where(col)
        anchors["hand"] = [round(float((max(rx - 6, 0) + xx.mean()) / W), 4), round(float((ry0 + yy.mean()) / H), 4)]
        # 枪口参考（射击）：整图最右不透明点
        xs_all = np.where(opq.any(axis=0))[0]
        anchors["front_x"] = round(float(xs_all.max() / W), 4)
    elif name == "motion_prop_pickaxe":
        # 柄朝下：握把 = 主体底部中列
        anchors["grip"] = [round(float((x0 + bw / 2) / W), 4), round(float(y1 / H), 4)]
        anchors["head"] = [round(float((x0 + bw / 2) / W), 4), round(float(y0 / H), 4)]
    elif name == "motion_prop_rod":
        # 手柄在左下：握把 = 主体最左列、靠下的质心
        band = opq[int(y0 + bh * 0.55):, :]
        ys_l, xs_l = np.where(band)
        lx = xs_l.min()
        sub = opq[y0 + int(bh * 0.55):, max(lx - 1, 0):lx + 8]
        yy, xx = np.where(sub)
        anchors["grip"] = [round(float((max(lx - 1, 0) + xx.mean()) / W), 4), round(float((y0 + int(bh * 0.55) + yy.mean()) / H), 4)]
        # 竿尖 = 右上
        ys_t, xs_t = np.where(opq)
        anchors["tip"] = [round(float(np.percentile(xs_t, 98) / W), 4), round(float(np.percentile(ys_t, 2) / H), 4)]
    elif name == "motion_prop_pistol":
        # 枪身水平朝右：握把 = 左下，枪口 = 最右
        band = opq[int(y0 + bh * 0.45):, :]
        ys_l, xs_l = np.where(band)
        lx = xs_l.min()
        sub = opq[int(y0 + bh * 0.45):, max(lx - 1, 0):lx + 10]
        yy, xx = np.where(sub)
        anchors["grip"] = [round(float((max(lx - 1, 0) + xx.mean()) / W), 4), round(float((y0 + int(bh * 0.45) + yy.mean()) / H), 4)]
        # 枪口：主体右 1/3 区域的最右不透明点
        rx0 = x0 + int(bw * 0.66)
        band2 = opq[:, rx0:]
        ys_m, xs_m = np.where(band2)
        anchors["muzzle"] = [round(float((rx0 + xs_m.max()) / W), 4), round(float(ys_m.mean() / H), 4)]
    rec["anchors"] = anchors
    out[name] = rec

    print("%-24s opq=%5.2f%% semi=%5.2f%% 残留=%5.3f%% bbox=%s 角落=%s" % (
        name, rec["opaque_%"], rec["semi_%"], rec["cream_residue_%of_opaque"],
        rec["subject_bbox_rel"], rec["corner_junk"]))
    print("    anchors:", anchors)

with open(os.path.join(BASE, "tools", "_motion_anchors.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("\n已写出 tools/_motion_anchors.json")
