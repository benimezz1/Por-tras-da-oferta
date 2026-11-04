import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const KEY = "nofeed-simulator-v4";
test.use({ reducedMotion: "reduce" });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("week-e2e-initialized")) {
      localStorage.clear();
      sessionStorage.setItem("week-e2e-initialized", "1");
    }
  });
});

async function enter(page: Page) {
  await page.goto("/");
  await page.locator('[data-action="start"]').click();
  await expect(page.locator(".cinematic")).toContainText("guardar R$ 400");
  await expect(page.locator(".cinematic")).toContainText("Nenhum pagamento é real");
  await page.locator('[data-action="intro-next"]').click();
  await expect(page.locator(".wake")).toContainText("SEGUNDA-FEIRA");
  await page.locator('[data-action="open-day"]').click();
  await expect(page.locator(".status-bar")).toContainText("SEG");
}
const saved = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), KEY);
async function endOfDay(page: Page) {
  for (let i = 0; i < 16; i++) {
    if (await page.locator('[data-action="sleep"]').count()) break;
    await page.locator(".load-more").evaluate((b: HTMLElement) => b.click());
  }
  await expect(page.locator('[data-action="sleep"]')).toBeVisible();
}
async function nextDay(page: Page) {
  await endOfDay(page);
  await page.locator('[data-action="sleep"]').click();
  const open = page.locator('[data-action="open-day"]');
  if (await open.count()) await open.click();
}
async function firstAdProduct(page: Page) {
  for (let i = 0; i < 4 && !(await page.locator(".ad-post").count()); i++)
    await page.locator(".load-more").evaluate((b: HTMLElement) => b.click());
  await page.locator(".ad-post .ad-shop-button").first().click();
  await expect(page.locator(".shop-title")).toBeVisible();
}

test("a partida mantém a imersão: HUD, sem avisos de bastidor e meta só sob demanda", async ({ page }) => {
  await enter(page);
  await expect(page.locator(".hud-vibe")).toBeVisible();
  await expect(page.locator(".hud-coins")).toContainText("R$ 5,00");
  await expect(page.locator(".ev-checkin")).toBeVisible();
  await expect(page.locator(".phone")).not.toContainText("fictíci");
  await expect(page.locator('[data-action="algorithm-final"]')).toHaveCount(0);
  await page.locator('.phone-footer [data-action="goal"]').click();
  await expect(page.locator(".critical-panel")).toContainText("R$ 400");
  await expect(page.locator(".critical-panel")).toContainText("R$ 620,00");
});

test("a loja usa cronômetro que reinicia, escassez, parcela e oferta de saída com confirmshaming", async ({ page }) => {
  await enter(page);
  await firstAdProduct(page);
  await expect(page.locator(".urgency")).toContainText(/OFERTA RELÂMPAGO|LOTE|grátis/);
  await expect(page.locator(".price-sub, .urgency.trial").first()).toBeVisible();
  const topic = await page.evaluate(() => document.querySelector(".layer .shop-browser b")?.textContent);
  expect(topic).toContain("pulso.shop/");
  await page.locator('[data-action="pass"]').click();
  const sheet = page.locator(".exit-offer");
  if (await sheet.count()) {
    await expect(sheet).toContainText("Não, prefiro pagar mais caro");
    await page.locator('[data-action="exit-decline"]').click();
  }
  await expect(page.locator(".layer")).toHaveCount(0);
  const s = await saved(page);
  expect(s.pressure.exposed.dark_patterns + s.pressure.exposed.urgencia).toBeGreaterThan(0);
});

test("o fone tem modelo isca e o cronômetro volta a 10:00 a cada visita", async ({ page }) => {
  await enter(page);
  await page.locator('[data-action="shop"]').first().click();
  await page.locator('.shop-product[data-product="fone"]').click();
  await expect(page.locator(".variant")).toHaveCount(3);
  await expect(page.locator(".variant.on")).toContainText("Atmos One");
  await page.locator('[data-variant="lite"]').click();
  await expect(page.locator(".shop-title h2")).toHaveText("Atmos Lite");
  await page.locator('[data-action="shop-back"]').click();
  await page.locator('.shop-product[data-product="fone"]').click();
  const s = await saved(page);
  expect(s.timers.fone.resets).toBe(1);
  expect(s.stock.fone).toBeGreaterThanOrEqual(2);
});

