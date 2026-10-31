#!/usr/bin/env python3
# 移除「生成方式: AI 生成」标签与全局 AI 生成声明（代码层，行级稳健匹配）
import io

def lines_of(p): return io.open(p, encoding="utf-8").read().split("\n")
def write(p, ls): io.open(p, "w", encoding="utf-8").write("\n".join(ls))

def drop_lines(p, needle):
    ls = lines_of(p); before = len(ls)
    ls = [l for l in ls if needle not in l]
    write(p, ls); print("DROP  %s  (%d -> %d lines, removed %d)" % (p, before, len(ls), before-len(ls)))

def repl_line(p, needle, new_line):
    ls = lines_of(p); n = sum(1 for l in ls if needle in l)
    if n != 1: raise SystemExit("FAIL %s: %r matched %d (want 1)" % (p, needle, n))
    ls = [new_line if needle in l else l for l in ls]
    write(p, ls); print("REPL  %s  (%d lines)" % (p, len(ls)))

def repl_all(p, needle, new_line):
    ls = lines_of(p); n = sum(1 for l in ls if needle in l)
    if n == 0: raise SystemExit("FAIL %s: %r matched 0" % (p, needle))
    ls = [new_line if needle in l else l for l in ls]
    write(p, ls); print("REPL* %s  (%d occurrences)" % (p, n))

# app.js —— 删除灯箱 meta 的「生成方式」行
drop_lines("app.js", "SF.t('meta.generation')")

# i18n.js —— 删除 meta.generation 键（中英 4 行），改写 footer.ai
drop_lines("i18n.js", "'meta.generation")
repl_line("i18n.js", "'footer.ai': '\u5173\u4e8e AI \u4e0e\u865a\u6784\u7684\u8bf4\u660e",
          "      'footer.ai': '\u5173\u4e8e\u865a\u6784\u4e0e\u6388\u6743\u7684\u8bf4\u660e\uff1a\u5404\u5904\u300c\u6545\u4e8b\u7531\u6765\u300d\u5747\u4e3a\u865a\u6784\u8bbe\u5b9a\uff0c\u975e\u4e8b\u5b9e\u9648\u8ff0\uff0c\u7d20\u6750\u89c4\u683c\u4ee5\u706f\u7bb1\u53c2\u6570\u533a\u4e3a\u51c6\uff1b\u672c\u7ad9\u4e0d\u627f\u8bfa\u5546\u7528\u6388\u6743\uff0c\u8f6c\u8f7d\u6216\u4f7f\u7528\u8bf7\u4fdd\u7559\u7f72\u540d\u4e0e\u51fa\u5904\uff08smallfigure.com\uff09\u3002\u76f8\u5173\u58f0\u660e\u7edf\u4e00\u5728\u6b64\u62ab\u9732\uff0c\u4e0d\u9010\u56fe\u91cd\u590d\u3002',")
repl_line("i18n.js", "'footer.ai': 'About AI and fiction",
          "      'footer.ai': 'About fiction and licensing: every \"Backstory\" is fictional lore, not a statement of fact, and specs are as shown in each lightbox. We make no commercial-licensing commitment; if you repost or use the assets, please retain attribution and source (smallfigure.com). These disclosures are unified here rather than repeated on every image.',")

# functions/_lib/markdown.js —— 详情页/分类页页脚去掉「生成方式：AI 生成；」
repl_all("functions/_lib/markdown.js", "\u751f\u6210\u65b9\u5f0f\uff1aAI \u751f\u6210\uff1b\u672c\u7ad9\u4e0d\u627f\u8bfa\u5546\u7528\u6388\u6743",
         "    L.push('> \u672c\u7ad9\u4e0d\u627f\u8bfa\u5546\u7528\u6388\u6743\uff0c\u8f6c\u8f7d\u6216\u4f7f\u7528\u8bf7\u4fdd\u7559\u7f72\u540d\u4e0e\u51fa\u5904\uff08smallfigure.com\uff09\u3002');")

# functions/index.js —— 描述去掉「生成方式: AI 生成」标注
repl_line("functions/index.js", "\u6bcf\u4ef6\u7d20\u6750\u9875\u811a\u6807\u6ce8\u300c\u751f\u6210\u65b9\u5f0f: AI \u751f\u6210\u300d",
          "  L.push(`- \u6388\u6743\uff1a\u672c\u7ad9\u4e0d\u627f\u8bfa\u5546\u7528\u6388\u6743\uff0c\u8f6c\u8f7d\u6216\u4f7f\u7528\u8bf7\u4fdd\u7559\u7f72\u540d\u4e0e\u51fa\u5904\uff08smallfigure.com\uff09`);")

# index.html —— 改写页脚统一声明（去掉 AI 生成）
repl_line("index.html", "\u5173\u4e8e AI \u4e0e\u865a\u6784\u7684\u8bf4\u660e\uff1a\u672c\u7ad9\u6240\u6709\u7d20\u6750\u56fe\u7247\u5747\u7531 AI \u751f\u6210",
          '    <p class="footer-note" data-i18n="footer.ai">\u5173\u4e8e\u865a\u6784\u4e0e\u6388\u6743\u7684\u8bf4\u660e\uff1a\u5404\u5904\u300c\u6545\u4e8b\u7531\u6765\u300d\u5747\u4e3a\u865a\u6784\u8bbe\u5b9a\uff0c\u975e\u4e8b\u5b9e\u9648\u8ff0\uff0c\u7d20\u6750\u89c4\u683c\u4ee5\u706f\u7bb1\u53c2\u6570\u533a\u4e3a\u51c6\uff1b\u672c\u7ad9\u4e0d\u627f\u8bfa\u5546\u7528\u6388\u6743\uff0c\u8f6c\u8f7d\u6216\u4f7f\u7528\u8bf7\u4fdd\u7559\u7f72\u540d\u4e0e\u51fa\u5904\uff08smallfigure.com\uff09\u3002\u76f8\u5173\u58f0\u660e\u7edf\u4e00\u5728\u6b64\u62ab\u9732\uff0c\u4e0d\u9010\u56fe\u91cd\u590d\u3002</p>')

# tools/_test_story.js —— 测试改为断言「不再含生成方式/AI 生成」
repl_line("tools/_test_story.js", "ok('meta \u542b\u751f\u6210\u65b9\u5f0f: AI \u751f\u6210'",
          "  ok('meta \u4e0d\u518d\u542b\u751f\u6210\u65b9\u5f0f/AI \u751f\u6210', !metaHtml.includes('\u751f\u6210\u65b9\u5f0f') && !metaHtml.includes('AI \u751f\u6210'));")
repl_line("tools/_test_story.js", "ok('\u7edf\u4e00\u58f0\u660e\u542b AI \u751f\u6210 / \u865a\u6784 / \u4e0d\u9010\u56fe\u91cd\u590d'",
          "  ok('\u7edf\u4e00\u58f0\u660e\u4e0d\u518d\u542b AI \u751f\u6210', !footerNote.includes('AI \u751f\u6210'));\n"
          "  ok('\u7edf\u4e00\u58f0\u660e\u4ecd\u542b \u865a\u6784 / \u4e0d\u9010\u56fe\u91cd\u590d', footerNote.includes('\u865a\u6784') && footerNote.includes('\u4e0d\u9010\u56fe\u91cd\u590d'));")
print("DONE")
