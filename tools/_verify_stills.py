# -*- coding: utf-8 -*-
"""三张冒烟静帧的量化检查：元素落位 + 特效存在 + 四角透明"""
import numpy as np
from PIL import Image

PROJ = "C:/Users/Administrator/.workbuddy/binaries/node/workspace/smallfigure-motion/out"

def load(name):
    im = Image.open(f"{PROJ}/{name}").convert("RGBA")
    a = np.array(im)
    return a, a[..., 3] > 100, a[..., :3].astype(int)

def region(mask, cx, cy, r):
    return mask[max(cy - r, 0):cy + r, max(cx - r, 0):cx + r].mean() * 100

def corners_transparent(alpha_mask):
    h, w = alpha_mask.shape
    corners = [alpha_mask[0:6, 0:6].any(), alpha_mask[0:6, w - 6:w].any(),
               alpha_mask[h - 6:h, 0:6].any(), alpha_mask[h - 6:h, w - 6:w].any()]
    return not any(corners)

print("== Mining f26（撞击帧） ==")
a, opq, rgb = load("smoke_mine.png")
print(f"  整体不透明 {opq.mean()*100:.1f}%  四角透明 {corners_transparent(opq)}")
print(f"  撞击点(369,415)r30 内容 {region(opq, 369, 415, 30):.1f}%")
print(f"  角色区(256,350)r80 内容 {region(opq, 256, 350, 80):.1f}%")
bright = (rgb.sum(axis=2) > 600) & opq
print(f"  撞击点亮像素(火/pick) {bright[388:442, 336:402].sum()} 个")

print("== Fishing f24（咬钩帧） ==")
a, opq, rgb = load("smoke_fish.png")
print(f"  整体不透明 {opq.mean()*100:.1f}%  四角透明 {corners_transparent(opq)}")
print(f"  浮漂区(330,397)r18 内容 {region(opq, 330, 397, 18):.1f}%")
print(f"  角色区(110,300)r80 内容 {region(opq, 110, 300, 80):.1f}%")
print(f"  水体区(400,450)r40 内容 {region(opq, 400, 450, 40):.1f}%")
print(f"  码头区(100,450)r40 内容 {region(opq, 100, 450, 40):.1f}%")
fishish = (rgb[..., 0] > 180) & (rgb[..., 1] > 110) & (rgb[..., 1] < 200) & (rgb[..., 2] < 140) & opq
print(f"  橙色鱼像素 {fishish[330:400, 320:400].sum()} 个")

print("== Shooting f31（枪口焰帧） ==")
a, opq, rgb = load("smoke_shoot.png")
print(f"  整体不透明 {opq.mean()*100:.1f}%  四角透明 {corners_transparent(opq)}")
print(f"  枪口区(306,240)r28 内容 {region(opq, 306, 240, 28):.1f}%")
bright = (rgb.sum(axis=2) > 600) & opq
print(f"  枪口亮像素(火焰) {bright[210:270, 275:340].sum()} 个")
print(f"  靶心区(452,240)r50 内容 {region(opq, 452, 240, 50):.1f}%")
print(f"  角色区(110,300)r90 内容 {region(opq, 110, 300, 90):.1f}%")
