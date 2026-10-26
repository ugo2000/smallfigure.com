# -*- coding: utf-8 -*-
"""「旧时百工」批次抠图管线（character-art 技能脚本）

复用 skills/character-art/scripts/advanced_cutout.py 的默认路径：
  标准抠图(tol 55) → 封闭背景口袋自动填充 → 同色残留清扫
水印统一在右下角，用 --remove-spots 区域内的孤立小块清理。

用法：
    python tools/_trades_cut.py
"""
import os
import subprocess
import sys

PY = sys.executable
CUT = 'C:/Users/Administrator/.workbuddy/skills/character-art/scripts/advanced_cutout.py'
PREV = 'C:/Users/Administrator/.workbuddy/skills/character-art/scripts/preview_on_bg.py'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# (原图相对路径, 定版输出名, 水印所在角)
BATCH = [
    ('originals/trades/01/Full_body_character_illustrati_2026-10-26T08-09-55.png', 'trades-1.png'),
    ('originals/trades/02b/Full_body_character_illustrati_2026-10-26T08-13-38.png', 'trades-2.png'),
    ('originals/trades/03b/Full_body_character_illustrati_2026-10-26T08-13-57.png', 'trades-3.png'),
    ('originals/trades/04/Full_body_character_illustrati_2026-10-26T08-11-10.png', 'trades-4.png'),
    ('originals/trades/05/Full_body_character_illustrati_2026-10-26T08-11-31.png', 'trades-5.png'),
    ('originals/trades/06/Full_body_character_illustrati_2026-10-26T08-11-52.png', 'trades-6.png'),
    ('originals/trades/07/Full_body_character_illustrati_2026-10-26T08-12-13.png', 'trades-7.png'),
    ('originals/trades/08/Full_body_character_illustrati_2026-10-26T08-12-34.png', 'trades-8.png'),
]


def main():
    os.chdir(ROOT)
    for src, out in BATCH:
        if not os.path.exists(src):
            print('  [缺失]', src)
            sys.exit(1)
        outp = os.path.join('processed', out)
        r = subprocess.run([PY, CUT, src, outp], capture_output=True, text=True)
        sys.stdout.write(r.stdout)
        if r.returncode != 0:
            sys.stdout.write(r.stderr)
            sys.exit(1)
        prev = os.path.join('processed', '_prev_' + out.replace('.png', '') + '.png')
        subprocess.run([PY, PREV, outp, prev, '--checker'], stdout=subprocess.DEVNULL)
        print('  ->', out, '| 预览', prev)


if __name__ == '__main__':
    main()
