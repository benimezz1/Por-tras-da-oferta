
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
  for (let n = 0; n < 12; n++) {
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
  await expect(page.locator(".story-rail .story")).toHaveCount(13);
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
  await expect(page.locator(".shop-title")).toBeVisible();
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
  await expect(page.locator('[data-rec-id^="p"]')).toHaveCount(24);
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
    await page.locator('.shop-footer [data-action="checkout"]').click();
    await expect(page.locator(".checkout-summary")).toBeVisible();
    await page.locator('.shop-footer [data-action="buy"]').click();
    await expect(page.locator(".receipt-screen")).toBeVisible();
    await page.locator(".receipt-screen [data-action='close-overlay']").click();
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
  expect(photos).toHaveLength(24);
  expect(new Set(photos).size).toBe(24);
  expect(photos.every(src => /(?:unique\/post-p[0-9]+[.]jpg|social\/[a-z_-]+[.]webp)$/.test(src || ""))).toBe(true);
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
  const storyCounts={bia:2,lucca:3,"rafa.tech":2,"vida.fit":2,"estudo.com":2,"agenda.festival":2};
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

test("um clique na foto do anúncio abre o site e dois cliques curtem sem sair", async ({ page }) => {
  await enter(page);
  const ad=page.locator(".ad-post").first();
  const adId=await ad.getAttribute("data-rec-id");
  const photo=ad.locator(".feed-photo");
  const heart=ad.locator('[data-action="like-ad"]');
  await photo.dblclick();
  await expect(heart).toHaveAttribute("aria-pressed","true");
  await expect(heart.locator("svg")).toHaveCSS("fill","rgb(236, 71, 126)");
  await expect(page.locator(".layer")).toHaveCount(0);
  expect(await page.evaluate(id=>JSON.parse(localStorage.getItem("nofeed-simulator-v3")).likedAds.includes(id),adId)).toBe(true);
  await page.reload();
  const again=page.locator('.ad-post[data-rec-id="'+adId+'"]');
  await expect(again.locator('[data-action="like-ad"]')).toHaveAttribute("aria-pressed","true");
  await again.locator('[data-action="like-ad"]').click();
  await expect(again.locator('[data-action="like-ad"]')).toHaveAttribute("aria-pressed","false");
  await again.locator(".feed-photo").click();
  await expect(page.locator(".shop-title")).toBeVisible();
  await expect(page.locator(".shop-browser")).toContainText(".example");
  await expect(page.locator(".layer")).toContainText("SITE FICTÍCIO");
  await expect(page.locator(".bottom-sheet")).toHaveCount(0);
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

test("anúncio abre loja funcional, sacola, pagamento e recibo", async ({ page }) => {
 await enter(page);
 const ad=page.locator(".ad-post").first();
 const topic=await ad.getAttribute("data-rec-topic");
 const price=topic==="plano"?39.8:{fone:219.90,tenis:279.90,mochila:159.90}[topic];
 await ad.locator(".ad-cta").click();
 await expect(page.locator(".shop-title")).toBeVisible();
 await expect(page.locator(".shop-browser")).toContainText(".example");
 await page.locator('.shop-footer [data-action="add-cart"]').click();
 await expect(page.locator('.shop-footer [data-action="cart"]')).toBeVisible();
 await page.locator('.shop-footer [data-action="cart"]').click();
 await expect(page.locator(".cart-item")).toHaveCount(1);
 await page.locator('[data-action="checkout-cart"]').click();
 await expect(page.locator(".checkout-summary")).toBeVisible();
 await page.locator('.shop-footer [data-action="buy"]').click();
 await expect(page.locator(".receipt-screen")).toContainText("Compra simulada confirmada");
 const result=await page.evaluate(()=>JSON.parse(localStorage.getItem("nofeed-simulator-v3")));
 expect(result.purchases).toHaveLength(1);
 expect(result.purchases[0].id).toBe(topic);
 expect(result.wallet).toBeCloseTo(620-price,2);
 await page.locator(".receipt-screen [data-action='close-overlay']").click();
 await expect(page.locator(".phone-content")).toBeVisible();
 await expect(page.locator(".receipt-screen")).toHaveCount(0);
});

test("explorar oferece oito lojas com retorno simples ao catálogo", async ({ page }) => {
 await enter(page);
 await page.locator('.phone-footer [data-action="search"]').click();
 await expect(page.locator(".shop-collection .shop-product")).toHaveCount(8);
 await page.locator('.shop-product[data-product="tenis"]').click();
 await expect(page.locator(".shop-title")).toContainText("Motion 88");
 await expect(page.locator(".shop-browser")).toContainText("rush-street.example");
 await page.locator('.layer-head [data-action="shop-back"]').click();
 await expect(page.locator(".shop-collection .shop-product")).toHaveCount(8);
 await page.locator('.shop-product[data-product="mochila"]').click();
 await expect(page.locator(".shop-title")).toContainText("Trail Mini");
 await page.locator('.shop-footer [data-action="checkout"]').click();
 await expect(page.locator(".checkout-summary")).toBeVisible();
 await page.locator('.layer-head [data-action="shop-back"]').click();
 await expect(page.locator(".shop-title")).toContainText("Trail Mini");
 await page.locator('.layer-head [data-action="shop-back"]').click();
 await expect(page.locator(".shop-collection .shop-product")).toHaveCount(8);
});

test("posts e stories com ofertas levam ao site do produto", async ({ page }) => {
 await enter(page);
 await loadAll(page);
 await page.locator('[data-rec-id="p5"] .post-shop-link').click();
 await expect(page.locator(".shop-title")).toContainText("Motion 88");
 await page.locator('.layer-head [data-action="shop-back"]').click();
 await page.locator('.story-rail .story[data-story-user="loja.noma"]').click();
 const story=page.locator(".story-layer");
 await expect(story).toBeVisible();
 await expect(story.locator(".story-shop-cta")).toContainText("Ver oferta na loja");
 await story.locator('.story-shop-cta').click();
 await expect(page.locator(".story-layer")).toHaveCount(0);
 await expect(page.locator(".shop-title")).toContainText("Trail Mini");
});

test("assinatura oferece adicional opcional e recalcula o checkout", async ({ page }) => {
 await enter(page);
 await page.locator('.phone-head [data-action="shop"]').click();
 await page.locator('.shop-product[data-product="plano"]').click();
 await page.locator('.shop-footer [data-action="checkout"]').click();
 await expect(page.locator(".checkout-summary")).toContainText("R$ 39,80");
 await page.locator('.checkout-summary #vip-extra').uncheck();
 await expect(page.locator(".checkout-summary")).toContainText("R$ 29,90");
 await page.locator('.shop-footer [data-action="buy"]').click();
 await expect(page.locator(".receipt-screen")).toBeVisible();
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem("nofeed-simulator-v3")));
 expect(state.monthly).toBe(29.90);
 expect(state.wallet).toBeCloseTo(590.10,2);
});

test("vitrine personalizada do feed oferece acesso claro a lojas", async ({ page }) => {
 await enter(page);
 await expect(page.locator(".shop-strip .shop-mini-card")).toHaveCount(2);
 await page.locator(".shop-strip .shop-mini-card").first().click();
 await expect(page.locator(".shop-title")).toBeVisible();
 await expect(page.locator(".shop-browser")).toBeVisible();
});


test("o catálogo ampliado apresenta oito lojas, busca e novos itens compráveis", async ({page})=>{
 await enter(page);
 await page.locator('.phone-head [data-action="shop"]').click();
 const entries=page.locator(".shop-collection .shop-product");
 await expect(entries).toHaveCount(8);
 const search=page.getByRole("searchbox",{name:"Pesquisar produtos"});
 await search.fill("Volt");
 await expect(page.locator(".shop-collection .shop-product:visible")).toHaveCount(1);
 await expect(page.locator(".shop-search-wrap")).toContainText("1 oferta");
 await expect.poll(async()=>page.evaluate(()=>{
  const events=JSON.parse(localStorage.getItem("nofeed-simulator-v3")).algorithm.events;
  return events.some(e=>e.type==="search"&&e.topic==="powerbank");
 })).toBe(true);
 await entries.filter({hasText:"Volt 10K"}).click();
 await expect(page.locator(".shop-title")).toContainText("Volt 10K");
 await expect(page.locator(".shop-hero svg")).toBeVisible();
 await expect(page.locator(".shop-browser")).toContainText("nexo-tech.example");
});

test("o feed libera novos temas sem tela de capítulo e mantém publicidade espaçada", async ({page})=>{
 await enter(page);
 await loadAll(page);
 const cards=page.locator(".post");
 await expect(page.locator('[data-rec-id^="p"]')).toHaveCount(24);
 const topics=await page.locator(".post").evaluateAll(els=>new Set(els.map(el=>el.getAttribute("data-rec-topic"))).size);
 expect(topics).toBe(8);
 const adTopics=await page.locator(".ad-post").evaluateAll(els=>[...new Set(els.map(el=>el.getAttribute("data-rec-topic")))]);
 expect(adTopics.length).toBeGreaterThanOrEqual(4);
 const ads=await cards.evaluateAll(els=>els.map((el,i)=>el.classList.contains("ad-post")?i:-1).filter(i=>i>=0));
 expect(ads.length).toBeGreaterThanOrEqual(5);
 expect(ads.every((i,k)=>k===0?i>=3:i-ads[k-1]>=4)).toBe(true);
 await expect(page.locator(".decision,.transition")).toHaveCount(0);
});

test("compra gera sugestão complementar e permite uma segunda compra", async ({page})=>{
 await enter(page);
 await page.locator('.phone-head [data-action="shop"]').click();
 await page.locator('.shop-product[data-product="fone"]').click();
 await page.locator('.shop-footer [data-action="checkout"]').click();
 await page.locator('.shop-footer [data-action="buy"]').click();
 await expect(page.locator(".receipt-screen")).toBeVisible();
 const suggestion=page.locator('.shop-receipt-suggestion[data-product="powerbank"]');
 await expect(suggestion).toBeVisible();
 await suggestion.click();
 await expect(page.locator(".shop-title")).toContainText("Volt 10K");
 await page.locator('.shop-footer [data-action="checkout"]').click();
 await page.locator('.shop-footer [data-action="buy"]').click();
 await expect(page.locator(".receipt-screen")).toBeVisible();
 const result=await page.evaluate(()=>JSON.parse(localStorage.getItem("nofeed-simulator-v3")));
 expect(result.purchases.map(p=>p.id)).toEqual(["fone","powerbank"]);
 expect(result.wallet).toBeCloseTo(310.20,2);
 await page.locator(".receipt-screen [data-action='close-overlay']").click();
 await page.locator(".finish-feed").click();
 await expect(page.locator(".end")).toContainText("não foi preservada");
});

test("mostrar menos oculta o post e reduz a afinidade sem revelar o algoritmo", async ({page})=>{
 await enter(page);
 const first=page.locator(".post").first();
 const topic=await first.getAttribute("data-rec-topic");
 const id=await first.getAttribute("data-rec-id");
 await first.locator('[data-action="post-more"],[data-action="ad-more"]').click();
 await page.locator('[data-action="less"]').click();
 await expect(page.locator('.post[data-rec-id="'+id+'"]')).toHaveCount(0);
 const events=await page.evaluate(()=>JSON.parse(localStorage.getItem("nofeed-simulator-v3")).algorithm.events);
 expect(events.some(e=>e.type==="less"&&e.topic===topic)).toBe(true);
 await expect(page.locator('[data-action="algorithm-final"]')).toHaveCount(0);
});

test("novos stories mantêm a autoria e levam às novas lojas fictícias", async ({page})=>{
 await enter(page);
 const owner=page.locator('.story-rail .story[data-story-user="rafa.tech"]');
 await expect(owner).toHaveCount(1);
 await owner.click();
 const layer=page.locator(".story-layer");
 await expect(layer).toHaveAttribute("data-story-user","rafa.tech");
 await expect(layer.locator(".story-progress-segment")).toHaveCount(2);
 await expect(layer.locator(".story-owner-avatar")).toBeVisible();
 await layer.locator('[data-action="story-product"]').click();
 await expect(layer).toHaveCount(0);
 await expect(page.locator(".shop-title")).toContainText("Volt 10K");
});

test("conclusão explica oito temas e três tipos de campanhas, sem mostrar pesos no jogo", async ({page})=>{
 await enter(page);
 await expect(page.locator(".algo-topic")).toHaveCount(0);
 await page.locator(".finish-feed").click();
 await page.locator('[data-action="algorithm-final"]').click();
 await expect(page.locator(".algo-topic")).toHaveCount(8);
 await expect(page.locator(".algorithm-final")).toContainText("novas ofertas");
 await expect(page.locator(".algorithm-final")).toContainText("produtos relacionados");
});
