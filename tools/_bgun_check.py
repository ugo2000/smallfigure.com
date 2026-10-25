# 量化检查：主体不透明占比 + 贴深色底 contact sheet
import sys, os
from PIL import Image

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src_dir = "tools/_cut"
names = ["bgun-%d" % i for i in range(1, 7)]

tiles = []
for n in names:
    p = os.path.join(src_dir, n + ".png")
    im = Image.open(p).convert("RGBA")
    a = im.getchannel("A")
    data = list(a.getdata())
    opaque = sum(1 for v in data if v >= 250)
    semi = sum(1 for v in data if 0 < v < 250)
    total = len(data)
    print(f"{n}: {im.size[0]}x{im.size[1]} 不透明 {opaque/total*100:.1f}% 半透明 {semi/total*100:.1f}%")

    bg = Image.new("RGBA", im.size, (14, 22, 46, 255))
    bg.alpha_composite(im)
    tiles.append(bg.convert("RGB").resize((360, 360), Image.LANCZOS))

sheet = Image.new("RGB", (360 * 3, 360 * 2), (14, 22, 46))
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % 3) * 360, (i // 3) * 360))
sheet.save(os.path.join(src_dir, "_bgun_sheet_dark.png"))
print("sheet saved")
