// Let's check what data is passed to onMouseEnter in Recharts Pie
// In Recharts Pie:
// onMouseEnter: (data, index, e) => ...
// data has: cx, cy, innerRadius, outerRadius, startAngle, endAngle, midAngle, ...
console.log('Math test for angles:');
const cx = 250;
const cy = 150;
const outerRadius = 102;
const innerRadius = 68;

// Suppose a slice has midAngle in degrees (Recharts angles: 0 is at 3 o'clock, 90 is at 12 o'clock or 6 o'clock depending on startAngle/endAngle)
// Recharts default: startAngle = 0 (3 o'clock), endAngle = 360 (counter-clockwise).
// Recharts coordinate formula:
// RADIAN = Math.PI / 180;
// x = cx + radius * Math.cos(-midAngle * RADIAN);
// y = cy + radius * Math.sin(-midAngle * RADIAN);
// (or in Recharts: -midAngle * Math.PI / 180 or midAngle * Math.PI / 180)
