# -*- coding: utf-8 -*-
# 批次二十九：8 张精致小人 抠图 + 重建脚下柔和投影
import subprocess, glob, importlib.util, sys

VENV = "C:/Users/Administrator/.workbuddy/binaries/python/envs/default/Scripts/python.exe"
CUT = "C:/Users/Administrator/.workbuddy/skills/character-art/scripts/advanced_cutout.py"

spec = importlib.util.spec_from_file_location("addsh", "tools/_add_shadow.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

keys = ["scholar", "tea", "embroider", "sword", "music", "craft", "merchant", "recluse"]

for k in keys:
    srcs = glob.glob(f"generated-images/lil-{k}/*.png")
    if not srcs:
        print("NO SOURCE for", k); sys.exit(1)
    src = srcs[0]
    out = f"processed/lil_{k}_t.png"
    r = subprocess.run([VENV, CUT, src, out], capture_output=True, text=True)
    print(f"[cut] {k}: rc={r.returncode}")
    if r.returncode != 0:
        print(r.stdout); print(r.stderr); sys.exit(1)
    # 重建脚下柔和投影（与食物批次同款窄椭圆）
    sm, om = mod.add_shadow(out, out, peak=48, wr=0.62, hr=0.11, drop=0.045)
    print(f"      shadow_px={sm} obj_px={om} -> {out}")

print("DONE 8 cutouts")
