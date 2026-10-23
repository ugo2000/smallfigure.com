# -*- coding: utf-8 -*-
"""线上全量资源检查：走 clash 代理，逐个取 full/thumb"""
import json, subprocess

PROXY = "http://127.0.0.1:7897"
raw = subprocess.run(["curl", "-s", "-x", PROXY, "https://smallfigure.com/data/images.json"],
                     capture_output=True, text=True, encoding="utf-8").stdout
d = json.loads(raw)
im = d["images"]
print("线上 count:", d["count"])
ok = bad = 0
for i in im:
    for k in ("file", "thumb"):
        u = "https://smallfigure.com/" + i[k] + "?v=" + i["ver"]
        out = subprocess.run(["curl", "-s", "-x", PROXY, "-o", "/dev/null", "-w", "%{http_code} %{size_download}",
                              u], capture_output=True, text=True).stdout.split()
        code, ln = out[0], int(out[1])
        if code == "200" and ln > 0:
            ok += 1
        else:
            bad += 1
            print("  BAD", i["id"], k, code, ln)
print("资源检查: %d OK / %d BAD (共 %d 个文件)" % (ok, bad, len(im) * 2))
