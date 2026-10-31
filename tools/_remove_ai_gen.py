#!/usr/bin/env python3
# 移除所有图像上的「生成方式: AI 生成」披露（数据与模板层）
import io, sys

FILES = {
    "data/images.json": [
        ('"desc": "本站看板小人：棕夹克工装男，AI 生成后抠成"',
         '"desc": "本站看板小人：棕夹克工装男，抠成透明 PNG"'),
        ('"descEn": "The mascot of this site: a brown-jacket workwear man, AI-generated and cut out to a"',
         '"descEn": "The mascot of this site: a brown-jacket workwear man, cut out to a transparent PNG"'),
        ('"desc": "AI 原始生成图，浅灰底未抠图（原图在本地备份目录中有留存）"',
         '"desc": "原始图，浅灰底未抠图（原图在本地备份目录中有留存）"'),
        ('"descEn": "Original AI-generated image, light gray background, not cut out (backup kept in originals/)"',
         '"descEn": "Original image, light gray background, not cut out (backup kept in originals/)"'),
        ('"desc": "AI 原始生成图，未抠图"',
         '"desc": "原始图，未抠图"'),
        ('"descEn": "Original AI-generated image, not cut out"',
         '"descEn": "Original image, not cut out"'),
        ('"原创 AI 生成系列（细腻美式漫画风"', '"原创系列（细腻美式漫画风"'),
        ('描述 AI 生成）"', '描述生成）"'),
    ],
    "data/stories.json": [
        ('"zh": "本站看板小人老张，棕夹克、工装裤，AI 生成后抠成透明 PNG。',
         '"zh": "本站看板小人老张，棕夹克、工装裤，抠成透明 PNG。'),
    ],
    "tools/build_assets.py": [
        ('"原创 AI 生成系列（细腻美式漫画风，', '"原创系列（细腻美式漫画风，'),
        ('描述 AI 生成）"', '描述生成）"'),
        ('"desc_zh": "本站看板小人：棕夹克工装男，AI 生成后抠成透明 PNG，512×512"',
         '"desc_zh": "本站看板小人：棕夹克工装男，抠成透明 PNG，512×512"'),
        ('"desc_en": "The mascot of this site: a brown-jacket workwear man, AI-generated and cut out to a transparent PNG, 512×512"',
         '"desc_en": "The mascot of this site: a brown-jacket workwear man, cut out to a transparent PNG, 512×512"'),
        ('"desc_zh": "AI 原始生成图，浅灰底未抠图（原图在本地备份目录中有留存）"',
         '"desc_zh": "原始图，浅灰底未抠图（原图在本地备份目录中有留存）"'),
        ('"desc_en": "Original AI-generated image, light gray background, not cut out (backup kept in originals/)"',
         '"desc_en": "Original image, light gray background, not cut out (backup kept in originals/)"'),
        ('"desc_zh": "AI 原始生成图，未抠图"', '"desc_zh": "原始图，未抠图"'),
        ('"desc_en": "Original AI-generated image, not cut out"',
         '"desc_en": "Original image, not cut out"'),
    ],
}

for path, repls in FILES.items():
    with io.open(path, "r", encoding="utf-8") as f:
        s = f.read()
    for old, new in repls:
        c = s.count(old)
        if c != 1:
            print("WARN %s: %r matched %d times (expected 1)" % (path, old[:40], c))
        s = s.replace(old, new)
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(s)
    print("OK   %s (%d replacements)" % (path, len(repls)))
print("DONE")
