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


test("retorno ao início funciona na introdução e sobre um story", async ({ page }) => {
  await page.goto("/");
  const homeButton = page.locator("#exit-home-trigger");
  const dialog = page.getByRole("dialog", { name: "Voltar ao início?" });
  await expect(homeButton).toBeHidden();

  await page.locator('[data-action="start"]').click();
  await expect(homeButton).toBeVisible();
  await homeButton.click();
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Continuar jogando" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator(".cinematic")).toBeVisible();

  await page.locator('[data-action="skip-intro"]').click();
  await expect(page.locator(".phone")).toBeVisible();
  await page.locator('[data-action="story"]').first().click();
  await expect(page.locator(".story-layer")).toBeVisible();

  await homeButton.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.locator(".story-layer")).toBeVisible();

  await homeButton.click();
  await page.getByRole("button", { name: "Voltar ao início", exact: true }).click();
  await expect(page.locator(".home")).toBeVisible();
  await expect(homeButton).toBeHidden();

  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="skip-intro"]').click();
  await expect(page.locator(".story.read")).toHaveCount(0);
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

test("stories em uma fileira e posts de amigos e páginas no feed", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="skip-intro"]').click();
  await expect(page.locator(".story-rail")).toHaveCount(1);
  await expect(page.locator(".stories")).toHaveCount(1);
  await expect(page.getByText("Amigos e páginas")).toBeVisible();
  await expect(page.locator(".stories .story")).toHaveCount(3);
  await expect(page.locator(".stories .story.page-story .page-logo")).toHaveCount(1);
  await expect(page.locator(".stories .story:not(.page-story) .avatar-photo")).toHaveCount(2);
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


test("stories alinhados com fotos de pessoas e logos de paginas nos quatro momentos", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="skip-intro"]').click();

  const pagesByPhase = ["agenda.local", "moda.agora", "dj.andre", "loja.noma"];
  for (let phase = 0; phase < 4; phase++) {
    await expect(page.locator(".phone")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".rail .eyebrow").first()).toContainText(
      "MOMENTO " + String(phase + 1).padStart(2, "0") + " / 04",
    );
    await expect(page.locator(".story-rail")).toHaveCount(1);
    const stories = page.locator(".story-rail .story");
    await expect(stories).toHaveCount(3);
    await expect(stories.locator(".page-logo")).toHaveCount(1);
    await expect(stories.locator("img.avatar-photo")).toHaveCount(2);
    const names = await stories.locator(".story-name").allTextContents();
    expect(names).toContain(pagesByPhase[phase]);

    const alignment = await stories.evaluateAll((els) =>
      els.map((el) => {
        const q = (selector: string) => el.querySelector(selector)!.getBoundingClientRect();
        const ring = q(".story-ring");
        const face = q(".story-face");
        const image = q(".page-logo, .avatar-photo");
        const name = q(".story-name");
        const isPage = el.classList.contains("page-story");
        return {
          x: ring.left,
          y: ring.top,
          ringWidth: ring.width,
          ringHeight: ring.height,
          imageInsideFace: image.left >= face.left - 1 &&
            image.right <= face.right + 1 &&
            image.top >= face.top - 1 &&
            image.bottom <= face.bottom + 1,
          labelBelow: name.top >= ring.bottom && name.top >= image.bottom,
          typeCorrect: isPage ?
            !!el.querySelector(".page-logo svg") && !el.querySelector(".avatar-photo") :
            !!el.querySelector("img.avatar-photo") && !el.querySelector(".page-logo"),
          frameRound: getComputedStyle(el.querySelector(".story-face")!).borderRadius,
        };
      }),
    );
    expect(alignment.every((item) => item.ringWidth === 60 && item.ringHeight === 60)).toBe(true);
    expect(alignment.every((item) => item.imageInsideFace && item.labelBelow && item.typeCorrect)).toBe(true);
    expect(alignment.every((item) => item.frameRound === "50%")).toBe(true);
    expect(alignment[0].x).toBeLessThan(alignment[1].x);
    expect(alignment[1].x).toBeLessThan(alignment[2].x);
    expect(Math.max(...alignment.map((item) => item.y)) - Math.min(...alignment.map((item) => item.y))).toBeLessThan(2);

    const brandStory = stories.filter({ has: page.locator(".page-logo") });
    await brandStory.click();
    await expect(page.locator(".story-layer .page-logo svg")).toBeVisible();
    await page.locator("button.story-close").click();

    if (phase < 3) await page.locator('[data-action="decision"][data-decision="skip"]').click();
  }
});


test("painel do algoritmo explica os sinais e controla a personalização", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="skip-intro"]').click();
  await page.locator('[data-action="like"][data-post="p1"]').click();
  await page.locator('[data-action="algorithm"]').first().click();
  await expect(page.locator(".algorithm-panel")).toBeVisible();
  await expect(page.locator(".algorithm-panel")).toContainText("Interesses inferidos pelo jogo");
  await expect(page.locator(".algorithm-panel")).toContainText("Fones e áudio");
  await page.locator(".algorithm-panel #privacy-switch").uncheck();
  await expect(page.locator(".algorithm-panel")).toContainText("Desligada");
  await page.locator('[data-action="close-overlay"]').click();
  await expect(page.locator(".recommendation-caption")).toContainText("Ordem cronológica");
  await page.locator('[data-action="post-more"][data-post="p1"]').first().click();
  await expect(page.locator(".algorithm-explanation")).toContainText("A personalização está desligada");
  await page.locator('[data-action="close-modal"]').click();
});

test("interesse no carrinho leva a anúncio de retargeting explicável", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="skip-intro"]').click();
  await page.locator('[data-action="decision"][data-decision="cart"]').click();
  await expect(page.locator(".phone")).toBeVisible({ timeout: 8000 });
  await expect(page.locator('[data-rec-id="ad-ret-fone"]')).toHaveCount(1);
  await page.locator('[data-rec-id="ad-ret-fone"] [data-action="ad-more"]').first().click();
  await expect(page.locator(".algorithm-explanation")).toContainText("anúncio pago");
  await page.locator('[data-action="less-topic"][data-topic="fone"]').click();
  await page.locator('[data-action="algorithm"]').first().click();
  await expect(page.locator(".algorithm-panel")).toContainText("sinais registrados");
  await page.locator('[data-action="clear-algorithm"]').click();
  await expect(page.locator(".algo-summary")).toContainText("0"); 
});
