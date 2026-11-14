import { Browser, sleep } from '../Frontend/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('../Backend/node_modules/dotenv').config({ path: './Backend/.env' });
const jwt = require('../Backend/node_modules/jsonwebtoken');

const ADMIN_USER_ID = '6564608c-35f5-40da-ac8a-b47f6e595d2d';
const token = jwt.sign({ userId: ADMIN_USER_ID, tokenVersion: 1 }, process.env.JWT_SECRET, { expiresIn: '2h' });

async function run() {
  const browser = await Browser.launch({ width: 1440, height: 1000 });
  const page = await browser.newPage({ width: 1440, height: 1000, dsf: 1 });

  await page.goto('http://localhost:5173/login', { settleMs: 400 });
  await page.eval((t) => localStorage.setItem('token', t), token);
  await page.goto('http://localhost:5173/insights', { settleMs: 2200 });

  await page.eval(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    const chartsSec = document.getElementById('primary-charts-section');
    if (chartsSec) {
      document.querySelector('main').scrollTop = chartsSec.offsetTop - 40;
    }
  });
  await sleep(1000);

  // Measure new layout
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

    return {
      leftColRect: leftColRect ? { width: Math.round(leftColRect.width), height: Math.round(leftColRect.height) } : null,
      rightColRect: rightCol ? { width: Math.round(rightCol.getBoundingClientRect().width), height: Math.round(rightCol.getBoundingClientRect().height) } : null,
      semanticToDonutGap: gap(semanticNote, donutWrapper),
      donutWrapperHeight: donutWrapRect ? Math.round(donutWrapRect.height) : null,
      subDescToSvgGap: gap(subDesc, subSvg),
      subSvgHeight: subSvg ? Math.round(subSvg.getBoundingClientRect().height) : null,
      subFooterGap: gap(subSvg, subFooter),
      spaceAboveDonut: donutRect && donutWrapRect ? Math.round(donutRect.top - donutWrapRect.top) : null,
      spaceBelowDonut: donutRect && donutWrapRect ? Math.round(donutWrapRect.bottom - donutRect.bottom) : null,
    };
  });

  console.log('NEW CHART LAYOUT:', JSON.stringify(layout, null, 2));

  // Find pie slices
  const slices = await page.eval(() => {
    const paths = Array.from(document.querySelectorAll('.recharts-pie-sector'));
    return paths.map((p, idx) => {
      const rect = p.getBoundingClientRect();
      return {
        idx,
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          centerX: Math.round(rect.x + rect.width / 2),
          centerY: Math.round(rect.y + rect.height / 2),
        },
      };
    });
  });

  console.log('FOUND SLICES COUNT:', slices.length);

  const hoverResults = [];

  for (const slice of slices) {
    // Hover on slice
    await page.eval(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      if (el) {
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: x, clientY: y }));
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: x, clientY: y }));
        el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y }));
      }
    }, { x: slice.rect.centerX, y: slice.rect.centerY });
    await sleep(250);

    const tooltipInfo = await page.eval(() => {
      const tt = document.querySelector('.recharts-tooltip-wrapper');
      const centerIndicator = document.querySelector('.pointer-events-none.text-center');
      if (!tt || !centerIndicator) return null;

      const ttRect = tt.getBoundingClientRect();

      // Individual central elements
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

      return {
        visible: getComputedStyle(tt).visibility !== 'hidden' && getComputedStyle(tt).display !== 'none',
        ttRect: { x: Math.round(ttRect.x), y: Math.round(ttRect.y), w: Math.round(ttRect.width), h: Math.round(ttRect.height) },
        textBounds: { l: Math.round(textBounds.left), r: Math.round(textBounds.right), t: Math.round(textBounds.top), b: Math.round(textBounds.bottom) },
        intersectsText,
      };
    });

    hoverResults.push({ sliceIdx: slice.idx, ...tooltipInfo });
  }

  console.log('HOVER RESULTS:', JSON.stringify(hoverResults, null, 2));

  await browser.close();
}

run().catch(console.error);
