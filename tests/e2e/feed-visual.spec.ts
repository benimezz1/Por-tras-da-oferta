import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("nofeed-simulator-v2"));
  await page.goto("/");
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="skip-intro"]').click();
});

test("stories de amigos e páginas ficam separados e fotografados", async ({ page }) => {
  await expect(page.getByText("Stories de amigos", { exact: true })).toBeVisible();
  await expect(page.getByText("Stories de páginas", { exact: true })).toBeVisible();
  await expect(page.locator(".story-section")).toHaveCount(2);
  await expect(page.locator(".story-section .story")).toHaveCount(3);
  await page.locator(".story-section").first().locator(".story").first().click();
  await expect(page.locator(".story-type")).toHaveText("amigo");
  await page.locator("button.story-close").click();
  await page.locator(".story-section.page .story").first().click();
  await expect(page.locator(".story-type")).toHaveText("página");
  await page.locator("button.story-close").click();
  await expect(page.getByText("Feed dos amigos", { exact: true })).toHaveCount(1);
  await expect(page.getByText("Feed de páginas: moda, música e rolês", { exact: true })).toHaveCount(1);
  await expect(page.locator(".post .meta-tag:not(.page)")).toHaveCount(2);
  await expect(page.locator(".post .meta-tag.page")).toHaveCount(1);
  const firstPhoto=page.locator(".post-media img.art-photo").first();
  await firstPhoto.scrollIntoViewIfNeeded();
  await expect(firstPhoto).toBeVisible();
  await expect.poll(() => firstPhoto.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(50);
});

test("orientação discreta indica rolar o feed e desaparece após interação", async ({ page }) => {
  const hint=page.locator(".scroll-cue");
  await expect(hint).toBeVisible();
  await expect(hint).toContainText("Role o feed");
  await hint.click();
  await expect(hint).toHaveClass(/hidden/);
  await expect(page.locator('[data-action="decision"][data-decision="cart"]')).toHaveCount(1);
});
