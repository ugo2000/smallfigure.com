# -*- coding: utf-8 -*-
"""线上全量资源检查（并发版）：走 clash 代理，逐个取 full/thumb + images.json"""
import json, sys, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

PROXY = "http://127.0.0.1:7897"
BASE = "https://smallfigure.com"
opener = urllib.request.build_opener(
    urllib.request.ProxyHandler({"http": PROXY, "https": PROXY})
)


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with opener.open(req, timeout=30) as r:
            return r.status, len(r.read())
    except urllib.error.HTTPError as e:
        return e.code, 0
    except Exception as e:
        return "ERR:" + type(e).__name__, 0


raw = urllib.request.urlopen(
    urllib.request.Request(BASE + "/data/images.json", headers={"User-Agent": "Mozilla/5.0"}),
    timeout=30,
) if False else get(BASE + "/data/images.json")
d = json.loads(opener.open(
    urllib.request.Request(BASE + "/data/images.json", headers={"User-Agent": "Mozilla/5.0"}),
    timeout=30).read().decode("utf-8"))
im = d["images"]
print("线上 count:", d["count"], "| images:", len(im))

tasks = []
for i in im:
    for k in ("file", "thumb"):
        tasks.append((i["id"], k, BASE + "/" + i[k] + "?v=" + i["ver"]))

ok = bad = 0
with ThreadPoolExecutor(max_workers=16) as ex:
    for (iid, k, u), (code, ln) in zip(tasks, ex.map(lambda t: get(t[2]), tasks)):
        if code == 200 and ln > 0:
            ok += 1
        else:
            bad += 1
            print("  BAD", iid, k, code, ln)
print("资源检查: %d OK / %d BAD (共 %d 个文件)" % (ok, bad, len(im) * 2))
sys.exit(1 if bad else 0)
