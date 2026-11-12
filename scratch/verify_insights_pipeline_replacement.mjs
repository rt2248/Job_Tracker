import { Browser, sleep } from '../Frontend/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('../Backend/node_modules/dotenv').config({ path: './Backend/.env' });
const jwt = require('../Backend/node_modules/jsonwebtoken');

const mode = process.argv[2] || 'after';
const ADMIN_USER_ID = '6564608c-35f5-40da-ac8a-b47f6e595d2d';
const token = jwt.sign({ userId: ADMIN_USER_ID, tokenVersion: 1 }, process.env.JWT_SECRET, { expiresIn: '2h' });

const outDir = './scratch/pipeline_replacement_screenshots';
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

async function run() {
  const browser = await Browser.launch({ width: 1440, height: 1000 });
  const page = await browser.newPage({ width: 1440, height: 1000, dsf: 1 });

  await page.goto('http://localhost:5173/login', { settleMs: 400 });
  await page.eval((t) => localStorage.setItem('token', t), token);

  await page.goto('http://localhost:5173/insights', { settleMs: 1800 });
  assert(page.consoleErrors.length === 0, `Console errors: ${page.consoleErrors.join('; ')}`);

  await setTheme(page, 'light');
  await page.eval(() => { document.querySelector('main').scrollTop = 0; });
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${mode}_light_top.png`, format: 'png' });

  await page.eval(() => { document.querySelector('main').scrollTop = 780; });
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${mode}_light_mid.png`, format: 'png' });

  await setTheme(page, 'dark');
  await page.eval(() => { document.querySelector('main').scrollTop = 0; });
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${mode}_dark_top.png`, format: 'png' });

  const audit = await page.eval(() => {
    const main = document.querySelector('main');
    const text = main?.innerText || '';
    const journeyNav = main?.querySelector('nav[aria-label="Application pipeline stages"]');
    const stageButtons = Array.from(journeyNav?.querySelectorAll('button[aria-label^="Filter by "]') || []);
    const metricSection = main?.querySelector('section[aria-label="Key Pipeline Metrics"]');
    const metricCards = Array.from(metricSection?.children || []).map((card) => card.innerText.trim());
    const apiResources = performance
      .getEntriesByType('resource')
      .map((r) => r.name)
      .filter((n) => n.includes('/api/'));

    return {
      hasOldVolumeHeading: text.includes('ALL-TIME CUMULATIVE VOLUME') || text.includes('All-Time Cumulative Volume'),
      hasPipelineJourney: Boolean(journeyNav),
      journeyStageCount: stageButtons.length,
      journeyStageLabels: stageButtons.map((b) => b.getAttribute('aria-label')),
      hasKeyPipelineMetrics: Boolean(metricSection),
      metricCardCount: metricCards.length,
      metricCards,
      hasCurrentPipelineState: text.includes('CURRENT PIPELINE STATE') || text.includes('Current Pipeline State'),
      apiCalls: apiResources,
      jobsApiCalled: apiResources.some((u) => /\/api\/jobs(\?|$)/.test(u)),
      docOverflowX: document.documentElement.scrollWidth - window.innerWidth,
    };
  });

  // Tablet & Mobile responsive checks
  const tablet = await browser.newPage({ width: 768, height: 1024, dsf: 1 });
  await tablet.goto('http://localhost:5173/login', { settleMs: 400 });
  await tablet.eval((t) => localStorage.setItem('token', t), token);
  await tablet.goto('http://localhost:5173/insights', { settleMs: 1600 });
  await setTheme(tablet, 'light');
  await tablet.screenshot({ path: `${outDir}/${mode}_tablet_light.png`, format: 'png' });
  const tabletOverflow = await tablet.eval(() => document.documentElement.scrollWidth - window.innerWidth);

  const mobile = await browser.newPage({ width: 390, height: 844, dsf: 1 });
  await mobile.goto('http://localhost:5173/login', { settleMs: 400 });
  await mobile.eval((t) => localStorage.setItem('token', t), token);
  await mobile.goto('http://localhost:5173/insights', { settleMs: 1600 });
  await setTheme(mobile, 'dark');
  await mobile.eval(() => { document.querySelector('main').scrollTop = 260; });
  await sleep(250);
  await mobile.screenshot({ path: `${outDir}/${mode}_mobile_dark.png`, format: 'png' });
  const mobileOverflow = await mobile.eval(() => document.documentElement.scrollWidth - window.innerWidth);

  if (mode === 'after') {
    assert(!audit.hasOldVolumeHeading, 'Old All-Time Cumulative Volume heading still present');
    assert(audit.hasPipelineJourney, 'Missing PipelineJourneyBar nav');
    assert(audit.journeyStageCount === 7, `Expected 7 stages, got ${audit.journeyStageCount}`);
    assert(audit.hasKeyPipelineMetrics && audit.metricCardCount === 4, 'Missing 4 DashboardMetricStrip blocks');
    assert(audit.metricCards[0].includes('Total Applications') && audit.metricCards[0].includes('20'), 'Card 1 mismatch');
    assert(audit.metricCards[1].includes('Submitted') && audit.metricCards[1].includes('18'), 'Card 2 mismatch');
    assert(audit.metricCards[2].includes('In Pipeline') && audit.metricCards[2].includes('9'), 'Card 3 mismatch');
    assert(audit.metricCards[3].includes('Offers & Accepted') && audit.metricCards[3].includes('5'), 'Card 4 mismatch');
    assert(!audit.jobsApiCalled, `Unexpected duplicate /api/jobs request on Insights: ${JSON.stringify(audit.apiCalls)}`);
    assert(audit.docOverflowX <= 0 && tabletOverflow <= 0 && mobileOverflow <= 0, 'Horizontal overflow detected');

    // Interactive stage selection check on PipelineJourneyBar -> synchronizes Reset & overview highlight
    await page.eval(() => {
      const btn = document.querySelector('nav[aria-label="Application pipeline stages"] button[aria-label^="Filter by Interview"]');
      btn?.click();
    });
    await sleep(300);
    const interaction = await page.eval(() => {
      const btn = document.querySelector('nav[aria-label="Application pipeline stages"] button[aria-label^="Filter by Interview"]');
      const resetBtn = document.querySelector('nav[aria-label="Application pipeline stages"] button[title="Reset stage filter"]');
      const overviewRows = Array.from(document.querySelectorAll('[aria-label="Active stages list"] [role="button"]'));
      const interviewOverviewSelected = overviewRows.some(
        (r) => r.getAttribute('aria-label')?.startsWith('Interview:') && r.className.includes('ring-1')
      );
      return {
        pressed: btn?.getAttribute('aria-pressed'),
        hasResetBtn: Boolean(resetBtn),
        interviewOverviewSelected,
      };
    });
    assert(interaction.pressed === 'true', 'Stage button did not toggle aria-pressed');
    assert(interaction.hasResetBtn, 'Reset button did not appear');
    assert(interaction.interviewOverviewSelected, 'Overview stage row did not highlight in sync');
  }

  console.log(`${mode.toUpperCase()} AUDIT:`, JSON.stringify({ audit, tabletOverflow, mobileOverflow }, null, 2));
  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
