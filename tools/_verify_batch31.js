// 线上验收：批次三十一（20 款中国独有传统玩具，新增 toys 中国玩具分类）
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'https://smallfigure.com';
const EXEC = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';

const TOY_IDS = ['toy-diabolo','toy-spinningtop','toy-jianzi','toy-kite','toy-lantern','toy-ninerings','toy-tangram','toy-lubanlock','toy-pelletdrum','toy-tumbler','toy-paperflip','toy-bamboodragonfly','toy-pinwheel','toy-clothtiger','toy-rabbitlord','toy-nigugu','toy-sugarfigure','toy-klotski','toy-slingshot','toy-zongren'];

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
    // 首页加载带重试（沙箱网络偶发超时）
    let loaded = false;
    for (let a = 0; a < 3 && !loaded; a++) {
      try {
        await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
        loaded = true;
      } catch (e) {
        if (a === 2) throw e;
        await page.waitForTimeout(3000);
      }
    }
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
    assert(/425/.test(info.countTxt), 'count line 含 425: ' + info.countTxt.trim());
    assert(/425/.test(info.heroCount), 'hero pill 素材数 425: ' + info.heroCount.trim());
    assert(/70/.test(info.heroCats), 'hero pill 分类数 70: ' + info.heroCats.trim());
    assert(info.chips.includes('toys'), '中国玩具 toys chip 存在');

    // toys 分类筛选
    await page.click('.chip[data-cat="toys"]');
    await page.waitForFunction(() => document.querySelectorAll('#grid .card[data-id]').length === 20, { timeout: 10000 }).catch(() => {});
    // 触发懒加载：强制 eager 立即加载后需重新等 naturalWidth>0
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
    assert(fk.n === 20, 'toys 筛出 20 张: ' + fk.n);
    assert(fk.broken === 0, 'toys 缩略图全加载: broken=' + fk.broken);

    // 灯箱：逐张点开 20 个 toy-* 玩具
    for (const id of TOY_IDS) {
      await page.evaluate(i => {
        const card = Array.from(document.querySelectorAll('#grid .card[data-id]')).find(c => c.dataset.id === i);
        if (card) card.click();
      }, id);
      await page.waitForFunction(() => {
        const im = document.querySelector('#lightbox .lb-img, #lightbox img');
        return im && im.complete && im.naturalWidth > 0;
      }, { timeout: 30000 }).catch(() => {});
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
    for (const id of TOY_IDS) {
      const resp = await page.goto(BASE + '/i/' + id + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      assert(resp && resp.status() === 200, '/i/' + id + '/ HTTP 200');
    }
    // 分类页
    const resp2 = await page.goto(BASE + '/c/toys/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    assert(resp2 && resp2.status() === 200, '/c/toys/ HTTP 200');

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
