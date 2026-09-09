import { chromium } from 'playwright';

const url = 'http://localhost:3000/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

// Scroll to blue section
await page.evaluate(() => {
  const el = document.querySelector('.premium-depth-card');
  window.scrollTo(0, el.offsetTop);
});
await page.waitForTimeout(3000);
await page.screenshot({ path: '/home/codespace/.claude/jobs/06cebf85/tmp/blue_edge.png' });

await browser.close();
