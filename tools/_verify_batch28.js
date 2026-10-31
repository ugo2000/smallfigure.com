// 线上验收：批次二十八（各种饭菜 food + 奇食瓶罐 foodjar 统一老张风格）
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'https://smallfigure.pages.dev';
const EXEC = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';

const FOOD_IDS = ['food-ramen','food-burger','food-pizza','food-cake','food-dumpling',
  'food-friedrice','food-sushi','food-hotpot','food-skewer','food-wonton','food-mapo'];
const FOODJAR_IDS = ['foodjar-1','foodjar-2','foodjar-3','foodjar-4','foodjar-5','foodjar-6'];

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox', '--no-proxy-server'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

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
    assert(/377/.test(info.countTxt), 'count line 含 377: ' + info.countTxt.trim());
    assert(/377/.test(info.heroCount), 'hero pill 素材数 377: ' + info.heroCount.trim());
    assert(/69/.test(info.heroCats), 'hero pill 分类数 69: ' + info.heroCats.trim());
    assert(info.chips.includes('food'), '食物美食 food chip 存在');
    assert(info.chips.includes('foodjar'), '奇食瓶罐 foodjar chip 存在');

    // food 分类筛选
    await page.click('.chip[data-cat="food"]');
    await page.waitForFunction(() => document.querySelectorAll('#grid .card[data-id]').length === 11, { timeout: 10000 }).catch(() => {});
    await page.waitForFunction(() => {
      const imgs = Array.from(document.querySelectorAll('#grid .card img'));
      return imgs.length > 0 && imgs.every(i => i.naturalWidth > 0);
    }, { timeout: 12000 }).catch(() => {});
    const fk = await page.evaluate(() => {
      const c = Array.from(document.querySelectorAll('#grid .card[data-id]'));
      return { n: c.length, broken: c.filter(x => (x.querySelector('img') || {}).naturalWidth === 0).length };
    });
    assert(fk.n === 11, 'food 筛出 11 张: ' + fk.n);
    assert(fk.broken === 0, 'food 缩略图全加载: broken=' + fk.broken);

    // food 灯箱逐张点开验证大图
    const foodN = fk.n;
    for (let i = 0; i < foodN; i++) {
      await page.evaluate(n => document.querySelectorAll('#grid .card[data-id]')[n].click(), i);
      await page.waitForFunction(() => {
        const im = document.querySelector('#lightbox .lb-img, #lightbox img');
        return im && im.complete && im.naturalWidth > 0;
      }, { timeout: 12000 }).catch(() => {});
      const lb = await page.evaluate(() => {
        const im = document.querySelector('#lightbox .lb-img, #lightbox img');
        const name = (document.querySelector('#lightbox .lb-name, #lightbox h3') || {}).textContent || '';
        return { nw: im ? im.naturalWidth : 0, name: name.trim() };
      });
      assert(lb.nw > 0, 'food 灯箱第 ' + (i + 1) + ' 张大图加载: ' + lb.name);
      await page.click('#lightbox .lb-close').catch(() => {});
      await page.waitForFunction(() => {
        const lb = document.querySelector('#lightbox');
        return !lb || !lb.classList.contains('open');
      }, { timeout: 5000 }).catch(() => {});
    }

    // foodjar 分类筛选
    await page.click('.chip[data-cat="foodjar"]');
    await page.waitForFunction(() => document.querySelectorAll('#grid .card[data-id]').length === 6, { timeout: 10000 }).catch(() => {});
    await page.waitForFunction(() => {
      const imgs = Array.from(document.querySelectorAll('#grid .card img'));
      return imgs.length > 0 && imgs.every(i => i.naturalWidth > 0);
    }, { timeout: 12000 }).catch(() => {});
    const fj = await page.evaluate(() => {
      const c = Array.from(document.querySelectorAll('#grid .card[data-id]'));
      return { n: c.length, broken: c.filter(x => (x.querySelector('img') || {}).naturalWidth === 0).length };
    });
    assert(fj.n === 6, 'foodjar 筛出 6 张: ' + fj.n);
    assert(fj.broken === 0, 'foodjar 缩略图全加载: broken=' + fj.broken);

    // 详情页 / 分类页
    const urls = [
      '/i/food-friedrice/', '/i/food-mapo/', '/i/food-ramen/',
      '/i/foodjar-1/', '/i/foodjar-6/', '/c/food/', '/c/foodjar/'
    ];
    for (const u of urls) {
      const resp = await page.goto(BASE + u, { waitUntil: 'domcontentloaded', timeout: 60000 });
      assert(resp && resp.status() === 200, u + ' HTTP 200');
    }

    // og:image 存在
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const og = await page.evaluate(() => {
      const m = document.querySelector('meta[property="og:image"]');
      return m ? m.getAttribute('content') : '';
    });
    assert(/og-.*\.jpg/.test(og), 'og:image 存在: ' + og);

    const real = errors.filter(e => !/401/.test(e));
    assert(real.length === 0, '控制台 0 真错误（401 匿名预期已忽略）' + (real.length ? ': ' + real.slice(0, 2).join(' | ') : ''));
  } catch (e) {
    console.log('FAIL 运行异常: ' + e.message); fails++;
  } finally { await browser.close(); }
  console.log(fails === 0 ? '\n== 全部通过 ==' : '\n== 失败 ' + fails + ' 项 ==');
  process.exit(fails === 0 ? 0 : 1);
})();
