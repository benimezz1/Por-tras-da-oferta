
import { test, expect } from "@playwright/test";
import { mockC4Service } from "./c4-mock";

test.beforeEach(async ({ page }) => {
  await mockC4Service(page);
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("nofeed-e2e-initialized")) {
      localStorage.removeItem("nofeed-simulator-v3");
      localStorage.removeItem("nofeed-simulator-v4");
      localStorage.removeItem("nofeed-simulator-v2");
      sessionStorage.setItem("nofeed-e2e-initialized", "1");
    }
  });
});

async function enter(page) {
  await page.goto("/");
  await expect(page.locator(".account-screen")).toBeVisible();
  await page.locator('input[name="username"]').fill("aluno_teste");
  await page.locator('input[name="password"]').fill("senha-teste-12345");
  await page.locator('#c4-account-form button[value="signup"]').click();
  await expect(page.locator(".home h1")).toContainText("Seu feed.");
  await page.locator('[data-action="start"]').click();
  await expect(page.locator(".cinematic")).toContainText("guardar R$ 400");
  await page.locator('[data-action="intro-next"]').click();
  await page.locator('[data-action="open-day"]').click();
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
  // O feed é infinito e recicla posts ("Sugerido para você"): compara um registro por post.
  const photos = await page.locator('.post:not(.ad-post):not(.mine-post) .post-media img.art-photo').evaluateAll(imgs => imgs.map(img => img.getAttribute("src")));
  expect(photos.length).toBeGreaterThanOrEqual(12);
  expect(new Set(photos).size).toBeGreaterThanOrEqual(9);
  expect(photos.every(src => /(?:unique\/(?:post-p[0-9]+|extra-[0-9]+)[.]jpg|social\/[a-z_-]+[.]webp)$/.test(src || ""))).toBe(true);
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
  expect(await page.evaluate((id)=>JSON.parse(localStorage.getItem("nofeed-simulator-v4:user:player-e2e")).liked.filter(x=>x===id).length,id)).toBe(1);
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
  expect(await page.evaluate(id=>JSON.parse(localStorage.getItem("nofeed-simulator-v4:user:player-e2e")).likedAds.includes(id),adId)).toBe(true);
  await page.reload();
  const again=page.locator('.ad-post[data-rec-id="'+adId+'"]');
  await expect(again.locator('[data-action="like-ad"]')).toHaveAttribute("aria-pressed","true");
  await again.locator('[data-action="like-ad"]').click();
  await expect(again.locator('[data-action="like-ad"]')).toHaveAttribute("aria-pressed","false");
  await again.locator(".feed-photo").click();
  await expect(page.locator(".shop-title")).toBeVisible();
  await expect(page.locator(".shop-browser")).toContainText("pulso.shop/");
  await expect(page.locator(".layer")).not.toContainText("FICTÍCIO");
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
  await photo.evaluate(el=>el.scrollIntoView({block:"center"}));
  const box=await photo.boundingBox();
  expect(box).toBeTruthy();
  const x=box.x+box.width/2,y=box.y+Math.min(box.height/2,160);
  await page.touchscreen.tap(x,y);
  await page.touchscreen.tap(x,y);
  await expect(heart).toHaveAttribute("aria-pressed","true");
  await expect(heart.locator("svg")).toHaveClass(/heart-filled/);
  await expect(page.locator(".bottom-sheet")).toHaveCount(0);
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

test("editor de post permite escolher foto, personalizar legenda e editar publicação", async ({page}) => {
  await enter(page);
  await page.locator('[data-action="new-post"]').click();
  await expect(page.locator('.post-compose .post-choice')).toHaveCount(12);
  await page.locator('.post-compose [data-action="select-post-photo"]').nth(5).click();
  await page.locator('#my-post-caption').fill('Minha legenda especial para a turma');
  await page.locator('.post-compose [data-action="publish"]').click();
  await expect(page.locator('.mine-post')).toContainText('Minha legenda especial para a turma');
  await page.locator('.mine-post [data-action="edit-my-post"]').click();
  await page.locator('#my-post-caption').fill('Legenda revisada');
  await page.locator('[data-action="save-my-post"]').click();
  await expect(page.locator('.mine-post')).toContainText('Legenda revisada');
});
test("dormir fica fora do feed, avança às 19h e a meia-noite muda discretamente a data", async ({page}) => {
  await enter(page);
  await expect(page.locator('.sb-time')).toContainText('SEG · 19:');
  await expect(page.locator('.day-sleep-control')).toBeVisible();
  await page.locator('.day-sleep-control').click();
  await page.locator('[data-action="open-day"]').click();
  await expect(page.locator('.sb-time')).toContainText('TER · 19:');
  await page.evaluate(() => {
    const key='nofeed-simulator-v4:user:player-e2e';
    const v=JSON.parse(localStorage.getItem(key) || '{}');
    v.clockViewed=38;
    localStorage.setItem(key,JSON.stringify(v));
  });
  await page.reload();
  await expect(page.locator('.sb-time')).toContainText('QUA · 00:');
  await expect(page.locator('.day-sleep-control')).toContainText('hoje · 19h');
});

test("cada novo dia mostra publicações inéditas e stories renovados", async ({page}) => {
  await enter(page);
  const firstPosts=await page.locator('.post[data-rec-id^="extra-post-"]').evaluateAll(cards=>cards.map(c=>c.getAttribute('data-rec-id')));
  const firstStories=await page.locator('.story-rail .story').evaluateAll(cards=>cards.map(c=>c.getAttribute('data-story-user')));
  expect(firstPosts.length).toBeGreaterThan(0);
  await page.locator('.day-sleep-control').click();
  await page.locator('[data-action="open-day"]').click();
  const secondPosts=await page.locator('.post[data-rec-id^="extra-post-"]').evaluateAll(cards=>cards.map(c=>c.getAttribute('data-rec-id')));
  const secondStories=await page.locator('.story-rail .story').evaluateAll(cards=>cards.map(c=>c.getAttribute('data-story-user')));
  expect(secondPosts.length).toBeGreaterThan(0);
  expect(secondPosts.every(id=>!firstPosts.includes(id))).toBe(true);
  expect(secondStories.length).toBeGreaterThan(0);
  expect(firstStories.length).toBeGreaterThan(0);
});
