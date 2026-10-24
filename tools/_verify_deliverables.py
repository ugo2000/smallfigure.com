# -*- coding: utf-8 -*-
"""成品终验：GIF/WebP 帧数、循环、alpha、哑光色、运动量、循环接缝；MP4 用 ffmpeg 读流信息"""
import os, re, subprocess
import numpy as np
from PIL import Image, ImageSequence

OUT = "D:/WB/smallfigure.com/motion"
FF = "C:/Users/Administrator/.workbuddy/binaries/node/workspace/smallfigure-motion/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe"
PANEL = np.array([20, 25, 38])
NAMES = ["mining", "fishing", "shooting"]

for name in NAMES:
    print("== %s ==" % name)
    p = os.path.join(OUT, name + ".gif")
    g = Image.open(p)
    frames = [fr.copy() for fr in ImageSequence.Iterator(g)]
    corner = np.array(frames[0].convert("RGB"))[2, 2]
    corner_ok = np.abs(corner.astype(int) - PANEL).max() <= 6
    d_mid = np.abs(np.array(frames[0].convert("RGB"), int) - np.array(frames[len(frames) // 3].convert("RGB"), int)).mean()
    d_seam = np.abs(np.array(frames[-1].convert("RGB"), int) - np.array(frames[0].convert("RGB"), int)).mean()
    print("  GIF  %d 帧 loop=%s %dKB 哑光%s 中段差异%.1f 首尾接缝%.1f" % (
        len(frames), g.info.get("loop"), os.path.getsize(p) // 1024,
        "OK" if corner_ok else "BAD", d_mid, d_seam))

    p = os.path.join(OUT, name + ".webp")
    w = Image.open(p)
    wf = [fr.copy() for fr in ImageSequence.Iterator(w)]
    a = np.array(wf[0])[..., 3]
    d2 = np.abs(np.array(wf[0].convert("RGB"), int) - np.array(wf[len(wf) // 3].convert("RGB"), int)).mean()
    d2s = np.abs(np.array(wf[-1].convert("RGB"), int) - np.array(wf[0].convert("RGB"), int)).mean()
    print("  WebP %d 帧 loop=%s %dKB alpha=%s 角alpha=%d 中段差异%.1f 首尾接缝%.1f" % (
        len(wf), w.info.get("loop"), os.path.getsize(p) // 1024, wf[0].mode == "RGBA", int(a[2, 2]), d2, d2s))

    p = os.path.join(OUT, name + ".mp4")
    r = subprocess.run([FF, "-hide_banner", "-i", p], capture_output=True, text=True)
    txt = r.stderr
    dur = re.search(r"Duration: ([\d:.]+)", txt)
    fps = re.search(r", (\d+(?:\.\d+)?) fps", txt)
    res = re.search(r", (\d{3,4}x\d{3,4})", txt)
    print("  MP4  %dKB 时长=%s fps=%s 分辨率=%s" % (
        os.path.getsize(p) // 1024, dur.group(1) if dur else "?",
        fps.group(1) if fps else "?", res.group(1) if res else "?"))
