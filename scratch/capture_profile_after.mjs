import { Browser } from '../Frontend/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync } from 'node:fs';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZmY1NGU2Ny1jYTQ1LTQzZjQtODRjNy00YmRjNzk2ZjJhM2YiLCJ0b2tlblZlcnNpb24iOjEsImlhdCI6MTc5NDIxNjcyOCwiZXhwIjoxNzk0ODIxNTI4fQ.vGb5Nq6c3jQYzTlAPRZYIWylPPK_uzafLkeZ3HNoQVE";

mkdirSync('./scratch/profile_screenshots', { recursive: true });

async function run() {
  const browser = await Browser.launch({ width: 1440, height: 1000 });
  const page = await browser.newPage({ width: 1440, height: 1000, dsf: 1 });

  // Navigate to login / app and set token in localStorage
  await page.goto('http://localhost:5173/login', { settleMs: 500 });
  await page.eval((t) => {
    localStorage.setItem('token', t);
  }, token);

  // 1. Overview Tab - Dark Mode
  await page.goto('http://localhost:5173/profile?tab=overview', { settleMs: 1500 });
  await page.eval(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: './scratch/profile_screenshots/after_overview_dark.png', format: 'png', fullPage: true });
  console.log('Saved after_overview_dark.png');

  // 2. Overview Tab - Light Mode
  await page.eval(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: './scratch/profile_screenshots/after_overview_light.png', format: 'png', fullPage: true });
  console.log('Saved after_overview_light.png');

  // 3. Edit Tab - Dark Mode
  await page.goto('http://localhost:5173/profile?tab=edit', { settleMs: 1500 });
  await page.eval(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: './scratch/profile_screenshots/after_edit_dark.png', format: 'png', fullPage: true });
  console.log('Saved after_edit_dark.png');

  // 4. Edit Tab - Light Mode
  await page.eval(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: './scratch/profile_screenshots/after_edit_light.png', format: 'png', fullPage: true });
  console.log('Saved after_edit_light.png');

  // 5. Account Tab - Dark Mode
  await page.goto('http://localhost:5173/profile?tab=account', { settleMs: 1500 });
  await page.eval(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: './scratch/profile_screenshots/after_account_dark.png', format: 'png', fullPage: true });
  console.log('Saved after_account_dark.png');

  // 6. Account Tab - Light Mode
  await page.eval(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: './scratch/profile_screenshots/after_account_light.png', format: 'png', fullPage: true });
  console.log('Saved after_account_light.png');

  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
