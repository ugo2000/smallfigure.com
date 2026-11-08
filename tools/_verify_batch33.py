# -*- coding: utf-8 -*-
# 批次三十三：线上验收（439 项 / 72 分类 / emblems 奇想徽章 8 件）
import json, sys, time, re
import urllib.request

BASE = "https://smallfigure.com"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


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
    print("%-42s %s %s" % (name, "PASS" if cond else "FAIL", extra))
    if not cond:
        ok = False


# 1. images.json
st, body = get(BASE + "/data/images.json?cb=33")
m = json.loads(body.decode("utf-8"))
imgs = m["images"]
cats = set(i["category"] for i in imgs)
badges = [i for i in imgs if i["category"] == "emblems"]
check("images.json HTTP 200", st == 200, "status=%s" % st)
check("count == 439", m["count"] == 439 and len(imgs) == 439, "count=%s actual=%d" % (m["count"], len(imgs)))
check("categories == 72", len(cats) == 72 and len(m["categories"]) == 72, "actual=%d meta=%d" % (len(cats), len(m["categories"])))
check("emblems items == 8", len(badges) == 8, "actual=%d" % len(badges))
check("emblems categoryLabel present", all(i.get("categoryLabel") == "奇想徽章" for i in badges))
check("emblems categoryLabelEn present", all(i.get("categoryLabelEn") == "Curious Emblems" for i in badges))
check("emblems all transparent", all(i.get("transparent") for i in badges))
check("subtitle 含奇想徽章", "奇想徽章" in m["subtitle"] and "Curious Emblems" in m["subtitleEn"])

# 2. 分类页（每件出现两次：卡片链接 + noscript 全文版，必须去重）
st, body = get(BASE + "/c/emblems/")
html = body.decode("utf-8", "ignore")
links = set(re.findall(r"/i/(emblem-[a-z]+)/", html))
check("/c/emblems/ HTTP 200", st == 200, "status=%s" % st)
check("/c/emblems/ 含 8 件唯一链接", len(links) == 8, "unique=%d" % len(links))

# 3. 详情页逐个检查
bad = []
for i in badges:
    try:
        s, b = get(BASE + "/i/%s/" % i["id"])
        h = b.decode("utf-8", "ignore")
        if s != 200 or "%s.png" % i["id"] not in h:
            bad.append((i["id"], s))
    except Exception as e:
        bad.append((i["id"], str(e)))
check("8 个 emblems 详情页 200 且含图", not bad, str(bad[:3]))

# 4. 首页
st, body = get(BASE + "/")
html = body.decode("utf-8", "ignore")
check("首页 HTTP 200", st == 200)
check("首页含 439", "439" in html)
check("首页含 72 个分类", "72 个分类" in html)

# 5. i18n.js
st, body = get(BASE + "/i18n.js?cb=33")
js = body.decode("utf-8", "ignore")
check("i18n.js 含 439", "439" in js)
check("i18n.js 含 72 categories", "72 categories" in js)
check("i18n.js 无残留 431", "431" not in js)

# 6. 首页脚本引用
st, body = get(BASE + "/app.js?cb=33")
check("app.js HTTP 200", st == 200)

# 7. og 图
for u in ["/og-1200x630.jpg", "/og-e14dfdf93d.jpg"]:
    try:
        s, b = get(BASE + u)
        check("og %s" % u, s == 200 and len(b) > 10000, "status=%s size=%d" % (s, len(b)))
    except Exception as e:
        check("og %s" % u, False, str(e))

# 8. 8 张大图可访问
bad_img = []
for i in badges:
    try:
        s, b = get(BASE + "/" + i["file"] + "?cb=33")
        if s != 200 or len(b) < 5000:
            bad_img.append((i["id"], s, len(b)))
    except Exception as e:
        bad_img.append((i["id"], str(e)))
check("8 张 emblems 大图可访问", not bad_img, str(bad_img[:3]))

# 9. 缩略图
bad_th = []
for i in badges:
    try:
        s, b = get(BASE + "/" + i["thumb"] + "?cb=33")
        if s != 200 or len(b) < 1000:
            bad_th.append((i["id"], s, len(b)))
    except Exception as e:
        bad_th.append((i["id"], str(e)))
check("8 张 emblems 缩略图可访问", not bad_th, str(bad_th[:3]))

# 10. sitemap / robots / llms
for u in ["/sitemap.xml", "/robots.txt", "/llms.txt"]:
    try:
        s, b = get(BASE + u)
        check(u, s == 200, "status=%s size=%d" % (s, len(b)))
    except Exception as e:
        check(u, False, str(e))

st, body = get(BASE + "/llms.txt")
llms = body.decode("utf-8", "ignore")
check("llms.txt 含 emblems 分类", "emblems" in llms)
check("llms.txt 含 emblem-cloudwhale", "emblem-cloudwhale" in llms)
check("llms.txt 含 72 分类", "72" in llms)

print("\n== 批次三十三线上验收：%s ==" % ("全部通过" if ok else "存在失败项"))
sys.exit(0 if ok else 1)
