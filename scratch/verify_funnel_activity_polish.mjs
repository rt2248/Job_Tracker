import { Browser, sleep } from '../Frontend/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('../Backend/node_modules/dotenv').config({ path: './Backend/.env' });
const jwt = require('../Backend/node_modules/jsonwebtoken');

const mode = process.argv[2] || 'after';
const ADMIN_USER_ID = '6564608c-35f5-40da-ac8a-b47f6e595d2d';
const token = jwt.sign({ userId: ADMIN_USER_ID, tokenVersion: 1 }, process.env.JWT_SECRET, { expiresIn: '2h' });

const outDir = './scratch/funnel_polish_screenshots';
mkdirSync(outDir, { recursive: true });

const assert = (cond, msg) => {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
};

async function setTheme(page, theme) {
  await page.eval((t) => {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(t);
  }, theme);
  await sleep(250);
}

async function scrollToInsights(page) {
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
  await scrollToInsights(page);
  await page.screenshot({ path: `${outDir}/${mode}_light_desktop.png`, format: 'png' });

  await setTheme(page, 'dark');
  await scrollToInsights(page);
  await page.screenshot({ path: `${outDir}/${mode}_dark_desktop.png`, format: 'png' });

  const metrics = await page.eval(() => {
    const ins = document.querySelector('section[aria-labelledby="dashboard-insights-heading"]');
    const leftPanel = ins?.querySelector('.lg\\:col-span-7 > div');
    const rightPanel = ins?.querySelector('.lg\\:col-span-5');
    const tablist = rightPanel?.querySelector('[role="tablist"]');
    const funnel = ins?.querySelector('[aria-labelledby="conversion-funnel-heading"]');
    const heading = funnel?.querySelector('#conversion-funnel-heading');
    const header = heading?.closest('div.border-b');
    const bars = Array.from(funnel?.querySelectorAll('[role="progressbar"]') || []);
    const stages = bars.map((b) => b.parentElement);
    const footer = funnel?.querySelector('div.border-t');
    const leftFooter = leftPanel?.querySelector('div.border-t');

    const gapY = (a, b) => (a && b ? Math.round(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom) : null);

    return {
      headingText: heading?.textContent?.trim(),
      hasEndToEndYield: funnel?.textContent?.includes('End-to-end yield') || false,
      leftRect: leftPanel ? {
        top: Math.round(leftPanel.getBoundingClientRect().top),
        height: Math.round(leftPanel.getBoundingClientRect().height),
      } : null,
      rightRect: rightPanel ? {
        top: Math.round(rightPanel.getBoundingClientRect().top),
        height: Math.round(rightPanel.getBoundingClientRect().height),
      } : null,
      gaps: {
        tablistToHeader: gapY(tablist, header),
        headerToStage1: gapY(header, stages[0]),
        stage1ToStage2: gapY(stages[0], stages[1]),
        stage2ToStage3: gapY(stages[1], stages[2]),
        stage3ToStage4: gapY(stages[2], stages[3]),
        stage4ToFooter: gapY(stages[3], footer),
      },
      barCount: bars.length,
      barHeights: bars.map((b) => Math.round(b.getBoundingClientRect().height)),
      leftFooterGap: leftFooter && leftPanel
        ? Math.round(leftPanel.getBoundingClientRect().bottom - leftFooter.getBoundingClientRect().bottom)
        : null,
      rightFooterGap: footer && rightPanel
        ? Math.round(rightPanel.getBoundingClientRect().bottom - footer.getBoundingClientRect().bottom)
        : null,
      docOverflowX: document.documentElement.scrollWidth - window.innerWidth,
    };
  });

  // Switch to Radar & Alerts tab and verify it renders cleanly
  await page.eval(() => {
    const btns = Array.from(document.querySelectorAll('[role="tablist"][aria-label="Insights perspective"] [role="tab"]'));
    const radar = btns.find((b) => b.textContent?.includes('Radar'));
    radar?.click();
  });
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${mode}_dark_radar.png`, format: 'png' });
  const radarHeadingOk = await page.eval(() => document.body.innerText.includes('Follow-up Radar'));

  // Mobile capture (390x844)
  const mobile = await browser.newPage({ width: 390, height: 844, dsf: 1 });
  await mobile.goto('http://localhost:5173/login', { settleMs: 400 });
  await mobile.eval((t) => localStorage.setItem('token', t), token);
  await mobile.goto('http://localhost:5173/dashboard', { settleMs: 1800 });
  await setTheme(mobile, 'light');
  await scrollToInsights(mobile);
  await mobile.screenshot({ path: `${outDir}/${mode}_mobile_light.png`, format: 'png' });
  const mobileOverflow = await mobile.eval(() => document.documentElement.scrollWidth - window.innerWidth);

  if (mode === 'after') {
    assert(metrics.docOverflowX <= 0 && mobileOverflow <= 0, 'Horizontal overflow detected');
    assert(metrics.headingText === 'Conversion Funnel', `Expected "Conversion Funnel", got "${metrics.headingText}"`);
    assert(metrics.hasEndToEndYield, 'Missing "End-to-end yield" descriptor');
    assert(metrics.barCount === 4 && metrics.barHeights.every((h) => h === 8), `Unexpected progress bars: ${JSON.stringify(metrics.barHeights)}`);
    assert(Math.abs(metrics.leftRect.top - metrics.rightRect.top) <= 1, `Top alignment mismatch: ${metrics.leftRect.top} vs ${metrics.rightRect.top}`);
    assert(metrics.rightRect.height < metrics.leftRect.height, `Funnel still artificially stretched to match Submission Activity (${metrics.rightRect.height} vs ${metrics.leftRect.height})`);
    assert(Math.abs(metrics.gaps.stage1ToStage2 - metrics.gaps.stage2ToStage3) <= 2, 'Stage rhythm uneven');
    assert(Math.abs(metrics.gaps.stage2ToStage3 - metrics.gaps.stage3ToStage4) <= 2, 'Stage rhythm uneven');
    assert(radarHeadingOk, 'Radar & Alerts tab failed to switch cleanly');
  }

  console.log(`${mode.toUpperCase()} METRICS:`, JSON.stringify({ metrics, mobileOverflow, radarHeadingOk }, null, 2));
  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
