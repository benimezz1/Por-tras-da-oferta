import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("nofeed-simulator-v2"));
});

test("início simples, introdução e navegação na primeira fase", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".home h1")).toContainText("Seu feed.");
  const overflow = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  expect(overflow).toBeLessThanOrEqual(3);
  await page.locator('[data-action="start"]').click();
  await expect(page.locator(".cinematic")).toBeVisible();
  await page.locator('[data-action="skip-intro"]').click();
  await expect(page.locator(".phone")).toBeVisible();
  await page.locator('[data-action="story"]').first().click();
  await expect(page.locator(".story-layer")).toBeVisible();
  await page.locator('button.story-close').click();
  await page.locator('[data-action="comments"][data-post="ad-main-fone"]').first().click();
  await expect(page.locator(".bottom-sheet")).toContainText("Opiniões sobre Atmos One");
  await page.locator('[data-action="close-modal"]').click();
  await page.locator('[data-action="product"][data-product="fone"]').first().click();
  await expect(page.locator(".layer .product-info")).toContainText("Atmos One");
  await page.locator('[data-action="add-cart"][data-product="fone"]').click();
  await page.locator('[data-action="close-overlay"]').click();
  await page.locator('[data-action="decision"][data-decision="cart"]').click();
  await page.locator('[data-action="open-next"]').click();
  await expect(page.getByText(/Ainda no seu carrinho: Atmos One/)).toBeVisible();
});

test("as quatro decisões avançam até a reflexão final", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="skip-intro"]').click();
  for (let index = 0; index < 4; index++) {
    await expect(page.locator(".phone")).toBeVisible();
    await page.locator('[data-action="decision"][data-decision="skip"]').click();
    if (index < 3) {
      await expect(page.locator(".phone")).toBeVisible({ timeout: 8000 });
    }
  }
  await expect(page.locator(".end")).toBeVisible();
  await expect(page.locator(".end")).toContainText("Suas decisões");
  await expect(page.locator(".end")).toContainText("O que aconteceu por trás das ofertas?");
  await page.locator('[data-action="restart"]').click();
  await expect(page.locator(".home")).toBeVisible();
});

test("personalização pode ser desligada no perfil", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="skip-intro"]').click();
  await page.locator('[data-action="product"][data-product="fone"]').first().click();
  await page.locator('[data-action="add-cart"][data-product="fone"]').click();
  await page.locator('[data-action="close-overlay"]').click();
  await page.locator('[data-action="profile"]').click();
  await expect(page.locator("#privacy-switch")).toBeChecked();
  await page.locator("#privacy-switch").uncheck();
  await page.locator('[data-action="close-overlay"]').click();
  await page.locator('[data-action="decision"][data-decision="cart"]').click();
  await page.locator('[data-action="open-next"]').click();
  await expect(page.getByText(/Ainda no seu carrinho: Atmos One/)).toHaveCount(0);
});

test("imagens locais e seções distintas de amigos e páginas no feed", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="skip-intro"]').click();
  await expect(page.locator(".story-section")).toHaveCount(2);
  await expect(page.getByText("Stories de amigos")).toBeVisible();
  await expect(page.getByText("Stories de páginas")).toBeVisible();
  await expect(page.getByText("Feed de amigos")).toBeVisible();
  await expect(page.getByText("Páginas que você segue")).toBeVisible();
  await expect(page.locator(".scroll-cue")).toBeVisible();
  const firstPhoto = page.locator(".post-media .art-photo").first();
  await firstPhoto.scrollIntoViewIfNeeded();
  await expect(firstPhoto).toHaveAttribute("src", /assets\/social\/.*\.webp$/);
  await expect.poll(() => firstPhoto.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBeTruthy();
  await expect(page.locator(".scroll-cue")).toHaveClass(/hidden/);
  await page.locator('[data-action="story"]').first().click();
  await expect(page.locator(".story-layer .art-photo")).toBeVisible();
  await page.locator("button.story-close").click();
});
