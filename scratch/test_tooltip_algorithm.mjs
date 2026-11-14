// Test tooltip position calculation for all 7 slices
const containerWidth = 573;
const containerHeight = 280;
const cx = containerWidth / 2; // 286.5
const cy = containerHeight / 2; // 140
const innerRadius = 68;
const outerRadius = 102;
const RADIAN = Math.PI / 180;

const W = 230;
const H = 105;

// Central protected box
const centerBox = {
  left: cx - 70,
  right: cx + 70,
  top: cy - 46,
  bottom: cy + 46,
};

// Test slices from the app:
// Saved (count 2), Applied (1), OA (6), Interview (2), Offer (1), Accepted (4), Rejected (4)
const slices = [
  { label: 'Saved', midAngle: 17.3 },
  { label: 'Applied', midAngle: 43.1 },
  { label: 'OA', midAngle: 104.5 },
  { label: 'Interview', midAngle: 173.7 },
  { label: 'Offer', midAngle: 199.6 },
  { label: 'Accepted', midAngle: 242.8 },
  { label: 'Rejected', midAngle: 312.0 },
];

function calculateTooltipPos(slice, cw, ch) {
  const midAngle = slice.midAngle;
  // In Recharts, angle is measured counterclockwise from positive X-axis (or clockwise depending on start/end).
  // With startAngle 0 to 360, angle in radians:
  const angleRad = -midAngle * RADIAN;
  const sliceR = (innerRadius + outerRadius) / 2;
  const sx = cx + sliceR * Math.cos(angleRad);
  const sy = cy + sliceR * Math.sin(angleRad);

  let x, y;

  if (cw >= 460) {
    const isRightSide = Math.cos(angleRad) >= 0;
    if (isRightSide) {
      // Place to the right of center hole
      const anchorX = Math.max(cx + 74, sx + 10);
      x = Math.min(cw - W - 10, anchorX);
      x = Math.max(cx + 74, x); // enforce right of center hole
    } else {
      // Place to the left of center hole
      const anchorX = Math.min(cx - 74 - W, sx - W - 10);
      x = Math.max(10, anchorX);
      x = Math.min(cx - 74 - W, x); // enforce left of center hole
    }

    // Vertical placement centered near slice Y
    const targetY = sy - H / 2;
    y = Math.max(10, Math.min(ch - H - 10, targetY));
  } else {
    // Narrow mobile layout
    const isTop = Math.sin(angleRad) < 0; // in SVG, negative Y is top
    if (isTop) {
      y = Math.max(6, cy - 50 - H);
    } else {
      y = Math.min(ch - H - 6, cy + 50);
    }
    x = Math.max(8, Math.min(cw - W - 8, cx - W / 2));
  }

  // Check collision with centerBox
  const collidesWithCenter = !(
    x + W <= centerBox.left ||
    x >= centerBox.right ||
    y + H <= centerBox.top ||
    y >= centerBox.bottom
  );

  // Check boundary clipping
  const isClipped = x < 0 || y < 0 || x + W > cw || y + H > ch;

  return {
    slice: slice.label,
    midAngle,
    sliceCenter: { sx: Math.round(sx), sy: Math.round(sy) },
    tooltipPos: { x: Math.round(x), y: Math.round(y) },
    collidesWithCenter,
    isClipped,
  };
}

console.log('--- TESTING DESKTOP (cw=573, ch=280) ---');
for (const s of slices) {
  const res = calculateTooltipPos(s, containerWidth, containerHeight);
  console.log(res);
}

console.log('\n--- TESTING MOBILE (cw=360, ch=320) ---');
for (const s of slices) {
  const res = calculateTooltipPos(s, 360, 320);
  console.log(res);
}
