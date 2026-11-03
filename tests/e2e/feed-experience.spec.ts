
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("nofeed-e2e-initialized")) {
      localStorage.removeItem("nofeed-simulator-v3");
      localStorage.removeItem("nofeed-simulator-v2");
      sessionStorage.setItem("nofeed-e2e-initialized", "1");
    }
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
    const count = await page.locator(".load-more").count();
    if (!count) break;
    const before = await page.locator(".post").count();
    await page.locator(".load-more").evaluate(button => button.click());
    await expect.poll(async () => page.locator(".post").count(), {timeout:8000}).toBeGreaterThan(before);
  }
}

test("uma única linha do tempo mistura produtos e recorda a meta só quando solicitada", async ({ page }) => {
  await enter(page);
  await expect(page.locator(".decision")).toHaveCount(0);
  await expect(page.locator(".transition")).toHaveCount(0);
  await expect(page.locator(".story-rail .story")).toHaveCount(9);
  const authors=await page.locator(".story-rail .story").evaluateAll(buttons=>buttons.map(b=>b.getAttribute("data-story-user")));
  expect(new Set(authors).size).toBe(authors.length);
  expect(authors.filter(author=>author==="lucca")).toHaveLength(1);
  expect(authors.filter(author=>author==="bia")).toHaveLength(1);
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
  for (const index of [0, 2, 4, 7]) {
    await page.locator('[data-action="story"]').nth(index).click();
    storyPhotos.push(await page.locator(".story-layer img.story-photo").getAttribute("src"));
    await page.locator("button.story-close").click();
  }
  expect(new Set(storyPhotos).size).toBe(4);
});


test("stories avançam no mesmo visualizador com toque, teclado e barra de progresso", async ({ page }) => {
  await enter(page);
  await page.locator('[data-action="story"]').first().click();
  const layer=page.locator(".story-layer");
  await expect(layer).toBeVisible();
  const firstAuthor=await layer.getAttribute("data-story-user");
  const authored=await page.locator('.story-rail .story[data-story-user="'+firstAuthor+'"]').count();
  expect(authored).toBe(1);
  const storyCounts={bia:2,lucca:3};
  const expectedCount=storyCounts[firstAuthor]||1;
  await expect(layer.locator(".story-progress-segment")).toHaveCount(expectedCount);
  const first=await layer.locator(".story-user").textContent();
  const firstIndex=await layer.getAttribute("data-story-index");
  await layer.locator('[data-action="story-next"]').click();
  await expect(layer).not.toHaveAttribute("data-story-index",firstIndex);
  const second=await layer.locator(".story-user").textContent();
  expect(second).not.toEqual(first);
  const secondIndex=await layer.getAttribute("data-story-index");
  await layer.locator('[data-action="story-prev"]').click();
  await expect(layer).toHaveAttribute("data-story-index",firstIndex);
  expect(await layer.locator(".story-user").textContent()).toEqual(first);
  await page.keyboard.press("ArrowRight");
  await expect(layer).toHaveAttribute("data-story-index",secondIndex);
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
  const firstIndex=await layer.getAttribute("data-story-index");
  await page.clock.fastForward(5700);
  await expect(layer).toBeVisible();
  await expect(layer).not.toHaveAttribute("data-story-index",firstIndex);
  const second=await layer.locator(".story-user").textContent();
  expect(second).toBeTruthy();
  await layer.locator('[data-action="story-pause"]').click();
  await expect(layer).toHaveClass(/is-paused/);
  await page.clock.fastForward(8000);
  expect(await layer.locator(".story-user").textContent()).toEqual(second);
  await layer.locator('[data-action="story-pause"]').click();
  await expect(layer).not.toHaveClass(/is-paused/);
  const secondIndex=await layer.getAttribute("data-story-index");
  await page.clock.fastForward(5700);
  await expect(layer).not.toHaveAttribute("data-story-index",secondIndex);
});

