import { Browser } from '../Frontend/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('../Backend/node_modules/dotenv').config({ path: './Backend/.env' });
const jwt = require('../Backend/node_modules/jsonwebtoken');

const mode = process.argv[2] || 'after';
const ADMIN_USER_ID = '6564608c-35f5-40da-ac8a-b47f6e595d2d';
const token = jwt.sign({ userId: ADMIN_USER_ID, tokenVersion: 1 }, process.env.JWT_SECRET, { expiresIn: '2h' });

const outDir = './scratch/funnel_spacing_screenshots';
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

async function scrollToInsightsAnalytics(page) {
  await page.eval(() => {
    const ins = document.querySelector('section[aria-labelledby="dashboard-insights-heading"]');
    const main = document.querySelector('main');
    if (ins && main) {
      main.scrollTop = Math.max(0, ins.offsetTop - 20);
    }
  });
  await sleep(300);
}

async function run() {
  const browser = await Browser.launch({ width: 1440, height: 1000 });
  const page = await browser.newPage({ width: 1440, height: 1000, dsf: 1 });

  await page.goto('http://localhost:5173/login', { settleMs: 400 });
  await page.eval((t) => localStorage.setItem('token', t), token);
  await page.goto('http://localhost:5173/dashboard', { settleMs: 1800 });

  assert(page.consoleErrors.length === 0, `Console errors: ${page.consoleErrors.join('; ')}`);

  await setTheme(page, 'light');
  await scrollToInsightsAnalytics(page);
  await page.screenshot({ path: `${outDir}/${mode}_light_funnel.png`, format: 'png' });

  await setTheme(page, 'dark');
  await scrollToInsightsAnalytics(page);
  await page.screenshot({ path: `${outDir}/${mode}_dark_funnel.png`, format: 'png' });

  const metrics = await page.eval(() => {
    const ins = document.querySelector('section[aria-labelledby="dashboard-insights-heading"]');
    const leftPanel = ins?.querySelector('.lg\\:col-span-7 > div');
    const rightPanel = ins?.querySelector('.lg\\:col-span-5');
    const funnel = ins?.querySelector('[aria-labelledby="conversion-funnel-heading"]');
    const header = funnel?.querySelector('#conversion-funnel-heading')?.closest('div.border-b');
    const bars = Array.from(funnel?.querySelectorAll('[role="progressbar"]') || []);
    const stages = bars.map((b) => b.parentElement);
    const footer = funnel?.querySelector('div.border-t');
    const stepTitle = stages[0]?.querySelector('span');

    const gapY = (a, b) => (a && b ? Math.round(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom) : null);

    return {
      leftPanelRect: leftPanel ? { top: Math.round(leftPanel.getBoundingClientRect().top), height: Math.round(leftPanel.getBoundingClientRect().height) } : null,
      rightPanelRect: rightPanel ? { top: Math.round(rightPanel.getBoundingClientRect().top), height: Math.round(rightPanel.getBoundingClientRect().height) } : null,
      funnelHeight: funnel ? Math.round(funnel.getBoundingClientRect().height) : null,
      barHeights: bars.map((b) => Math.round(b.getBoundingClientRect().height)),
      stageFontSize: stepTitle ? getComputedStyle(stepTitle).fontSize : null,
      gaps: {
        headerToStage1: gapY(header, stages[0]),
        stage1ToStage2: gapY(stages[0], stages[1]),
        stage2ToStage3: gapY(stages[1], stages[2]),
        stage3ToStage4: gapY(stages[2], stages[3]),
        stage4ToFooter: gapY(stages[3], footer),
      },
      footerBottomGapInsideFunnel: funnel && footer
        ? Math.round(funnel.getBoundingClientRect().bottom - footer.getBoundingClientRect().bottom)
        : null,
      docOverflowX: document.documentElement.scrollWidth - window.innerWidth,
    };
  });

  if (mode === 'after') {
    assert(metrics.docOverflowX <= 0, `Horizontal overflow: ${metrics.docOverflowX}`);
    assert(metrics.leftPanelRect.height === metrics.rightPanelRect.height, `Panel alignment broken: left=${metrics.leftPanelRect.height}, right=${metrics.rightPanelRect.height}`);
    assert(metrics.barHeights.every((h) => h === 8), `Progress bar heights changed: ${JSON.stringify(metrics.barHeights)}`);
    assert(metrics.gaps.stage1ToStage2 >= 22, `Stage gaps too small: ${JSON.stringify(metrics.gaps)}`);
    assert(Math.abs(metrics.gaps.stage1ToStage2 - metrics.gaps.stage2ToStage3) <= 2, 'Stage 1-2 vs 2-3 gap not even');
    assert(Math.abs(metrics.gaps.stage2ToStage3 - metrics.gaps.stage3ToStage4) <= 2, 'Stage 2-3 vs 3-4 gap not even');
    assert(metrics.gaps.stage4ToFooter >= 18 && metrics.gaps.stage4ToFooter <= 32, `Unexpected stage4->footer gap: ${metrics.gaps.stage4ToFooter}`);
    assert(metrics.footerBottomGapInsideFunnel <= 2, `Footer not anchored near bottom: ${metrics.footerBottomGapInsideFunnel}`);
  }

  // Mobile check (390x844)
  const mobile = await browser.newPage({ width: 390, height: 844, dsf: 1 });
  await mobile.goto('http://localhost:5173/login', { settleMs: 400 });
  await mobile.eval((t) => localStorage.setItem('token', t), token);
  await mobile.goto('http://localhost:5173/dashboard', { settleMs: 1800 });

  await setTheme(mobile, 'light');
  await mobile.eval(() => {
    const funnel = document.querySelector('[aria-labelledby="conversion-funnel-heading"]');
    const main = document.querySelector('main');
    if (funnel && main) main.scrollTop = Math.max(0, funnel.offsetTop - 90);
  });
  await sleep(250);
  await mobile.screenshot({ path: `${outDir}/${mode}_mobile_light.png`, format: 'png' });

  const mobileMetrics = await mobile.eval(() => {
    const funnel = document.querySelector('[aria-labelledby="conversion-funnel-heading"]');
    const bars = Array.from(funnel?.querySelectorAll('[role="progressbar"]') || []);
    const stages = bars.map((b) => b.parentElement);
    const footer = funnel?.querySelector('div.border-t');
    const gapY = (a, b) => (a && b ? Math.round(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom) : null);
    return {
      docOverflowX: document.documentElement.scrollWidth - window.innerWidth,
      stage1ToStage2: gapY(stages[0], stages[1]),
      stage4ToFooter: gapY(stages[3], footer),
    };
  });
  assert(mobileMetrics.docOverflowX <= 0, `Mobile overflow: ${mobileMetrics.docOverflowX}`);

  console.log(`${mode.toUpperCase()} FUNNEL METRICS:`, JSON.stringify({ metrics, mobileMetrics }, null, 2));
  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
