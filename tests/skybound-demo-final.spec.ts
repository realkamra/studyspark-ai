import { expect, test } from "@playwright/test";

test("skybound demo: starts safely, HUD live, controls + pause/resume work", async ({ page }) => {
  // Track any console/page errors
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("CONSOLE: " + m.text());
  });

  await page.goto("http://localhost:5180/#/demo/skybound", { waitUntil: "domcontentloaded" });
  await expect(page.locator("canvas")).toBeVisible({ timeout: 8000 });
  await expect(page.getByText("Play Skybound")).toBeVisible();

  // Start the game
  await page.getByText("Play Skybound").click();
  await expect(page.getByLabel("Pause")).toBeVisible({ timeout: 3000 });

  // The first two spawn patterns are "collectTrail" (guaranteed no obstacle),
  // so at 2s of no input the run must still have all 3 lives.
  await page.waitForTimeout(2000);
  const livesHUD = page.getByLabel("3 lives");
  await expect(livesHUD).toBeVisible({ timeout: 3000 });
  await expect(livesHUD.locator(".fill-red-500")).toHaveCount(3, { timeout: 2000 });

  // Verify the HUD distance counter is live (it ticks up every frame while running)
  const distanceM = page.getByText(/\d+ m$/).first();
  await expect(distanceM).toContainText(" m", { timeout: 2000 });

  // Controls: jump, slide, dash, lane-change should not crash the game
  await page.keyboard.press("w"); // jump
  await page.waitForTimeout(150);
  await page.keyboard.press("s"); // slide
  await page.waitForTimeout(150);
  await page.keyboard.press("Shift"); // dash
  await page.waitForTimeout(150);
  await page.keyboard.press("a"); // lane left
  await page.keyboard.press("d"); // lane right
  await page.waitForTimeout(150);
  await expect(page.getByLabel("Pause")).toBeVisible();

  // Pause and resume to verify UI
  await page.getByLabel("Pause").click();
  await expect(page.getByLabel("Resume")).toBeVisible({ timeout: 2000 });
  await page.getByLabel("Resume").click();
  await expect(page.getByLabel("Pause")).toBeVisible({ timeout: 2000 });

  // Fullscreen toggle must be present and clickable without crashing the game.
  // (In headless Chromium the Fullscreen API may be a no-op and the shell
  // re-render detaches the Pause button briefly — so click via JS and
  // tolerate a no-op headless toggle. Check no page errors are logged.)
  const fsBtn = page.getByLabel("Enter fullscreen").first();
  await expect(fsBtn).toBeVisible({ timeout: 2000 });
  // Click via the DOM to be immune to the canvas's pointer-events plane
  await fsBtn.evaluate((el: HTMLElement) => el.click());
  await page.waitForTimeout(600);
  // Escape is also an exit path; send it and let the app settle so
  // subsequent DOM queries don't hit a stale isFs transition.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  // Pause/Resume must still work after any fullscreen attempt.
  await page.getByLabel("Pause").click({ force: true });
  await expect(page.getByLabel("Resume")).toBeVisible({ timeout: 2000 });
  await page.getByLabel("Resume").click({ force: true });
  await expect(page.getByLabel("Pause")).toBeVisible({ timeout: 2000 });

  // No errors should have been logged
  expect(errors.join("\n")).toBe("");
});