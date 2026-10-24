# smallfigure.com

每个人都有自己的故事，就像 smallfigure 里的每个小人。

原创小人图鉴：把老张、果克星人、女工程师这些**单体小人**的图分门别类放上网，
支持**分类浏览、尺寸筛选、名称搜索、大图下载、下载热度计数**。
smallfigure = 小人的图。

线上地址：https://smallfigure.com （Cloudflare Pages 托管）

## 收录内容

| 分类 | 内容 |
|---|---|
| 人物立绘 | 老张（立绘 + 原图）、果克星人（立绘 + 原图）、女工程师立绘 |
| 小徽章 | 低音核 / 晶铃 / 等离子 三枚霓虹线稿徽章 |

只收单体小人和小徽章；动画帧、游戏截图、封面、背景一律不上站。

## 功能

- **分类**：人物立绘 / 小徽章
- **搜索**：名称、简介、标签实时匹配（如「老张」「透明」「徽章」），按 `/` 快速聚焦
- **尺寸筛选**：≤400px / 401–800px / 801–1600px / >1600px 四档
- **排序**：默认 / 尺寸 / 体积 / 名称
- **灯箱**：大图 + 元数据 + 标签 + 下载，支持 ←/→ 切换、ESC 关闭
- **登录后下载**：下载需注册登录（邮箱 + 密码，PBKDF2 加盐哈希 + httpOnly 会话 Cookie，30 天）。
  未登录点下载会弹登录/注册窗，登录成功后自动补下载；卡片大图和灯箱图拦右键另存与拖拽保存
- **下载计数**：每张图的后台下载次数存在 Cloudflare D1，**满 100 次才在卡片右上角和灯箱里亮出计数**
  （`↓ 137` 金色徽章 / 「下载次数 137 次」）。不到 100 次只统计、不展示
- **背景音乐**：默认开启（浏览器拦截自动播放时，访客首次点页面即响起），右下角圆形按钮随时开关，
  选择记在 localStorage，刷新不丢
- **中英双语**：顶栏（及灯箱内）一键切换全站文案，默认跟随浏览器语言，选择记在 localStorage。
  界面文案在 `i18n.js` 字典里，图片的中英文名/简介/分类标签在 `data/images.json`（`nameEn`/`descEn`/`categoryLabelEn`），
  搜索时中英文关键词都能命中

## 目录结构

```
├── index.html / styles.css / app.js   # 站点本体（零依赖原生三件套）
├── i18n.js                            # 中英双语字典 + 语言切换（须在 app.js 前加载）
├── functions/api/                     # Pages Functions：下载计数 + 用户认证后端
│   ├── counts.js                      #   GET  /api/counts        全量计数
│   ├── download/[id].js               #   POST /api/download/:id  自增并返回最新值（需登录）
│   └── auth/                          #   注册 / 登录 / 注销 / me / stats
│       ├── register.js                #   POST /api/auth/register
│       ├── login.js                   #   POST /api/auth/login
│       ├── logout.js                  #   POST /api/auth/logout
│       ├── me.js                      #   GET  /api/auth/me       当前登录用户
│       └── stats.js                   #   GET  /api/auth/stats    注册统计（需 X-Admin-Token）
├── functions/_lib/auth.js             # 认证共享库：PBKDF2 哈希 / 会话 / 限流
├── migrations/                        # D1 建表脚本（按序号执行）
│   ├── 0001_init.sql                  #   downloads 表
│   └── 0002_auth.sql                  #   users / sessions / user_downloads
├── wrangler.toml                      # Pages 项目配置 + D1 绑定（DB）
├── data/images.json                   # 素材元数据（构建产物）
├── assets/img/
│   ├── hero_bg.webp                   # 主页宣传横幅背景（桌面 2400×860， tools/make_hero_bg.py 产出）
│   ├── hero_bg_m.webp                 # 主页宣传横幅背景（移动 1100×1180）
│   ├── full/                          # 站内大图（最长边 1024，PNG）
│   └── thumbs/                        # 网格缩略图（最长边 400，WebP）
├── assets/audio/bgm.mp3               # 背景音乐（Meditation · Arulo，Mixkit 免费曲库）
├── processed/                         # 人物透明立绘：character-art 技能脚本从 AI 原图重抠
├── originals/                         # ★ AI 生成的原图片，本地单独存放，不发布
├── tools/build_assets.py              # 素材构建脚本（可重复跑，幂等）
├── tools/sync_site.sh                 # 同步站点文件进 _site
├── tools/deploy.sh                    # 一键部署（同步 + wrangler pages deploy）
└── .gitignore                         # 忽略 originals/、_site/、临时预览图
```

## 本地开发

```bash
# 带计数后端的本地预览（Pages Functions + 本地 D1）
npx wrangler pages dev _site --port 8788
# 打开 http://127.0.0.1:8788

# 纯静态预览（计数接口不可用，徽章不显示，不影响浏览）
python -m http.server 8080
```

## 重新构建素材

改了 `processed/` 或 game-ball1 里的图之后，重跑一次构建脚本即可更新全站图片与元数据：

```bash
python tools/build_assets.py
```

脚本会：复制原图到 `originals/` → 生成大图/缩略图 → 重写 `data/images.json`。
清单在脚本顶部的 `ITEMS` 里，加小人就往里加一行；`processed/` 开头表示用站点自己的重抠版。

