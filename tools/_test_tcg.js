/* 回归：TCG 浮动预告窗
 *
 * 覆盖 2026-11-13 修复的一组真实缺陷：
 *   1. assets/tcg/*.png 未入库 → 线上靠 14 小时陈旧缓存显示，重新部署即集体裂图
 *   2. 卡牌是 744×1039 竖版，但 .tcgfw-slide 高度塌成 0、图片不渲染
 *   3. .tcgfw-stage 是 position:static，绝对定位的 slide 脱离容器
 *   4. 浮窗 z-index 99999 远高于灯箱 100，打开灯箱时浮窗仍压在内容上
 *   5. 浮窗固定在左下角，滚动到图库后压住素材卡片，导致卡片点不开
 *   6. FAB 与右下角音乐按钮 / 回到顶部按钮位置重叠
 *   7. CTA 按钮跳 /tcg，而该页面不存在 → 死链 404
 */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe';
const BASE = process.env.SF_BASE || 'http://127.0.0.1:8899';
const ROOT = path.dirname(__dirname);
const ONLINE = /^https:\/\/smallfigure\.com/.test(BASE);

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS  ' + name); }
  else { fail++; console.log('FAIL  ' + name); }
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const jsErrors = [], failedReq = [];
  page.on('pageerror', (e) => jsErrors.push(e.message));
  page.on('response', (r) => { if (r.status() >= 400) failedReq.push(r.status() + ' ' + r.url()); });

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  /* ---------- 1. 资源真实存在于仓库（防再次丢失） ---------- */
  const tcgDir = path.join(ROOT, 'assets', 'tcg');
  const localImgs = fs.existsSync(tcgDir) ? fs.readdirSync(tcgDir).filter((f) => f.endsWith('.png')) : [];
  ok('assets/tcg 目录存在', fs.existsSync(tcgDir));
  ok('assets/tcg 至少 5 张卡面图', localImgs.length >= 5);

  const srcs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.tcgfw-slide img')).map((i) => i.getAttribute('src')));
  ok('浮窗引用 5 张卡面', srcs.length === 5);

  /* ---------- 2. 图片真实加载（不是裂图） ---------- */
  const imgs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.tcgfw-slide img')).map((i) => ({
      ok: i.complete && i.naturalWidth > 0,
      nat: i.naturalWidth + 'x' + i.naturalHeight,
    })));
  ok('5 张卡面全部加载成功', imgs.every((i) => i.ok));
  ok('卡面为竖版 744x1039', imgs.every((i) => i.nat === '744x1039'));

  /* ---------- 3. slide 有实际尺寸且在舞台内 ---------- */
  // 轮播每 2.6s 切一次，切的过程有 .5s 过渡，采样可能落在动画中途；
  // 取多帧里偏差最小的一帧，避免把过渡态误判成未居中。
  const geo = await page.evaluate(async () => {
    const box = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
    const stage = document.querySelector('#tcgfwStage');
    let best = null;
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 250));
      const act = document.querySelector('.tcgfw-slide.a');
      if (!act) continue;
      const s = stage.getBoundingClientRect(), a = act.getBoundingClientRect();
      const dx = Math.abs((a.left + a.right) / 2 - (s.left + s.right) / 2);
      const dy = Math.abs((a.top + a.bottom) / 2 - (s.top + s.bottom) / 2);
      if (!best || dx + dy < best.score) {
        best = {
          score: dx + dy, dx, dy,
          stagePos: getComputedStyle(stage).position,
          slideH: Math.round(a.height),
          inStage: a.top >= s.top - 2 && a.bottom <= s.bottom + 2 && a.left >= s.left - 2 && a.right <= s.right + 2,
        };
      }
    }
    return best;
  });
  ok('舞台是定位上下文', geo.stagePos === 'relative');
  ok('卡牌有实际高度（非塌成 0）', geo.slideH > 100);
  ok('卡牌完整落在舞台内', geo.inStage);
  ok('卡牌居中', geo.dx < 3 && geo.dy < 3);

  /* ---------- 4. z-index 不压过灯箱 ---------- */
  const z = await page.evaluate(() => ({
    wrap: parseInt(getComputedStyle(document.querySelector('.tcgfw-wrap')).zIndex, 10),
    lb: parseInt(getComputedStyle(document.querySelector('#lightbox')).zIndex, 10),
  }));
  ok('浮窗 z-index 低于灯箱', z.wrap < z.lb);

  /* ---------- 5. 打开灯箱时浮窗让位 ---------- */
  await page.evaluate(() => { const c = document.querySelector('.card'); if (c) c.click(); });
  await page.waitForSelector('#lightbox:not([hidden])', { timeout: 5000 });
  await page.waitForTimeout(600);
  const lbState = await page.evaluate(() => ({
    open: !document.querySelector('#lightbox').hidden,
    wrapDisplay: getComputedStyle(document.querySelector('.tcgfw-wrap')).display,
  }));
  ok('灯箱已打开', lbState.open);
  ok('灯箱打开时浮窗隐藏', lbState.wrapDisplay === 'none');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  /* ---------- 6. 滚动后浮窗收起，不再遮挡卡片 ---------- */
  await page.locator('.card').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const scrollState = await page.evaluate(() => {
    const wrap = document.querySelector('.tcgfw-wrap').getBoundingClientRect();
    const card = document.querySelector('.card').getBoundingClientRect();
    const top = document.elementFromPoint(card.left + card.width / 2, card.top + card.height / 2);
    return {
      collapsed: wrap.height === 0,
      fabVisible: document.querySelector('.tcgfw-fab').classList.contains('show'),
      blocked: top ? !!top.closest('.tcgfw-wrap') : false,
    };
  });
  ok('滚动后浮窗收起', scrollState.collapsed);
  ok('滚动后 FAB 出现', scrollState.fabVisible);
  ok('滚动后素材卡片可点击（不被遮挡）', !scrollState.blocked);

  /* ---------- 7. FAB 不与音乐按钮 / 回到顶部按钮重叠 ---------- */
  const overlap = await page.evaluate(() => {
    const rects = Array.from(document.querySelectorAll('.bgm-btn, .to-top-btn, .tcgfw-fab'))
      .map((e) => ({ c: e.className, r: e.getBoundingClientRect() }))
      .filter((x) => x.r.width > 0);
    const hits = [];
    for (let i = 0; i < rects.length; i++)
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i].r, b = rects[j].r;
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 0 && oy > 0) hits.push(rects[i].c + ' × ' + rects[j].c);
      }
    return hits;
  });
  ok('右下角浮动按钮互不重叠', overlap.length === 0);

  /* ---------- 8. CTA 无死链 ---------- */
  const cta = await page.evaluate(() => {
    const a = document.getElementById('tcgfwCtaP');
    return { tag: a.tagName, url: a.getAttribute('onclick') || '' };
  });
  ok('CTA 不是跳转死链的裸 URL', !/location\.href\s*=\s*'\/tcg'/.test(cta.url));

  if (ONLINE) {
    const tcgPage = await page.goto(BASE + '/tcg.html', { waitUntil: 'domcontentloaded' });
    ok('TCG 预告页返回 200', tcgPage && tcgPage.status() === 200);
    const tcgImgs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.tcg-card img')).map((i) => i.complete && i.naturalWidth > 0));
    ok('TCG 预告页卡面图全部加载', tcgImgs.length > 0 && tcgImgs.every(Boolean));
  }

  /* ---------- 9. 无 JS 报错 / 无 4xx 资源 ---------- */
  const realFails = failedReq.filter((r) => !/\/api\/(counts|auth)/.test(r));
  ok('无 4xx/5xx 资源请求', realFails.length === 0);
  ok('全程无 JS 报错', jsErrors.length === 0);

  console.log('\n' + (fail === 0 ? '---- ALL PASS' : '---- FAILED') + ` (${pass}/${pass + fail}) ` + '----');
  await browser.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
