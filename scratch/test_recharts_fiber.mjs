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

  // Check what recharts stores on pie sector elements or fiber
  const sectorData = await page.eval(() => {
    const sectors = Array.from(document.querySelectorAll('.recharts-pie-sector'));
    return sectors.map((s) => {
      // get react fiber or recharts props if available
      const key = Object.keys(s).find(k => k.startsWith('__reactFiber$'));
      const fiber = key ? s[key] : null;
      const memoizedProps = fiber?.memoizedProps;
      return {
        cx: memoizedProps?.cx,
        cy: memoizedProps?.cy,
        innerRadius: memoizedProps?.innerRadius,
        outerRadius: memoizedProps?.outerRadius,
        startAngle: memoizedProps?.startAngle,
        endAngle: memoizedProps?.endAngle,
        midAngle: memoizedProps?.midAngle,
        payload: memoizedProps?.payload,
      };
    });
  });

  console.log('SECTOR DATA FROM FIBER:', JSON.stringify(sectorData, null, 2));
  await browser.close();
}

run().catch(console.error);
