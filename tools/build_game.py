# -*- coding: utf-8 -*-
"""生成本地预览页与分平台提交包。

用法：python tools/build_game.py
产出（outputs/）：
  smallfigure-merge-museum.zip         YouTube 游戏大本营提交版（含官方 SDK）
  smallfigure-merge-museum-web.zip     itch.io / 自托管版（零外部请求）
  smallfigure-merge-museum-poki.zip    Poki 版（含官方 PokiSDK）
  game/preview.html                   本地预览版（零外部请求，标题带 Local Preview）

三个包共用同一份 game.js / style.css / sprites，只差 index.html 里的一行 SDK script。
"""
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAME = ROOT / "game"
OUT = ROOT / "outputs"
OUT.mkdir(parents=True, exist_ok=True)
SELFHOST = ROOT / "_site" / "game"

YT_COMMENT = "<!-- YouTube 游戏大本营官方要求：SDK 必须在任何游戏代码之前加载。本地预览版会移除这一行。 -->"
SDK_YT = '<script src="https://www.youtube.com/game_api/v1"></script>'
YT_BLOCK = YT_COMMENT + "\n" + SDK_YT

PORTALS = {
    "": ("YouTube Playables build: official SDK loaded before any game code.", YT_BLOCK),
    "web": ("Web / itch.io build: zero external requests, no platform SDK.", ""),
    "poki": (
        "Poki build: official PokiSDK script, loaded before any game code.",
        '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>',
    ),
}


def game_files():
    files = [GAME / "style.css", GAME / "game.js", GAME / "favicon.webp"]
    sprites = sorted((GAME / "sprites").glob("*.webp"))
    if len(sprites) != 11:
        raise SystemExit(f"sprite 数量不对：{len(sprites)}（应为 11），先跑 tools/make_game_sprites.py")
    return files + sprites


def html_for(suffix):
    src = (GAME / "index.html").read_text(encoding="utf-8")
    if YT_BLOCK not in src:
        raise SystemExit("index.html 里找不到官方 SDK 块，构建中止")
    comment, sdk = PORTALS[suffix]
    replacement = "<!-- " + comment + " -->" + ("\n" + sdk if sdk else "")
    return src.replace(YT_BLOCK, replacement)


def build_preview(web_html):
    out = web_html.replace(
        "<title>Smallfigure: Merge Museum</title>",
        "<title>Smallfigure: Merge Museum · Local Preview</title>",
    )
    dst = GAME / "preview.html"
    dst.write_text(out, encoding="utf-8")
    return dst


BRANDBAR_SRC = (
    '<footer class="brandbar"><span>© 2026 smallfigure.com</span>'
    '<span data-t="brandTag">ORIGINAL TINY FOLKS · MERGE &amp; COLLECT</span></footer>'
)
BRANDBAR_SELFHOST = (
    '<footer class="brandbar"><span>© 2026 smallfigure.com</span>'
    '<a href="privacy.html" data-t="privacy">PRIVACY</a>'
    '<span data-t="brandTag">ORIGINAL TINY FOLKS · MERGE &amp; COLLECT</span></footer>'
)


def build_selfhost(web_html):
    """Emits the production self-host build into _site/game/ (zero external requests,
    proper title, in-footer PRIVACY link). This is what gets served at smallfigure.com/game/."""
    html = web_html
    if "Local Preview" in html:
        html = html.replace(
            "<title>Smallfigure: Merge Museum · Local Preview</title>",
            "<title>Smallfigure: Merge Museum</title>",
        )
    if BRANDBAR_SRC in html:
        html = html.replace(BRANDBAR_SRC, BRANDBAR_SELFHOST)
    SELFHOST.mkdir(parents=True, exist_ok=True)
    for p in SELFHOST.glob("*"):
        if p.is_file():
            p.unlink()
    (SELFHOST / "sprites").mkdir(exist_ok=True)
    for p in (SELFHOST / "sprites").glob("*"):
        p.unlink()
    (SELFHOST / "index.html").write_text(html, encoding="utf-8")
    for f in ["style.css", "game.js", "favicon.webp"]:
        shutil.copy2(GAME / f, SELFHOST / f)
    for sp in sorted((GAME / "sprites").glob("*.webp")):
        shutil.copy2(sp, SELFHOST / "sprites" / sp.name)
    if (GAME / "privacy.html").exists():
        shutil.copy2(GAME / "privacy.html", SELFHOST / "privacy.html")
    return SELFHOST / "index.html"


def build_zip(suffix, html_text, files):
    name = "smallfigure-merge-museum" + ("-" + suffix if suffix else "") + ".zip"
    dst = OUT / name
    with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        z.writestr("index.html", html_text)
        for f in files:
            arc = "sprites/" + f.name if f.parent.name == "sprites" else f.name
            z.write(f, arc)
    return dst


def main():
    files = game_files()
    for f in files:
        if not f.exists():
            raise SystemExit(f"缺少文件：{f}")
    htmls = {suffix: html_for(suffix) for suffix in PORTALS}

    p = build_preview(htmls["web"])
    print(f"本地预览：{p}\n")
    for suffix, html in htmls.items():
        z = build_zip(suffix, html, files)
        label = suffix or "youtube"
        with zipfile.ZipFile(z) as f:
            ext = [u for u in f.read("index.html").decode("utf-8").split() if "src=\"http" in u]
        print(f"{label:<8} {z.name:<42} {z.stat().st_size / 1024:>6.0f} KB  SDK: {ext[0] if ext else 'none'}")
    sh = build_selfhost(htmls["web"])
    print(f"\n自托管：{sh}  （零外部请求，将在 smallfigure.com/game/ 提供）")
    print("\n三个包入口都是根目录 index.html。提交前按目标平台跑对应 Test Suite / Inspector。")


if __name__ == "__main__":
    main()
