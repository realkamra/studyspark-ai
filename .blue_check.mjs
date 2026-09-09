import { chromium } from 'playwright';

const url = 'http://localhost:3000/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

const m = () => page.evaluate(() => {
  const q = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) };
  };
  return {
    viewportH: window.innerHeight,
    scrollY: window.scrollY,
    docH: document.documentElement.scrollHeight,
    headline: q('.hero-text-wrapper'),
    blue: q('.premium-depth-card'),
    cue: q('.cta-wrapper'),
  };
});

console.log('=== INITIAL ===');
console.log(JSON.stringify(await m(), null, 2));

await page.evaluate(() => {
  const el = document.querySelector('.premium-depth-card');
  window.scrollTo(0, el.offsetTop);
});
await page.waitForTimeout(500);
console.log('=== BLUE TOP ALIGNED ===');
console.log(JSON.stringify(await m(), null, 2));

await page.waitForTimeout(2500);
console.log('=== AFTER ANIMATION ===');
console.log(JSON.stringify(await m(), null, 2));

await page.evaluate(() => {
  const el = document.querySelector('.premium-depth-card');
  window.scrollTo(0, el.offsetTop);
});
await page.waitForTimeout(2600);
await page.screenshot({ path: '/home/codespace/.claude/jobs/06cebf85/tmp/blue_fullscreen.png' });

await browser.close();
