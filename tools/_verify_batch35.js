// 线上验收：批次三十五（新增 8 片异星叶片 alienleaves，467 项 / 73 分类）
// 灯箱：每次点开前强制复位（移除 open + 清空大图 src），避免遮罩残留拦截点击，也无需重载首页
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'https://smallfigure.com';
const EXEC = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';

const NEW_IDS = [
  'leaf-starvein', 'leaf-crystalhoney', 'leaf-gearclock', 'leaf-moonphase',
  'leaf-lampvein', 'leaf-doublespiral', 'leaf-metalscales', 'leaf-dewlens'
];
const OG = 'og-0c1cf70f5f.jpg';

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

  const gotoHome = async () => {
    for (let a = 0; a < 3; a++) {
      try {
        await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForSelector('#grid .card[data-id]', { timeout: 30000 });
        return true;
      } catch (e) {
        if (a === 2) throw e;
        await page.waitForTimeout(3000);
      }
    }
  };

  try {
    await gotoHome();
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
    assert(/467/.test(info.countTxt), 'count line 含 467: ' + info.countTxt.trim());
    assert(/467/.test(info.heroCount), 'hero pill 素材数 467: ' + info.heroCount.trim());
    assert(/73/.test(info.heroCats), 'hero pill 分类数 73: ' + info.heroCats.trim());
    assert(info.chips.includes('alienleaves'), '异星叶片 alienleaves chip 存在');

    // alienleaves 分类筛选（8 张卡片）
    await page.click('.chip[data-cat="alienleaves"]');
    await page.waitForFunction(() => document.querySelectorAll('#grid .card[data-id]').length === 8, { timeout: 10000 }).catch(() => {});
    await page.evaluate(() => {
      document.querySelectorAll('#grid .card img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
    });
    await page.waitForFunction(() => {
      const imgs = Array.from(document.querySelectorAll('#grid .card img'));
      return imgs.length > 0 && imgs.every(i => i.naturalWidth > 0);
    }, { timeout: 30000 }).catch(() => {});
    const fk = await page.evaluate(() => {
      const c = Array.from(document.querySelectorAll('#grid .card[data-id]'));
      return { n: c.length, broken: c.filter(x => (x.querySelector('img') || {}).naturalWidth === 0).length };
    });
    assert(fk.n === 8, 'alienleaves 筛出 8 张: ' + fk.n);
    assert(fk.broken === 0, 'alienleaves 缩略图全加载: broken=' + fk.broken);

    // 灯箱：强制复位后点卡片，等新大图真正加载完成
    for (const id of NEW_IDS) {
      await page.evaluate(i => {
        const lb = document.querySelector('#lightbox');
        if (lb) lb.classList.remove('open');
        const old = document.querySelector('#lightbox .lb-img, #lightbox img');
        if (old) old.removeAttribute('src');
        const card = Array.from(document.querySelectorAll('#grid .card[data-id]')).find(c => c.dataset.id === i);
        if (card) card.click();
      }, id);
      await page.waitForFunction(() => {
        const im = document.querySelector('#lightbox .lb-img, #lightbox img');
        return im && im.complete && im.naturalWidth > 0;
      }, { timeout: 20000 }).catch(() => {});
      const lb = await page.evaluate(() => {
        const im = document.querySelector('#lightbox .lb-img, #lightbox img');
        return { nw: im ? im.naturalWidth : 0, src: im ? (im.currentSrc || im.src) : '' };
      });
      assert(lb.nw > 0 && lb.src.indexOf(id) >= 0, '灯箱 ' + id + ' 大图加载: nw=' + lb.nw);
    }

    // 新增 8 个详情页
    for (const id of NEW_IDS) {
      const resp = await page.goto(BASE + '/i/' + id + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      assert(resp && resp.status() === 200, '/i/' + id + '/ HTTP 200');
    }
    // 分类页
    const resp2 = await page.goto(BASE + '/c/alienleaves/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    assert(resp2 && resp2.status() === 200, '/c/alienleaves/ HTTP 200');

    // og:image
    await gotoHome();
    const og = await page.evaluate(() => {
      const m = document.querySelector('meta[property="og:image"]');
      return m ? m.getAttribute('content') : '';
    });
    assert(og.indexOf(OG) >= 0, 'og:image 为本次 digest: ' + og);

    const nonFavicon404 = notfound.filter(u => !/favicon\.ico/.test(u));
    assert(nonFavicon404.length === 0, '无 favicon 以外的 404' + (nonFavicon404.length ? ': ' + nonFavicon404.slice(0, 3).join(' | ') : ''));
    const real = errors.filter(e => !/401/.test(e) && !(nonFavicon404.length === 0 && /404/.test(e)));
    assert(real.length === 0, '控制台 0 真错误（401 匿名 / favicon 404 已忽略）' + (real.length ? ': ' + real.slice(0, 2).join(' | ') : ''));
  } catch (e) {
    console.log('FAIL 运行异常: ' + e.message); fails++;
  } finally { await browser.close(); }
  console.log(fails === 0 ? '\n== 全部通过 ==' : '\n== 失败 ' + fails + ' 项 ==');
  process.exit(fails === 0 ? 0 : 1);
})();
