# -*- coding: utf-8 -*-
# 给透明 PNG 的物体下方合成一个柔和投影椭圆（匹配老张「落地感」）。
# 用法：python _add_shadow.py <in.png> <out.png> [peak] [width_ratio] [height_ratio] [drop]
import sys, numpy as np
from PIL import Image, ImageFilter

def add_shadow(src, dst, peak=80, wr=0.78, hr=0.16, drop=0.06, color=(70,62,55)):
    im = Image.open(src).convert("RGBA")
    a = np.array(im)
    H, W = a.shape[:2]
    alpha = a[:,:,3].astype(float)
    obj = alpha > 12
    if obj.sum() == 0:
        im.save(dst); return (0,0)
    ys, xs = np.where(obj)
    x0,x1,y0,y1 = xs.min(), xs.max(), ys.min(), ys.max()
    cx = (x0+x1)/2.0
    obj_w = x1-x0; obj_h = y1-y0
    # 阴影椭圆中心：在物体底部略下方
    cy = y1 + drop*obj_h
    rx = (obj_w*wr)/2.0
    ry = (obj_h*hr)/2.0
    yy, xx = np.mgrid[0:H,0:W]
    nx = (xx-cx)/rx; ny = (yy-cy)/ry
    d = np.sqrt(nx*nx + ny*ny)
    sh = np.clip(1.0 - d, 0, 1)**1.8 * peak   # 柔和径向衰减
    sh = sh * (1 - alpha/255.0)               # 只在背景/半透明处落影，物体下方不重复
    sh = np.clip(sh, 0, 255).astype(np.uint8)
    # 轻微模糊让边缘更柔
    sh_img = Image.fromarray(sh, "L").filter(ImageFilter.GaussianBlur(radius=max(2,int(obj_w*0.012))))
    sh_a = np.array(sh_img).astype(float)
    # 合成：阴影在物体之下（alpha 取 max），颜色用阴影色
    out = a.copy()
    shadow_mask = sh_a > out[:,:,3]
    out[shadow_mask,0:3] = color
    out[shadow_mask,3] = np.maximum(out[shadow_mask,3], sh_a[shadow_mask]).astype(np.uint8)
    # 物体本身保持不变（已被 >=12 保留）
    Image.fromarray(out, "RGBA").save(dst)
    return (int(sh_a.sum()), int(obj.sum()))

if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    peak = float(sys.argv[3]) if len(sys.argv)>3 else 80
    r = add_shadow(src, dst, peak=peak)
    print("shadow px sum=%d  obj px=%d -> %s" % (r[0], r[1], dst))
