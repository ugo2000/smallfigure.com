# -*- coding: utf-8 -*-
# 批次三十五：线上验收（467 项 / 73 分类 / alienleaves 异星叶片 8 片）
import json, sys, time, re
import urllib.request

BASE = "https://smallfigure.com"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

NEW_IDS = [
    "leaf-starvein", "leaf-crystalhoney", "leaf-gearclock", "leaf-moonphase",
    "leaf-lampvein", "leaf-doublespiral", "leaf-metalscales", "leaf-dewlens",
]
OG = "og-0c1cf70f5f.jpg"


def get(url, timeout=30, retry=3):
    """带重试的 GET（Cloudflare 偶发 SSL EOF / 超时）"""
    last = None
    for attempt in range(retry):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.status, r.read()
        except Exception as e:
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise last


ok = True


def check(name, cond, extra=""):
    global ok
    print("%-46s %s %s" % (name, "PASS" if cond else "FAIL", extra))
    if not cond:
        ok = False


# 1. images.json
st, body = get(BASE + "/data/images.json?cb=35")
m = json.loads(body.decode("utf-8"))
imgs = m["images"]
cats = set(i["category"] for i in imgs)
leaves = [i for i in imgs if i["category"] == "alienleaves"]
ids = [i["id"] for i in leaves]
check("images.json HTTP 200", st == 200, "status=%s" % st)
check("count == 467", m["count"] == 467 and len(imgs) == 467, "count=%s actual=%d" % (m["count"], len(imgs)))
check("categories == 73", len(cats) == 73 and len(m["categories"]) == 73, "actual=%d meta=%d" % (len(cats), len(m["categories"])))
check("alienleaves items == 8", len(leaves) == 8, "actual=%d" % len(leaves))
check("8 个新 id 全在", all(n in ids for n in NEW_IDS))
check("alienleaves categoryLabel", all(i.get("categoryLabel") == "异星叶片" for i in leaves))
check("alienleaves categoryLabelEn", all(i.get("categoryLabelEn") == "Alien Leaves" for i in leaves))
check("alienleaves 全 transparent", all(i.get("transparent") for i in leaves))
check("subtitle 含异星叶片", "异星叶片" in m["subtitle"] and "Alien Leaves" in m["subtitleEn"])
check("旧 emblems 28 项未受影响", len([i for i in imgs if i["category"] == "emblems"]) == 28)

# 2. 分类页（每件出现两次：卡片链接 + noscript 全文版，必须去重）
st, body = get(BASE + "/c/alienleaves/")
html = body.decode("utf-8", "ignore")
links = set(re.findall(r"/i/(leaf-[a-z]+)/", html))
check("/c/alienleaves/ HTTP 200", st == 200, "status=%s" % st)
check("/c/alienleaves/ 含 8 件唯一链接", len(links) == 8, "unique=%d" % len(links))
check("分类页含 8 个新 id", all(n in html for n in NEW_IDS))
check("分类页标题含异星叶片", "异星叶片" in html)

# 3. 详情页逐个检查
bad = []
for i in leaves:
    try:
        s, b = get(BASE + "/i/%s/" % i["id"])
        h = b.decode("utf-8", "ignore")
        if s != 200 or "%s.png" % i["id"] not in h:
            bad.append((i["id"], s))
    except Exception as e:
        bad.append((i["id"], str(e)))
check("8 个异星叶片详情页 200 且含图", not bad, str(bad[:3]))

# 4. 首页
st, body = get(BASE + "/")
html = body.decode("utf-8", "ignore")
check("首页 HTTP 200", st == 200)
check("首页含 467", "467" in html)
check("首页含 73 个分类", "73 个分类" in html)

# 5. i18n.js
st, body = get(BASE + "/i18n.js?cb=35")
js = body.decode("utf-8", "ignore")
check("i18n.js 含 467", "467" in js)
check("i18n.js 含 73 categories", "73 categories" in js)
check("i18n.js 含 73 个分类", "73 个分类" in js)
check("i18n.js 无残留 459", "459" not in js)
check("i18n.js 含新搜索词", "露镜叶" in js and "dew lens" in js)

# 6. 首页脚本引用
st, body = get(BASE + "/app.js?cb=35")
check("app.js HTTP 200", st == 200)

# 7. og 图
for u in ["/og-1200x630.jpg", "/" + OG]:
    try:
        s, b = get(BASE + u)
        check("og %s" % u, s == 200 and len(b) > 10000, "status=%s size=%d" % (s, len(b)))
    except Exception as e:
        check("og %s" % u, False, str(e))

# 8. 大图可访问
bad_img = []
for i in leaves:
    try:
        s, b = get(BASE + "/" + i["file"] + "?cb=35")
        if s != 200 or len(b) < 5000:
            bad_img.append((i["id"], s, len(b)))
    except Exception as e:
        bad_img.append((i["id"], str(e)))
check("8 张叶片大图可访问", not bad_img, str(bad_img[:3]))

# 9. 缩略图
bad_th = []
for i in leaves:
    try:
        s, b = get(BASE + "/" + i["thumb"] + "?cb=35")
        if s != 200 or len(b) < 1000:
            bad_th.append((i["id"], s, len(b)))
    except Exception as e:
        bad_th.append((i["id"], str(e)))
check("8 张叶片缩略图可访问", not bad_th, str(bad_th[:3]))

# 10. sitemap / robots / llms
for u in ["/sitemap.xml", "/robots.txt", "/llms.txt"]:
    try:
        s, b = get(BASE + u)
        check(u, s == 200, "status=%s size=%d" % (s, len(b)))
    except Exception as e:
        check(u, False, str(e))

st, body = get(BASE + "/llms.txt")
llms = body.decode("utf-8", "ignore")
check("llms.txt 含 alienleaves 分类", "alienleaves" in llms)
check("llms.txt 含 leaf-dewlens", "leaf-dewlens" in llms)
check("llms.txt 含 73 分类", "73" in llms)

print("\n== 批次三十五线上验收：%s ==" % ("全部通过" if ok else "存在失败项"))
sys.exit(0 if ok else 1)
