// Run: node scripts/gen-og-image.js
// Generates public/og-image.png for iMessage / WhatsApp rich link previews

const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1200;
const H = 630;

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// --- Background gradient ---
const bgGrad = ctx.createLinearGradient(0, 0, W, H);
bgGrad.addColorStop(0, '#667eea');
bgGrad.addColorStop(1, '#764ba2');
ctx.fillStyle = bgGrad;
ctx.fillRect(0, 0, W, H);

// --- Decorative circles ---
function softCircle(x, y, r, alpha) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.fill();
}
softCircle(80,   80,  160, 0.06);
softCircle(1150, 580, 200, 0.05);
softCircle(1100, 60,  100, 0.04);
softCircle(200,  560,  90, 0.04);

// --- Emoji ---
ctx.font = '140px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
ctx.textAlign = 'center';
ctx.fillStyle = 'white';
ctx.fillText('🎉', W / 2, 270);

// --- Title ---
ctx.font = 'bold 88px "Segoe UI", "Arial", sans-serif';
ctx.fillStyle = 'white';
ctx.shadowColor = 'rgba(0,0,0,0.25)';
ctx.shadowBlur = 12;
ctx.fillText('Showdown Live!', W / 2, 392);
ctx.shadowBlur = 0;

// --- Tagline ---
ctx.font = '36px "Segoe UI", "Arial", sans-serif';
ctx.fillStyle = 'rgba(255,255,255,0.85)';
ctx.fillText('Real-time multiplayer quiz for the whole family', W / 2, 462);

// --- Bottom pill ---
const pillX = 330, pillY = 494, pillW = 540, pillH = 58, pillR = 29;
ctx.beginPath();
ctx.moveTo(pillX + pillR, pillY);
ctx.lineTo(pillX + pillW - pillR, pillY);
ctx.arcTo(pillX + pillW, pillY, pillX + pillW, pillY + pillR, pillR);
ctx.lineTo(pillX + pillW, pillY + pillH - pillR);
ctx.arcTo(pillX + pillW, pillY + pillH, pillX + pillW - pillR, pillY + pillH, pillR);
ctx.lineTo(pillX + pillR, pillY + pillH);
ctx.arcTo(pillX, pillY + pillH, pillX, pillY + pillH - pillR, pillR);
ctx.lineTo(pillX, pillY + pillR);
ctx.arcTo(pillX, pillY, pillX + pillR, pillY, pillR);
ctx.closePath();
ctx.fillStyle = 'rgba(255,255,255,0.15)';
ctx.fill();

ctx.font = '600 26px "Segoe UI", "Arial", sans-serif';
ctx.fillStyle = 'rgba(255,255,255,0.92)';
ctx.fillText('AI questions · Live scores · Fun for all ages', W / 2, 530);

// --- Save OG image ---
const out = path.join(__dirname, '..', 'public', 'og-image.png');
fs.writeFileSync(out, canvas.toBuffer('image/png'));
console.log(`Saved ${out} (${(fs.statSync(out).size / 1024).toFixed(1)} KB)`);

// ============================================================
//  Apple Touch Icon  (180 × 180)
// ============================================================

const IC = 180;
const icon = createCanvas(IC, IC);
const ic   = icon.getContext('2d');

// Background gradient
const icGrad = ic.createLinearGradient(0, 0, IC, IC);
icGrad.addColorStop(0, '#667eea');
icGrad.addColorStop(1, '#764ba2');
ic.fillStyle = icGrad;
ic.roundRect(0, 0, IC, IC, 28);
ic.fill();

// Soft decorative circle
ic.beginPath();
ic.arc(IC * 0.85, IC * 0.15, 52, 0, Math.PI * 2);
ic.fillStyle = 'rgba(255,255,255,0.08)';
ic.fill();

// Emoji
ic.font = '90px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
ic.textAlign = 'center';
ic.textBaseline = 'middle';
ic.fillStyle = 'white';
ic.fillText('🎉', IC / 2, IC / 2 - 8);

// Label
ic.font = 'bold 22px "Segoe UI", Arial, sans-serif';
ic.textBaseline = 'alphabetic';
ic.fillStyle = 'rgba(255,255,255,0.90)';
ic.shadowColor = 'rgba(0,0,0,0.25)';
ic.shadowBlur   = 4;
ic.fillText('Showdown Live', IC / 2, IC - 18);
ic.shadowBlur = 0;

const iconOut = path.join(__dirname, '..', 'public', 'apple-touch-icon.png');
fs.writeFileSync(iconOut, icon.toBuffer('image/png'));
console.log(`Saved ${iconOut} (${(fs.statSync(iconOut).size / 1024).toFixed(1)} KB)`);
