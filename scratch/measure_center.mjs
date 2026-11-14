import { Browser } from '../Frontend/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
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

  const metrics = await page.eval(() => {
    const centerIndicator = document.querySelector('.pointer-events-none.text-center');
    const rechartsWrapper = document.querySelector('.recharts-wrapper');
    const donutWrapper = rechartsWrapper?.parentElement;

    const rRect = rechartsWrapper.getBoundingClientRect();
    const cRect = centerIndicator.getBoundingClientRect();

    // The individual text lines
    const numberSpan = centerIndicator.querySelector('.font-mono');
    const titleSpan = centerIndicator.querySelectorAll('span')[1];
    const subSpan = centerIndicator.querySelectorAll('span')[2];

    const nRect = numberSpan.getBoundingClientRect();
    const tRect = titleSpan.getBoundingClientRect();
    const sRect = subSpan.getBoundingClientRect();

    return {
      wrapper: { w: Math.round(rRect.width), h: Math.round(rRect.height) },
      fullIndicatorBoxRelative: {
        x: Math.round(cRect.x - rRect.x),
        y: Math.round(cRect.y - rRect.y),
        w: Math.round(cRect.width),
        h: Math.round(cRect.height),
      },
      actualTextBoundsRelative: {
        left: Math.round(Math.min(nRect.left, tRect.left, sRect.left) - rRect.left),
        right: Math.round(Math.max(nRect.right, tRect.right, sRect.right) - rRect.left),
        top: Math.round(nRect.top - rRect.top),
        bottom: Math.round(sRect.bottom - rRect.top),
        width: Math.round(Math.max(nRect.right, tRect.right, sRect.right) - Math.min(nRect.left, tRect.left, sRect.left)),
        height: Math.round(sRect.bottom - nRect.top),
      }
    };
  });

  console.log('ACTUAL CENTER METRICS:', JSON.stringify(metrics, null, 2));
  await browser.close();
}

run().catch(console.error);
