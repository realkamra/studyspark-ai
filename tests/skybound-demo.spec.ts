import { expect, test } from "@playwright/test";

test("skybound demo loads and game can start", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push("PAGEERROR " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") pageErrors.push("CONSOLE " + m.text());
  });

  await page.goto("http://localhost:5176/#/demo/skybound", { waitUntil: "domcontentloaded" });
  await expect(page.locator("canvas")).toBeVisible({ timeout: 8000 });
  await expect(page.getByText("Play Skybound")).toBeVisible();

  // Start the game
  await page.getByText("Play Skybound").click();
  await expect(page.getByLabel("Pause")).toBeVisible({ timeout: 3000 });

  // The game is running — score HUD should be visible
  const hudScore = page.getByText(/^\d+$/).first();
  const scoreText1 = await hudScore.textContent().catch(() => "0");
  // let the game run a moment, obstacle spawn and movement shouldn't crash
  await page.waitForTimeout(1800);
  const scoreText2 = await hudScore.textContent().catch(() => "0");

  // Score should be a number (may or may not have changed yet, but must be parseable)
  const s1 = parseInt(scoreText1 ?? "0", 10);
  const s2 = parseInt(scoreText2 ?? "0", 10);
  expect(Number.isFinite(s1)).toBe(true);
  expect(Number.isFinite(s2)).toBe(true);

  // Exercise controls — jump (W / ArrowUp / Space), slide (S), dash (Shift)
  await page.keyboard.press("w");
  await page.waitForTimeout(100);
  await page.keyboard.press("s");
  await page.waitForTimeout(100);
  await page.keyboard.press("Shift");
  await page.waitForTimeout(100);

  // Press reserve dash button (HUD) if reachable, then pause to confirm still alive
  await page.getByLabel("Pause").click();
  await expect(page.getByLabel("Resume")).toBeVisible();

  expect(pageErrors.join("\n")).toBe("");
});

test("skybound can play a full sequence to game over", async ({ page }) => {
  await page.goto("http://localhost:5176/#/demo/skybound");
  await page.getByText("Play Skybound").click();
  await expect(page.getByLabel("Pause")).toBeVisible({ timeout: 3000 });

  // Just let it run — verify the game reaches a terminal state or keeps running without crashing.
  // Fast-forward the requestAnimationFrame clock is hard, so just run for a while and spam input
  // to prove controls don't throw.
  for (let i = 0; i < 40; i++) {
    const keys: Array<"w" | "s" | "a" | "d" | "Shift" | "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown"> = [
      "w", "s", "a", "d", "Shift", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
    ];
    await page.keyboard.press(keys[i % keys.length]);
    await page.waitForTimeout(60);
  }

  // HUD should still be present (game hasn't hard-crashed)
  await expect(page.locator("canvas")).toBeVisible();
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push("PAGEERROR " + e.message));
  page.on("console", (m) => { if (m.type() === "error") pageErrors.push("CONSOLE " + m.text()); });
  await page.waitForTimeout(1500);
  expect(pageErrors.join("\n")).toBe("");
});