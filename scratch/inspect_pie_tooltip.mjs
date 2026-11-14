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
  await page.goto('http://localhost:5173/insights', { settleMs: 1800 });

  await page.eval(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    const chartsSec = document.getElementById('primary-charts-section');
    if (chartsSec) {
      document.querySelector('main').scrollTop = chartsSec.offsetTop - 40;
    }
  });
  await sleep(400);

  // Inspect chart layout measurements
  const layout = await page.eval(() => {
    const chartsSec = document.getElementById('primary-charts-section');
    const cols = Array.from(chartsSec?.querySelectorAll(':scope > div > div') || []);
    const leftCol = cols[0];
    const rightCol = cols[1];

    const semanticNote = leftCol?.querySelector('.border-l-2');
    const donutWrapper = leftCol?.querySelector('.relative.w-full.h-64, .relative.w-full');
    const svgPie = leftCol?.querySelector('svg.recharts-surface');

    const subTitle = rightCol?.querySelector('h3');
    const subDesc = rightCol?.querySelector('p');
    const subSvg = rightCol?.querySelector('svg:not(.recharts-surface)');
    const subFooter = rightCol?.querySelector('.border-t');

    const gap = (a, b) => a && b ? Math.round(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom) : null;

    return {
      leftColRect: leftCol ? { width: Math.round(leftCol.getBoundingClientRect().width), height: Math.round(leftCol.getBoundingClientRect().height) } : null,
      rightColRect: rightCol ? { width: Math.round(rightCol.getBoundingClientRect().width), height: Math.round(rightCol.getBoundingClientRect().height) } : null,
      semanticToDonutGap: gap(semanticNote, donutWrapper),
      donutWrapperHeight: donutWrapper ? Math.round(donutWrapper.getBoundingClientRect().height) : null,
      subDescToSvgGap: gap(subDesc, subSvg),
      subSvgHeight: subSvg ? Math.round(subSvg.getBoundingClientRect().height) : null,
      subFooterGap: gap(subSvg, subFooter),
    };
  });

  console.log('CURRENT CHART LAYOUT:', JSON.stringify(layout, null, 2));

  // Find pie slices and their bounding boxes
  const slices = await page.eval(() => {
    const paths = Array.from(document.querySelectorAll('.recharts-pie-sector'));
    return paths.map((p, idx) => {
      const rect = p.getBoundingClientRect();
      const fill = p.getAttribute('fill');
      return {
        idx,
        fill,
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

  console.log('PIE SLICES DETECTED:', slices);

  if (slices.length > 0) {
    // Hover over each slice and measure tooltip position vs central hole
    for (const slice of slices) {
      // Hover using mouse
      await page.eval(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        if (el) {
          el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: x, clientY: y }));
          el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y }));
        }
      }, { x: slice.rect.centerX, y: slice.rect.centerY });
      await sleep(150);

      const tooltipInfo = await page.eval(() => {
        const tt = document.querySelector('.recharts-tooltip-wrapper');
        const centerText = document.querySelector('.recharts-wrapper')?.parentElement?.querySelector('.pointer-events-none');
        if (!tt) return null;
        const ttRect = tt.getBoundingClientRect();
        const cRect = centerText ? centerText.getBoundingClientRect() : null;

        // Check if ttRect intersects cRect
        const intersects = cRect ? !(
          ttRect.right < cRect.left ||
          ttRect.left > cRect.right ||
          ttRect.bottom < cRect.top ||
          ttRect.top > cRect.bottom
        ) : false;

        return {
          visible: getComputedStyle(tt).visibility !== 'hidden' && getComputedStyle(tt).display !== 'none',
          ttRect: { x: Math.round(ttRect.x), y: Math.round(ttRect.y), w: Math.round(ttRect.width), h: Math.round(ttRect.height) },
          cRect: cRect ? { x: Math.round(cRect.x), y: Math.round(cRect.y), w: Math.round(cRect.width), h: Math.round(cRect.height) } : null,
          intersectsCenter: intersects,
        };
      });

      console.log(`Slice ${slice.idx} (${slice.fill}) Tooltip:`, tooltipInfo);
    }
  }

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
