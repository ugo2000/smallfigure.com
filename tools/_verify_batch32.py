# -*- coding: utf-8 -*-
# 批次三十二：线上验收（431 项 / 71 分类 / playkids 童戏小人 6 件）
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
st, body = get(BASE + "/data/images.json?cb=32")
m = json.loads(body.decode("utf-8"))
imgs = m["images"]
cats = set(i["category"] for i in imgs)
kids = [i for i in imgs if i["category"] == "playkids"]
check("images.json HTTP 200", st == 200, "status=%s" % st)
check("count == 431", m["count"] == 431 and len(imgs) == 431, "count=%s actual=%d" % (m["count"], len(imgs)))
check("categories == 71", len(cats) == 71 and len(m["categories"]) == 71, "actual=%d meta=%d" % (len(cats), len(m["categories"])))
check("playkids items == 6", len(kids) == 6, "actual=%d" % len(kids))
check("playkids categoryLabel present", all(i.get("categoryLabel") == "童戏小人" for i in kids))
check("playkids categoryLabelEn present", all(i.get("categoryLabelEn") == "Children at Play" for i in kids))
check("playkids all transparent", all(i.get("transparent") for i in kids))
check("subtitle 含童戏小人", "童戏小人" in m["subtitle"] and "Children at Play" in m["subtitleEn"])

# 2. 分类页（每件出现两次：卡片链接 + noscript 全文版，必须去重）
st, body = get(BASE + "/c/playkids/")
html = body.decode("utf-8", "ignore")
kid_links = set(re.findall(r"/i/(kid-[a-z]+)/", html))
check("/c/playkids/ HTTP 200", st == 200, "status=%s" % st)
check("/c/playkids/ 含 6 件唯一链接", len(kid_links) == 6, "unique=%d" % len(kid_links))

# 3. 详情页逐个检查
bad = []
for i in kids:
    try:
        s, b = get(BASE + "/i/%s/" % i["id"])
        h = b.decode("utf-8", "ignore")
        if s != 200 or "%s.png" % i["id"] not in h:
            bad.append((i["id"], s))
    except Exception as e:
        bad.append((i["id"], str(e)))
check("6 个 playkids 详情页 200 且含图", not bad, str(bad[:3]))

# 4. 首页
st, body = get(BASE + "/")
html = body.decode("utf-8", "ignore")
check("首页 HTTP 200", st == 200)
check("首页含 431", "431" in html)
check("首页含 71 个分类", "71 个分类" in html)

# 5. i18n.js
st, body = get(BASE + "/i18n.js?cb=32")
js = body.decode("utf-8", "ignore")
check("i18n.js 含 431", "431" in js)
check("i18n.js 含 71 categories", "71 categories" in js)
check("i18n.js 无残留 425", "425" not in js)

# 6. 首页脚本引用
st, body = get(BASE + "/app.js?cb=32")
check("app.js HTTP 200", st == 200)

# 7. og 图
for u in ["/og-1200x630.jpg", "/og-696835f37f.jpg"]:
    try:
        s, b = get(BASE + u)
        check("og %s" % u, s == 200 and len(b) > 10000, "status=%s size=%d" % (s, len(b)))
    except Exception as e:
        check("og %s" % u, False, str(e))

# 8. 6 张大图可访问
bad_img = []
for i in kids:
    try:
        s, b = get(BASE + "/" + i["file"] + "?cb=32")
        if s != 200 or len(b) < 5000:
            bad_img.append((i["id"], s, len(b)))
    except Exception as e:
        bad_img.append((i["id"], str(e)))
check("6 张 playkids 大图可访问", not bad_img, str(bad_img[:3]))

# 9. 缩略图
bad_th = []
for i in kids:
    try:
        s, b = get(BASE + "/" + i["thumb"] + "?cb=32")
        if s != 200 or len(b) < 1000:
            bad_th.append((i["id"], s, len(b)))
    except Exception as e:
        bad_th.append((i["id"], str(e)))
check("6 张 playkids 缩略图可访问", not bad_th, str(bad_th[:3]))

# 10. sitemap / robots / llms
for u in ["/sitemap.xml", "/robots.txt", "/llms.txt"]:
    try:
        s, b = get(BASE + u)
        check(u, s == 200, "status=%s size=%d" % (s, len(b)))
    except Exception as e:
        check(u, False, str(e))

st, body = get(BASE + "/llms.txt")
llms = body.decode("utf-8", "ignore")
check("llms.txt 含 playkids 分类", "playkids" in llms)
check("llms.txt 含 kid-diabolo", "kid-diabolo" in llms)
check("llms.txt 含 71 分类", "71" in llms)

print("\n== 批次三十二线上验收：%s ==" % ("全部通过" if ok else "存在失败项"))
sys.exit(0 if ok else 1)