test("checkout pré-marca a proteção, mostra taxa tardia e o Pulso Pay joga a compra para a fatura", async ({ page }) => {
  await enter(page);
  await page.locator('[data-action="shop"]').first().click();
  await page.locator('.shop-product[data-product="fone"]').click();
  await page.locator('.shop-footer [data-action="checkout"]').click();
  await expect(page.locator('[data-protect="fone"]')).toBeChecked();
  await expect(page.locator(".summary")).toContainText("Taxa de serviço");
  await page.locator('[data-action="activate-card-checkout"]').first().click();
  await expect(page.locator('input[name="pay"][value="card10"]')).toBeChecked();
  await expect(page.locator(".checkout-summary")).toContainText("10x de");
  await page.locator('.shop-footer [data-action="buy"]').click();
  await expect(page.locator(".receipt-screen")).toContainText("cashback");
  const s = await saved(page);
  expect(s.wallet).toBe(620);
  expect(s.invoice).toHaveLength(1);
  expect(s.invoice[0].n).toBe(10);
  expect(s.invoice[0].interest).toBeGreaterThan(0);
  expect(s.pressure.influenced.dark_patterns.length).toBeGreaterThan(0);
  expect(s.pressure.influenced.preco.length).toBeGreaterThan(0);
});

test("a roleta para ao lado do prêmio maior e dá um cupom com valor mínimo", async ({ page }) => {
  await enter(page);
  for (let i = 0; i < 4 && !(await page.locator(".ev-roleta").count()); i++)
    await page.locator(".load-more").evaluate((b: HTMLElement) => b.click());
  await page.locator('.ev-roleta [data-action="roleta"]').click();
  await page.locator('[data-action="spin"]').click();
  await expect(page.locator(".roleta-result")).toContainText("QUASE");
  await expect(page.locator(".roleta-result")).toContainText("acima de R$ 249");
  const s = await saved(page);
  expect(s.coupons.find((c: { code: string }) => c.code === "ROLETA50").min).toBe(249);
});

test("o amigo oferece uma alternativa barata pelo direct", async ({ page }) => {
  await enter(page);
  await page.locator('[data-action="inbox"].hud-dm').click();
  await page.locator('.inbox-row[data-thread="lucca"]').click();
  await expect(page.locator(".chat-body")).toContainText("conserta fone");
  await page.locator('[data-choice="repair"]').click();
  await expect(page.locator(".chat-body")).toContainText("devolve quinta");
  expect((await saved(page)).wallet).toBe(585);
});

test("a semana tem cinco dias, live na terça e Mega Liquida com preço “de” inflado", async ({ page }) => {
  await enter(page);
  await nextDay(page);
  await expect(page.locator(".status-bar")).toContainText("TER");
  for (let i = 0; i < 4 && !(await page.locator(".ev-live").count()); i++)
    await page.locator(".load-more").evaluate((b: HTMLElement) => b.click());
  await page.locator(".ev-live .ev-btn").click();
  await expect(page.locator("div.live")).toContainText("AO VIVO");
  await expect(page.locator(".live-info")).toContainText("LIVIA15");
  await page.locator('[data-action="leave-live"]').click();
  await expect(page.locator(".exit-offer")).toContainText("perder meu desconto");
  await page.locator('[data-action="live-exit"]').click();
  await nextDay(page);
  await nextDay(page);
  await expect(page.locator(".status-bar")).toContainText("QUI");
  await page.locator(".ev-flash .ev-btn").click();
  await expect(page.locator(".sale-banner")).toContainText("MEGA LIQUIDA");
  await expect(page.locator('.shop-product[data-product="mochila"]')).toContainText("R$ 399,90");
});

test("sem compras o jogador embarca e passa pelo final em quatro etapas", async ({ page }) => {
  await enter(page);
  for (let d = 0; d < 5; d++) await nextDay(page);
  await expect(page.locator(".end")).toContainText("Você embarcou");
  await expect(page.locator(".extrato")).toContainText("R$ 400,00 pago");
  await page.locator('[data-action="end-next"]').click();
  await expect(page.locator(".end")).toContainText("Nada ali era por acaso");
  await expect(page.locator(".strat")).toHaveCount(10);
  await expect(page.locator(".vibe-chart svg")).toBeVisible();
  await page.locator('[data-action="end-next"]').click();
  const questions = page.locator(".quiz-q");
  await expect(questions).toHaveCount(5);
  await expect(page.locator('[data-action="end-next"]')).toBeDisabled();
  // A resposta precisa aparecer no mesmo lugar, sem reconstruir o quiz ou voltar ao topo.
  const fourthQuestion = questions.nth(3);
  const fourthOption = fourthQuestion.locator(".quiz-opt").first();
  await fourthOption.scrollIntoViewIfNeeded();
  const scroller = page.locator(".end");
  const originalCard = await fourthQuestion.elementHandle();
  const scrollBefore = await scroller.evaluate((element) => element.scrollTop);
  expect(scrollBefore).toBeGreaterThan(100);
  await fourthOption.click();
  await expect(fourthQuestion.locator(".quiz-feedback")).toBeVisible();
  expect(await originalCard?.evaluate((element) => element.isConnected)).toBe(true);
  const scrollAfter = await scroller.evaluate((element) => element.scrollTop);
  expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(25);
  expect(scrollAfter).toBeGreaterThan(100);

  for (let i = 0; i < 5; i++) {
    if (i !== 3) await questions.nth(i).locator(".quiz-opt").first().click();
  }
  await expect(page.locator('[data-action="end-next"]')).toBeEnabled();
  await page.locator('[data-action="end-next"]').click();
  await expect(page.locator(".end")).toContainText("Reconheceu");
  const button = page.locator('[data-action="algorithm-final"]');
  await button.click();
  await expect(page.locator("#algorithm-final-panel")).toBeVisible();
  await page.locator('[data-action="restart"]').click();
  await expect(page.locator(".home")).toBeVisible();
});

