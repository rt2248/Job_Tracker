import { Browser } from '../Frontend/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('../Backend/node_modules/dotenv').config({ path: './Backend/.env' });
const jwt = require('../Backend/node_modules/jsonwebtoken');

const mode = process.argv[2] || 'after'; // 'before' | 'after'
const ADMIN_USER_ID = '6564608c-35f5-40da-ac8a-b47f6e595d2d'; // admin_123 (20 jobs)
const token = jwt.sign({ userId: ADMIN_USER_ID, tokenVersion: 1 }, process.env.JWT_SECRET, { expiresIn: '2h' });

const outDir = './scratch/dashboard_refine_screenshots';
mkdirSync(outDir, { recursive: true });

const assert = (cond, msg) => {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function setTheme(page, theme) {
  await page.eval((t) => {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(t);
  }, theme);
  await sleep(300);
}

async function run() {
  const browser = await Browser.launch({ width: 1440, height: 1000 });
  const page = await browser.newPage({ width: 1440, height: 1000, dsf: 1 });

  await page.goto('http://localhost:5173/login', { settleMs: 400 });
  await page.eval((t) => localStorage.setItem('token', t), token);
  await page.goto('http://localhost:5173/dashboard', { settleMs: 1800 });

  assert(page.consoleErrors.length === 0, `Console errors: ${page.consoleErrors.join('; ')}`);

  // Collect detailed typography & vertical/horizontal layout telemetry
  const telemetry = await page.eval(() => {
    const main = document.querySelector('main');
    const getStyle = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { fontSize: cs.fontSize, lineHeight: cs.lineHeight, marginBottom: cs.marginBottom, left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) };
    };

    const kpiTitle = getStyle('section[aria-label="Key Pipeline Metrics"] span');
    const insightsTitle = Array.from(document.querySelectorAll('section[aria-labelledby="dashboard-insights-heading"] span')).find((s) => s.textContent === 'Tracked');
    const insightsSub = Array.from(document.querySelectorAll('section[aria-labelledby="dashboard-insights-heading"] span')).find((s) => s.textContent === 'Total opportunities');
    const xLabel = document.querySelector('svg[aria-label*="timeline line chart" i] text');
    const apLabel = Array.from(document.querySelectorAll('section[aria-label="Key Pipeline Metrics"] span')).find((s) => s.textContent === 'AP');
    const funnelLabel = Array.from(document.querySelectorAll('[aria-labelledby="conversion-funnel-heading"] span')).find((s) => s.textContent.includes('of tracked'));
    const nextActionDesc = Array.from(document.querySelectorAll('[aria-labelledby="next-best-action-title"] p')).pop();

    const clippedElements = Array.from(document.querySelectorAll('section span, section p, section button, section h3, section h4')).filter((el) => {
      const cs = getComputedStyle(el);
      return cs.overflowX === 'hidden' && cs.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 2;
    }).length;

    return {
      mainScrollHeight: main.scrollHeight,
      mainPaddingLeft: getComputedStyle(main).paddingLeft,
      mainPaddingRight: getComputedStyle(main).paddingRight,
      mainPaddingTop: getComputedStyle(main).paddingTop,
      docOverflowX: document.documentElement.scrollWidth - window.innerWidth,
      kpiTitle,
      insightsCellLabelFont: insightsTitle ? getComputedStyle(insightsTitle).fontSize : null,
      insightsCellSubFont: insightsSub ? getComputedStyle(insightsSub).fontSize : null,
      chartSvgTextFont: xLabel ? getComputedStyle(xLabel).fontSize : null,
      apLabelFont: apLabel ? getComputedStyle(apLabel).fontSize : null,
      funnelPctFont: funnelLabel ? getComputedStyle(funnelLabel).fontSize : null,
      nextActionBodyFont: nextActionDesc ? getComputedStyle(nextActionDesc).fontSize : null,
      clippedElements,
    };
  });
  console.log(`[${mode.toUpperCase()}] Telemetry:`, telemetry);
  assert(telemetry.docOverflowX <= 0, `Horizontal overflow detected: ${telemetry.docOverflowX}`);

  // 1. Dark Mode desktop screenshots (Top, Mid/Insights+Focus, Bottom)
  await setTheme(page, 'dark');
  await page.eval(() => { document.querySelector('main').scrollTop = 0; });
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${mode}_dark_top.png`, format: 'png' });

  await page.eval(() => {
    const insightsEl = document.querySelector('section[aria-labelledby="dashboard-insights-heading"]');
    const m = document.querySelector('main');
    m.scrollTop = Math.max(0, insightsEl.offsetTop - 28);
  });
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${mode}_dark_insights_focus.png`, format: 'png' });

  await page.eval(() => {
    const m = document.querySelector('main');
    m.scrollTop = m.scrollHeight;
  });
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${mode}_dark_bottom.png`, format: 'png' });

  // 2. Light Mode desktop screenshots (Top, Insights exact crop focus, Bottom)
  await setTheme(page, 'light');
  await page.eval(() => { document.querySelector('main').scrollTop = 0; });
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${mode}_light_top.png`, format: 'png' });

  await page.eval(() => {
    const insightsEl = document.querySelector('section[aria-labelledby="dashboard-insights-heading"]');
    const m = document.querySelector('main');
    m.scrollTop = Math.max(0, insightsEl.offsetTop - 28);
  });
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${mode}_light_insights_focus.png`, format: 'png' });

  await page.eval(() => {
    const m = document.querySelector('main');
    m.scrollTop = m.scrollHeight;
  });
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${mode}_light_bottom.png`, format: 'png' });

  // 3. Mobile (390x844) Dark & Light
  await page.setViewport({ width: 390, height: 844, dsf: 2, mobile: true });
  await page.eval(() => { document.querySelector('main').scrollTop = 0; });
  await sleep(300);
  const mobileOverflow = await page.eval(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(mobileOverflow <= 0, `Mobile horizontal overflow: ${mobileOverflow}`);
  await page.screenshot({ path: `${outDir}/${mode}_mobile_light.png`, format: 'png' });

  await setTheme(page, 'dark');
  await page.screenshot({ path: `${outDir}/${mode}_mobile_dark.png`, format: 'png' });

  // 4. Verify Insights.jsx stays unchanged
  if (mode === 'after') {
    await page.setViewport({ width: 1440, height: 1000, dsf: 1 });
    await page.goto('http://localhost:5173/insights', { settleMs: 1000 });
    const insightsTextFont = await page.eval(() => {
      const svgText = document.querySelector('svg[aria-label*="timeline line chart" i] text');
      return svgText ? getComputedStyle(svgText).fontSize : null;
    });
    console.log('[AFTER] Dedicated Insights page chart SVG text font:', insightsTextFont);
  }

  assert(page.consoleErrors.length === 0, `Console errors at end: ${page.consoleErrors.join('; ')}`);
  console.log(`[${mode.toUpperCase()}] CAPTURE & CHECK PASSED!`);
  await browser.close();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
