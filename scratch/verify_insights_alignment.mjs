import { Browser, sleep } from '../Frontend/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('../Backend/node_modules/dotenv').config({ path: './Backend/.env' });
const jwt = require('../Backend/node_modules/jsonwebtoken');

const mode = process.argv[2] || 'after';
const ADMIN_USER_ID = '6564608c-35f5-40da-ac8a-b47f6e595d2d';
const token = jwt.sign({ userId: ADMIN_USER_ID, tokenVersion: 1 }, process.env.JWT_SECRET, { expiresIn: '2h' });

const outDir = './scratch/insights_alignment_screenshots';
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

async function scrollAndCaptureSections(page, prefix, modeName) {
  const scrollHeight = await page.eval(() => document.querySelector('main')?.scrollHeight || 0);
  const clientHeight = await page.eval(() => document.querySelector('main')?.clientHeight || 1000);

  await page.eval(() => { document.querySelector('main').scrollTop = 0; });
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${modeName}_${prefix}_top.png`, format: 'png' });

  await page.eval((h) => { document.querySelector('main').scrollTop = Math.round(h * 0.34); }, scrollHeight);
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${modeName}_${prefix}_mid.png`, format: 'png' });

  await page.eval((h) => { document.querySelector('main').scrollTop = Math.round(h * 0.68); }, scrollHeight);
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${modeName}_${prefix}_low.png`, format: 'png' });

  await page.eval((h) => { document.querySelector('main').scrollTop = h; }, scrollHeight);
  await sleep(250);
  await page.screenshot({ path: `${outDir}/${modeName}_${prefix}_bottom.png`, format: 'png' });

  return { scrollHeight, clientHeight };
}

async function run() {
  const browser = await Browser.launch({ width: 1440, height: 1000 });
  const page = await browser.newPage({ width: 1440, height: 1000, dsf: 1 });

  await page.goto('http://localhost:5173/login', { settleMs: 400 });
  await page.eval((t) => localStorage.setItem('token', t), token);
  await page.goto('http://localhost:5173/insights', { settleMs: 1800 });

  assert(page.consoleErrors.length === 0, `Console errors: ${page.consoleErrors.join('; ')}`);

  // Audit Typography, Sections, Nested Scrollbars, Emojis
  const audit = await page.eval(() => {
    const main = document.querySelector('main');
    const h1 = main?.querySelector('h1');
    const h1Style = h1 ? getComputedStyle(h1) : null;
    const volLabel = Array.from(main?.querySelectorAll('div') || []).find((d) => d.textContent?.trim() === 'All-Time Cumulative Volume');
    const snapLabel = Array.from(main?.querySelectorAll('div') || []).find((d) => d.textContent?.trim() === 'Current Pipeline State');
    const staleList = main?.querySelector('[aria-label="Stale applications list"]');

    // Check emoji presence in visible text (excluding SVG paths)
    const text = main?.innerText || '';
    const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    const emojiMatch = text.match(emojiRegex);

    const kpiValues = Array.from(main?.querySelectorAll('section[aria-labelledby="kpi-metrics-heading"] p.font-mono') || []).map((p) => ({
      text: p.textContent?.trim(),
      fontSize: getComputedStyle(p).fontSize,
      color: getComputedStyle(p).color,
    }));

    return {
      h1Text: h1?.textContent?.trim(),
      h1Font: h1Style ? `${h1Style.fontFamily} | ${h1Style.fontSize} | ${h1Style.fontWeight}` : null,
      volHeadingColor: volLabel ? getComputedStyle(volLabel).color : null,
      snapHeadingColor: snapLabel ? getComputedStyle(snapLabel).color : null,
      kpiValues,
      docOverflowX: document.documentElement.scrollWidth - window.innerWidth,
      staleListHasNestedScroll: staleList ? staleList.scrollHeight > staleList.clientHeight : false,
      staleListOverflowY: staleList ? getComputedStyle(staleList).overflowY : null,
      emojiFound: emojiMatch ? emojiMatch[0] : null,
      hasCheckChar: text.includes('✓'),
      hasPieSvg: Boolean(main?.querySelector('.recharts-wrapper svg')),
      hasActivitySvg: Boolean(main?.querySelector('[aria-label*="Activity timeline line chart"]')),
      hasSkillFit: Boolean(main?.querySelector('[aria-label="Skill-fit analysis"]')),
    };
  });

  await setTheme(page, 'light');
  const lightScroll = await scrollAndCaptureSections(page, 'light', mode);

  await setTheme(page, 'dark');
  const darkScroll = await scrollAndCaptureSections(page, 'dark', mode);

  // Tablet viewport (768x1024)
  const tablet = await browser.newPage({ width: 768, height: 1024, dsf: 1 });
  await tablet.goto('http://localhost:5173/login', { settleMs: 400 });
  await tablet.eval((t) => localStorage.setItem('token', t), token);
  await tablet.goto('http://localhost:5173/insights', { settleMs: 1800 });
  await setTheme(tablet, 'light');
  await tablet.eval(() => { document.querySelector('main').scrollTop = 0; });
  await sleep(250);
  await tablet.screenshot({ path: `${outDir}/${mode}_tablet_light_top.png`, format: 'png' });
  const tabletOverflow = await tablet.eval(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(tabletOverflow <= 0, `Tablet overflow: ${tabletOverflow}`);

  // Mobile viewport (390x844)
  const mobile = await browser.newPage({ width: 390, height: 844, dsf: 1 });
  await mobile.goto('http://localhost:5173/login', { settleMs: 400 });
  await mobile.eval((t) => localStorage.setItem('token', t), token);
  await mobile.goto('http://localhost:5173/insights', { settleMs: 1800 });
  await setTheme(mobile, 'dark');
  await mobile.eval(() => { document.querySelector('main').scrollTop = 0; });
  await sleep(250);
  await mobile.screenshot({ path: `${outDir}/${mode}_mobile_dark_top.png`, format: 'png' });
  await mobile.eval(() => { document.querySelector('main').scrollTop = 700; });
  await sleep(250);
  await mobile.screenshot({ path: `${outDir}/${mode}_mobile_dark_mid.png`, format: 'png' });
  const mobileOverflow = await mobile.eval(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(mobileOverflow <= 0, `Mobile overflow: ${mobileOverflow}`);

  if (mode === 'after') {
    assert(!audit.emojiFound, `Emoji found in UI: ${audit.emojiFound}`);
    assert(!audit.hasCheckChar, 'Unicode checkmark still present in UI');
    assert(audit.docOverflowX <= 0, `Desktop overflow: ${audit.docOverflowX}`);
    assert(audit.hasPieSvg && audit.hasActivitySvg && audit.hasSkillFit, 'Missing primary analytics components');
    assert(!audit.staleListHasNestedScroll, 'Nested scrollbar active in Stale Application Alerts');

    // Interactive checks: time range selector, stage selection, skill fit toggle
    await setTheme(page, 'light');
    await page.eval(() => { document.querySelector('main').scrollTop = 0; });
    await sleep(200);
    await page.eval(() => {
      const btn90 = Array.from(document.querySelectorAll('[role="tab"]')).find((b) => b.textContent?.trim() === '90 Days');
      btn90?.click();
    });
    await sleep(900);
    const range90Selected = await page.eval(() => {
      const btn90 = Array.from(document.querySelectorAll('[role="tab"]')).find((b) => b.textContent?.trim() === '90 Days');
      return btn90?.getAttribute('aria-selected');
    });
    assert(range90Selected === 'true', `90 Days range tab did not activate: ${range90Selected}`);

    // Click stage breakdown row & verify dimming / selection state toggles cleanly
    await page.eval(() => {
      const row = document.querySelector('[aria-label="Active stages list"] [role="button"]');
      row?.click();
    });
    await sleep(250);
    const stageSelectedOk = await page.eval(() => {
      const rows = Array.from(document.querySelectorAll('[aria-label="Active stages list"] [role="button"]'));
      return rows.some((r) => r.className.includes('ring-1'));
    });
    assert(stageSelectedOk, 'Stage cross-filtering click did not select row');
  }

  console.log(`${mode.toUpperCase()} INSIGHTS AUDIT:`, JSON.stringify({ audit, lightScroll, darkScroll, tabletOverflow, mobileOverflow }, null, 2));
  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
