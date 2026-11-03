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
  await expect(firstPhoto).toHaveAttribute("src", /assets\/social\/unique\/post-p1\.jpg$/);
  await expect.poll(() => firstPhoto.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBeTruthy();
  await expect(page.locator(".scroll-cue")).toHaveClass(/hidden/);
  await page.locator('[data-action="story"]').first().click();
  await expect(page.locator(".story-layer .art-photo")).toBeVisible();
  await page.locator("button.story-close").click();
});

test("cada post e cada story das quatro fases usa foto diferente", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="skip-intro"]').click();

  for (let phase = 0; phase < 4; phase++) {
    // A mudança de capítulo exibe brevemente uma tela de transição.
    await expect(page.locator(".phone")).toBeVisible({ timeout: 10000 });
    const postSources = await page.locator(".post-media .art-photo").evaluateAll((imgs) =>
      imgs.map((img) => img.getAttribute("src") || ""),
    );
    expect(postSources.length).toBeGreaterThanOrEqual(4);
    expect(new Set(postSources).size).toBe(postSources.length);
    expect(postSources.every((src) => /assets\/social\/unique\/.+\.jpg$/.test(src))).toBeTruthy();

    const storySources: string[] = [];
    const storyButtons = page.locator('[data-action="story"]');
    for (let i = 0; i < 3; i++) {
      await storyButtons.nth(i).click();
      const photo = page.locator(".story-layer .art-photo");
      await expect(photo).toBeVisible();
      const src = await photo.getAttribute("src");
      expect(src).toMatch(/assets\/social\/unique\/story-.+\.jpg$/);
      await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBeTruthy();
      storySources.push(src!);
      await page.locator("button.story-close").click();
    }
    expect(new Set(storySources).size).toBe(storySources.length);

    await page.locator('[data-action="decision"][data-decision="skip"]').click();
  }
});


test("fotos e nomes dos stories ficam contidos nos quatro momentos", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="skip-intro"]').click();

  for (let phase = 0; phase < 4; phase++) {
    await expect(page.locator(".phone")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".rail .eyebrow").first()).toContainText(
      `MOMENTO ${String(phase + 1).padStart(2, "0")} / 04`,
    );

    const storyButtons = page.locator(".stories .story");
    await expect(storyButtons).toHaveCount(3);
    for (const button of await storyButtons.all()) {
      const face = button.locator(".story-face");
      const photo = face.locator("img.avatar-photo");
      const name = button.locator(".story-name");
      await expect(photo).toBeVisible();
      await expect(name).toBeVisible();
      const geometry = await button.evaluate((el) => {
        const rect = (selector: string) => el.querySelector(selector)!.getBoundingClientRect();
        const ring = rect(".story-ring");
        const face = rect(".story-face");
        const image = rect("img.avatar-photo");
        const label = rect(".story-name");
        return {
          ringWidth: ring.width,
          ringHeight: ring.height,
          imageInsideFace: image.left >= face.left - 1 &&
            image.right <= face.right + 1 &&
            image.top >= face.top - 1 &&
            image.bottom <= face.bottom + 1,
          nameClear: label.top >= ring.bottom &&
            label.top >= image.bottom,
          roundFrame: getComputedStyle(el.querySelector(".story-face")!).borderRadius,
          fixedPhoto: getComputedStyle(el.querySelector("img.avatar-photo")!).position,
          label: el.querySelector(".story-name")!.textContent?.trim(),
        };
      });
      expect(geometry.ringWidth).toBe(60);
      expect(geometry.ringHeight).toBe(60);
      expect(geometry.imageInsideFace).toBe(true);
      expect(geometry.nameClear).toBe(true);
      expect(geometry.roundFrame).toBe("50%");
      expect(geometry.fixedPhoto).toBe("absolute");
      expect(geometry.label?.length).toBeGreaterThan(0);
    }
    if (phase < 3) {
      await page.locator('[data-action="decision"][data-decision="skip"]').click();
    }
  }
});
