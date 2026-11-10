import { Browser } from '../Frontend/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync } from 'node:fs';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZmY1NGU2Ny1jYTQ1LTQzZjQtODRjNy00YmRjNzk2ZjJhM2YiLCJ0b2tlblZlcnNpb24iOjEsImlhdCI6MTc5NDIxNjcyOCwiZXhwIjoxNzk0ODIxNTI4fQ.vGb5Nq6c3jQYzTlAPRZYIWylPPK_uzafLkeZ3HNoQVE";

mkdirSync('./scratch/split_screenshots', { recursive: true });

const assert = (cond, msg) => {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function setTheme(page, mode) {
  await page.eval((m) => {
    document.documentElement.setAttribute('data-theme', m);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(m);
  }, mode);
  await sleep(300);
}

async function run() {
  const browser = await Browser.launch({ width: 1440, height: 1000 });
  const page = await browser.newPage({ width: 1440, height: 1000, dsf: 1 });

  await page.goto('http://localhost:5173/login', { settleMs: 400 });
  await page.eval((t) => localStorage.setItem('token', t), token);

  // 1. Desktop 1440x1000 Overview Verification
  await page.goto('http://localhost:5173/profile?tab=overview', { settleMs: 1500 });
  await setTheme(page, 'dark');

  assert(page.consoleErrors.length === 0, `Console errors: ${page.consoleErrors.join('; ')}`);

  const beforeMetrics = await page.eval(() => {
    const main = document.querySelector('main');
    const aside = document.querySelector('aside[aria-label="Persistent Profile Card"]');
    const leftCard = document.querySelector('section[aria-label="Profile Identity"]');
    const rightPanel = document.querySelector('[data-testid="overview-right-scroll"]');
    const tablist = document.querySelector('[role="tablist"]');
    const sidebar = document.querySelector('aside'); // outer dashboard sidebar
    const mainCs = getComputedStyle(main);

    const asideRect = aside.getBoundingClientRect();
    const leftCardRect = leftCard.getBoundingClientRect();
    const rightRect = rightPanel.getBoundingClientRect();
    const tabRect = tablist.getBoundingClientRect();
    const sbRect = sidebar.getBoundingClientRect();

    return {
      mainScrollHeight: main.scrollHeight,
      mainClientHeight: main.clientHeight,
      mainOverflowY: mainCs.overflowY,
      rightScrollHeight: rightPanel.scrollHeight,
      rightClientHeight: rightPanel.clientHeight,
      leftCardTop: leftCardRect.top,
      leftCardLeft: leftCardRect.left,
      leftCardWidth: leftCardRect.width,
      rightWidth: rightRect.width,
      tabBottom: tabRect.bottom,
      sbRight: sbRect.right,
      asideScrollHeight: aside.scrollHeight,
      asideClientHeight: aside.clientHeight,
      docOverflowX: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  console.log('Desktop 1440x1000 Initial Metrics:', beforeMetrics);

  assert(beforeMetrics.docOverflowX <= 0, `Unexpected horizontal overflow: ${beforeMetrics.docOverflowX}`);
  assert(
    beforeMetrics.mainScrollHeight <= beforeMetrics.mainClientHeight + 1,
    `Main developed unwanted scrollbar: scrollHeight=${beforeMetrics.mainScrollHeight}, clientHeight=${beforeMetrics.mainClientHeight}`
  );
  assert(
    beforeMetrics.rightScrollHeight > beforeMetrics.rightClientHeight,
    `Right panel must overflow vertically to scroll independently: scrollH=${beforeMetrics.rightScrollHeight}, clientH=${beforeMetrics.rightClientHeight}`
  );
  assert(
    beforeMetrics.leftCardTop >= beforeMetrics.tabBottom - 1,
    `Left card overlaps tab header: leftTop=${beforeMetrics.leftCardTop}, tabBottom=${beforeMetrics.tabBottom}`
  );
  assert(
    beforeMetrics.leftCardLeft >= beforeMetrics.sbRight - 1,
    `Left card overlaps sidebar: leftLeft=${beforeMetrics.leftCardLeft}, sbRight=${beforeMetrics.sbRight}`
  );

  await page.screenshot({ path: './scratch/split_screenshots/after_split_dark_top.png', format: 'png' });

  // Scroll the right panel down and assert Left Profile Card stays 100% stationary!
  const afterScrollMetrics = await page.eval(() => {
    const rightPanel = document.querySelector('[data-testid="overview-right-scroll"]');
    const leftCard = document.querySelector('section[aria-label="Profile Identity"]');
    const main = document.querySelector('main');
    rightPanel.scrollTop = rightPanel.scrollHeight;
    return {
      rightScrollTop: rightPanel.scrollTop,
      mainScrollTop: main.scrollTop,
      leftCardTopAfter: leftCard.getBoundingClientRect().top,
      leftCardLeftAfter: leftCard.getBoundingClientRect().left,
      resumeBottom: document.querySelector('section[aria-label="Resume Management"]')?.getBoundingClientRect()?.bottom,
      sessionBottom: document.querySelector('section[aria-label="Account Session"]')?.getBoundingClientRect()?.bottom,
    };
  });
  console.log('Desktop 1440x1000 Scrolled Metrics:', afterScrollMetrics);

  assert(afterScrollMetrics.rightScrollTop > 100, `Right panel did not scroll: ${afterScrollMetrics.rightScrollTop}`);
  assert(afterScrollMetrics.mainScrollTop === 0, `Outer main scrolled unexpectedly: ${afterScrollMetrics.mainScrollTop}`);
  assert(
    Math.abs(afterScrollMetrics.leftCardTopAfter - beforeMetrics.leftCardTop) < 0.5,
    `Left profile card moved vertically while scrolling right: before=${beforeMetrics.leftCardTop}, after=${afterScrollMetrics.leftCardTopAfter}`
  );
  assert(
    Math.abs(afterScrollMetrics.leftCardLeftAfter - beforeMetrics.leftCardLeft) < 0.5,
    `Left profile card shifted horizontally: before=${beforeMetrics.leftCardLeft}, after=${afterScrollMetrics.leftCardLeftAfter}`
  );

  await sleep(300);
  await page.screenshot({ path: './scratch/split_screenshots/after_split_dark_scrolled.png', format: 'png' });

  // Light Mode Top & Scrolled
  await page.eval(() => {
    document.querySelector('[data-testid="overview-right-scroll"]').scrollTop = 0;
  });
  await setTheme(page, 'light');
  await page.screenshot({ path: './scratch/split_screenshots/after_split_light_top.png', format: 'png' });

  await page.eval(() => {
    const rp = document.querySelector('[data-testid="overview-right-scroll"]');
    rp.scrollTop = rp.scrollHeight;
  });
  await sleep(300);
  await page.screenshot({ path: './scratch/split_screenshots/after_split_light_scrolled.png', format: 'png' });

  // Test Avatar Preview Click still opens inside the two-column card
  await setTheme(page, 'dark');
  await page.eval(() => {
    document.querySelector('section[aria-label="Profile Identity"] button[aria-label*="profile picture"]')?.click();
  });
  await sleep(250);
  assert(await page.eval(() => Boolean(document.querySelector('[role="dialog"][aria-label*="preview"]'))), 'Avatar preview failed to open');
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(250);

  // 2. Verify Edit & Account Tabs remain completely intact & scrollable
  await page.eval(() => document.querySelector('#profile-tab-edit')?.click());
  await sleep(400);
  const editTabCheck = await page.eval(() => {
    const main = document.querySelector('main');
    return {
      overflowY: getComputedStyle(main).overflowY,
      scrollHeight: main.scrollHeight,
      clientHeight: main.clientHeight,
    };
  });
  console.log('Edit Tab scroll check:', editTabCheck);
  assert(editTabCheck.overflowY === 'auto' && editTabCheck.scrollHeight > editTabCheck.clientHeight, 'Edit Profile tab scrolling broke');

  await page.eval(() => document.querySelector('#profile-tab-overview')?.click());
  await sleep(400);

  // 3. Test tighter Laptop Viewport (1280x768) to confirm zero clipping or double scrollbar
  await page.setViewport({ width: 1280, height: 768, dsf: 1 });
  await sleep(400);
  const laptopMetrics = await page.eval(() => {
    const main = document.querySelector('main');
    const rightPanel = document.querySelector('[data-testid="overview-right-scroll"]');
    const aside = document.querySelector('aside[aria-label="Persistent Profile Card"]');
    return {
      mainScrollH: main.scrollHeight,
      mainClientH: main.clientHeight,
      rightScrollH: rightPanel.scrollHeight,
      rightClientH: rightPanel.clientHeight,
      asideScrollH: aside.scrollHeight,
      asideClientH: aside.clientHeight,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  console.log('Laptop 1280x768 Metrics:', laptopMetrics);
  assert(laptopMetrics.overflowX <= 0, `Horizontal overflow at 1280x768: ${laptopMetrics.overflowX}`);
  assert(laptopMetrics.mainScrollH <= laptopMetrics.mainClientH + 1, 'Double scrollbar at 1280x768');
  await page.screenshot({ path: './scratch/split_screenshots/after_split_laptop_dark.png', format: 'png' });

  // 4. Test Mobile Viewport (390x844) stacked flow without overflow
  await page.setViewport({ width: 390, height: 844, dsf: 2, mobile: true });
  await sleep(400);
  const mobileMetrics = await page.eval(() => {
    const main = document.querySelector('main');
    const leftCard = document.querySelector('section[aria-label="Profile Identity"]').getBoundingClientRect();
    const rightPanel = document.querySelector('[data-testid="overview-right-scroll"]').getBoundingClientRect();
    return {
      mainOverflowY: getComputedStyle(main).overflowY,
      mainScrollH: main.scrollHeight,
      mainClientH: main.clientHeight,
      leftBottom: leftCard.bottom,
      rightTop: rightPanel.top,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  console.log('Mobile 390x844 Metrics:', mobileMetrics);
  assert(mobileMetrics.overflowX <= 0, `Mobile horizontal overflow: ${mobileMetrics.overflowX}`);
  assert(mobileMetrics.leftBottom <= mobileMetrics.rightTop + 2, 'Mobile panels did not stack cleanly');
  assert(mobileMetrics.mainScrollH > mobileMetrics.mainClientH, 'Mobile page does not scroll cleanly');

  await setTheme(page, 'dark');
  await page.screenshot({ path: './scratch/split_screenshots/after_split_mobile_dark.png', format: 'png' });
  await setTheme(page, 'light');
  await page.screenshot({ path: './scratch/split_screenshots/after_split_mobile_light.png', format: 'png' });

  console.log('ALL TWO-COLUMN SPLIT & INDEPENDENT SCROLL VERIFICATIONS PASSED!');
  await browser.close();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
