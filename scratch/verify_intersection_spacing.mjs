import { Browser } from '../Frontend/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('../Backend/node_modules/dotenv').config({ path: './Backend/.env' });
const jwt = require('../Backend/node_modules/jsonwebtoken');

const mode = process.argv[2] || 'after'; // 'before' | 'after'
const ADMIN_USER_ID = '6564608c-35f5-40da-ac8a-b47f6e595d2d';
const token = jwt.sign({ userId: ADMIN_USER_ID, tokenVersion: 1 }, process.env.JWT_SECRET, { expiresIn: '2h' });

const outDir = './scratch/dashboard_intersection_screenshots';
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
  await sleep(250);
}

async function run() {
  const browser = await Browser.launch({ width: 1440, height: 1000 });
  const page = await browser.newPage({ width: 1440, height: 1000, dsf: 1 });

  await page.goto('http://localhost:5173/login', { settleMs: 400 });
  await page.eval((t) => localStorage.setItem('token', t), token);
  await page.goto('http://localhost:5173/dashboard', { settleMs: 1800 });

  assert(page.consoleErrors.length === 0, `Console errors: ${page.consoleErrors.join('; ')}`);

  const metrics = await page.eval(() => {
    const main = document.querySelector('main');
    const header = document.querySelector('main > header');
    const journey = document.querySelector('nav[aria-label="Application pipeline stages"]');
    const kpi = document.querySelector('section[aria-label="Key Pipeline Metrics"]');
    const insightsSec = document.querySelector('section[aria-labelledby="dashboard-insights-heading"]');
    const insightsHeader = insightsSec?.querySelector(':scope > div:first-child');
    const insightsDeck = insightsSec?.querySelector('.dashboard-workspace-deck');
    const ledgerRow = insightsDeck?.querySelector('.divide-border-subtle.border-b');
    const analyticsSplit = ledgerRow?.nextElementSibling;
    const focusSec = document.querySelector('section[aria-label="Focus and Deadlines"]');
    const focusHeader = focusSec?.querySelector(':scope > div:first-child');
    const focusGrid = focusSec?.querySelector('.grid');
    const pipelineSec = document.querySelector('section[aria-label="Pipeline Board"]');
    const pipelineToolbar = pipelineSec?.querySelector(':scope > div:first-child');
    const kanbanBoard = pipelineToolbar?.nextElementSibling;

    const gapY = (a, b) => (a && b ? Math.round(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom) : null);
    const rectInfo = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { width: Math.round(r.width), height: Math.round(r.height), left: Math.round(r.left) };
    };

    const kpiCard = kpi?.querySelector('.dashboard-panel');
    const actionCard = focusSec?.querySelector('.dashboard-panel-focal');
    const sampleText = ledgerRow?.querySelector('span');

    return {
      mainScrollHeight: main.scrollHeight,
      docOverflowX: document.documentElement.scrollWidth - window.innerWidth,
      gaps: {
        headerToJourney: gapY(header, journey),
        journeyToKpi: gapY(journey, kpi),
        kpiToInsights: gapY(kpi, insightsSec),
        insightsHeadingToDeck: gapY(insightsHeader, insightsDeck),
        insightsLedgerToAnalytics: gapY(ledgerRow, analyticsSplit),
        insightsToFocus: gapY(insightsSec, focusSec),
        focusHeadingToCards: gapY(focusHeader, focusGrid),
        focusToPipeline: gapY(focusSec, pipelineSec),
        pipelineToolbarToKanban: gapY(pipelineToolbar, kanbanBoard),
      },
      preservedDimensions: {
        kpiCard: rectInfo(kpiCard),
        actionCard: rectInfo(actionCard),
        insightsDeckWidth: Math.round(insightsDeck?.getBoundingClientRect().width || 0),
        ledgerLabelFontSize: sampleText ? getComputedStyle(sampleText).fontSize : null,
      },
    };
  });

  console.log(`[${mode.toUpperCase()}] Inter-Section Spacing Metrics:`, metrics);
  assert(metrics.docOverflowX <= 0, `Horizontal overflow: ${metrics.docOverflowX}`);

  // Desktop Light & Dark screenshots (Top, Mid/Insights+Focus, Bottom/Kanban)
  await setTheme(page, 'light');
  await page.eval(() => { document.querySelector('main').scrollTop = 0; });
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${mode}_light_top.png`, format: 'png' });

  await page.eval(() => {
    const ins = document.querySelector('section[aria-labelledby="dashboard-insights-heading"]');
    document.querySelector('main').scrollTop = Math.max(0, ins.offsetTop - 28);
  });
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${mode}_light_mid.png`, format: 'png' });

  await page.eval(() => {
    const m = document.querySelector('main');
    m.scrollTop = m.scrollHeight;
  });
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${mode}_light_bottom.png`, format: 'png' });

  await setTheme(page, 'dark');
  await page.eval(() => { document.querySelector('main').scrollTop = 0; });
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${mode}_dark_top.png`, format: 'png' });

  await page.eval(() => {
    const ins = document.querySelector('section[aria-labelledby="dashboard-insights-heading"]');
    document.querySelector('main').scrollTop = Math.max(0, ins.offsetTop - 28);
  });
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${mode}_dark_mid.png`, format: 'png' });

  await page.eval(() => {
    const m = document.querySelector('main');
    m.scrollTop = m.scrollHeight;
  });
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${mode}_dark_bottom.png`, format: 'png' });

  // Mobile (390x844) Light & Dark
  await page.setViewport({ width: 390, height: 844, dsf: 2, mobile: true });
  await page.eval(() => { document.querySelector('main').scrollTop = 0; });
  await sleep(250);
  const mobileOverflow = await page.eval(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(mobileOverflow <= 0, `Mobile horizontal overflow: ${mobileOverflow}`);
  await page.screenshot({ path: `${outDir}/${mode}_mobile_dark.png`, format: 'png' });

  await setTheme(page, 'light');
  await page.screenshot({ path: `${outDir}/${mode}_mobile_light.png`, format: 'png' });

  assert(page.consoleErrors.length === 0, `Console errors at end: ${page.consoleErrors.join('; ')}`);
  console.log(`[${mode.toUpperCase()}] CAPTURE PASSED!`);
  await browser.close();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