test("comprar no Pix além da folga faz perder a viagem", async ({ page }) => {
  await enter(page);
  for (const id of ["fone", "tenis"]) {
    await page.locator('[data-action="shop"]').first().click();
    await page.locator(`.shop-product[data-product="${id}"]`).click();
    await page.locator('.shop-footer [data-action="checkout"]').click();
    await page.locator('.shop-footer [data-action="buy"]').click();
    await page.locator(".receipt-screen [data-action='close-overlay']").click();
  }
  expect((await saved(page)).wallet).toBeLessThan(400);
  await page.locator('.phone-footer [data-action="profile"]').click();
  await page.locator('.layer [data-action="finish"]').click();
  await expect(page.locator(".end")).toContainText("O ônibus saiu sem você");
  await expect(page.locator(".extrato")).toContainText("recusado");
  await page.locator('[data-action="end-next"]').click();
  await expect(page.locator(".strat.is-fell").first()).toBeVisible();
});


test("as fotos dos produtos preenchem os quadrados sem margens internas ou faixas vazias", async ({ page }) => {
  await enter(page);
  await page.locator('[data-action="shop"]').first().click();
  for (const id of ["fone", "tenis", "plano", "mochila", "powerbank", "garrafa", "luminaria", "ingresso"]) {
    const photo = page.locator(`.shop-product[data-product="${id}"] .art.has-photo.is-product-photo .art-photo`);
    await expect(photo).toHaveCount(1);
    await expect(photo).toHaveCSS("object-fit", "cover");
    await expect(photo).toHaveCSS("padding", "0px");
    await expect(photo).toHaveCSS("position", "absolute");
    const layout = await photo.evaluate((image) => {
      const tile = image.parentElement!;
      const bounds = image.getBoundingClientRect();
      const square = tile.getBoundingClientRect();
      return {
        fillsWidth: Math.abs(bounds.width - square.width) <= 1,
        fillsHeight: Math.abs(bounds.height - square.height) <= 1,
        loaded: (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
        backdrop: getComputedStyle(tile, "::before").content,
      };
    });
    expect(layout.fillsWidth).toBe(true);
    expect(layout.fillsHeight).toBe(true);
    expect(layout.loaded).toBe(true);
    expect(layout.backdrop).toBe("none");
  }

  await page.locator('.shop-product[data-product="luminaria"]').click();
  const hero = page.locator(".shop-hero .art.has-photo.is-product-photo .art-photo");
  await expect(hero).toHaveCSS("object-fit", "cover");
  await expect(hero).toHaveCSS("padding", "0px");
});

test("exporta JSON da semana pelo perfil sem enviar dados automaticamente", async ({ page }) => {
  await enter(page);
  await page.locator('.phone-footer [data-action="profile"]').click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator('.layer [data-action="export-c4"]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename().startsWith("por-tras-da-oferta-semana-")).toBe(true);
  expect(download.suggestedFilename().endsWith(".json")).toBe(true);
  const filePath = await download.path();
  expect(filePath).toBeTruthy();
  const exported = JSON.parse(await readFile(filePath!, "utf8"));
  expect(exported).toMatchObject({
    formato: "por-tras-da-oferta/c4-semana",
    versao: 1,
    campanha: "semana-ate-a-viagem",
    simulado: true,
    estado: { version: 4, started: true, day: 1, wallet: 620, goal: 400 },
  });
  expect(exported.resumo.estrategias).toHaveLength(10);
  expect(exported.sessao.id).toBeTruthy();
  await expect(page.locator(".layer .export-c4-status")).toContainText("Arquivo JSON baixado");
  await expect(page.locator(".status-bar")).toContainText("SEG");
});

test("o encerramento inclui exportação do percurso para o MCP", async ({ page }) => {
  await enter(page);
  for (let d = 0; d < 5; d++) await nextDay(page);
  for (let i = 0; i < 3; i++) {
    if (i === 2) {
      for (let q = 0; q < 5; q++) await page.locator(".quiz-q").nth(q).locator(".quiz-opt").first().click();
    }
    await page.locator('[data-action="end-next"]').click();
  }
  await expect(page.locator('.end-step-3 [data-action="export-c4"]')).toBeVisible();
  const dl = page.waitForEvent("download");
  await page.locator('.end-step-3 [data-action="export-c4"]').click();
  const file = await dl;
  const data = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(data.estado.finished).toBe(true);
  expect(data.resumo.quiz.respondidas).toBe(5);
  expect(data.sessao.concluidaEm).toBeTruthy();
});
