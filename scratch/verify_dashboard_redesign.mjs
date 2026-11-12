import { Browser } from '../Frontend/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('../Backend/node_modules/dotenv').config({ path: './Backend/.env' });
const jwt = require('../Backend/node_modules/jsonwebtoken');

const ADMIN_USER_ID = '6564608c-35f5-40da-ac8a-b47f6e595d2d'; // admin_123 (20 jobs)
const VERIFIER_USER_ID = 'dbe03098-975f-4ce3-b07c-6f61c3de791d'; // verifier_test (12 jobs)
const EMPTY_USER_ID = '4ff54e67-ca45-43f4-84c7-4bdc796f2a3f'; // rt-2248 (0 jobs)

const adminToken = jwt.sign({ userId: ADMIN_USER_ID, tokenVersion: 1 }, process.env.JWT_SECRET, { expiresIn: '2h' });
const verifierToken = jwt.sign({ userId: VERIFIER_USER_ID, tokenVersion: 1 }, process.env.JWT_SECRET, { expiresIn: '2h' });
const emptyToken = jwt.sign({ userId: EMPTY_USER_ID, tokenVersion: 1 }, process.env.JWT_SECRET, { expiresIn: '2h' });

mkdirSync('./scratch/dashboard_redesign_screenshots', { recursive: true });