test("deslizar o story para o lado troca de publicação sem sair do visualizador", async ({ page }) => {
  await enter(page);
  await page.locator('[data-action="story"]').first().click();
  const layer=page.locator(".story-layer");
  const name=await layer.locator(".story-user").textContent();
  const index=await layer.getAttribute("data-story-index");
  const next=layer.locator(".story-tap-zone.next");
  await next.dispatchEvent("pointerdown",{pointerId:1,clientX:310,clientY:270});
  await next.dispatchEvent("pointerup",{pointerId:1,clientX:160,clientY:273});
  await expect(layer).not.toHaveAttribute("data-story-index",index);
  expect(await layer.locator(".story-user").textContent()).not.toEqual(name);
  await layer.locator("button.story-close").click();
  await expect(layer).toHaveCount(0);
});

test("o último story encerra a sequência sem reabrir o feed", async ({ page }) => {
  await enter(page);
  await page.locator('[data-action="story"]').last().click();
  const layer=page.locator(".story-layer");
  await expect(layer).toBeVisible();
  const count=await layer.locator(".story-progress-segment").count();
  for(let i=0;i<count;i++){
   if(await layer.count()===0)break;
   await layer.locator("[data-action='story-next']").click();
  }
  await expect(layer).toHaveCount(0);
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


test("cada autor reúne seus stories, muda de perfil e reinicia as barras", async ({ page }) => {
  await enter(page);
  const lucca=page.locator('.story-rail .story[data-story-user="lucca"]');
  await expect(lucca).toHaveCount(1);
  await lucca.click();
  const layer=page.locator(".story-layer");
  await expect(layer).toHaveAttribute("data-story-user","lucca");
  await expect(layer.locator(".story-progress-segment")).toHaveCount(3);
  const usernames=[];
  for(let i=0;i<3;i++){
    usernames.push(await layer.locator(".story-user strong").textContent());
    if(i<2){
      const before=await layer.getAttribute("data-story-index");
      await layer.locator('[data-action="story-next"]').click();
      await expect(layer).not.toHaveAttribute("data-story-index",before);
    }
  }
  expect(usernames).toEqual(["lucca","lucca","lucca"]);
  await layer.locator('[data-action="story-next"]').click();
  await expect(layer).toBeVisible();
  await expect(layer).not.toHaveAttribute("data-story-user","lucca");
  const changed=await layer.locator(".story-user strong").textContent();
  expect(changed).toBeTruthy();
  await expect(layer.locator(".story-progress-fill.completed")).toHaveCount(0);
  const current=layer.locator(".story-progress-fill.current");
  await expect(current).toHaveCount(1);
  await expect(layer.locator("img.story-photo")).toBeVisible();
  await expect(layer.locator("img.story-photo")).toHaveJSProperty("complete",true);
});

test("troca para imagem já carregada sem mostrar tela cinza durante transição lenta", async ({ page }) => {
  await page.route("**/assets/social/unique/story-plano-2.jpg", async route => {
    await new Promise(resolve=>setTimeout(resolve,1800));
    await route.continue();
  });
  await enter(page);
  await page.locator('.story-rail .story[data-story-user="bia"]').click();
  const layer=page.locator(".story-layer");
  await expect(layer).toHaveAttribute("data-story-user","bia");
  const original=await layer.locator("img.story-photo").getAttribute("src");
  await layer.locator('[data-action="story-next"]').click();
  await expect(layer).toBeVisible();
  await expect(layer.locator("img.story-photo")).toHaveAttribute("src",original);
  await expect(layer.locator("img.story-photo")).toBeVisible();
  await expect(layer).toHaveAttribute("data-story-user","bia");
  await expect(layer.locator("img.story-photo")).not.toHaveAttribute("src",original,{timeout:7000});
  await expect(layer.locator("img.story-photo")).toBeVisible();
  await expect(layer.locator("img.story-photo")).toHaveJSProperty("complete",true);
});

test("ao entrar em um story, o avatar e o nome pertencem ao autor selecionado", async ({ page }) => {
  await enter(page);
  const authors=["gabi","livia","mia","loja.noma"];
  for(const author of authors){
    const bubble=page.locator('.story-rail .story[data-story-user="'+author+'"]');
    await expect(bubble).toHaveCount(1);
    await bubble.click();
    const layer=page.locator(".story-layer");
    await expect(layer).toHaveAttribute("data-story-user",author);
    await expect(layer.locator(".story-user strong")).toHaveText(author);
    await expect(layer.locator(".story-owner-avatar")).toBeVisible();
    await layer.locator('[data-action="close-story"]').click();
  }
});


test("foto do feed: clique simples não abre comentários e duplo clique curte com coração preenchido", async ({ page }) => {
  await enter(page);
  const card=page.locator('.post[data-rec-id^="p"]').first();
  const id=await card.getAttribute("data-rec-id");
  const photo=card.locator(".feed-photo");
  const heart=card.locator('[data-action="like"]');
  const icon=heart.locator("svg");
  const initial=await card.locator(".likecount").textContent();
  await photo.click();
  await expect(page.locator(".bottom-sheet")).toHaveCount(0);
  await expect(heart).toHaveAttribute("aria-pressed","false");
  await photo.dblclick();
  await expect(heart).toHaveAttribute("aria-pressed","true");
  await expect(heart).toHaveClass(/is-liked/);
  await expect(icon).toHaveClass(/heart-filled/);
  await expect(icon).toHaveCSS("fill","rgb(236, 71, 126)");
  expect(await card.locator(".likecount").textContent()).not.toEqual(initial);
  await photo.dblclick();
  await expect(heart).toHaveAttribute("aria-pressed","true");
  expect(await page.evaluate((id)=>JSON.parse(localStorage.getItem("nofeed-simulator-v3")).liked.filter(x=>x===id).length,id)).toBe(1);
  await heart.click();
  await expect(heart).toHaveAttribute("aria-pressed","false");
  await expect(icon).not.toHaveClass(/heart-filled/);
  await expect(card.locator(".likecount")).toHaveText(initial);
  await expect(page.locator(".bottom-sheet")).toHaveCount(0);
  await card.locator('[data-action="comments"]').click();
  await expect(page.locator(".bottom-sheet")).toBeVisible();
});

test("anúncios também podem ser curtidos com duplo clique, sem abrir loja ou comentários", async ({ page }) => {
  await enter(page);
  const ad=page.locator(".ad-post").first();
  const adId=await ad.getAttribute("data-rec-id");
  const photo=ad.locator(".feed-photo");
  const heart=ad.locator('[data-action="like-ad"]');
  await photo.click();
  await expect(page.locator(".layer")).toHaveCount(0);
  await expect(page.locator(".bottom-sheet")).toHaveCount(0);
  await photo.dblclick();
  await expect(heart).toHaveAttribute("aria-pressed","true");
  await expect(heart.locator("svg")).toHaveCSS("fill","rgb(236, 71, 126)");
  expect(await page.evaluate((id)=>JSON.parse(localStorage.getItem("nofeed-simulator-v3")).likedAds.includes(id),adId)).toBe(true);
  await page.reload();
  const again=page.locator('.ad-post[data-rec-id="'+adId+'"]');
  await expect(again.locator('[data-action="like-ad"]')).toHaveAttribute("aria-pressed","true");
  await again.locator('[data-action="like-ad"]').click();
  await expect(again.locator('[data-action="like-ad"]')).toHaveAttribute("aria-pressed","false");
  await again.locator('[data-action="product"]').first().click();
  await expect(page.locator(".product-info")).toBeVisible();
});

test("toque duplo na foto em celular curte, enquanto arrastar não curte", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name!=="mobile","Gestos de toque disponíveis no projeto mobile.");
  await enter(page);
  const card=page.locator('.post[data-rec-id^="p"]').first();
  const photo=card.locator(".feed-photo");
  const heart=card.locator('[data-action="like"]');
  await expect(photo).toHaveCSS("touch-action","manipulation");
  await photo.evaluate(el=>{
    const opts={bubbles:true,pointerType:"touch",pointerId:42,clientX:120,clientY:150};
    el.dispatchEvent(new PointerEvent("pointerdown",opts));
    el.dispatchEvent(new PointerEvent("pointerup",{...opts,clientY:205}));
  });
  await expect(heart).toHaveAttribute("aria-pressed","false");
  const box=await photo.boundingBox();
  expect(box).toBeTruthy();
  const x=box.x+box.width/2,y=box.y+Math.min(box.height/2,160);
  await page.touchscreen.tap(x,y);
  await page.touchscreen.tap(x,y);
  await expect(heart).toHaveAttribute("aria-pressed","true");
  await expect(heart.locator("svg")).toHaveClass(/heart-filled/);
  await expect(page.locator(".bottom-sheet")).toHaveCount(0);
});