## 部署（Cloudflare Pages）

```bash
# 一键：同步 _site → 直传部署（含 Functions）
bash tools/deploy.sh

# 手动等价操作：
bash tools/sync_site.sh
npx wrangler pages deploy _site --project-name=smallfigure --branch=main
```

下载计数依赖 D1 数据库 `smallfigure_downloads`（已在 wrangler.toml 绑定为 `DB`），
建表语句在 `migrations/0001_init.sql`（downloads）与 `migrations/0002_auth.sql`（users / sessions / user_downloads）；
换账号/换库时改 wrangler.toml 里的 `database_id` 并按序号重跑：

```bash
npx wrangler d1 execute smallfigure_downloads --remote --file migrations/0001_init.sql
npx wrangler d1 execute smallfigure_downloads --remote --file migrations/0002_auth.sql
```

自定义域名 `smallfigure.com` 与 `www.smallfigure.com` 均已绑定（Cloudflare DNS CNAME → smallfigure.pages.dev，
已 proxied，SSL 自动签发）。当前状态：线上 https://smallfigure.com 与 https://www.smallfigure.com 正常运行。

## 登录门控与用户统计

下载动作需注册登录，链路全在 Pages Functions + D1（`functions/api/auth/*`，共享库 `functions/_lib/auth.js`）：

- 密码 PBKDF2-SHA256 加盐哈希（默认 5000 次迭代，适配 Workers 免费档 10ms CPU；可用
  `npx wrangler pages secret put PBKDF2_ITER --project-name=smallfigure` 调高，付费档建议 120000）
- 会话：32 字节随机令牌，httpOnly + SameSite=Lax Cookie（https 下自动加 Secure），
  库里只存 SHA-256 哈希，有效期 30 天，退出即删
- 注册/登录按 IP 内存限流（注册 5 次/小时、登录 10 次/分钟， isolate 重建即重置）
- 下载计数三路落库：全局 `downloads`、用户归属 `user_downloads`、`users.download_count`

注册用户统计（只读，需管理员令牌）：

```bash
# 设置管理员令牌（一次性，设置后接口才开启）
npx wrangler pages secret put ADMIN_TOKEN --project-name=smallfigure
# 查询
curl -H "X-Admin-Token: <令牌>" https://smallfigure.com/api/auth/stats
```

返回注册总数 / 今日新增 / 近 7 日新增 / 有下载行为的用户数 / 用户下载总次数 / 最近 20 个注册用户。
未登录下载、失效会话都会返回 401，前端据此拉起登录弹窗。

全链路回归测试（本地 dev + playwright）：

```bash
npx wrangler pages dev _site --port 8788 --ip 127.0.0.1   # 另一个终端
NODE_PATH=<node workspace>/node_modules node tools/_test_auth_flow.js
```

覆盖：匿名态入口 / 下载按钮引导 / 未登录拦截 / 注册 / 登录后补下载 / 右键拦截 / 已登录下载 / 退出。
注意注册限流 5 次/小时，复跑前先重启 dev 服务。

> 说明：卡片与灯箱里的图仍是公开静态文件（浏览体验所需），右键防护与登录门控挡的是「顺手保存」，
> 无法阻止从浏览器网络面板直接取图；如需彻底保护，得把大图改走签名 URL 后端代理（会牺牲浏览体验，暂未做）。

## 主页宣传横幅

首页顶部是一条宣传横幅：背景图 `assets/img/hero_bg.webp`（桌面 2400×860）/
`assets/img/hero_bg_m.webp`（移动 1100×1180），用站内原创小人拼成「夜空收集册」构图——
老张、果克星人、巫女、徽章、小动物们都出镜，底部渐隐进页面底色，和下方素材网格无缝衔接。
横幅文字（标题 / 简介 / 数据胶囊 / 按钮）不烤进图里，由 `index.html` 的 `.hero` 区块负责，
文案走 `i18n.js` 字典，中英切换不掉链子。

改图：编辑 `tools/make_hero_bg.py` 顶部的 `DESKTOP` / `MOBILE` 布局表
（文件名, 横坐标, 纵坐标, 高度, 旋转, 透明度，均为画幅比例），重跑：

```bash
python tools/make_hero_bg.py
```

会同时更新站点 webp 与 `originals/hero/` 下的 PNG 母版（本地存档，不进仓库）；
`alien.png` 这类白底原图会在生成时自动裁底（副本缓存于 `originals/hero/cut/`），不动站点文件。

## 背景音乐

曲目 **Meditation**（作者 Arulo，1:58），来自 Mixkit 免费曲库，Mixkit Stock Music Free License：
允许在网站公开播放、免署名、可商用（不得用于 CD/电视广播/游戏）。源文件：
`https://assets.mixkit.co/music/441/441.mp3`（曲目页 `https://mixkit.co/free-stock-music/meditation-441/`）。
换曲子：下载新 mp3 覆盖 `assets/audio/bgm.mp3`，重新部署即可，代码零改动。

代码仓库：GitHub 仓库 `ugo2000/smallfigure.com`（建库后由 AI 通过 connector 全量推送）。

## 素材来源与授权

- 老张 / 果克星人 / 女工程师立绘与徽章：均为原创角色，非真实人物肖像，可自由分发。
- AI 生成的原图片在本地 `originals/` 单独存档，不随网站发布（详见目录结构说明）。
