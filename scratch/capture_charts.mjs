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
  await page.goto('http://localhost:5173/insights', { settleMs: 2000 });

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

  // Capture screenshot of light mode
  const sec = await page.eval(() => {
    const el = document.getElementById('primary-charts-section');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
  });

  if (sec) {
    await page.screenshot({
      path: 'scratch/charts_light_current.png',
      clip: sec,
    });
  }

  // Hover over Rejected slice (slice 6) to see tooltip
  const slice6 = await page.eval(() => {
    const paths = Array.from(document.querySelectorAll('.recharts-pie-sector'));
    if (paths.length >= 7) {
      const r = paths[6].getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }
    return null;
  });

  if (slice6) {
    await page.eval(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      if (el) {
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: x, clientY: y }));
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: x, clientY: y }));
        el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y }));
      }
    }, slice6);
    await sleep(300);

    await page.screenshot({
      path: 'scratch/charts_light_hover_rejected.png',
      clip: sec,
    });
  }

  // Also switch to dark mode
  await page.eval(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
  await sleep(300);

  await page.screenshot({
    path: 'scratch/charts_dark_hover_rejected.png',
    clip: sec,
  });

  await browser.close();
}

run().catch(console.error);
