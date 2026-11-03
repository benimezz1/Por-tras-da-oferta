
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
  await expect(page.locator('.rail.right')).toHaveCount(0);
  await expect(page.locator('[data-action="algorithm"]')).toHaveCount(0);
  await expect(page.locator('.algorithm-final')).toHaveCount(0);
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
  await page.locator('.layer [data-action="coach"]').click();
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


test("compras livres podem comprometer o objetivo sem encerrar o feed", async ({ page }) => {
  await enter(page);
  await loadAll(page);
  const options = await page.locator('.ad-post[data-rec-id^="ad-main-"]').evaluateAll(els =>
    [...new Set(els.map(el => el.getAttribute("data-rec-topic")))].filter(Boolean)
  );
  expect(options.length).toBeGreaterThanOrEqual(2);
  const price = { tenis: 279.90, fone: 219.90, mochila: 159.90, plano: 39.80 };
  options.sort((a, b) => price[b] - price[a]);
  let failedGoal = false;
  for (const id of options) {
    await page.locator('.ad-post[data-rec-topic="' + id + '"] [data-action="product"]').first().click();
    await page.locator('[data-action="buy"]').click();
    await expect(page.locator(".phone")).toBeVisible();
    const remaining = await page.evaluate(() => JSON.parse(localStorage.getItem("nofeed-simulator-v3")).wallet);
    if (remaining < 400) { failedGoal = true; break; }
  }
  expect(failedGoal).toBe(true);
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

test("o algoritmo só é explicado na conclusão, e as configurações continuam no perfil", async ({ page }) => {
  await enter(page);
  await expect(page.locator('[data-action="algorithm"]')).toHaveCount(0);
  await expect(page.locator('[data-action="algorithm-final"]')).toHaveCount(0);
  await expect(page.locator(".why-post")).toHaveCount(0);
  await page.locator('[data-action="like"]').first().click();
  await page.locator('.phone-footer [data-action="profile"]').click();
  await page.locator('.layer #privacy-switch').uncheck();
  await page.locator('[data-action="close-overlay"]').click();
  await expect(page.locator(".recommendation-caption")).toContainText("ordem editorial");
  await page.locator(".finish-feed").click();
  const button=page.locator('[data-action="algorithm-final"]');
  const report=page.locator("#algorithm-final-panel");
  await expect(button).toBeVisible();
  await expect(report).toBeHidden();
  await button.click();
  await expect(report).toBeVisible();
  await expect(report).toContainText("Interesses que a simulação inferiu");
  await expect(report).toContainText("não recebeu sua meta de poupar R$ 400");
  await expect(button).toHaveAttribute("aria-expanded","true");
  await button.click();
  await expect(report).toBeHidden();
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


test("stories avançam no mesmo visualizador com toque, teclado e barra de progresso", async ({ page }) => {
  await enter(page);
  await page.locator('[data-action="story"]').first().click();
  const layer=page.locator(".story-layer");
  await expect(layer).toBeVisible();
  await expect(layer.locator(".story-progress-segment")).toHaveCount(12);
  const first=await layer.locator(".story-user").textContent();
  await layer.locator('[data-action="story-next"]').click();
  await expect(layer).toBeVisible();
  const second=await layer.locator(".story-user").textContent();
  expect(second).not.toEqual(first);
  await layer.locator('[data-action="story-prev"]').click();
  expect(await layer.locator(".story-user").textContent()).toEqual(first);
  await page.keyboard.press("ArrowRight");
  expect(await layer.locator(".story-user").textContent()).toEqual(second);
  await page.keyboard.press("Escape");
  await expect(layer).toHaveCount(0);
  await expect(page.locator(".phone")).toBeVisible();
});

test("stories passam automaticamente e podem ser pausados", async ({ page }) => {
  await page.clock.install();
  await enter(page);
  await page.locator('[data-action="story"]').first().click();
  const layer=page.locator(".story-layer");
  const first=await layer.locator(".story-user").textContent();
  await page.clock.fastForward(5700);
  await expect(layer).toBeVisible();
  const second=await layer.locator(".story-user").textContent();
  expect(second).not.toEqual(first);
  await layer.locator('[data-action="story-pause"]').click();
  await expect(layer).toHaveClass(/is-paused/);
  await page.clock.fastForward(8000);
  expect(await layer.locator(".story-user").textContent()).toEqual(second);
  await layer.locator('[data-action="story-pause"]').click();
  await expect(layer).not.toHaveClass(/is-paused/);
  await page.clock.fastForward(5700);
  expect(await layer.locator(".story-user").textContent()).not.toEqual(second);
});

test("deslizar o story para o lado troca de publicação sem sair do visualizador", async ({ page }) => {
  await enter(page);
  await page.locator('[data-action="story"]').first().click();
  const layer=page.locator(".story-layer");
  const name=await layer.locator(".story-user").textContent();
  const next=layer.locator(".story-tap-zone.next");
  await next.dispatchEvent("pointerdown",{pointerId:1,clientX:310,clientY:270});
  await next.dispatchEvent("pointerup",{pointerId:1,clientX:160,clientY:273});
  await expect(layer).toBeVisible();
  expect(await layer.locator(".story-user").textContent()).not.toEqual(name);
  await layer.locator("button.story-close").click();
  await expect(layer).toHaveCount(0);
});

test("o último story encerra a sequência sem reabrir o feed", async ({ page }) => {
  await enter(page);
  await page.locator('[data-action="story"]').last().click();
  await expect(page.locator(".story-layer")).toBeVisible();
  await page.locator(".story-layer [data-action='story-next']").click();
  await expect(page.locator(".story-layer")).toHaveCount(0);
  await expect(page.locator(".phone")).toBeVisible();
});

test("o carrinho permanece acessível sem botão de algoritmo no feed", async ({ page }) => {
  await enter(page);
  await page.locator('.ad-post [data-action="product"]').first().click();
  await page.locator('[data-action="add-cart"]').click();
  await page.locator('[data-action="close-overlay"]').click();
  await expect(page.locator('[data-action="algorithm"]')).toHaveCount(0);
  await page.locator('.phone-head [data-action="cart"]').click();
  await expect(page.locator(".cart-item")).toHaveCount(1);
});