const assert = (cond, msg) => {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function setTheme(page, mode) {
  await page.eval((m) => {
    document.documentElement.setAttribute('data-theme', m);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(m);
  }, mode);
  await sleep(350);
}

async function run() {
  const browser = await Browser.launch({ width: 1440, height: 1000 });
  const page = await browser.newPage({ width: 1440, height: 1000, dsf: 1 });

  await page.goto('http://localhost:5173/login', { settleMs: 400 });
  await page.eval((t) => localStorage.setItem('token', t), adminToken);

  await page.goto('http://localhost:5173/dashboard', { settleMs: 2000 });
  await setTheme(page, 'dark');

  assert(page.consoleErrors.length === 0, `Console errors: ${page.consoleErrors.join('; ')}`);

  // 1. Structural & Functional Verification on 20-job dataset
  const metricsCheck = await page.eval(() => {
    const main = document.querySelector('main');
    const h1 = document.querySelector('h1')?.textContent?.trim();
    const kpiSection = document.querySelector('section[aria-label="Key Pipeline Metrics"]');
    const insightsSection = document.querySelector('section[aria-labelledby="dashboard-insights-heading"]');
    const focusSection = document.querySelector('section[aria-label="Focus and Deadlines"]');
    const kanbanCols = document.querySelectorAll('[id^="kanban-col-"]').length;
    const journeyBtns = document.querySelectorAll('nav[aria-label="Application pipeline stages"] button[aria-pressed]').length;
    const cardsCount = document.querySelectorAll('[id^="kanban-col-"] [draggable="true"]').length;
    const metricTexts = kpiSection?.innerText || '';

    return {
      h1,
      hasKpi: Boolean(kpiSection),
      hasInsights: Boolean(insightsSection),
      hasFocus: Boolean(focusSection),
      kanbanCols,
      journeyBtns,
      cardsCount,
      has20Total: metricTexts.includes('20'),
      mainOverflowY: getComputedStyle(main).overflowY,
      mainScrollHeight: main.scrollHeight,
      mainClientHeight: main.clientHeight,
      docOverflowX: document.documentElement.scrollWidth - window.innerWidth,
      blurElements: Array.from(document.querySelectorAll('*')).filter((el) => el.className?.toString().includes('blur-3xl')).length,
      bodyTextHasAmazonFollowUp: document.body.innerText.includes('Amazon'),
    };
  });
  console.log('Populated Dashboard DOM Verification:', metricsCheck);
  assert(metricsCheck.h1 === 'Application Pipeline', `Unexpected H1: ${metricsCheck.h1}`);
  assert(metricsCheck.hasKpi, 'Missing Key Pipeline Metrics strip');
  assert(metricsCheck.hasInsights, 'Missing Insights workspace');
  assert(metricsCheck.hasFocus, 'Missing Focus & Deadlines row');
  assert(metricsCheck.kanbanCols === 7, `Expected 7 Kanban columns, got ${metricsCheck.kanbanCols}`);
  assert(metricsCheck.journeyBtns === 7, `Expected 7 stage filter buttons, got ${metricsCheck.journeyBtns}`);
  assert(metricsCheck.cardsCount === 20, `Expected 20 Kanban cards, got ${metricsCheck.cardsCount}`);
  assert(metricsCheck.has20Total, 'Expected KPI strip to display 20 total applications');
  assert(metricsCheck.mainOverflowY === 'auto', `Expected normal main overflowY auto, got ${metricsCheck.mainOverflowY}`);
  assert(metricsCheck.docOverflowX <= 0, `Horizontal overflow: ${metricsCheck.docOverflowX}`);
  assert(metricsCheck.blurElements === 0, 'Detected prohibited artificial blur-3xl decoration');

  // 2. Capture Populated Dark Mode Top, Mid, Bottom
  await page.screenshot({ path: './scratch/dashboard_redesign_screenshots/dark_top.png', format: 'png' });

  await page.eval(() => {
    const m = document.querySelector('main');
    m.scrollTop = Math.round(m.scrollHeight * 0.34);
  });
  await sleep(350);
  await page.screenshot({ path: './scratch/dashboard_redesign_screenshots/dark_mid.png', format: 'png' });

  await page.eval(() => {
    const m = document.querySelector('main');
    m.scrollTop = m.scrollHeight;
  });
  await sleep(350);
  await page.screenshot({ path: './scratch/dashboard_redesign_screenshots/dark_bottom.png', format: 'png' });

  // 3. Test Interactive Features (Timeframe toggle, Hover tooltip, Radar tab, Stage filter, Job Type filter, Search, JobDetailModal)
  await page.eval(() => {
    document.querySelector('main').scrollTop = 360;
  });
  await sleep(250);

  // Hover point on SubmissionActivityChart to verify interactive hover readout
  const chartBox = await page.eval(() => {
    const svg = document.querySelector('svg[role="img"][aria-label*="Submission activity chart"]');
    if (!svg) return null;
    const circles = svg.querySelectorAll('circle[data-date], rect[data-date], circle');
    const target = circles[Math.floor(circles.length / 2)] || svg;
    const r = target.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (chartBox && chartBox.x > 0) {
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: chartBox.x, y: chartBox.y });
    await sleep(200);
  }

  // Switch Conversion Funnel -> Radar & Alerts tab
  await page.eval(() => {
    const tabs = Array.from(document.querySelectorAll('[aria-label="Insights perspective"] button[role="tab"]'));
    tabs.find((b) => b.textContent.includes('Radar'))?.click();
  });
  await sleep(300);
  const radarOpen = await page.eval(() => Boolean(document.querySelector('[aria-label="Stale applications preview"]')));
  assert(radarOpen, 'Radar & Alerts tab failed to switch');
  await page.screenshot({ path: './scratch/dashboard_redesign_screenshots/dark_radar_tab.png', format: 'png' });

  // Switch back to Conversion Funnel for Light Mode capture
  await page.eval(() => {
    const tabs = Array.from(document.querySelectorAll('[aria-label="Insights perspective"] button[role="tab"]'));
    tabs.find((b) => b.textContent.includes('Funnel'))?.click();
  });
  await sleep(200);

  // Test Submission Activity range selector ("90 Days" -> "30 Days")
  await page.eval(() => {
    const tabs = Array.from(document.querySelectorAll('[aria-label="Time period selection"] button[role="tab"]'));
    tabs.find((b) => b.textContent.includes('90 Days'))?.click();
  });
  await sleep(700);
  const selected90d = await page.eval(() => {
    const tabs = Array.from(document.querySelectorAll('[aria-label="Time period selection"] button[role="tab"]'));
    return tabs.find((b) => b.textContent.includes('90 Days'))?.getAttribute('aria-selected');
  });
  assert(selected90d === 'true', 'Time period range tab 90d did not activate');
  await page.eval(() => {
    const tabs = Array.from(document.querySelectorAll('[aria-label="Time period selection"] button[role="tab"]'));
    tabs.find((b) => b.textContent.includes('30 Days'))?.click();
  });
  await sleep(450);

  // Inspect Pipeline Journey stage dot styles & Stage focus/filter toggle
  const journeyDots = await page.eval(() => {
    return Array.from(document.querySelectorAll('nav[aria-label="Application pipeline stages"] button[aria-pressed]')).map((b) => {
      const dot = b.querySelector('span[aria-hidden="true"]');
      const style = dot ? getComputedStyle(dot) : null;
      return {
        label: b.getAttribute('aria-label'),
        dotClass: dot?.className || null,
        dotBg: style?.backgroundColor || null,
      };
    });
  });
  console.log('Pipeline Journey dots:', journeyDots);
  assert(
    journeyDots.every((d) => d.dotBg && d.dotBg !== 'rgba(0, 0, 0, 0)'),
    `Expected every Pipeline Journey stage dot to render a visible color: ${JSON.stringify(journeyDots)}`
  );

  // Test Stage focus toggle + Clear
  await page.eval(() => {
    const btn = document.querySelector('button[aria-label*="Filter by Interview"]');
    btn?.click();
  });
  await sleep(300);
  const stageCheck = await page.eval(() => {
    const interviewCol = document.querySelector('#kanban-col-interview');
    const clearBtn = document.querySelector('button[aria-label="Clear focused stage"]');
    const visibleCards = Array.from(document.querySelectorAll('[id^="kanban-col-"] [draggable="true"]')).length;
    const boardHeader = Array.from(document.querySelectorAll('h2')).find((h) => h.textContent.includes('Pipeline Board'))?.parentElement?.innerText;
    return {
      pressed: document.querySelector('button[aria-label*="Filter by Interview"]')?.getAttribute('aria-pressed'),
      hasClearBtn: Boolean(clearBtn),
      interviewColClass: interviewCol?.className || '',
      visibleCards,
      boardHeader,
    };
  });
  console.log('Stage filter check:', stageCheck);
  assert(stageCheck.pressed === 'true', 'Stage filter button did not toggle aria-pressed');
  assert(stageCheck.hasClearBtn, 'Clear focused stage button did not appear');
  await page.eval(() => document.querySelector('button[aria-label="Clear focused stage"]')?.click());
  await sleep(200);

  // Test Job Type filter (Internship)
  await page.eval(() => {
    const sel = document.querySelector('select[aria-label*="job type" i]') || Array.from(document.querySelectorAll('select')).find((s) => s.innerText.includes('Internship'));
    if (sel) {
      sel.value = 'internship';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(250);
  const internshipFiltered = await page.eval(() => document.body.innerText.includes('of 20 shown'));
  assert(internshipFiltered, 'Job type filter did not narrow displayed Kanban card count');

  // Test Search Input filtering Kanban cards & Reset All Filters
  await page.eval(() => {
    const resetBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Reset All Filters'));
    resetBtn?.click();
  });
  await sleep(200);

  await page.eval(() => {
    const input = document.querySelector('input[placeholder*="Search role or company"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'Amazon');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await sleep(250);
  const filteredText = await page.eval(() => document.body.innerText.includes('1 of 20 shown'));
  assert(filteredText, 'Search filter for Amazon failed to narrow to 1 of 20 shown');
  await page.eval(() => {
    const resetBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Reset All Filters'));
    resetBtn?.click();
  });
  await sleep(200);

  // Test NextBestAction CTA opening JobDetailModal
  await page.eval(() => {
    const btn = Array.from(document.querySelectorAll('[aria-labelledby="next-best-action-title"] button')).find((b) =>
      b.textContent.includes('Review Application') || b.textContent.includes('View')
    );
    btn?.click();
  });
  await sleep(300);
  const modalOpened = await page.eval(() => Boolean(document.querySelector('[role="dialog"]')));
  assert(modalOpened, 'Clicking NextBestAction CTA did not open JobDetailModal');
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(200);

  // 4. Populated Light Mode Captures (Top, Mid, Bottom)
  await setTheme(page, 'light');
  await page.eval(() => { document.querySelector('main').scrollTop = 0; });
  await sleep(350);
  await page.screenshot({ path: './scratch/dashboard_redesign_screenshots/light_top.png', format: 'png' });

  await page.eval(() => {
    const m = document.querySelector('main');
    m.scrollTop = Math.round(m.scrollHeight * 0.34);
  });
  await sleep(350);
  await page.screenshot({ path: './scratch/dashboard_redesign_screenshots/light_mid.png', format: 'png' });

  await page.eval(() => {
    const m = document.querySelector('main');
    m.scrollTop = m.scrollHeight;
  });
  await sleep(350);
  await page.screenshot({ path: './scratch/dashboard_redesign_screenshots/light_bottom.png', format: 'png' });

  // 5. Tablet Responsive (768x1024) & Mobile Responsive (390x844) on 20-job dataset
  await setTheme(page, 'dark');
  await page.setViewport({ width: 768, height: 1024, dsf: 1 });
  await page.eval(() => { document.querySelector('main').scrollTop = 0; });
  await sleep(350);
  const tabletOverflow = await page.eval(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(tabletOverflow <= 0, `Tablet overflowX: ${tabletOverflow}`);
  await page.screenshot({ path: './scratch/dashboard_redesign_screenshots/tablet_dark.png', format: 'png' });

  await page.setViewport({ width: 390, height: 844, dsf: 2, mobile: true });
  await sleep(350);
  const mobileOverflow = await page.eval(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(mobileOverflow <= 0, `Mobile overflowX: ${mobileOverflow}`);
  await page.screenshot({ path: './scratch/dashboard_redesign_screenshots/mobile_dark.png', format: 'png' });

  await setTheme(page, 'light');
  await page.screenshot({ path: './scratch/dashboard_redesign_screenshots/mobile_light.png', format: 'png' });

  // 6. Kanban Drag & Drop Verification (on isolated verifier_test user so admin_123 DB history stays untouched)
  await page.setViewport({ width: 1440, height: 1000, dsf: 1 });
  await page.eval((t) => localStorage.setItem('token', t), verifierToken);
  await page.goto('http://localhost:5173/dashboard', { settleMs: 1800 });

  const initialCounts = await page.eval(() => ({
    saved: document.querySelectorAll('#kanban-col-saved [draggable="true"]').length,
    applied: document.querySelectorAll('#kanban-col-applied [draggable="true"]').length,
  }));
  console.log('verifier_test initial Kanban counts:', initialCounts);

  // Drag first saved card -> #kanban-col-applied
  await page.eval(() => {
    const card = document.querySelector('#kanban-col-saved [draggable="true"]');
    const targetCol = document.querySelector('#kanban-col-applied');
    const dt = new DataTransfer();
    card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));
    targetCol.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }));
    targetCol.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    targetCol.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    card.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: dt }));
  });
  await sleep(800);

  const afterDropCounts = await page.eval(() => ({
    saved: document.querySelectorAll('#kanban-col-saved [draggable="true"]').length,
    applied: document.querySelectorAll('#kanban-col-applied [draggable="true"]').length,
  }));
  console.log('verifier_test after drag saved->applied:', afterDropCounts);
  assert(
    afterDropCounts.saved === initialCounts.saved - 1 && afterDropCounts.applied === initialCounts.applied + 1,
    `Kanban drag-and-drop did not move card! Initial=${JSON.stringify(initialCounts)}, After=${JSON.stringify(afterDropCounts)}`
  );

  // Drag CloudStart back to #kanban-col-saved so counts match
  await page.eval(() => {
    const cards = Array.from(document.querySelectorAll('#kanban-col-applied [draggable="true"]'));
    const card = cards.find((c) => c.textContent.includes('CloudStart')) || cards[0];
    const targetCol = document.querySelector('#kanban-col-saved');
    const dt = new DataTransfer();
    card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));
    targetCol.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }));
    targetCol.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    targetCol.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    card.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: dt }));
  });
  await sleep(800);

  const restoredCounts = await page.eval(() => ({
    saved: document.querySelectorAll('#kanban-col-saved [draggable="true"]').length,
    applied: document.querySelectorAll('#kanban-col-applied [draggable="true"]').length,
  }));
  assert(
    restoredCounts.saved === initialCounts.saved && restoredCounts.applied === initialCounts.applied,
    `Kanban drag-and-drop restore failed! Restored=${JSON.stringify(restoredCounts)}`
  );

  // 7. Empty-State Capture (0 jobs user rt-2248)
  await page.eval((t) => localStorage.setItem('token', t), emptyToken);
  await page.goto('http://localhost:5173/dashboard', { settleMs: 1600 });
  await setTheme(page, 'dark');
  await page.screenshot({ path: './scratch/dashboard_redesign_screenshots/empty_dark.png', format: 'png' });
  await setTheme(page, 'light');
  await page.screenshot({ path: './scratch/dashboard_redesign_screenshots/empty_light.png', format: 'png' });

  // 8. Verify Insights.jsx page was NOT broken/altered
  await page.eval((t) => localStorage.setItem('token', t), adminToken);
  await page.goto('http://localhost:5173/insights', { settleMs: 1200 });
  const insightsPageOk = await page.eval(() => document.querySelector('h1')?.textContent?.includes('Insights & Analytics'));
  assert(insightsPageOk, 'Dedicated Insights page failed to render properly');

  assert(page.consoleErrors.length === 0, `Console errors detected at end: ${page.consoleErrors.join('; ')}`);
  console.log('ALL DASHBOARD REDESIGN VERIFICATIONS PASSED CLEANLY!');
  await browser.close();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
