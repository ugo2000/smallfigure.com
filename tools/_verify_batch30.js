// 线上验收：批次三十（精致小人第二批 lil2-* 20 张，加入 characters 人物立绘分类）
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'https://smallfigure.pages.dev';
const EXEC = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';

const LIL2_IDS = ['lil2-fisher','lil2-woodman','lil2-farmer','lil2-cowherd','lil2-healer','lil2-taoist','lil2-monk','lil2-warrior','lil2-poet','lil2-drinker','lil2-goplayer','lil2-painter','lil2-gardener','lil2-boatman','lil2-hunter','lil2-herbalist','lil2-diviner','lil2-flutist','lil2-lady','lil2-child'];

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox', '--no-proxy-server', '--disable-quic'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  const notfound = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('response', r => { if (r.status() === 404) notfound.push(r.url()); });

  let fails = 0;
  const assert = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('#grid .card[data-id]', { timeout: 30000 });
    await page.waitForFunction(() => {
      const imgs = Array.from(document.querySelectorAll('#grid .card img'));
      return imgs.length > 0 && imgs.slice(0, 6).every(i => i.naturalWidth > 0);
    }, { timeout: 12000 }).catch(() => {});

    const info = await page.evaluate(() => {
      const countTxt = document.querySelector('#countLine') ? document.querySelector('#countLine').textContent : '';
      const chips = Array.from(document.querySelectorAll('.chip')).map(c => c.dataset.cat);
      const heroCount = (document.querySelector('[data-i18n="hero.pill.count"]') || {}).textContent || '';
      const heroCats = (document.querySelector('[data-i18n="hero.pill.cats"]') || {}).textContent || '';
      return { countTxt, chips, heroCount, heroCats };
    });
    assert(/405/.test(info.countTxt), 'count line 含 405: ' + info.countTxt.trim());
    assert(/405/.test(info.heroCount), 'hero pill 素材数 405: ' + info.heroCount.trim());
    assert(/69/.test(info.heroCats), 'hero pill 分类数 69: ' + info.heroCats.trim());
    assert(info.chips.includes('characters'), '人物立绘 characters chip 存在');

    // characters 分类筛选
    await page.click('.chip[data-cat="characters"]');
    await page.waitForFunction(() => document.querySelectorAll('#grid .card[data-id]').length === 56, { timeout: 10000 }).catch(() => {});
    // 触发懒加载：56 张超出浏览器懒加载预载边距，强制 eager 立即加载
    await page.evaluate(() => {
      document.querySelectorAll('#grid .card img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
    });
    await page.waitForFunction(() => {
      const imgs = Array.from(document.querySelectorAll('#grid .card img'));
      return imgs.length > 0 && imgs.every(i => i.naturalWidth > 0);
    }, { timeout: 12000 }).catch(() => {});
    const fk = await page.evaluate(() => {
      const c = Array.from(document.querySelectorAll('#grid .card[data-id]'));
      return { n: c.length, broken: c.filter(x => (x.querySelector('img') || {}).naturalWidth === 0).length };
    });
    assert(fk.n === 56, 'characters 筛出 56 张: ' + fk.n);
    assert(fk.broken === 0, 'characters 缩略图全加载: broken=' + fk.broken);

    // 灯箱：逐张点开 20 个 lil2-* 新人
    for (const id of LIL2_IDS) {
      await page.evaluate(i => {
        const card = Array.from(document.querySelectorAll('#grid .card[data-id]')).find(c => c.dataset.id === i);
        if (card) card.click();
      }, id);
      await page.waitForFunction(() => {
        const im = document.querySelector('#lightbox .lb-img, #lightbox img');
        return im && im.complete && im.naturalWidth > 0;
      }, { timeout: 12000 }).catch(() => {});
      const lb = await page.evaluate(() => {
        const im = document.querySelector('#lightbox .lb-img, #lightbox img');
        const name = (document.querySelector('#lightbox .lb-name, #lightbox h3') || {}).textContent || '';
        return { nw: im ? im.naturalWidth : 0, name: name.trim() };
      });
      assert(lb.nw > 0, '灯箱 ' + id + ' 大图加载: ' + lb.name);
      await page.click('#lightbox .lb-close').catch(() => {});
      await page.waitForFunction(() => {
        const lb = document.querySelector('#lightbox');
        return !lb || !lb.classList.contains('open');
      }, { timeout: 5000 }).catch(() => {});
    }

    // 详情页
    for (const id of LIL2_IDS) {
      const resp = await page.goto(BASE + '/i/' + id + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      assert(resp && resp.status() === 200, '/i/' + id + '/ HTTP 200');
    }
    // 分类页
    const resp2 = await page.goto(BASE + '/c/characters/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    assert(resp2 && resp2.status() === 200, '/c/characters/ HTTP 200');

    // og:image
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const og = await page.evaluate(() => {
      const m = document.querySelector('meta[property="og:image"]');
      return m ? m.getAttribute('content') : '';
    });
    assert(/og-.*\.jpg/.test(og), 'og:image 存在: ' + og);

    const nonFavicon404 = notfound.filter(u => !/favicon\.ico/.test(u));
    assert(nonFavicon404.length === 0, '无 favicon 以外的 404（已知 favicon.ico 缺失为站点历史遗留，与本次批次无关）' + (nonFavicon404.length ? ': ' + nonFavicon404.slice(0, 3).join(' | ') : ''));
    const real = errors.filter(e => !/401/.test(e) && !(nonFavicon404.length === 0 && /404/.test(e)));
    assert(real.length === 0, '控制台 0 真错误（401 匿名 / favicon 404 已忽略）' + (real.length ? ': ' + real.slice(0, 2).join(' | ') : ''));
  } catch (e) {
    console.log('FAIL 运行异常: ' + e.message); fails++;
  } finally { await browser.close(); }
  console.log(fails === 0 ? '\n== 全部通过 ==' : '\n== 失败 ' + fails + ' 项 ==');
  process.exit(fails === 0 ? 0 : 1);
})();
