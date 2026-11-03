
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem("nofeed-simulator-v3");
    localStorage.removeItem("nofeed-simulator-v2");
  });
});

async function enter(page) {
  await page.goto("/");
  await expect(page.locator(".home h1")).toContainText("Seu feed.");
  await page.locator('[data-action="start"]').click();
  await expect(page.locator(".cinematic")).toContainText("guardar R$ 400");
  await page.locator('[data-action="intro-next"]').click();
  await expect(page.locator(".phone")).toBeVisible();
}
async function loadAll(page) {
  for (let n = 0; n < 8; n++) {
    if (!await page.locator(".load-more").count()) break;
    await page.locator(".load-more").click();
  }
}

test("uma única linha do tempo mistura produtos e recorda a meta só quando solicitada", async ({ page }) => {
  await enter(page);
  await expect(page.locator(".decision")).toHaveCount(0);
  await expect(page.locator(".transition")).toHaveCount(0);
  await expect(page.locator(".story-rail .story")).toHaveCount(12);
  const topics = await page.locator("[data-rec-topic]").evaluateAll(els => [...new Set(els.map(el => el.getAttribute("data-rec-topic")))]);
  expect(topics.length).toBeGreaterThanOrEqual(3);
  await expect(page.locator(".post.ad-post")).toHaveCount(1);
  await expect(page.locator(".rail-note")).not.toContainText("Meta de economia");
  await page.locator('.phone-footer [data-action="goal"]').click();
  await expect(page.locator(".critical-panel")).toContainText("guardar R$ 400");
  await expect(page.locator(".critical-panel")).toContainText("R$ 620");
});

test("stories, comentários, produtos e ajuda não exigem decisão entre capítulos", async ({ page }) => {
  await enter(page);
  await page.locator('[data-action="story"]').first().click();
  await expect(page.locator(".story-layer")).toBeVisible();
  await page.locator("button.story-close").click();
  await page.locator('[data-rec-id^="p"] [data-action="comments"]').first().click();
  await expect(page.locator(".bottom-sheet")).toBeVisible();
  await page.locator('[data-action="close-modal"]').click();
  await page.locator('.ad-post [data-action="product"]').first().click();
  await expect(page.locator(".product-info")).toBeVisible();
  await page.locator('[data-action="coach"]').click();
  await expect(page.locator(".critical-panel")).toContainText("O anúncio chama sua atenção");
  await expect(page.locator(".critical-panel")).toContainText("Não é uma resposta do MCP conectado");
  await page.locator('.critical-panel [data-action="product"]').click();
  await page.locator('[data-action="pass"]').click();
  await expect(page.locator(".phone")).toBeVisible();
  await expect(page.locator(".transition")).toHaveCount(0);
});

test("continuação progressiva mantém a variedade sem telas de momento", async ({ page }) => {
  await enter(page);
  const before = await page.locator(".post").count();
  await page.locator(".load-more").click();
  expect(await page.locator(".post").count()).toBeGreaterThan(before);
  await loadAll(page);
  await expect(page.locator('[data-rec-id^="p"]')).toHaveCount(12);
  await expect(page.locator(".feed-end-hint")).toBeVisible();
  await page.locator(".finish-feed").click();
  await expect(page.locator(".end")).toBeVisible();
  await expect(page.locator(".end")).toContainText("Você lembra");
  await expect(page.locator(".end")).toContainText("R$ 400");
});

test("duas compras podem comprometer a reserva sem encerrar o feed", async ({ page }) => {
  await enter(page);
  const firstAd = page.locator(".ad-post").first();
  await firstAd.locator('[data-action="product"]').first().click();
  await page.locator('[data-action="buy"]').click();
  await expect(page.locator(".phone")).toBeVisible();
  await page.locator(".load-more").click();
  const nextAd = page.locator(".ad-post").last();
  await nextAd.locator('[data-action="product"]').first().click();
  await page.locator('[data-action="buy"]').click();
  await expect(page.locator(".phone")).toBeVisible();
  await page.locator('.phone-footer [data-action="goal"]').click();
  await expect(page.locator(".goal-result")).toContainText("comprometida");
  await page.locator('.critical-panel [data-action="finish"]').click();
  await expect(page.locator(".end")).toContainText("não foi preservada");
  await expect(page.locator(".end")).toContainText("Conflito de objetivos");
});

test("o jogador pode sair sem comprar e manter a reserva", async ({ page }) => {
  await enter(page);
  await page.locator(".finish-feed").click();
  await expect(page.locator(".end")).toContainText("preservou a reserva de R$ 400");
  await expect(page.locator(".end")).toContainText("R$ 620,00");
  await page.locator('[data-action="restart"]').click();
  await expect(page.locator(".home")).toBeVisible();
});

test("o algoritmo é explicável e pode ser desligado", async ({ page }) => {
  await enter(page);
  await page.locator('[data-action="like"]').first().click();
  await page.locator('.phone-head [data-action="algorithm"]').click();
  await expect(page.locator(".algorithm-panel")).toBeVisible();
  await expect(page.locator(".algorithm-panel")).toContainText("Interesses inferidos");
  await page.locator(".algorithm-panel #privacy-switch").uncheck();
  await expect(page.locator(".algorithm-panel")).toContainText("Desligada");
  await page.locator('[data-action="close-overlay"]').click();
  await expect(page.locator(".recommendation-caption")).toContainText("ordem editorial");
  await page.locator('[data-rec-id^="p"] [data-action="post-more"]').first().click();
  await expect(page.locator(".algorithm-explanation")).toContainText("A personalização está desligada");
});

test("o botão de retorno funciona por cima dos stories", async ({ page }) => {
  await enter(page);
  const home = page.locator("#exit-home-trigger");
  await page.locator('[data-action="story"]').first().click();
  await home.click();
  await expect(page.getByRole("dialog", { name: "Voltar ao início?" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar jogando" }).click();
  await expect(page.locator(".story-layer")).toBeVisible();
  await home.click();
  await page.getByRole("button", { name: "Voltar ao início", exact: true }).click();
  await expect(page.locator(".home")).toBeVisible();
  await expect(home).toBeHidden();
});

test("as fotografias dos posts e stories são distintas", async ({ page }) => {
  await enter(page);
  await loadAll(page);
  const photos = await page.locator('[data-rec-id^="p"] .post-media img.art-photo').evaluateAll(imgs => imgs.map(img => img.getAttribute("src")));
  expect(photos).toHaveLength(12);
  expect(new Set(photos).size).toBe(12);
  expect(photos.every(src => /post-p[0-9]+[.]jpg$/.test(src || ""))).toBe(true);
  const storyPhotos = [];
  for (const index of [0, 3, 6, 9]) {
    await page.locator('[data-action="story"]').nth(index).click();
    storyPhotos.push(await page.locator(".story-layer img.art-photo").getAttribute("src"));
    await page.locator("button.story-close").click();
  }
  expect(new Set(storyPhotos).size).toBe(4);
});

test("apagar sinais não apaga compras ou itens no carrinho", async ({ page }) => {
  await enter(page);
  await page.locator('.ad-post [data-action="product"]').first().click();
  await page.locator('[data-action="add-cart"]').click();
  await page.locator('[data-action="close-overlay"]').click();
  await page.locator('.phone-head [data-action="algorithm"]').click();
  await page.locator('[data-action="clear-algorithm"]').click();
  await expect(page.locator(".algo-summary")).toContainText("0");
  await page.locator('[data-action="close-overlay"]').click();
  await page.locator('.phone-head [data-action="cart"]').click();
  await expect(page.locator(".cart-item")).toHaveCount(1);
});
