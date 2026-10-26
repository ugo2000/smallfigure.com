# -*- coding: utf-8 -*-
"""「旧时百工」批次：统一去投影 + 抠图（在原图层面做）。

背景：AI 画的脚下投影是带 halftone 网点的柔和椭圆，抠图时网点芯切断洪水通道，
抠完只剩一片浅色碎斑（3 号最明显），或一整块脏椭圆（8 号）。
站内其它素材（老张、果克星人、公仔）以纯人物无投影为准，故本批次统一抹掉投影。

做法（在 RGB 原图上做，抠图之前）：
  ① 取边框中位数当纸底色 ref
  ② 底部带（y > 85.5%）内「比纸底暗、比主体亮」的像素（色距 20~132）整体改写成 ref
     —— 主体像素色距普遍 >132（深色墨线/衣料/靴子），天然被排除
  ③ 改写后等于纯纸底，标准抠图自然把它当背景清掉

用法：python tools/_trades_noshadow.py 1 2 3 4 5 6 7 8
"""
import os
import subprocess
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUT = 'C:/Users/Administrator/.workbuddy/skills/character-art/scripts/advanced_cutout.py'

# (原图相对路径, 定版输出名)
BATCH = {
    '1': ('originals/trades/01/Full_body_character_illustrati_2026-10-26T08-09-55.png', 'trades-1.png'),
    '2': ('originals/trades/02b/Full_body_character_illustrati_2026-10-26T08-13-38.png', 'trades-2.png'),
    '3': ('originals/trades/03b/Full_body_character_illustrati_2026-10-26T08-13-57.png', 'trades-3.png'),
    '4': ('originals/trades/04/Full_body_character_illustrati_2026-10-26T08-11-10.png', 'trades-4.png'),
    '5': ('originals/trades/05/Full_body_character_illustrati_2026-10-26T08-11-31.png', 'trades-5.png'),
    '6': ('originals/trades/06/Full_body_character_illustrati_2026-10-26T08-11-52.png', 'trades-6.png'),
    '7': ('originals/trades/07/Full_body_character_illustrati_2026-10-26T08-12-13.png', 'trades-7.png'),
    '8': ('originals/trades/08/Full_body_character_illustrati_2026-10-26T08-12-34.png', 'trades-8.png'),
}


def erase_shadow(src, dst, band=0.855, lo=20, hi=132):
    im = Image.open(os.path.join(ROOT, src)).convert('RGB')
    arr = np.array(im).astype(np.float32)
    H, W, _ = arr.shape
    edge = np.concatenate([arr[0], arr[-1], arr[:, 0], arr[:, -1]], axis=0)
    ref = np.median(edge, axis=0)
    dist = np.sqrt(((arr - ref) ** 2).sum(axis=2))

    zone = np.zeros((H, W), bool)
    zone[int(H * band):, :] = True

    target = zone & (dist >= lo) & (dist < hi)
    out = arr.copy()
    out[target] = ref
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(dst)
    return int(target.sum())


if __name__ == '__main__':
    os.chdir(ROOT)
    for key in sys.argv[1:]:
        src, out = BATCH[key]
        raw = os.path.join('processed', '_trades_raw_%s.png' % key)
        n = erase_shadow(src, raw)
        subprocess.run([sys.executable, CUT, raw, os.path.join('processed', out)],
                       check=True, stdout=subprocess.DEVNULL)
        print('trades-%s 抹投影 %6d px  ->  %s' % (key, n, out))
