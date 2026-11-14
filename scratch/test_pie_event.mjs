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
    const chartsSec = document.getElementById('primary-charts-section');
    if (chartsSec) {
      document.querySelector('main').scrollTop = chartsSec.offsetTop - 40;
    }
  });
  await sleep(400);

  // Dispatch mouseover on the first slice
  await page.eval(() => {
    const paths = Array.from(document.querySelectorAll('.recharts-pie-sector'));
    if (paths.length > 0) {
      const rect = paths[0].getBoundingClientRect();
      const x = rect.x + rect.width / 2;
      const y = rect.y + rect.height / 2;
      const el = document.elementFromPoint(x, y);
      if (el) {
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: x, clientY: y }));
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: x, clientY: y }));
      }
    }
  });

  await sleep(300);
  const ttRect = await page.eval(() => {
    const tt = document.querySelector('.recharts-tooltip-wrapper');
    const container = document.querySelector('.recharts-wrapper');
    if (!tt || !container) return null;
    const cR = container.getBoundingClientRect();
    const tR = tt.getBoundingClientRect();
    return {
      relativeX: Math.round(tR.x - cR.x),
      relativeY: Math.round(tR.y - cR.y),
      ttWidth: Math.round(tR.width),
      ttHeight: Math.round(tR.height),
      transform: tt.style.transform,
      left: tt.style.left,
      top: tt.style.top,
    };
  });
  console.log('TOOLTIP RECT RELATIVE TO CONTAINER:', ttRect);
  await browser.close();
}

run().catch(console.error);
