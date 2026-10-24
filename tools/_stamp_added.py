# 回填每个条目的 added 时间戳（首次出现在 data/images.json 的提交时间）
# 已有 added 的条目（如本轮新加入、尚未提交的）保留原值
import json, subprocess, sys, os

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

shas = subprocess.check_output(
    ["git", "log", "--format=%H|%aI", "--reverse", "--", "data/images.json"],
    text=True).strip().splitlines()

added = {}
for line in shas:
    sha, ts = line.split("|")
    raw = subprocess.check_output(["git", "show", f"{sha}:data/images.json"])
    data = json.loads(raw.decode("utf-8"))
    for im in data.get("images", []):
        iid = im.get("id")
        if iid and iid not in added:
            added[iid] = ts

path = "data/images.json"
with open(path, encoding="utf-8") as f:
    cur = json.load(f)

missing = []
for im in cur["images"]:
    iid = im.get("id")
    if iid in added:
        im["added"] = added[iid]
    elif not im.get("added"):
        missing.append(iid)

if missing:
    print("MISSING(无 added 且不在 git 历史):", missing)

# added 统一放到字段末尾
for im in cur["images"]:
    val = im.pop("added", None)
    if val is not None:
        im["added"] = val

with open(path, "w", encoding="utf-8") as f:
    json.dump(cur, f, ensure_ascii=False, indent=1)
    f.write("\n")

print("stamped", len(added), "ids from git; current items:", len(cur["images"]))
