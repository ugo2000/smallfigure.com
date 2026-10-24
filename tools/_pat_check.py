# 量化检查：主体不透明占比 + 贴深底 contact sheet
import sys, os
from PIL import Image

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src_dir = "tools/_cut"
names = [f"pat-{i}" for i in range(1, 7)]

tiles = []
for n in names:
    p = os.path.join(src_dir, n + ".png")
    im = Image.open(p).convert("RGBA")
    a = im.getchannel("A")
    px = list(a.getdata())
    opaque = sum(1 for v in px if v >= 250)
    semi = sum(1 for v in px if 0 < v < 250)
    total = len(px)
    print(f"{n}: 尺寸 {im.size[0]}x{im.size[1]} 不透明占比 {opaque/total*100:.1f}% 半透明 {semi/total*100:.1f}%")

    # 贴深蓝底
    bg = Image.new("RGBA", im.size, (14, 22, 46, 255))
    bg.alpha_composite(im)
    t = bg.convert("RGB").resize((340, 340), Image.LANCZOS)
    tiles.append(t)

sheet = Image.new("RGB", (340 * 3, 340 * 2), (14, 22, 46))
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % 3) * 340, (i // 3) * 340))
sheet.save(os.path.join(src_dir, "_pat_sheet_dark.png"))
print("sheet saved")
