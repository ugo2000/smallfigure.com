# -*- coding: utf-8 -*-
# 批次三十一：线上验收（425 项 / 70 分类 / toys 20 件）
import json, os, sys, time
import re
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
st, body = get(BASE + "/data/images.json")
m = json.loads(body.decode("utf-8"))
imgs = m["images"]
cats = set(i["category"] for i in imgs)
toys = [i for i in imgs if i["category"] == "toys"]
check("images.json HTTP 200", st == 200, "status=%s" % st)
check("count == 425", m["count"] == 425 and len(imgs) == 425, "count=%s actual=%d" % (m["count"], len(imgs)))
check("categories == 70", len(cats) == 70 and len(m["categories"]) == 70, "actual=%d meta=%d" % (len(cats), len(m["categories"])))
check("toys items == 20", len(toys) == 20, "actual=%d" % len(toys))
check("toys categoryLabel present", all(i.get("categoryLabel") == "中国玩具" for i in toys))
check("toys categoryLabelEn present", all(i.get("categoryLabelEn") == "Chinese Toys" for i in toys))
check("toys all transparent", all(i.get("transparent") for i in toys))

# 2. 分类页
st, body = get(BASE + "/c/toys/")
html = body.decode("utf-8", "ignore")
toy_links = set(re.findall(r"/i/(toy-[a-z]+)/", html))
check("/c/toys/ HTTP 200", st == 200, "status=%s" % st)
check("/c/toys/ 含 20 件唯一链接", len(toy_links) == 20, "unique=%d" % len(toy_links))

# 3. 详情页逐个检查
bad = []
for i in toys:
    try:
        s, b = get(BASE + "/i/%s/" % i["id"])
        h = b.decode("utf-8", "ignore")
        if s != 200 or "%s.png" % i["id"] not in h:
            bad.append((i["id"], s))
    except Exception as e:
        bad.append((i["id"], str(e)))
check("20 个 toys 详情页 200 且含图", not bad, str(bad[:3]))

# 4. 首页
st, body = get(BASE + "/")
html = body.decode("utf-8", "ignore")
check("首页 HTTP 200", st == 200)
check("首页含 425", "425" in html)
check("首页含 70 个分类", "70" in html)

# 5. i18n.js
st, body = get(BASE + "/i18n.js")
js = body.decode("utf-8", "ignore")
check("i18n.js 含 425", "425" in js)
check("i18n.js 含 70 categories", "70 categories" in js)
check("i18n.js 无残留 405", "405" not in js)

# 6. 首页脚本引用
st, body = get(BASE + "/app.js")
check("app.js HTTP 200", st == 200)

# 7. og 图
for u in ["/og-1200x630.jpg", "/og-c78a467cc0.jpg"]:
    try:
        s, b = get(BASE + u)
        check("og %s" % u, s == 200 and len(b) > 10000, "status=%s size=%d" % (s, len(b)))
    except Exception as e:
        check("og %s" % u, False, str(e))

# 8. 20 张大图可访问
bad_img = []
for i in toys:
    try:
        s, b = get(BASE + "/" + i["file"])
        if s != 200 or len(b) < 5000:
            bad_img.append((i["id"], s, len(b)))
    except Exception as e:
        bad_img.append((i["id"], str(e)))
check("20 张 toys 大图可访问", not bad_img, str(bad_img[:3]))

# 9. 缩略图
bad_th = []
for i in toys:
    try:
        s, b = get(BASE + "/" + i["thumb"])
        if s != 200 or len(b) < 1000:
            bad_th.append((i["id"], s, len(b)))
    except Exception as e:
        bad_th.append((i["id"], str(e)))
check("20 张 toys 缩略图可访问", not bad_th, str(bad_th[:3]))

# 10. sitemap / robots / llms
for u in ["/sitemap.xml", "/robots.txt", "/llms.txt"]:
    try:
        s, b = get(BASE + u)
        check(u, s == 200, "status=%s size=%d" % (s, len(b)))
    except Exception as e:
        check(u, False, str(e))

st, body = get(BASE + "/llms.txt")
llms = body.decode("utf-8", "ignore")
check("llms.txt 含 toys 分类", "toys" in llms)
check("llms.txt 含 toy-diabolo", "toy-diabolo" in llms)

print("\n== 批次三十一线上验收：%s ==" % ("全部通过" if ok else "存在失败项"))
sys.exit(0 if ok else 1)
