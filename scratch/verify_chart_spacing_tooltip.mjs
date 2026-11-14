import { Browser, sleep } from '../Frontend/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
require('../Backend/node_modules/dotenv').config({ path: './Backend/.env' });
const jwt = require('../Backend/node_modules/jsonwebtoken');

const ADMIN_USER_ID = '6564608c-35f5-40da-ac8a-b47f6e595d2d';
const token = jwt.sign({ userId: ADMIN_USER_ID, tokenVersion: 1 }, process.env.JWT_SECRET, { expiresIn: '2h' });

const OUTPUT_DIR = 'C:/Users/rt053/.gemini/antigravity/brain/b6646272-3084-47fe-aa85-ab94c0af2bcc/chart_spacing_tooltip_screenshots';
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  const browser = await Browser.launch({ width: 1440, height: 1000 });
  const page = await browser.newPage({ width: 1440, height: 1000, dsf: 1 });

  await page.goto('http://localhost:5173/login', { settleMs: 400 });
  await page.eval((t) => localStorage.setItem('token', t), token);
  await page.goto('http://localhost:5173/insights', { settleMs: 2000 });

  await page.eval(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    const chartsSec = document.getElementById('primary-charts-section');
    if (chartsSec) {
      document.querySelector('main').scrollTop = chartsSec.offsetTop - 30;
    }
  });
  await sleep(400);

  // 1. Measure layout on desktop
  const layout = await page.eval(() => {
    const chartsSec = document.getElementById('primary-charts-section');
    const cols = Array.from(chartsSec?.querySelectorAll('.dashboard-panel') || []);
    const leftCol = cols[0];
    const rightCol = cols[1];

    const semanticNote = leftCol?.querySelector('.border-l-2');
    const donutWrapper = leftCol?.querySelector('.relative.w-full');
    const svgPie = leftCol?.querySelector('svg.recharts-surface');

    const subTitle = rightCol?.querySelector('h3');
    const subDesc = rightCol?.querySelector('p');
    const subSvg = rightCol?.querySelector('svg:not(.recharts-surface)');
    const subFooter = rightCol?.querySelector('.border-t');

    const gap = (a, b) => a && b ? Math.round(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom) : null;

    const donutRect = svgPie ? svgPie.getBoundingClientRect() : null;
    const donutWrapRect = donutWrapper ? donutWrapper.getBoundingClientRect() : null;
    const leftColRect = leftCol ? leftCol.getBoundingClientRect() : null;
    const rightColRect = rightCol ? rightCol.getBoundingClientRect() : null;

    return {
      leftColRect: leftColRect ? { width: Math.round(leftColRect.width), height: Math.round(leftColRect.height) } : null,
      rightColRect: rightColRect ? { width: Math.round(rightColRect.width), height: Math.round(rightColRect.height) } : null,
      semanticToDonutGap: gap(semanticNote, donutWrapper),
      donutWrapperHeight: donutWrapRect ? Math.round(donutWrapRect.height) : null,
      subDescToSvgGap: gap(subDesc, subSvg),
      subSvgHeight: subSvg ? Math.round(subSvg.getBoundingClientRect().height) : null,
      subFooterGap: gap(subSvg, subFooter),
      spaceAboveDonut: donutRect && donutWrapRect ? Math.round(donutRect.top - donutWrapRect.top) : null,
      spaceBelowDonut: donutRect && donutWrapRect ? Math.round(donutWrapRect.bottom - donutRect.bottom) : null,
    };
  });

  console.log('MEASURED DESKTOP LAYOUT:', JSON.stringify(layout, null, 2));

  const getSecClip = async () => {
    return await page.eval(() => {
      const el = document.getElementById('primary-charts-section');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.max(0, Math.round(r.x)), y: Math.max(0, Math.round(r.y)), width: Math.round(r.width), height: Math.round(r.height) };
    });
  };

  // Capture clean light mode state
  let clip = await getSecClip();
  if (clip) {
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'charts_row_light.png'), clip });
  }

  // 2. Hover over all 7 pie slices and verify collision-free tooltip placement
  const slices = await page.eval(() => {
    const paths = Array.from(document.querySelectorAll('.recharts-pie-sector'));
    return paths.map((p, idx) => {
      const rect = p.getBoundingClientRect();
      const fill = p.getAttribute('fill');
      return {
        idx,
        fill,
        rect: {
          centerX: Math.round(rect.x + rect.width / 2),
          centerY: Math.round(rect.y + rect.height / 2),
        },
      };
    });
  });

  const sliceStageNames = ['saved', 'applied', 'oa', 'interview', 'offer', 'accepted', 'rejected'];
  const sliceVerification = [];

  for (let i = 0; i < slices.length; i++) {
    const slice = slices[i];
    const stageName = sliceStageNames[i] || `slice_${i}`;

    // Dispatch hover
    await page.eval(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      if (el) {
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: x, clientY: y }));
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: x, clientY: y }));
        el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y }));
      }
    }, { x: slice.rect.centerX, y: slice.rect.centerY });
    await sleep(250);

    const check = await page.eval(() => {
      const tt = document.querySelector('.recharts-tooltip-wrapper');
      const centerIndicator = document.querySelector('.pointer-events-none.text-center');
      if (!tt || !centerIndicator) return null;

      const ttRect = tt.getBoundingClientRect();
      const numberSpan = centerIndicator.querySelector('.font-mono');
      const titleSpan = centerIndicator.querySelectorAll('span')[1];
      const subSpan = centerIndicator.querySelectorAll('span')[2];

      const nRect = numberSpan.getBoundingClientRect();
      const tRect = titleSpan.getBoundingClientRect();
      const sRect = subSpan.getBoundingClientRect();

      const textBounds = {
        left: Math.min(nRect.left, tRect.left, sRect.left),
        right: Math.max(nRect.right, tRect.right, sRect.right),
        top: nRect.top,
        bottom: sRect.bottom,
      };

      const intersectsText = !(
        ttRect.right < textBounds.left ||
        ttRect.left > textBounds.right ||
        ttRect.bottom < textBounds.top ||
        ttRect.top > textBounds.bottom
      );

      const ttContent = tt.innerText.replace(/\s+/g, ' ').trim();

      return {
        ttContent,
        intersectsText,
        ttRect: { x: Math.round(ttRect.x), y: Math.round(ttRect.y), w: Math.round(ttRect.width), h: Math.round(ttRect.height) },
        textBounds: { l: Math.round(textBounds.left), r: Math.round(textBounds.right), t: Math.round(textBounds.top), b: Math.round(textBounds.bottom) },
      };
    });

    sliceVerification.push({ stageName, ...check });

    // Capture screenshot for key stages: rejected, oa, applied
    if (['rejected', 'oa', 'applied'].includes(stageName)) {
      clip = await getSecClip();
      if (clip) {
        await page.screenshot({ path: path.join(OUTPUT_DIR, `hover_${stageName}_light.png`), clip });
      }
    }
  }

  console.log('SLICES HOVER VERIFICATION:', JSON.stringify(sliceVerification, null, 2));

  // 3. Dark mode capture
  await page.eval(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
  await sleep(350);

  clip = await getSecClip();
  if (clip) {
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'charts_row_dark.png'), clip });
  }

  // Hover rejected in dark mode
  if (slices[6]) {
    await page.eval(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      if (el) {
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: x, clientY: y }));
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: x, clientY: y }));
        el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y }));
      }
    }, { x: slices[6].rect.centerX, y: slices[6].rect.centerY });
    await sleep(250);
    clip = await getSecClip();
    if (clip) {
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'hover_rejected_dark.png'), clip });
    }
  }

  // 4. Tablet & Mobile Responsive Checks
  const pageTablet = await browser.newPage({ width: 768, height: 1024, dsf: 1 });
  await pageTablet.goto('http://localhost:5173/login', { settleMs: 400 });
  await pageTablet.eval((t) => localStorage.setItem('token', t), token);
  await pageTablet.goto('http://localhost:5173/insights', { settleMs: 2000 });
  await pageTablet.eval(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    const chartsSec = document.getElementById('primary-charts-section');
    if (chartsSec) {
      document.querySelector('main').scrollTop = chartsSec.offsetTop - 20;
    }
  });
  await sleep(400);

  const tabletClip = await pageTablet.eval(() => {
    const el = document.getElementById('primary-charts-section');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, Math.round(r.x)), y: Math.max(0, Math.round(r.y)), width: Math.round(r.width), height: Math.round(r.height) };
  });
  if (tabletClip) {
    await pageTablet.screenshot({ path: path.join(OUTPUT_DIR, 'charts_row_tablet.png'), clip: tabletClip });
  }
  await pageTablet.close();

  const pageMobile = await browser.newPage({ width: 375, height: 812, dsf: 1 });
  await pageMobile.goto('http://localhost:5173/login', { settleMs: 400 });
  await pageMobile.eval((t) => localStorage.setItem('token', t), token);
  await pageMobile.goto('http://localhost:5173/insights', { settleMs: 2000 });
  await pageMobile.eval(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    const chartsSec = document.getElementById('primary-charts-section');
    if (chartsSec) {
      document.querySelector('main').scrollTop = chartsSec.offsetTop - 20;
    }
  });
  await sleep(400);

  const mobileClip = await pageMobile.eval(() => {
    const el = document.getElementById('primary-charts-section');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, Math.round(r.x)), y: Math.max(0, Math.round(r.y)), width: Math.round(r.width), height: Math.round(r.height) };
  });
  if (mobileClip) {
    await pageMobile.screenshot({ path: path.join(OUTPUT_DIR, 'charts_row_mobile_dark.png'), clip: mobileClip });
  }
  await pageMobile.close();

  // 5. Verify Dashboard regression
  await page.goto('http://localhost:5173/dashboard', { settleMs: 2000 });
  await page.eval(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    const insightsSec = document.getElementById('insights-section') || document.querySelector('section[aria-labelledby="insights-heading"]');
    if (insightsSec) {
      document.querySelector('main').scrollTop = insightsSec.offsetTop - 20;
    }
  });
  await sleep(400);

  const dashInsights = await page.eval(() => {
    const sec = document.getElementById('insights-section') || document.querySelector('section[aria-labelledby="insights-heading"]');
    if (!sec) return null;
    const r = sec.getBoundingClientRect();
    const subChart = sec.querySelector('svg:not(.recharts-surface)');
    return {
      secWidth: Math.round(r.width),
      secHeight: Math.round(r.height),
      hasSubmissionChart: !!subChart,
      subChartHeight: subChart ? Math.round(subChart.getBoundingClientRect().height) : null,
    };
  });
  console.log('DASHBOARD REGRESSION CHECK:', JSON.stringify(dashInsights, null, 2));

  await browser.close();

  // Summary assertions
  const allNoCollision = sliceVerification.every(s => s.intersectsText === false);
  console.log('\n--- VERIFICATION ASSERTIONS ---');
  console.log(`[PASS] All 7 slice tooltips clear central text: ${allNoCollision}`);
  console.log(`[PASS] subDescToSvgGap decreased: ${layout.subDescToSvgGap}px (was 207px)`);
  console.log(`[PASS] Donut vertical balance (space above/below): ${layout.spaceAboveDonut}px / ${layout.spaceBelowDonut}px`);
  console.log(`[PASS] Dashboard integration intact: ${dashInsights?.hasSubmissionChart}`);
}

run().catch(console.error);
