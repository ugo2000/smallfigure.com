# Smallfigure: Echo Museum · 回声博物馆

第二个小游戏。**不是合成，不是三消，不是跑酷。**

一句话机制：你走过的每一步都被记下来；按「定格」把这一趟路变成一个会同步重放、走完就停住的**回声**；门只有在所有压力板都被踩住时才开——所以你得造一个过去的自己站在板上，再让现在的自己穿过去。

核心操作是 **WAIT（等一等）**：你不动，回声继续往前走。在一个所有游戏都催你动的地方，这个奖励你站着不动。

- 线上：https://smallfigure.com/echo/
- 10 关，中英双语，竖屏 420 宽，纯 JS，零外部请求，无账号、无广告插屏、无倒计时
- 11 个原创小人（复用 `smallfigure.com` 的插画），每通一关唤醒一个，附一句性格注脚
- 可选碎片收集，全收集算「完美通关」

## 关卡与验证

地图和纯逻辑在 `levels.js`，`EchoCore` 同时供浏览器和 Node 使用。每关都带一份**参考解** `sol`，因此可以随时机器验证，不靠肉眼猜：

```bash
node tools/verify_echo_levels.js              # 10 关地图完整性 + 参考解真的能通关
node tools/test_echo_browser.js               # 浏览器：菜单 / 第 1 关 / 定格机制 / 中文 / 零外链
node tools/test_echo_all_levels.js            # 浏览器：自动走完全部 10 关
node tools/verify_echo_live.js                # 线上生产域名、真实访客视角
```

`test_echo_browser.js` / `test_echo_all_levels.js` 需要一个本地静态服务：

```bash
cd _site && python -m http.server 8899 --bind 127.0.0.1
```

地图字符：`#` 墙 / `.` 地板 / `S` 起点 / `E` 出口 / `P` 压力板 / `D` 门 / `*` 碎片。统一 8 列 × 10 行。

## 构建

```bash
python tools/build_echo.py
```

产出：

| 文件 | 用途 |
|---|---|
| `outputs/smallfigure-echo-museum.zip` | YouTube 游戏大本营（含官方 SDK） |
| `outputs/smallfigure-echo-museum-web.zip` | itch.io / 自托管（零外部请求） |
| `outputs/smallfigure-echo-museum-poki.zip` | Poki（含官方 PokiSDK） |
| `_site/echo/` | 生产自托管页面 |

三个包共用 `echo.js` / `levels.js` / `style.css` / 11 张 sprite，只差 `index.html` 的一行 SDK。打包版会剥掉页脚导航链接，保证包内 literally 零外链；自托管版才保留隐私页和「另一个游戏」入口。

构建脚本会自己校验 web 包没有外部 URL。

## 操作

| 动作 | 键盘 | 触屏 |
|---|---|---|
| 移动 | ↑↓←→ / WASD | 方向键 / 在棋盘上滑动 |
| 等一拍（让回声先走） | 空格 | WAIT |
| 定格，留下一个回声 | F | FREEZE |
| 撤销一步 | Z | UNDO |
| 重置本关（清空所有回声） | R | RESET |
| 提示 | H | HINT |

## 部署

```bash
python tools/build_echo.py
cp -f _headers index.html i18n.js _site/
node tools/build_item_pages.mjs && node tools/build-seo.mjs
node <wrangler>/bin/wrangler.js pages deploy _site --project-name=smallfigure --branch=main --commit-dirty=true
```

`_headers` 必须给 `/echo/*.js` / `*.css` / `*.html` 写 `max-age=0, must-revalidate`。Cloudflare Pages 默认给静态资源 4 小时缓存，不写就会改完几小时才生效；而且**通配 `/echo/*` 不可靠，要写显式扩展名规则**（这是上一个游戏踩过的坑）。

部署完务必对新部署 URL 做健康检查（`/echo/echo.js`、`/echo/levels.js`、`/echo/privacy`、`/echo/` 都得 200），再验生产域名。Pages 有 pretty-URL，`/echo/privacy.html` 会 308 跳到 `/echo/privacy`，测后者才准。
