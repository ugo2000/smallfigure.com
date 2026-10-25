#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 tools/stories_data.py 的故事文案合并产出 data/stories.json，并报告覆盖率。

用法：python tools/build_stories.py
产物：data/stories.json（站点运行时 fetch 的文件，与 images.json 分离，
      远端素材管线重建 images.json 不会冲掉故事内容）
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from stories_data import CAT_STORIES, ITEM_STORIES  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    img_path = os.path.join(ROOT, 'data', 'images.json')
    with open(img_path, encoding='utf-8') as f:
        images = json.load(f)['images']

    out = {'items': ITEM_STORIES, 'cats': CAT_STORIES}
    out_path = os.path.join(ROOT, 'data', 'stories.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    # 覆盖率报告
    all_ids = {im['id'] for im in images}
    all_cats = {im['category'] for im in images}
    missing_items = sorted(all_ids - set(ITEM_STORIES))
    missing_cats = sorted(all_cats - set(CAT_STORIES))
    stale_items = sorted(set(ITEM_STORIES) - all_ids)      # 故事里有但数据里没了的 id
    stale_cats = sorted(set(CAT_STORIES) - all_cats)

    # 重复查重：素材故事全文（zh）两两比对，防止同分类图点开都是同一段话
    dup = {}
    for sid, v in ITEM_STORIES.items():
        dup.setdefault(v['zh'], []).append(sid)
    dups = {k: v for k, v in dup.items() if len(v) > 1}

    print('[stories] %s 已生成：%d 条素材故事 + %d 条分类故事'
          % (out_path, len(ITEM_STORIES), len(CAT_STORIES)))
    print('[stories] 覆盖率：素材 %d/%d，分类 %d/%d'
          % (len(ITEM_STORIES), len(all_ids), len(CAT_STORIES), len(all_cats)))
    if dups:
        print('[stories] ⚠ 素材故事有重复（每张图必须不同）：')
        for k, v in dups.items():
            print('    %s => %s' % (', '.join(v), k[:40] + '…'))
    else:
        print('[stories] 素材故事零重复（每张图都不同）✓')
    if missing_cats:
        print('[stories] 缺故事的分类：%s' % ', '.join(missing_cats))
    if stale_items:
        print('[stories] ⚠ 故事库有、数据里没有的素材 id（清理或改名了？）：%s' % ', '.join(stale_items))
    if stale_cats:
        print('[stories] ⚠ 故事库有、数据里没有的分类 key：%s' % ', '.join(stale_cats))
    if missing_items:
        print('[stories] 待补故事的素材 %d 件，前 20：%s' % (len(missing_items), ', '.join(missing_items[:20])))


if __name__ == '__main__':
    main()
