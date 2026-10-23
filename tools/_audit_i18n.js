/* 审计：英文模式下所有可见文案里的中文残留（含属性与灯箱） */
const pw = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.SF_URL || 'http://127.0.0.1:8788';

(async () => {
  const isHttps = BASE.indexOf('https') === 0;
  const browser = await pw.chromium.launch({
    executablePath: EXE,
    args: ['--mute-audio'].concat(isHttps ? ['--proxy-server=http://127.0.0.1:7897'] : [])
  });
  const pg = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'en-US' });
  await pg.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(1500);

  const CJK = /[\u4e00-\u9fff\u3001-\u303f\uff01-\uff5e]/;

  async function audit(label) {
    const found = await pg.evaluate(() => {
      const out = [];
      const attrs = ['placeholder', 'title', 'aria-label', 'alt', 'value'];
      const isCJK = s => /[\u4e00-\u9fff\u3001-\u303f\uff01-\uff5e]/.test(s);
      document.querySelectorAll('body *').forEach(el => {
        if (el.closest('[hidden]')) return;
        if (el.closest('.lang-toggle')) return; /* 切换器按钮名（中文/EN）是故意保留的目标语言名 */
        const own = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').trim();
        if (own && isCJK(own)) out.push({ where: el.tagName + (el.id ? '#' + el.id : '.' + (el.className || '').split(' ')[0]), text: own });
        attrs.forEach(a => {
          const v = el.getAttribute && el.getAttribute(a);
          if (v && isCJK(v)) out.push({ where: el.tagName + '[' + a + ']', text: v });
        });
      });
      const meta = document.querySelector('meta[name="description"]');
      if (meta && isCJK(meta.getAttribute('content') || '')) out.push({ where: 'meta[description]', text: meta.getAttribute('content') });
      if (isCJK(document.title)) out.push({ where: 'title', text: document.title });
      return out;
    });
    console.log('=== ' + label + '：中文残留 ' + found.length + ' 处 ===');
    found.forEach(f => console.log('  [' + f.where + '] ' + f.text.slice(0, 80)));
    return found.length;
  }

  // 1. 网格页
  const n1 = await audit('网格页 EN');
  // 2. 空状态（搜个不存在的词）
  await pg.fill('#search', 'zzzznomatch');
  await pg.waitForTimeout(500);
  const emptyTxt = await pg.evaluate(() => ({
    title: document.querySelector('#empty p').textContent,
    btn: document.querySelector('#resetBtn').textContent,
    count: document.querySelector('#countLine').textContent
  }));
  const emptyOk = emptyTxt.title === 'No matching images' && emptyTxt.btn === 'Reset filters';
  console.log((emptyOk ? 'PASS' : 'FAIL') + ' | 空状态 EN | ' + JSON.stringify(emptyTxt));
  await pg.click('#resetBtn');
  await pg.waitForTimeout(300);
  // 3. 打开灯箱（含标签）
  await pg.click('.card');
  await pg.waitForTimeout(700);
  const n2 = await audit('灯箱 EN');
  await pg.keyboard.press('Escape');

  console.log('\n合计残留: ' + (n1 + n2) + ' 处');
  await browser.close();
  process.exit((n1 + n2) || !emptyOk ? 1 : 0);
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });
