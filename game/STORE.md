# Store kit · Smallfigure: Merge Museum

按拍板的路线：先投网页游戏门户验证留存，再拿数据去谈 YouTube 游戏大本营 / 发行伙伴。
素材全部备齐，**账号注册、签协议、上传、收款信息由 U 哥本人操作**，AI 不碰凭证。

## 三个包，同一份游戏

| 文件（outputs/） | 用在哪 | index.html 里的差别 |
|---|---|---|
| `smallfigure-merge-museum.zip` | YouTube 游戏大本营提交版 | 官方 `ytgame` SDK |
| `smallfigure-merge-museum-web.zip` | itch.io / 自托管 / 送审试玩 | 零外部请求，无任何 SDK |
| `smallfigure-merge-museum-poki.zip` | Poki | 官方 PokiSDK v2 |

`game.js` 里有一层平台适配，自动识别宿主注入的 SDK（YouTube / Poki / CrazyGames），
没有 SDK 时广告按钮自动隐藏、进度走 localStorage。加第四个平台只需在 `tools/build_game.py`
的 `PORTALS` 里加一行 script，玩法代码一行不用改。

封面：`outputs/cover-1200x630.png`（横版 / OG / Poki）、`outputs/cover-630x500.png`（itch.io）。
截图：`outputs/game-menu.png`、`outputs/game-play.png`、`outputs/game-collection.png`。

## 英文商店文案（可直接复制）

**Title**：Smallfigure: Merge Museum

**Tagline**：Drop. Merge. Collect 11 original tiny folks.

**Short description**（<150 字符）：
A cozy merge puzzle built from 11 hand-drawn characters. Drop a tiny folk, merge two of a kind, and fill the encyclopedia before the pile tops out.

**Long description**：
Smallfigure: Merge Museum is a small, calm merge puzzle made from the original character art of smallfigure.com. Every piece has a story: a crystal bell that only rings for lost things, a flame imp keeping a candle as a pet, an alien gentleman dressed for a dinner party on a planet that no longer exists.

Drop a character from the top of the board. Two of the same kind merge into the next, stranger character. Chain merges for combo bonuses, unlock all 11 entries in the museum, and try not to let the pile cross the red line.

No installs, no accounts, no timers, no energy. Just one more try.

**How to play**：Move / drag to aim. Tap or click to drop. On a keyboard, use ← → and SPACE. Two identical characters merge on contact.

**Features**：
- 11 merge levels, each an original illustrated character with a short story
- Collection museum with unlockable entries
- Combo scoring, personal best, saved progress
- Portrait-first layout that works on phones, tablets and desktop
- English by default, Chinese available with one tap
- Under 150 KB, loads instantly, zero external assets

**Tags**：merge, puzzle, casual, html5, browser, singleplayer, collection, cute, portrait, no-install, family

**Languages**：English (default) · 中文 (optional in-game toggle, remembered on this device)

**Credits / license**：Original character art © 2026 smallfigure.com. Built with plain JavaScript; audio synthesised in code. No third-party art or music.

## Privacy Policy（平台要求填 URL 时贴这段）

> **Privacy Policy — Smallfigure: Merge Museum**
> Last updated: 2026-11-13
>
> This game does not collect, store or transmit personal data. There are no accounts, no analytics, no tracking cookies and no advertising trackers of our own. The game makes no external network requests; all art, code and styles are bundled locally, and sound is generated in the browser.
>
> Your progress (best score and unlocked museum entries) and your language choice are saved locally in your browser's localStorage. On YouTube Playables, progress is saved through Google's official Playables cloud-save API instead. None of this data is sent to us.
>
> Platform-provided ads, where enabled, are served by the platform's own SDK under that platform's privacy policy.
>
> Questions: ugo2000@126.com · smallfigure.com

部署后建议挂在 `https://smallfigure.com/game/privacy`，现在**还没部署**。

## 提交顺序与门槛

**1. itch.io（今天就能投，用 web 包）**
新建 project → 上传 `smallfigure-merge-museum-web.zip` → 勾 "This file will be played in the browser" → 嵌入尺寸 420 × 868、勾 mobile friendly → 传 630×500 封面 → 分类 Puzzle → 价格 Free 或 Name your own price（可收打赏，itch.io 默认抽 10%，可自调）→ Publish。无审核，即时上线。目的：拿到真实玩家、评论和时长反馈。

**2. Poki（要流量和广告收入，用 poki 包）**
注册 developers.poki.com 拿 game ID → 上传 poki 包 → 用 Poki Inspector（inspector.poki.io）逐项验证 `init` / `gameLoadingFinished` / `gameplayStart` / `gameplayStop` / `commercialBreak` / `rewardedBreak` → 提交 review。
变现完全靠 PokiSDK，未接 SDK 的包上去能玩但不赚钱。签协议前看清楚：默认偏独家（多年），非独家通常是一次性买断。竖屏支持还能额外拿 Gamebar Display 广告。

**3. CrazyGames（QA 最严，需再出一个包）**
注册 developer.crazygames.com，从后台拿当前 SDK script 地址，在 `tools/build_game.py` 的 `PORTALS` 里加 `crazygames` 一项重新构建即可，适配层已经写好自动检测。上传后过 QA。
注意：**Basic Launch 阶段广告是关闭的，没有收入**，Full Launch 才开；且不能有"点了没反应"的激励广告按钮（我们的适配层在无广告环境会直接隐藏它）。技术要求：初始包 ≤ 50 MB（我们 135 KB）、相对路径、Chrome / Edge、到可玩 ≤ 20 秒、竖屏允许带背景条。€100 起月结，独家另有补偿。

**4. YouTube 游戏大本营（youtube 包，最后一步）**
early access 意向表 → 频道管理员权限 → 开发者门户四步 → 官方 Test Suite → IARC 分级。门槛和分成现状见 `game/README.md`。

## 现实提醒

Poki / CrazyGames 的钱来自各自 SDK 的广告，YouTube 的钱来自门户里的广告位（资格分批开放、比例未公开）。
三个平台都不支持内购。所以顺序是：itch.io 先验玩法 → Poki / CrazyGames 跑留存和 eCPM → 拿着数据去谈 YouTube 或发行伙伴。
**当前状态：本地文件已备齐，未部署线上，未提交 git，未在任何平台注册或上传。**
