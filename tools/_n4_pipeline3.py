# -*- coding: utf-8 -*-
"""本轮 17 张最终抠图管线（v14 · 定版）

按「是否需要投影重建」分流，避免过度处理：

  默认路径（绝大多数图）：
    标准抠图 → 清扫同色残留 → 完成
    （这些图本来就没网点问题，投影要么不存在、要么本来就是干净的）

  投影重建路径（--rebuild-shadow，仅用于脚下有 halftone 网点的图）：
    ① 原图上把「封闭纸底色块」（背景口袋）改成纯纸底色
    ② 原图上把投影椭圆整块改写成「比纸底深 58 色距」的深奶油色
       （色距在抠图容差之外 → 洪水进不去 → 完整保留），边缘 alpha 渐变
    ③ 标准抠图
    ④ 清扫同色残留

投影椭圆只认「底部带 + 横长 + 面积够大」的连通块，
并且要求它**不含大面积主体墨线**——否则说明抓到的是主体下半身而不是投影。
"""
import os, sys, argparse, subprocess
import numpy as np
from PIL import Image
from scipy import ndimage

MK = 'C:/Users/Administrator/.workbuddy/skills/character-art/scripts/make_transparent.py'
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def median_border(arr):
    edge = np.concatenate([arr[0], arr[-1], arr[:, 0], arr[:, -1]], axis=0)
    return np.median(edge, axis=0)

def closed_light_blocks(arr, ref, tol=32, min_area=800, max_std=6.5):
    H, W, _ = arr.shape
    dist = np.sqrt(((arr - ref) ** 2).sum(axis=2))
    m = dist <= tol
    lab, n = ndimage.label(m)
    if n == 0:
        return np.zeros((H, W), bool)
    border = set(lab[0].tolist()) | set(lab[-1].tolist()) | \
             set(lab[:, 0].tolist()) | set(lab[:, -1].tolist())
    sizes = ndimage.sum(m, lab, range(1, n+1))
    out = np.zeros((H, W), bool)
    for i in range(1, n+1):
        if i in border or sizes[i-1] < min_area: continue
        cell = (lab == i)
        if float(arr[cell].std(axis=0).mean()) > max_std: continue
        out |= cell
    return out

def shadow_ellipse(arr, ref, band=0.68, close=9, max_frac=0.22):
    """投影椭圆：底部带里横长的、且主体墨线占比低的连通块"""
    H, W, _ = arr.shape
    dist = np.sqrt(((arr - ref) ** 2).sum(axis=2))
    lum = arr.mean(axis=2)
    zone = np.zeros((H, W), bool); zone[int(band*H):, :] = True
    body = zone & (((dist >= 6) & (dist < 30)) | (dist >= 60))
    body = ndimage.binary_closing(body, np.ones((close, close)))
    body = ndimage.binary_fill_holes(body)
    lab, n = ndimage.label(body)
    if n == 0:
        return np.zeros((H, W), bool)
    sizes = ndimage.sum(body, lab, range(1, n+1))
    objs = ndimage.find_objects(lab)
    ink = lum < 60
    best, best_score = 0, 0
    for i in range(1, n+1):
        if sizes[i-1] < 20000: continue
        if sizes[i-1] > H*W*max_frac: continue
        cell = (lab == i)
        ys, xs = objs[i-1]
        w = xs.stop - xs.start; h = ys.stop - ys.start
        if w < h * 1.15: continue                # 投影是横长的
        # 排除右下角的水印块（贴边且很小）
        if sizes[i-1] < 30000 and (xs.stop > W*0.8 or xs.start < W*0.2):
            continue
        score = sizes[i-1]
        if score > best_score:
            best, best_score = i, score
    return (lab == best) if best else np.zeros((H, W), bool)

def sweep(a, sweep_tol=12, sweep_min=500, shadow_shift=(58, 46, 40), soft_edge=True):
    """清扫同色残留 + 投影边缘柔化"""
    rgb = a[:, :, :3].astype(np.float32); al = a[:, :, 3]
    op = al >= 250
    tr = rgb[~op]
    if len(tr):
        vals, cnts = np.unique(tr.astype(np.uint8).reshape(-1, 3), axis=0, return_counts=True)
        sref = vals[cnts.argmax()].astype(np.float32)
    else:
        sref = np.array([231., 215., 180.], dtype=np.float32)
    sd = np.sqrt(((rgb - sref) ** 2).sum(axis=2))
    match = (sd <= sweep_tol) & op
    nmatch = int(match.sum())
    if nmatch >= sweep_min:
        a[match, 3] = 0
    if soft_edge:
        proj_col = np.clip(sref - np.array(shadow_shift, dtype=np.float32), 0, 255)
        pmask = (np.abs(rgb - proj_col).max(axis=2) <= 6) & op
        if pmask.any():
            din = ndimage.distance_transform_edt(pmask)
            f = np.clip(din / 7.0, 0, 1)
            a[:, :, 3] = np.where(pmask, np.clip(80 + f*175, 0, 255).astype(np.uint8), al)
    return nmatch

def process(raw, out, tol=55, rebuild_shadow=False, band=0.68,
            shadow_shift=(58, 46, 40), sweep_tol=12, pocket_std=6.5):
    im = Image.open(os.path.join(BASE, raw)).convert('RGB')
    arr = np.array(im).astype(np.float32)
    H, W, _ = arr.shape
    ref = median_border(arr)
    dist = np.sqrt(((arr - ref) ** 2).sum(axis=2))
    work = arr.copy()
    npk = nsh = 0

    if rebuild_shadow:
        # ① 封闭背景口袋 → 纯纸底色
        pockets = closed_light_blocks(arr, ref, pocket_std=pocket_std) \
            if False else closed_light_blocks(arr, ref, 32, 800, pocket_std)
        work[pockets] = ref
        npk = int(pockets.sum())
        # ② 投影重建
        ell = shadow_ellipse(arr, ref, band)
        nsh = int(ell.sum())
        if nsh:
            proj = np.clip(ref - np.array(shadow_shift, dtype=np.float32), 0, 255)
            work[ell & ~(dist > 130)] = proj

    tmp = os.path.join(BASE, 'processed', '_n4pipe_tmp.png')
    Image.fromarray(np.clip(work, 0, 255).astype(np.uint8)).save(tmp)
    cut = os.path.join(BASE, 'processed', '_n4pipe_cut.png')
    cmd = [sys.executable, MK, 'key', tmp, cut,
           '--target-w', '1024', '--bg-ref', '--no-soft', '--tol', str(tol),
           '--remove-spots', '0.70,0.82,1.0,1.0', '--spots-max', '0.05']
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)

    a = np.array(Image.open(cut).convert('RGBA')).copy()
    nsw = sweep(a, sweep_tol, 500, shadow_shift, soft_edge=rebuild_shadow)
    Image.fromarray(a).save(os.path.join(BASE, out))
    print("  %-32s 口袋 %6d  投影 %6d  清扫 %6d%s" % (
        os.path.basename(raw), npk, nsh, nsw, '  [重建]' if rebuild_shadow else ''))

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('raw'); ap.add_argument('out')
    ap.add_argument('--tol', type=int, default=55)
    ap.add_argument('--rebuild-shadow', action='store_true')
    ap.add_argument('--band', type=float, default=0.68)
    ap.add_argument('--sweep-tol', type=int, default=12)
    ap.add_argument('--shift', default='58,46,40')
    a = ap.parse_args()
    sh = tuple(int(v) for v in a.shift.split(','))
    process(a.raw, a.out, a.tol, a.rebuild_shadow, a.band, sh, a.sweep_tol)
