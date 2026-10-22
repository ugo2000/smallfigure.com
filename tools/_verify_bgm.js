/* 背景音乐验证：自动播放策略 / 开关 / 记忆 / 文件加载 */
const pw = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.SF_URL || 'http://127.0.0.1:8788';

(async () => {
  const browser = await pw.chromium.launch({ executablePath: EXE, args: ['--mute-audio'] });
  const pg = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  pg.on('pageerror', e => errors.push('pageerror: ' + e.message));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  let pass = 0, fail = 0;
  const check = (name, ok, extra) => {
    console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (extra ? ' | ' + extra : ''));
    ok ? pass++ : fail++;
  };

  await pg.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(1000);

  // 1. 音频元素与文件
  const audio = await pg.evaluate(() => {
    const a = document.getElementById('bgm');
    return a ? { src: a.getAttribute('src'), loop: a.loop, preload: a.preload } : null;
  });
  check('audio 元素存在且 loop', !!audio && audio.loop === true, JSON.stringify(audio));

  // 2. 文件能加载、时长正常
  const meta = await pg.evaluate(() => new Promise(res => {
    const a = document.getElementById('bgm');
    if (a.readyState >= 1) return res({ duration: a.duration });
    a.addEventListener('loadedmetadata', () => res({ duration: a.duration }), { once: true });
    setTimeout(() => res({ duration: a.duration || 0 }), 4000);
  }));
  check('音频时长 ~118s', meta.duration > 100 && meta.duration < 140, 'duration=' + meta.duration);

  // 3. 默认期望开启：headless 下自动播放大概率被拦 → 应进入 waiting 提示态
  const st1 = await pg.evaluate(() => ({
    paused: document.getElementById('bgm').paused,
    waiting: document.getElementById('bgmBtn').classList.contains('waiting'),
    stored: localStorage.getItem('sf_bgm'),
  }));
  console.log('  初始状态:', JSON.stringify(st1));

  // 4. 首次交互（点页面空白处）→ 应该顺势响起
  await pg.click('.subtitle', { position: { x: 5, y: 5 } });
  await pg.waitForTimeout(900);
  const st2 = await pg.evaluate(() => ({
    paused: document.getElementById('bgm').paused,
    vol: document.getElementById('bgm').volume,
    waiting: document.getElementById('bgmBtn').classList.contains('waiting'),
  }));
  check('首次交互后音乐播放', st2.paused === false, JSON.stringify(st2));
  check('渐入音量到位(0.35)', Math.abs(st2.vol - 0.35) < 0.06, 'vol=' + st2.vol);

  // 5. 点开关 → 暂停 + 记住 off
  await pg.click('#bgmBtn');
  await pg.waitForTimeout(300);
  const st3 = await pg.evaluate(() => ({
    paused: document.getElementById('bgm').paused,
    stored: localStorage.getItem('sf_bgm'),
  }));
  check('点开关后暂停', st3.paused === true);
  check('localStorage 记住 off', st3.stored === 'off', 'stored=' + st3.stored);

  // 6. 刷新 → 保持关闭（默认开的反证：记忆优先）
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForTimeout(1200);
  const st4 = await pg.evaluate(() => ({
    paused: document.getElementById('bgm').paused,
    waiting: document.getElementById('bgmBtn').classList.contains('waiting'),
  }));
  check('刷新后保持关闭', st4.paused === true && st4.waiting === false, JSON.stringify(st4));

  // 7. 再点开关 → 手动开启
  await pg.click('#bgmBtn');
  await pg.waitForTimeout(600);
  const st5 = await pg.evaluate(() => ({
    paused: document.getElementById('bgm').paused,
    stored: localStorage.getItem('sf_bgm'),
  }));
  check('再点开关恢复播放', st5.paused === false && st5.stored === 'on', JSON.stringify(st5));

  console.log('JS 错误:', errors.length ? errors.join(' | ') : '无');
  console.log(`\n结果: ${pass} PASS / ${fail} FAIL`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });
