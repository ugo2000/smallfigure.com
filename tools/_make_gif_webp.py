# -*- coding: utf-8 -*-
"""单场景转换：PNG 序列 → GIF（哑光 #141926 + 全局调色板）+ 动画 WebP（alpha 循环）
用法: python _make_gif_webp.py mining|fishing|shooting
一场一跑，避免沙箱内存/时限；跑完立即释放。"""
import os, sys, glob, gc, io, subprocess
from PIL import Image

PROJ = "C:/Users/Administrator/.workbuddy/binaries/node/workspace/smallfigure-motion/out"
OUT = "D:/WB/smallfigure.com/motion"
FFMPEG = "C:/Users/Administrator/.workbuddy/binaries/node/workspace/smallfigure-motion/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe"
os.makedirs(OUT, exist_ok=True)

PANEL = (20, 25, 38)  # #141926
DUR = 42              # 24fps
SCENES = {"mining": ("seq_mine", "mine"), "fishing": ("seq_fish", "fish"), "shooting": ("seq_shoot", "shoot")}

name = sys.argv[1]
d, prefix = SCENES[name]

files = sorted(glob.glob(os.path.join(PROJ, d, prefix + "_*.png")))
n = len(files)

# ---- GIF ----
frames_rgba = [Image.open(f).convert("RGBA") for f in files]
mattes = []
for fr in frames_rgba:
    bg = Image.new("RGBA", fr.size, PANEL + (255,))
    bg.alpha_composite(fr)
    mattes.append(bg.convert("RGB"))
del frames_rgba
gc.collect()

# 全局调色板：4 个采样帧拼图量化，避免逐帧调色板闪烁
w, h = mattes[0].size
grid = Image.new("RGB", (w * 2, h * 2))
for i, m in enumerate([mattes[0], mattes[n // 3], mattes[2 * n // 3], mattes[-1]]):
    grid.paste(m, ((i % 2) * w, (i // 2) * h))
pal = grid.quantize(colors=128, method=Image.Quantize.MEDIANCUT)
del grid
gc.collect()

gif_path = os.path.join(OUT, name + ".gif")
first = mattes[0].quantize(palette=pal, dither=Image.Dither.NONE)
first.save(gif_path, save_all=True,
           append_images=[m.quantize(palette=pal, dither=Image.Dither.NONE) for m in mattes[1:]],
           duration=DUR, loop=0, optimize=True)
print("GIF  %s: %d 帧, %dKB" % (name, n, os.path.getsize(gif_path) // 1024))

# ---- MP4（h264，哑光帧经管道喂 Remotion 自带 ffmpeg）----
mp4_path = os.path.join(OUT, name + ".mp4")
proc = subprocess.Popen(
    [FFMPEG, "-y", "-framerate", "24", "-f", "image2pipe", "-vcodec", "png", "-i", "-",
     "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart", mp4_path],
    stdin=subprocess.PIPE)
for m in mattes:
    buf = io.BytesIO()
    m.save(buf, "PNG")
    proc.stdin.write(buf.getvalue())
proc.stdin.close()
proc.wait()
print("MP4  %s: %d 帧, %dKB" % (name, n, os.path.getsize(mp4_path) // 1024))

del mattes
gc.collect()

# ---- WebP（保留 alpha）----
frames_rgba = [Image.open(f).convert("RGBA") for f in files]
webp_path = os.path.join(OUT, name + ".webp")
frames_rgba[0].save(webp_path, save_all=True, append_images=frames_rgba[1:],
                    duration=DUR, loop=0, method=4, quality=92)
print("WebP %s: %d 帧, %dKB" % (name, n, os.path.getsize(webp_path) // 1024))
