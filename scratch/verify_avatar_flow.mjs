import { Browser } from '../Frontend/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZmY1NGU2Ny1jYTQ1LTQzZjQtODRjNy00YmRjNzk2ZjJhM2YiLCJ0b2tlblZlcnNpb24iOjEsImlhdCI6MTc5NDIxNjcyOCwiZXhwIjoxNzk0ODIxNTI4fQ.vGb5Nq6c3jQYzTlAPRZYIWylPPK_uzafLkeZ3HNoQVE";

mkdirSync('./scratch/avatar_screenshots', { recursive: true });

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

  await page.send('DOM.enable');
  await page.send('Network.enable');

  let uploadRequestCount = 0;
  browser.on(page.sessionId, 'Network.requestWillBeSent', (params) => {
    if (params.request?.url?.includes('/api/profile/avatar') && params.request?.method === 'POST') {
      uploadRequestCount++;
    }
  });

  // 1. Authenticate
  await page.goto('http://localhost:5173/login', { settleMs: 400 });
  await page.eval((t) => localStorage.setItem('token', t), token);

  // 2. Navigate to Overview Tab
  await page.goto('http://localhost:5173/profile?tab=overview', { settleMs: 1500 });
  await setTheme(page, 'dark');

  // Verify zero console exceptions so far
  assert(page.consoleErrors.length === 0, `Console errors: ${page.consoleErrors.join('; ')}`);

  // Check avatar styling on Overview + Sidebar (zero border, zero shadow, rounded-full)
  const overviewAvatarCheck = await page.eval(() => {
    const avatarBtn = document.querySelector('button[aria-label*="profile picture"]');
    assertNode: if (!avatarBtn) return { missing: true };
    const visual = avatarBtn.firstElementChild;
    const csBtn = getComputedStyle(avatarBtn);
    const csVis = getComputedStyle(visual);
    return {
      missing: false,
      btnBorderWidth: csBtn.borderTopWidth,
      btnBoxShadow: csBtn.boxShadow,
      btnBg: csBtn.backgroundColor,
      visTag: visual.tagName,
      visBorderWidth: csVis.borderTopWidth,
      visBoxShadow: csVis.boxShadow,
      visWidth: parseFloat(csVis.width),
      visHeight: parseFloat(csVis.height),
      visRadius: csVis.borderRadius,
    };
  });
  console.log('Overview Avatar Computed Check:', overviewAvatarCheck);
  assert(!overviewAvatarCheck.missing, 'Overview avatar trigger missing');
  assert(overviewAvatarCheck.btnBorderWidth === '0px', 'Avatar button has unexpected border');
  assert(overviewAvatarCheck.btnBoxShadow === 'none', 'Avatar button has unexpected shadow');
  assert(overviewAvatarCheck.visBorderWidth === '0px', 'Avatar visual has unexpected border');
  assert(overviewAvatarCheck.visBoxShadow === 'none', 'Avatar visual has unexpected shadow');
  assert(Math.abs(overviewAvatarCheck.visWidth - overviewAvatarCheck.visHeight) < 1, 'Avatar is stretched / non-1:1');

  // Click overview avatar -> verify Preview opens -> close via Escape -> reopen -> close via backdrop
  await page.eval(() => document.querySelector('button[aria-label*="profile picture"]').click());
  await sleep(250);
  const previewOpened = await page.eval(() => Boolean(document.querySelector('[role="dialog"][aria-label*="preview"]')));
  assert(previewOpened, 'Avatar preview lightbox did not open from Overview click');
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(250);
  const previewClosedEsc = await page.eval(() => !document.querySelector('[role="dialog"][aria-label*="preview"]'));
  assert(previewClosedEsc, 'Preview lightbox failed to close via Escape');

  // Reopen & test backdrop click outside
  await page.eval(() => document.querySelector('button[aria-label*="profile picture"]').click());
  await sleep(250);
  await page.eval(() => {
    const backdrop = document.querySelector('[role="presentation"]');
    if (backdrop) backdrop.click();
  });
  await sleep(250);
  const previewClosedBackdrop = await page.eval(() => !document.querySelector('[role="dialog"][aria-label*="preview"]'));
  assert(previewClosedBackdrop, 'Preview lightbox failed to close via outside backdrop click');
  console.log('Verified: Overview avatar lightbox open/close (Escape + backdrop click)');

  // 3. Switch to Edit Profile tab
  await page.goto('http://localhost:5173/profile?tab=edit', { settleMs: 1500 });
  await setTheme(page, 'dark');

  // Generate crisp 900x600 landscape PNG inside browser canvas
  const base64Png = await page.eval(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 900, 600);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#0891b2');
    grad.addColorStop(1, '#6366f1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 900, 600);
    // Concentric crisp geometric portrait motif
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(450, 240, 95, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.ellipse(450, 490, 180, 130, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    // Accent markers on left/right to test crop panning visually
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(40, 40, 80, 80);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(780, 480, 80, 80);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  const sampleImgPath = resolve('./scratch/sample_portrait.png');
  writeFileSync(sampleImgPath, Buffer.from(base64Png, 'base64'));
  console.log('Generated 900x600 sample PNG at:', sampleImgPath);

  // Set file onto #avatar-upload-input using CDP DOM.setFileInputFiles
  async function attachSampleFile() {
    const doc = await page.send('DOM.getDocument', { depth: -1 });
    const inputNode = await page.send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector: '#avatar-upload-input',
    });
    assert(inputNode?.nodeId > 0, 'Could not find #avatar-upload-input');
    await page.send('DOM.setFileInputFiles', {
      nodeId: inputNode.nodeId,
      files: [sampleImgPath],
    });
  }

  await attachSampleFile();
  await sleep(600);

  // Confirm Crop modal opened and NO immediate upload triggered
  const cropModalOpen = await page.eval(() => Boolean(document.querySelector('#avatar-crop-modal-title')));
  assert(cropModalOpen, 'AvatarCropModal did not open when image was selected');
  assert(uploadRequestCount === 0, `Expected 0 upload requests before Save, saw ${uploadRequestCount}`);
  console.log('Verified: Selecting image opens adjustment modal without uploading immediately');

  // Capture Crop modal Dark Mode screenshot
  await page.screenshot({ path: './scratch/avatar_screenshots/after_crop_dark.png', format: 'png' });

  // Capture Crop modal Light Mode screenshot
  await setTheme(page, 'light');
  await page.screenshot({ path: './scratch/avatar_screenshots/after_crop_light.png', format: 'png' });
  await setTheme(page, 'dark');

  // Test Dragging on crop stage
  const stageBox = await page.eval(() => {
    const el = document.querySelector('[aria-label*="Crop area"]');
    const r = el.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  });
  await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: stageBox.cx, y: stageBox.cy, button: 'left', buttons: 1, clickCount: 1 });
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: stageBox.cx + 70, y: stageBox.cy + 10, button: 'left', buttons: 1 });
  await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: stageBox.cx + 70, y: stageBox.cy + 10, button: 'left', buttons: 0, clickCount: 1 });
  await sleep(200);

  const transformAfterDrag = await page.eval(() => {
    const img = document.querySelector('[alt="Crop preview source"]');
    return img?.style?.transform || '';
  });
  console.log('Transform after drag:', transformAfterDrag);
  assert(transformAfterDrag.includes('70px'), `Expected drag transform ~70px, got ${transformAfterDrag}`);

  // Test Zoom slider
  await page.eval(() => {
    const slider = document.querySelector('#avatar-zoom-slider');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(slider, '1.85');
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await sleep(200);
  const zoomReadout = await page.eval(() => document.querySelector('#avatar-zoom-slider')?.closest('div')?.previousElementSibling?.querySelector('span')?.textContent);
  console.log('Zoom readout:', zoomReadout);
  assert(zoomReadout === '1.85x', `Expected zoom 1.85x, got ${zoomReadout}`);

  // Test Reset button
  await page.eval(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const resetBtn = buttons.find((b) => b.textContent.trim() === 'Reset');
    resetBtn?.click();
  });
  await sleep(200);
  const resetState = await page.eval(() => ({
    zoomVal: document.querySelector('#avatar-zoom-slider')?.value,
    transform: document.querySelector('[alt="Crop preview source"]')?.style?.transform,
  }));
  console.log('After Reset:', resetState);
  assert(resetState.zoomVal === '1', 'Reset did not restore zoom to 1');
  assert(resetState.transform === 'translate(0px, 0px)', `Reset did not restore offset: ${resetState.transform}`);

  // Test Cancel closes without upload
  await page.eval(() => {
    const dialog = document.querySelector('[aria-labelledby="avatar-crop-modal-title"]');
    const cancelBtn = Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Cancel');
    cancelBtn?.click();
  });
  await sleep(250);
  const closedAfterCancel = await page.eval(() => !document.querySelector('#avatar-crop-modal-title'));
  assert(closedAfterCancel, 'Cancel did not close crop modal');
  assert(uploadRequestCount === 0, 'Cancel triggered unexpected upload');

  // Re-attach same file (proving input reset allows re-selecting same filename)
  await attachSampleFile();
  await sleep(600);
  assert(await page.eval(() => Boolean(document.querySelector('#avatar-crop-modal-title'))), 'Re-selecting same file did not reopen crop modal');

  // Adjust zoom to 1.50x + pan slightly and Save Picture
  await page.eval(() => {
    const slider = document.querySelector('#avatar-zoom-slider');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(slider, '1.5');
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await sleep(150);
  await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: stageBox.cx, y: stageBox.cy, button: 'left', buttons: 1, clickCount: 1 });
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: stageBox.cx - 40, y: stageBox.cy - 20, button: 'left', buttons: 1 });
  await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: stageBox.cx - 40, y: stageBox.cy - 20, button: 'left', buttons: 0, clickCount: 1 });
  await sleep(200);

  await page.eval(() => {
    const dialog = document.querySelector('[aria-labelledby="avatar-crop-modal-title"]');
    const saveBtn = Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent.includes('Save Picture'));
    saveBtn?.click();
  });

  // Wait for upload completion and modal closure
  for (let i = 0; i < 30; i++) {
    await sleep(250);
    const stillOpen = await page.eval(() => Boolean(document.querySelector('#avatar-crop-modal-title')));
    if (!stillOpen) break;
  }
  await sleep(500);
  assert(uploadRequestCount === 1, `Expected exactly 1 POST /api/profile/avatar, got ${uploadRequestCount}`);
  assert(await page.eval(() => !document.querySelector('#avatar-crop-modal-title')), 'Crop modal stayed open after save');

  // Verify Edit Profile displays loaded cropped 512x512 photo cleanly with zero borders
  const editAvatarStatus = await page.eval(() => {
    const imgs = Array.from(document.querySelectorAll('button[aria-label="View profile picture"] img'));
    return imgs.map((img) => ({
      src: img.getAttribute('src'),
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      border: getComputedStyle(img).borderTopWidth,
      radius: getComputedStyle(img).borderRadius,
      boxShadow: getComputedStyle(img).boxShadow,
    }));
  });
  console.log('Edit Profile uploaded avatars:', editAvatarStatus);
  assert(editAvatarStatus.length === 2, `Expected 2 rendered avatar images in Edit Profile, got ${editAvatarStatus.length}`);
  for (const a of editAvatarStatus) {
    assert(a.complete && a.naturalWidth === 512 && a.naturalHeight === 512, `Expected 512x512 cropped image, got ${a.naturalWidth}x${a.naturalHeight}`);
    assert(a.border === '0px', 'Uploaded avatar still has border');
    assert(a.boxShadow === 'none', 'Uploaded avatar still has boxShadow');
  }

  // Capture Edit Profile after screenshots (Dark & Light)
  await setTheme(page, 'dark');
  await page.screenshot({ path: './scratch/avatar_screenshots/after_edit_dark.png', format: 'png' });
  await setTheme(page, 'light');
  await page.screenshot({ path: './scratch/avatar_screenshots/after_edit_light.png', format: 'png' });

  // Open Preview Lightbox with uploaded image & capture Dark and Light screenshots
  await setTheme(page, 'dark');
  await page.eval(() => document.querySelector('button[aria-label="View profile picture"]')?.click());
  await sleep(400);
  const previewImgInfo = await page.eval(() => {
    const img = document.querySelector('[role="dialog"][aria-label*="preview"] img');
    return img ? { naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, complete: img.complete } : null;
  });
  assert(previewImgInfo && previewImgInfo.complete && previewImgInfo.naturalWidth === 512, 'Preview lightbox failed to load cropped photo');
  await page.screenshot({ path: './scratch/avatar_screenshots/after_preview_dark.png', format: 'png' });
  await setTheme(page, 'light');
  await page.screenshot({ path: './scratch/avatar_screenshots/after_preview_light.png', format: 'png' });
  // Close via close button
  await page.eval(() => document.querySelector('button[aria-label="Close image preview"]')?.click());
  await sleep(250);

  // 4. Switch to Overview tab WITHOUT full reload to verify cross-view state sync
  await setTheme(page, 'dark');
  await page.eval(() => document.querySelector('#profile-tab-overview')?.click());
  await sleep(600);
  const overviewSynced = await page.eval(() => {
    const ovImg = document.querySelector('section[aria-label="Profile Identity"] img');
    const sbImg = document.querySelector('aside img[alt*="Rahul"], button[aria-label="User Profile & Account Menu"] img');
    return {
      ovSrc: ovImg?.getAttribute('src'),
      ovSize: ovImg ? `${ovImg.naturalWidth}x${ovImg.naturalHeight}` : null,
      sbSrc: sbImg?.getAttribute('src'),
      sbLoaded: sbImg ? sbImg.complete && sbImg.naturalWidth === 512 : false,
    };
  });
  console.log('Cross-component synchronization check:', overviewSynced);
  assert(overviewSynced.ovSize === '512x512', 'Overview tab did not sync new avatar live');
  assert(overviewSynced.sbLoaded, 'Sidebar footer avatar did not sync new avatar live');

  // Capture Overview After screenshots (Dark & Light)
  await setTheme(page, 'dark');
  await page.screenshot({ path: './scratch/avatar_screenshots/after_overview_dark.png', format: 'png', fullPage: true });
  await setTheme(page, 'light');
  await page.screenshot({ path: './scratch/avatar_screenshots/after_overview_light.png', format: 'png', fullPage: true });

  // 5. Responsive mobile layout check (390x844)
  await page.setViewport({ width: 390, height: 844, dsf: 2, mobile: true });
  await setTheme(page, 'dark');
  await sleep(400);
  await page.screenshot({ path: './scratch/avatar_screenshots/after_overview_mobile_dark.png', format: 'png' });

  console.log('ALL END-TO-END AVATAR VERIFICATIONS PASSED!');
  await browser.close();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
