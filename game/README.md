# Smallfigure: Merge Museum

把 smallfigure.com 的原创小人做成的一个可玩的 HTML5 合成游戏原型。
**结论先说：游戏能做出来，但 YouTube 游戏大本营（Playables）不能像传视频一样自助上架，也不能"上架就赚钱"。**

## 玩法

顶部放下一个小人，两个同级的碰到一起就合成下一级，一共 11 级：
晶铃 → 火苗小鬼 → 豚骨拉面 → 羽衣仙童 → 外卖骑手 → 红斗篷女孩 → 维多利亚绅士 → 弯角杂货巨人 → 女工程师 → 果克星人 → 老张。
堆过红线 1.8 秒就结束；解锁的角色进图鉴，可点开看名字和一句小故事。有连击、最高分、云存档、失败续命（仅在有广告 SDK 的平台显示）。
**默认英语**；菜单底部「切换为中文」或右下角 EN 按钮可切中文，选择只记在本机，不进云存档。

## 本地跑

```bash
python tools/make_game_sprites.py   # 生成 11 张紧凑 sprite + favicon（可重复跑）
python tools/make_game_cover.py     # 生成两张上架封面
python tools/build_game.py          # 生成 preview.html + 三个平台 ZIP
python -m http.server 8088 -d game # 浏览器打开 http://127.0.0.1:8088/preview.html
```

`preview.html` 去掉了所有平台 SDK，本地秒开；`index.html` 是 YouTube 提交版。
`outputs/` 下有三个包（YouTube / web / Poki），根目录都是 `index.html`，差别只有一行 SDK script。
英文商店文案、封面、隐私政策与各平台提交步骤见 `game/STORE.md`。

按拍板路线，先投网页游戏门户验证留存，再拿数据谈游戏大本营或发行伙伴；文案、封面、隐私政策与提交步骤见 `game/STORE.md`。

## 上线有两条路

**A. 官方直申（慢，门槛高）**
开发者资格仍是 early access：先填 [Playables 意向调查表](https://docs.google.com/forms/d/e/1FAIpQLSdvdQ0lgIq2369aemj1O6w8R8FwGn9O5ARRGODDDUbVINCRJQ/viewform)，
通过后还要求你有一个「已加入游戏大本营的 YouTube 频道」且具备频道管理员权限，才能进
[开发者门户](https://developers.google.cn/youtube/gaming/playables/developer_portal) 走「详细信息 → 测试 → IARC 年龄分级 → 检查并发布」四步。
排队常以月计。官方 SDK 文档：<https://developers.google.cn/youtube/gaming/playables>

**B. 认证发行伙伴（快，现实）**
Playgama / FRVR / GameDistribution / Mediacube 这类已拿到门户权限的伙伴，替你做 QA 和认证，
常见 2–4 周上线，且非独家：同一个包能同时分发到 YouTube Playables、MSN、TikTok 小游戏、小米等。
代价是伙伴抽成（行业常见 15%–30%，逐家谈），以及要把 `game.js` 里的 `S` 适配层从官方 `ytgame` 换成伙伴的 Bridge SDK。

**赚钱的现实**：门户里前贴片/插页/激励广告默认开启（前贴片不能关），但 Google 未公布统一的 Playables 分成比例，
变现资格在分批开放，IAP、订阅、买断都不支持（官方释放的信号是 2027 年才开始测内购）。
所以别把它当"发布即收钱"。**更稳的顺序**：同一个 ZIP 先投 Poki / CrazyGames / itch.io 验证留存和 eCPM
（CrazyGames 满 €100 月结，GameDistribution 非独家抽净收入 33%，itch.io 即时上架、无审核、可自己定价或收打赏），
拿到「单次时长 / 留存」数据再去申请官方或谈伙伴条件。游戏库目前只有几百款，竞争小，但流量给不给你由 YouTube 说了算。

## 已按官方规范做到的

- 根目录 `index.html`；`https://www.youtube.com/game_api/v1` 在任何游戏代码之前加载
- `firstFrameReady()` 在加载画面、`gameReady()` 在菜单可交互时才调用
- `loadData()` resolve 之后才允许 `saveData()`；`sendScore()` 与存档里的 best 始终一致
- `isAudioEnabled()` / `onAudioEnabledChange()`；YouTube 环境里不显示游戏内全局静音按钮
- `onPause()` / `onResume()` 会停掉整个循环和渲染，**没有**用 Page Visibility API
- 插页广告只在局末自然断点发，不 await、不锁游戏循环；激励广告用 `requestRewardedAd('sfmm-revive-top-row')`
- 零外部请求：无外链字体、无统计、无 CDN 图片；音效是 WebAudio 现场合成
  （特意不用站里 `bgm.mp3`：Mixkit 免费许可明确写了不得用于游戏）
- 竖屏优先、桌面自适应，包体远小于 30 MB 初始限制
- 默认英语，中文是玩家显式选择；偏好只存 localStorage，不进 Playables 云存档（`getLanguage()` 仅作环境参考）
- 平台适配层自动识别 YouTube / Poki / CrazyGames SDK；无广告 SDK 时直接隐藏激励广告按钮

## 提交前还得补

官方 [Test Suite](https://developers.google.cn/youtube/gaming/playables/test_suite) 跑一遍；Poki Inspector 逐项核对 SDK 事件；CrazyGames QA（Basic Launch 阶段广告关闭、无收入）；IARC 年龄分级问卷；
隐私政策、服务条款、支持页与联系邮箱（申请时会查）；各宽高比缩略图；iOS / Android 真机与弱网测试；
以及如果走伙伴渠道，把广告回调按伙伴 SDK 文档核一遍。

素材为 smallfigure.com 原创角色，游戏内保留署名；不要往包里加站外图片。
