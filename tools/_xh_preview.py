# -*- coding: utf-8 -*-
"""本轮 6 张异星猎食素材的验收预览（拼图，无视觉依赖也能自查）。

输出两张 3×2 拼图：
  _xh_sheet_dark.png   抠图成品贴深色底（看边缘白边/背景残留）
  _xh_sheet_mark.png   同一批图，口袋候选区染红（判断是真口袋还是生物本体）
"""
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, 'C:/Users/Administrator/.workbuddy/skills/character-art/scripts')
from advanced_cutout import closed_light_blocks, median_border  # noqa: E402

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAMES = ['xeno-prism-stalker', 'xeno-rib-lurker', 'xeno-mycelial-weaver',
         'flora-pulse-pod', 'flora-gland-stake', 'xeno-strike-scene']
CELL = 520
BG = (24, 26, 34)


def over(bg, fg, alpha):
    a = alpha[..., None].astype(np.float32) / 255.0
    return (fg.astype(np.float32) * a + bg.astype(np.float32) * (1 - a)).astype(np.uint8)


def main():
    dark = Image.new('RGB', (CELL * 3, CELL * 2), BG)
    mark = Image.new('RGB', (CELL * 3, CELL * 2), BG)
    for idx, n in enumerate(NAMES):
        cut = Image.open(os.path.join(BASE, 'processed', n + '_t.png')).convert('RGBA')
        cut = cut.resize((CELL, CELL), Image.LANCZOS)
        a = np.array(cut)
        comp = over(np.array(Image.new('RGB', (CELL, CELL), BG)), a[:, :, :3], a[:, :, 3])

        # 口袋候选（在 1024 原图上算，再缩到格子）
        raw = np.array(Image.open(os.path.join(BASE, 'originals', 'raw',
                                               n + '_raw.png')).convert('RGB')).astype(np.float32)
        pk = closed_light_blocks(raw, median_border(raw), 32, 800, 6.5)
        pks = np.array(Image.fromarray((pk * 255).astype(np.uint8)).resize(
            (CELL, CELL), Image.NEAREST)) > 127

        m = comp.copy().astype(np.float32)
        if pks.any():
            m[pks] = m[pks] * 0.35 + np.array([255, 40, 40], dtype=np.float32) * 0.65

        x, y = (idx % 3) * CELL, (idx // 3) * CELL
        dark.paste(Image.fromarray(comp), (x, y))
        mark.paste(Image.fromarray(m.astype(np.uint8)), (x, y))

    dark.save(os.path.join(BASE, 'processed', '_xh_sheet_dark.png'))
    mark.save(os.path.join(BASE, 'processed', '_xh_sheet_mark.png'))
    print('已输出 _xh_sheet_dark.png / _xh_sheet_mark.png')


if __name__ == '__main__':
    main()
