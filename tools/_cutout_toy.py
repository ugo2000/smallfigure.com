# -*- coding: utf-8 -*-
# 批次三十一：20 款中国独有传统玩具 抠图（故事书墨线淡彩风，与 gizmos/metalfolk 同款，无落地投影）
import subprocess, glob, importlib.util, sys

VENV = "C:/Users/Administrator/.workbuddy/binaries/python/envs/default/Scripts/python.exe"
CUT = "C:/Users/Administrator/.workbuddy/skills/character-art/scripts/advanced_cutout.py"

keys = ["diabolo", "spinningtop", "jianzi", "kite", "lantern", "ninerings",
        "tangram", "lubanlock", "pelletdrum", "tumbler", "paperflip",
        "bamboodragonfly", "pinwheel", "clothtiger", "rabbitlord", "nigugu",
        "sugarfigure", "klotski", "slingshot", "zongren"]

fail = []
for k in keys:
    srcs = glob.glob(f"generated-images/toy-{k}/*.png")
    if not srcs:
        print("NO SOURCE for", k)
        fail.append(k)
        continue
    src = srcs[0]
    out = f"processed/toy-{k}.png"
    r = subprocess.run([VENV, CUT, src, out], capture_output=True, text=True)
    print(f"[cut] {k}: rc={r.returncode} {r.stdout.strip()[-120:]}")
    if r.returncode != 0:
        print(r.stdout); print(r.stderr)
        fail.append(k)

print("DONE %d cutouts, failed=%s" % (len(keys) - len(fail), fail))
