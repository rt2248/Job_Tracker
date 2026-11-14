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
  await page.goto('http://localhost:5173/insights', { settleMs: 1500 });
  await sleep(1000);

  const url = await page.eval(() => window.location.href);
  const htmlSnippets = await page.eval(() => {
    return {
      bodyText: document.body.innerText.slice(0, 300),
      hasChartsSec: !!document.getElementById('primary-charts-section'),
      panels: document.querySelectorAll('.dashboard-panel').length,
    };
  });
  console.log('CURRENT URL:', url);
  console.log('PAGE INFO:', htmlSnippets);
  await browser.close();
}

run().catch(console.error);
