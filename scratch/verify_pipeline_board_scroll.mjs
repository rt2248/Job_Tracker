import { findChrome, Page, sleep } from '../Frontend/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('../Backend/node_modules/dotenv').config({ path: './Backend/.env' });
const jwt = require('../Backend/node_modules/jsonwebtoken');

const mode = process.argv[2] || 'after';
const ADMIN_USER_ID = '6564608c-35f5-40da-ac8a-b47f6e595d2d';
const token = jwt.sign({ userId: ADMIN_USER_ID, tokenVersion: 1 }, process.env.JWT_SECRET, { expiresIn: '2h' });

const outDir = './scratch/pipeline_scroll_screenshots';
mkdirSync(outDir, { recursive: true });

const assert = (cond, msg) => {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
};

// Launch Chrome WITHOUT --hide-scrollbars so custom/scoped scrollbars render identically to a real user browser
async function launchVisibleScrollbarBrowser({ width = 1440, height = 1000 } = {}) {
  const exe = findChrome();
  if (!exe) throw new Error('Chrome not found');
  const dir = mkdtempSync(join(tmpdir(), 'ad-chrome-vis-'));
  const args = [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`,
    '--no-first-run', '--no-default-browser-check', '--mute-audio',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows', '--disable-features=Translate,MediaRouter',
    '--force-color-profile=srgb', '--autoplay-policy=no-user-gesture-required',
    '--enable-unsafe-swiftshader', `--window-size=${width},${height}`, 'about:blank',
  ];
  const proc = spawn(exe, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const t = setTimeout(() => reject(new Error('Chrome did not start within 20s')), 20000);
    proc.stderr.on('data', (d) => {
      buf += d.toString();
      const m = buf.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (m) { clearTimeout(t); resolve(m[1]); }
    });
    proc.on('exit', (code) => { clearTimeout(t); reject(new Error('Chrome exited: ' + code)); });
  });
  const b = {
    proc, dir, nextId: 1, pending: new Map(), listeners: new Map(),
    ws: new WebSocket(wsUrl),
    send(method, params = {}, sessionId, timeoutMs = 30000) {
      const id = this.nextId++;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, timeoutMs);
        this.pending.set(id, { resolve, reject, timer });
        this.ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
      });
    },
    on(sessionId, method, fn) {
      const k = (sessionId || '') + '|' + method;
      if (!this.listeners.has(k)) this.listeners.set(k, new Set());
      this.listeners.get(k).add(fn);
      return () => this.listeners.get(k)?.delete(fn);
    },
    async newPage({ width: w = 1440, height: h = 1000, dsf = 1, mobile = false } = {}) {
      const { targetId } = await this.send('Target.createTarget', { url: 'about:blank', newWindow: true });
      const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
      const p = new Page(this, targetId, sessionId);
      await p.send('Page.enable');
      await p.send('Runtime.enable');
      await p.setViewport({ width: w, height: h, dsf, mobile });
      return p;
    },
    async close() {
      try { await this.send('Browser.close', {}, undefined, 3000); } catch {}
      try { this.ws.close(); } catch {}
      try { this.proc.kill(); } catch {}
      await sleep(300);
      try { rmSync(this.dir, { recursive: true, force: true, maxRetries: 3 }); } catch {}
    },
  };
  await new Promise((res, rej) => { b.ws.onopen = res; b.ws.onerror = () => rej(new Error('CDP ws failed')); });
  b.ws.onmessage = (ev) => {
    const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data).toString());
    if (msg.id && b.pending.has(msg.id)) {
      const { resolve, reject, timer } = b.pending.get(msg.id);
      clearTimeout(timer); b.pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message)); else resolve(msg.result);
    } else if (msg.method) {
      const fns = b.listeners.get((msg.sessionId || '') + '|' + msg.method);
      if (fns) for (const fn of [...fns]) fn(msg.params);
    }
  };
  return b;
}

const KEY_CODES = {
  ArrowLeft: 37,
  ArrowRight: 39,
};

async function pressKey(page, key) {
  const vk = KEY_CODES[key] || 0;
  await page.send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown',
    key,
    code: key,
    windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk,
  });
  await page.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key,
    code: key,
    windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk,
  });
}

async function setTheme(page, theme) {
  await page.eval((t) => {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(t);
  }, theme);
  await sleep(250);
}

async function scrollToPipelineBoardBottom(page) {
  await page.eval(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTop = main.scrollHeight;
  });
  await sleep(250);
}

async function run() {
  const browser = await launchVisibleScrollbarBrowser({ width: 1440, height: 1000 });
  const page = await browser.newPage({ width: 1440, height: 1000, dsf: 1 });

  await page.goto('http://localhost:5173/login', { settleMs: 400 });
  await page.eval((t) => localStorage.setItem('token', t), token);
  await page.goto('http://localhost:5173/dashboard', { settleMs: 1800 });

  assert(page.consoleErrors.length === 0, `Console errors: ${page.consoleErrors.join('; ')}`);

  await setTheme(page, 'dark');
  await scrollToPipelineBoardBottom(page);
  await page.screenshot({ path: `${outDir}/${mode}_dark_board.png`, format: 'png' });

  await setTheme(page, 'light');
  await scrollToPipelineBoardBottom(page);
  await page.screenshot({ path: `${outDir}/${mode}_light_board.png`, format: 'png' });

  const boardMetrics = await page.eval(() => {
    const sec = document.querySelector('section[aria-label="Pipeline Board"]');
    const h2 = sec?.querySelector('h2');
    const board = sec?.querySelector('[class*="overflow-x-auto"]');
    const cols = Array.from(sec?.querySelectorAll('[id^="kanban-col-"]') || []);
    const cs = board ? getComputedStyle(board) : null;
    const hint = sec?.querySelector('[aria-label*="Arrow keys"]');
    return {
      heading: h2?.textContent?.trim(),
      stageOrder: cols.map((c) => c.id.replace('kanban-col-', '')),
      stageCount: cols.length,
      totalApplications: sec?.querySelector('span.font-mono')?.textContent?.trim(),
      docOverflowX: document.documentElement.scrollWidth - window.innerWidth,
      boardScrollWidth: board?.scrollWidth,
      boardClientWidth: board?.clientWidth,
      boardScrollHeight: board?.scrollHeight,
      boardClientHeight: board?.clientHeight,
      hasHorizontalOverflow: board ? board.scrollWidth > board.clientWidth : false,
      hasVerticalOverflow: board ? board.scrollHeight > board.clientHeight : false,
      scrollbarReservedHeight: board ? board.offsetHeight - board.clientHeight : 0,
      overflowX: cs?.overflowX,
      overflowY: cs?.overflowY,
      tabIndex: board?.getAttribute('tabindex'),
      role: board?.getAttribute('role'),
      ariaLabel: board?.getAttribute('aria-label'),
      hasHint: sec?.textContent?.includes('Navigate stages') || false,
      hintFontSize: hint ? getComputedStyle(hint).fontSize : null,
    };
  });

  if (mode === 'after') {
    assert(boardMetrics.stageCount === 7, `Expected 7 stages, got ${boardMetrics.stageCount}`);
    assert(
      boardMetrics.stageOrder.join(',') === 'saved,applied,oa,interview,offer,accepted,rejected',
      `Unexpected stage order: ${boardMetrics.stageOrder.join(',')}`
    );
    assert(boardMetrics.totalApplications === '20 applications', `Unexpected count: ${boardMetrics.totalApplications}`);
    assert(boardMetrics.docOverflowX === 0, `Horizontal doc overflow: ${boardMetrics.docOverflowX}`);
    assert(boardMetrics.hasHorizontalOverflow, 'Expected Pipeline Board to overflow horizontally at 1440px');
    assert(!boardMetrics.hasVerticalOverflow, `Unexpected vertical overflow: scrollHeight=${boardMetrics.boardScrollHeight} clientHeight=${boardMetrics.boardClientHeight}`);
    assert(boardMetrics.scrollbarReservedHeight >= 8, `Expected visible scrollbar track (>=8px), got ${boardMetrics.scrollbarReservedHeight}`);
    assert(boardMetrics.tabIndex === '0', `Expected board tabIndex="0", got ${boardMetrics.tabIndex}`);
    assert(boardMetrics.role === 'region', `Expected board role="region", got ${boardMetrics.role}`);
    assert(boardMetrics.hasHint, 'Expected "Navigate stages" keyboard hint');

    // 1a. ArrowRight inside Search <input> MUST NOT scroll board & must move caret normally
    await page.eval(() => {
      const inp = document.querySelector('section[aria-label="Pipeline Board"] input[placeholder*="Search"]');
      inp.focus();
      inp.value = 'test';
      inp.setSelectionRange(2, 2);
    });
    await pressKey(page, 'ArrowRight');
    await sleep(300);
    const inputCaretCheck = await page.eval(() => {
      const board = document.querySelector('section[aria-label="Pipeline Board"] [role="region"]');
      const inp = document.querySelector('section[aria-label="Pipeline Board"] input[placeholder*="Search"]');
      return {
        scrollLeft: Math.round(board.scrollLeft),
        selectionStart: inp.selectionStart,
      };
    });
    assert(inputCaretCheck.scrollLeft === 0, `Input focus hijacked board scroll: ${inputCaretCheck.scrollLeft}`);
    assert(inputCaretCheck.selectionStart === 3, `Expected input caret at 3, got ${inputCaretCheck.selectionStart}`);
    await page.eval(() => {
      const inp = document.querySelector('section[aria-label="Pipeline Board"] input[placeholder*="Search"]');
      inp.value = '';
    });

    // 1b. ArrowRight & ArrowLeft inside <select> keep native selection & MUST NOT scroll board
    await page.eval(() => {
      document.querySelector('section[aria-label="Pipeline Board"] select')?.focus();
    });
    await pressKey(page, 'ArrowRight');
    await sleep(250);
    await pressKey(page, 'ArrowLeft');
    await sleep(250);
    const selectScrollCheck = await page.eval(() => {
      const board = document.querySelector('section[aria-label="Pipeline Board"] [role="region"]');
      const sel = document.querySelector('section[aria-label="Pipeline Board"] select');
      return { scrollLeft: Math.round(board.scrollLeft), value: sel?.value };
    });
    assert(selectScrollCheck.scrollLeft === 0, `Select focus hijacked board scroll: ${selectScrollCheck.scrollLeft}`);
    assert(selectScrollCheck.value === '', `Expected select to return to "", got ${selectScrollCheck.value}`);

    // 1c. ArrowRight on Journey Stage filter button outside board MUST NOT scroll board via arrow handler
    await page.eval(() => {
      document.querySelector('nav[aria-label="Application pipeline stages"] button')?.focus();
    });
    await pressKey(page, 'ArrowRight');
    await sleep(300);
    const externalButtonScroll = await page.eval(() => {
      const board = document.querySelector('section[aria-label="Pipeline Board"] [role="region"]');
      return Math.round(board.scrollLeft);
    });
    assert(externalButtonScroll === 0, `External button focus triggered board scroll: ${externalButtonScroll}`);

    // 2. Focus Pipeline Board region & test ArrowRight / ArrowLeft
    await page.eval(() => {
      document.querySelector('section[aria-label="Pipeline Board"] [role="region"]').focus();
    });
    await pressKey(page, 'ArrowRight');
    await sleep(650);
    const afterRight1 = await page.eval(() => Math.round(document.querySelector('section[aria-label="Pipeline Board"] [role="region"]').scrollLeft));
    assert(afterRight1 > 150, `Expected ArrowRight to scroll right smoothly, got ${afterRight1}`);

    await pressKey(page, 'ArrowRight');
    await sleep(650);
    const afterRight2 = await page.eval(() => Math.round(document.querySelector('section[aria-label="Pipeline Board"] [role="region"]').scrollLeft));
    assert(afterRight2 > afterRight1 + 150, `Expected second ArrowRight to scroll further: ${afterRight1} -> ${afterRight2}`);

    await page.screenshot({ path: `${outDir}/after_light_board_scrolled.png`, format: 'png' });

    await pressKey(page, 'ArrowLeft');
    await sleep(650);
    const afterLeft1 = await page.eval(() => Math.round(document.querySelector('section[aria-label="Pipeline Board"] [role="region"]').scrollLeft));
    assert(afterLeft1 < afterRight2 - 150, `Expected ArrowLeft to scroll back left: ${afterRight2} -> ${afterLeft1}`);

    // 3. Test horizontal wheel event on board (touchpad/mouse horizontal gesture)
    const box = await page.eval(() => {
      const r = document.querySelector('section[aria-label="Pipeline Board"] [role="region"]').getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    });
    await page.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: box.x, y: box.y, deltaX: 250, deltaY: 0 });
    await sleep(300);
    const afterWheelX = await page.eval(() => Math.round(document.querySelector('section[aria-label="Pipeline Board"] [role="region"]').scrollLeft));
    assert(afterWheelX > afterLeft1, `Expected horizontal mouseWheel to scroll board: ${afterLeft1} -> ${afterWheelX}`);

    // Dark scrolled screenshot
    await setTheme(page, 'dark');
    await page.eval(() => {
      document.querySelector('section[aria-label="Pipeline Board"] [role="region"]').scrollLeft = 520;
    });
    await sleep(250);
    await page.screenshot({ path: `${outDir}/after_dark_board_scrolled.png`, format: 'png' });

    console.log('Keyboard & Wheel Checks:', JSON.stringify({
      inputCaretCheck,
      selectScrollCheck,
      externalButtonScroll,
      afterRight1,
      afterRight2,
      afterLeft1,
      afterWheelX,
    }, null, 2));
  }

  // Mobile viewport check (390x844)
  const mobile = await browser.newPage({ width: 390, height: 844, dsf: 1 });
  await mobile.goto('http://localhost:5173/login', { settleMs: 400 });
  await mobile.eval((t) => localStorage.setItem('token', t), token);
  await mobile.goto('http://localhost:5173/dashboard', { settleMs: 1800 });

  await setTheme(mobile, 'dark');
  await scrollToPipelineBoardBottom(mobile);
  await mobile.screenshot({ path: `${outDir}/${mode}_mobile_dark.png`, format: 'png' });

  await setTheme(mobile, 'light');
  await scrollToPipelineBoardBottom(mobile);
  await mobile.screenshot({ path: `${outDir}/${mode}_mobile_light.png`, format: 'png' });

  const mobileMetrics = await mobile.eval(() => {
    const sec = document.querySelector('section[aria-label="Pipeline Board"]');
    const hint = sec?.querySelector('[aria-label*="Arrow keys"]');
    const board = sec?.querySelector('[class*="overflow-x-auto"]');
    return {
      docOverflowX: document.documentElement.scrollWidth - window.innerWidth,
      secOverflow: sec ? sec.scrollWidth > sec.clientWidth + 1 : false,
      boardHasVerticalOverflow: board ? board.scrollHeight > board.clientHeight : false,
      hintRect: hint ? hint.getBoundingClientRect().toJSON() : null,
    };
  });

  assert(mobileMetrics.docOverflowX === 0, `Mobile horizontal overflow: ${mobileMetrics.docOverflowX}`);
  assert(!mobileMetrics.secOverflow, 'Mobile Pipeline Board header section overflowed');
  assert(!mobileMetrics.boardHasVerticalOverflow, 'Mobile Pipeline Board had vertical overflow');

  console.log(`${mode.toUpperCase()} VERIFICATION RESULT:`, JSON.stringify({ boardMetrics, mobileMetrics }, null, 2));
  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
