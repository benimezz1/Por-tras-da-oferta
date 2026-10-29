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
  await page.locator('[data-action="close-story"]').click();
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
