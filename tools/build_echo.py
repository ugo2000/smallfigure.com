# -*- coding: utf-8 -*-
"""Build Smallfigure: Echo Museum deliverables.

Usage: python tools/build_echo.py
Outputs (outputs/):
  smallfigure-echo-museum.zip         YouTube Playables build (official SDK)
  smallfigure-echo-museum-web.zip     itch.io / self-host build (zero external requests)
  smallfigure-echo-museum-poki.zip    Poki build (official PokiSDK)
Also writes the self-hosted production page into _site/echo/.

All three zips share echo.js / levels.js / style.css / sprites; only index.html differs.
"""
import re
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAME = ROOT / "game-echo"
OUT = ROOT / "outputs"
OUT.mkdir(parents=True, exist_ok=True)
SELFHOST = ROOT / "_site" / "echo"
STEM = "smallfigure-echo-museum"

SDK_YT = '<script src="https://www.youtube.com/game_api/v1"></script>'
SDK_POKI = '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>'
ANCHOR = '<link rel="stylesheet" href="style.css">'

PORTALS = {
    "": ("YouTube Playables build: official SDK loaded before any game code.", SDK_YT),
    "web": ("Web / itch.io build: zero external requests, no platform SDK.", ""),
    "poki": ("Poki build: official PokiSDK script, loaded before any game code.", SDK_POKI),
}

# Self-host footer: cross-links to the other game and privacy. itch/YouTube/Poki zips
# get a stripped footer so the package has literally zero outbound URLs.
FOOTER_FULL = (
    '<footer class="brandbar"><span>© 2026 smallfigure.com</span><span class="dot">·</span>'
    '<a href="privacy.html" data-t="privacy">PRIVACY</a><span class="dot">·</span>'
    '<a href="https://smallfigure.com/game/" target="_blank" rel="noopener" data-t="otherGame">ALSO: MERGE MUSEUM</a></footer>'
)
FOOTER_PACK = (
    '<footer class="brandbar"><span>© 2026 smallfigure.com</span>'
    '<span data-t="brandTag">ORIGINAL TINY FOLKS · ECHOES &amp; ROOMS</span></footer>'
)


def game_files():
    files = [GAME / "style.css", GAME / "echo.js", GAME / "levels.js", GAME / "favicon.webp"]
    sprites = sorted((GAME / "sprites").glob("*.webp"))
    if len(sprites) != 11:
        raise SystemExit(f"sprite count {len(sprites)} != 11")
    for f in files + sprites:
        if not f.exists():
            raise SystemExit(f"missing file: {f}")
    return files + sprites


def html_for(suffix):
    src = (GAME / "index.html").read_text(encoding="utf-8")
    if ANCHOR not in src:
        raise SystemExit("index.html: SDK anchor not found")
    comment, sdk = PORTALS[suffix]
    injected = ("<!-- " + comment + " -->\n" + sdk + "\n" if sdk else "<!-- " + comment + " -->\n") + ANCHOR
    html = src.replace(ANCHOR, injected)
    # zips must be self-contained: drop nav links from the footer
    html = re.sub(r'<footer class="brandbar">.*?</footer>', FOOTER_PACK, html, flags=re.S)
    return html


def selfhost_html():
    src = (GAME / "index.html").read_text(encoding="utf-8")
    return re.sub(r'<footer class="brandbar">.*?</footer>', FOOTER_FULL, src, flags=re.S)


def build_zip(suffix, html_text, files):
    name = STEM + ("-" + suffix if suffix else "") + ".zip"
    dst = OUT / name
    with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        z.writestr("index.html", html_text)
        for f in files:
            arc = "sprites/" + f.name if f.parent.name == "sprites" else f.name
            z.write(f, arc)
    return dst


def build_selfhost(files):
    SELFHOST.mkdir(parents=True, exist_ok=True)
    (SELFHOST / "sprites").mkdir(exist_ok=True)
    for p in (SELFHOST / "sprites").glob("*"):
        if p.is_file():
            p.unlink()
    html = selfhost_html()
    (SELFHOST / "index.html").write_text(html, encoding="utf-8")
    for f in files:
        dst = (SELFHOST / "sprites" / f.name) if f.parent.name == "sprites" else (SELFHOST / f.name)
        shutil.copy2(f, dst)
    shutil.copy2(GAME / "privacy.html", SELFHOST / "privacy.html")
    return SELFHOST / "index.html"


def main():
    files = game_files()
    htmls = {suffix: html_for(suffix) for suffix in PORTALS}
    for suffix, html in htmls.items():
        z = build_zip(suffix, html, files)
        with zipfile.ZipFile(z) as f:
            body = f.read("index.html").decode("utf-8")
            scripts = re.findall(r'<script[^>]+src="(https?://[^"]+)"', body)
            urls = re.findall(r'https?://[^\s"\'<>]+', body)
        label = suffix or "youtube"
        print(f"{label:<8} {z.name:<44} {z.stat().st_size / 1024:>6.0f} KB  SDK: {scripts[0] if scripts else 'none'}")
        if suffix == "web" and urls:
            raise SystemExit(f"web build still contains external URLs: {urls}")
        # check every packed file for accidental external resource URLs
        with zipfile.ZipFile(z) as f:
            for n in f.namelist():
                if n.endswith((".js", ".css", ".html")):
                    txt = f.read(n).decode("utf-8", "ignore")
                    bad = re.findall(r'(?:src|href)\s*=\s*["\']https?://[^"\']+', txt)
                    if suffix == "web" and bad:
                        raise SystemExit(f"web build {n} has external resource: {bad}")
    sh = build_selfhost(files)
    print(f"\nself-host: {sh}  (served at smallfigure.com/echo/)")
    print("\nAll zips use root index.html. Run each platform's own Test Suite / Inspector before submitting.")


if __name__ == "__main__":
    main()
