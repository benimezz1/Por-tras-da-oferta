
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
    const more=page.locator(".load-more");
    if (!await more.count()) break;
    const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e')||'{}').feedItems?.length||0);
    await more.evaluate(button=>button.click());
    await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e')||'{}').feedItems?.length||0),{timeout:8000}).toBeGreaterThan(before);
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
  // O feed atual apresenta posts do dia sem reciclar publicações antigas.
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
  // A quantidade de stories por autor muda conforme o dia.
  const count=await layer.locator(".story-progress-segment").count();
  expect(count).toBeGreaterThanOrEqual(1);
  await expect(layer.locator(".story-progress-fill.current")).toHaveCount(1);
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
  const count=await layer.locator(".story-progress-segment").count();
  expect(count).toBeGreaterThanOrEqual(1);
  const usernames=[];
  for(let i=0;i<count;i++){
    usernames.push(await layer.locator(".story-user strong").textContent());
    if(i<count-1){
      const before=await layer.getAttribute("data-story-index");
      await layer.locator('[data-action="story-next"]').click();
      await expect(layer).not.toHaveAttribute("data-story-index",before);
    }
  }
  expect(usernames).toEqual(Array(count).fill("lucca"));
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

test("troca de story mantém fotografia visível durante a transição", async ({page}) => {
  await enter(page);
  await page.locator('.story-rail .story[data-action="story"]').first().click();
  const layer=page.locator(".story-layer");
  await expect(layer.locator("img.story-photo")).toBeVisible();
  const start=await layer.getAttribute("data-story-index");
  await layer.locator('[data-action="story-next"]').click();
  await expect(layer).not.toHaveAttribute("data-story-index",start);
  await expect(layer.locator("img.story-photo")).toBeVisible();
  await expect(layer.locator("img.story-photo")).toHaveJSProperty("complete",true);
});

test("avatar e nome de cada story correspondem ao autor escolhido", async ({page}) => {
  await enter(page);
  const authors=await page.locator('.story-rail .story[data-action="story"]').evaluateAll(nodes=>nodes.slice(0,4).map(n=>n.getAttribute('data-story-user')));
  expect(authors.length).toBeGreaterThanOrEqual(3);
  for(const author of authors){
    await page.locator('.story-rail .story[data-story-user="'+author+'"]').click();
    const layer=page.locator(".story-layer");
    await expect(layer).toHaveAttribute("data-story-user",author);
    await expect(layer.locator(".story-user strong")).toHaveText(author);
    await expect(layer.locator(".story-owner-avatar")).toBeVisible();
    await layer.locator('[data-action="close-story"]').click();
  }
});

test("foto do feed: clique simples não abre comentários e duplo clique curte com coração preenchido", async ({ page }) => {
  await enter(page);
  const card=page.locator('.post:not(.ad-post):not(.mine-post):not(.tagged-post)').first();
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
  const card=page.locator('.post:not(.ad-post):not(.mine-post):not(.tagged-post)').first();
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

test("stories do dia mantêm autoria e oferecem acesso às lojas fictícias", async ({page})=>{
 await enter(page);
 for(let day=1;day<4;day++){
   await page.locator('.day-sleep-control').click();
   if(await page.locator('[data-action="hook-decline"]').count())await page.locator('[data-action="hook-decline"]').click();
   await page.locator('[data-action="open-day"]').click();
 }
 const owner=page.locator('.story-rail .story[data-story-user="rafa.tech"]');
 await expect(owner).toHaveCount(1);
 await owner.click();
 const layer=page.locator(".story-layer");
 await expect(layer).toHaveAttribute("data-story-user","rafa.tech");
 await expect(layer.locator(".story-progress-segment").first()).toBeVisible();
 await expect(layer.locator(".story-owner-avatar")).toBeVisible();
 await layer.locator('[data-action="story-product"]').click();
 await expect(layer).toHaveCount(0);
 await expect(page.locator(".shop-title")).toContainText("Volt 10K");
});

test("editor de post permite escolher foto, personalizar legenda e editar publicação", async ({page}) => {
  await enter(page);
  await page.locator('[data-action="new-post"]').click();
  await expect(page.locator('.gallery-launch')).toContainText('Ver Galeria');
  await page.locator('[data-action="open-gallery"]').click();
  await expect(page.locator('.ios-gallery-grid .ios-gallery-tile').first()).toBeVisible();
  expect(await page.locator('.ios-gallery-tile').count()).toBeGreaterThan(70);
  await expect(page.locator('.ios-gallery-done')).toBeDisabled();
  await page.locator('.ios-gallery-tile').nth(5).click();
  await expect(page.locator('.ios-gallery-done')).toBeEnabled();
  await page.locator('.ios-gallery-done').click();
  await expect(page.locator('#my-post-caption')).not.toBeEmpty();
  await page.locator('#my-post-caption').fill('Minha legenda especial para a turma');
  await page.locator('.post-compose [data-action="publish"]').click();
  await expect(page.locator('.mine-post')).toContainText('Minha legenda especial para a turma');
  await page.locator('.mine-post [data-action="edit-my-post"]').click();
  await page.locator('#my-post-caption').fill('Legenda revisada');
  await page.locator('[data-action="save-my-post"]').click();
  await expect(page.locator('.mine-post')).toContainText('Legenda revisada');
});
test("dormir passa para as 19h e rolar bastante atravessa a meia-noite", async ({page}) => {
  await enter(page);
  await expect(page.locator('.sb-time')).toContainText('SEG · 19:');
  await expect(page.locator('.day-sleep-control')).toBeVisible();
  await page.locator('.day-sleep-control').click();
  await page.locator('[data-action="hook-decline"]').click();
  await page.locator('[data-action="open-day"]').click();
  await expect(page.locator('.sb-time')).toContainText('TER · 19:');
  const posts=page.locator('.post[data-rec-id]');
  for(let i=0;i<22;i++){
    while(await posts.count()<=i && await page.locator('.load-more').count()){
      await page.locator('.load-more').evaluate(node=>node.click());
    }
    const card=posts.nth(i);
    await card.scrollIntoViewIfNeeded();
    await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e')||'{}').clockViewed||0)).toBeGreaterThanOrEqual(i+1);
  }
  await expect(page.locator('.sb-time')).toContainText('QUA · 0');
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

test("compra oferece quatro opções de compartilhamento; feed e story aparecem de verdade", async ({page}) => {
  await enter(page);
  await page.locator('.phone-head [data-action="shop"]').click();
  await page.locator('.shop-product[data-product="garrafa"]').click();
  await page.locator('.shop-footer [data-action="checkout"]').click();
  await page.locator('.shop-footer [data-action="buy"]').click();
  const options=page.locator('.purchase-modal [data-action="purchase-share"]');
  await expect(options).toHaveCount(4);
  await page.locator('#purchase-share-caption').fill('Comprei uma garrafa para a viagem 💧');
  await page.locator('.purchase-modal [data-channel="ambos"]').click();
  const post=page.locator('.mine-post').first();
  await expect(post).toContainText('Comprei uma garrafa para a viagem');
  await expect(post.locator('.js-my-likes')).not.toBeEmpty();
  await expect(post.locator('.mine-comment-preview')).toContainText('bia.m');
  await post.locator('[data-action="like-mine"]').click();
  await expect(post.locator('[data-action="like-mine"]')).toHaveAttribute('aria-pressed','true');
  await post.locator('.post-actions [data-action="comments"]').click();
  await page.locator('#own-comment-input').fill('Essa compra foi só uma simulação!');
  await page.locator('[data-action="add-my-comment"]').click();
  await expect(page.locator('.bottom-sheet')).toContainText('Essa compra foi só uma simulação!');
  await page.locator('[data-action="close-modal"]').click();
  await expect(page.locator('.story-rail .story[data-story-user="você"]')).toHaveCount(1);
  const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e')||'{}'));
  expect(data.purchaseShares[0]).toMatchObject({channel:'ambos',products:['garrafa']});
  expect(data.myPosts).toHaveLength(1);
  expect(data.myStories).toHaveLength(1);
  expect(data.myPosts[0].comments).toHaveLength(1);
});

test("não publicar compra preserva escolha sem fabricar post ou story", async ({page}) => {
  await enter(page);
  await page.locator('.phone-head [data-action="shop"]').click();
  await page.locator('.shop-product[data-product="garrafa"]').click();
  await page.locator('.shop-footer [data-action="checkout"]').click();
  await page.locator('.shop-footer [data-action="buy"]').click();
  await page.locator('.purchase-modal [data-channel="nenhum"]').click();
  await expect(page.locator('.purchase-modal')).toHaveCount(0);
  const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e')||'{}'));
  expect(data.purchaseShares[0].channel).toBe('nenhum');
  expect(data.myPosts).toHaveLength(0);
  expect(data.myStories).toHaveLength(0);
});

test("Seu story aparece sempre primeiro, mesmo antes de publicar, e pode ser criado pela galeria", async ({page}) => {
  await enter(page);
  await expect(page.locator('.story-rail .stories').first()).toBeVisible();
  await expect(page.locator('.story-rail .stories > .own-story-container')).toBeVisible();
  await expect(page.locator('.own-story-slot')).toHaveAttribute('data-action','new-story');
  await page.locator('.own-story-slot').click();
  await page.locator('.gallery-launch').click();
  await page.locator('.ios-gallery-tile').nth(3).click();
  await page.locator('.ios-gallery-done').click();
  await expect(page.locator('#my-post-caption')).not.toBeEmpty();
  await page.locator('[data-action="publish-own-story"]').click();
  await expect(page.locator('.own-story-slot.has-story')).toHaveAttribute('data-action','story');
  await page.locator('.own-story-slot.has-story').click();
  await expect(page.locator('.story-layer')).toHaveAttribute('data-story-user','você');
});

test("é possível comentar no post de amigo e no anúncio com texto próprio", async ({page}) => {
  await enter(page);
  const common=page.locator('.post:not(.ad-post):not(.mine-post):not(.tagged-post)').first();
  await expect(common).toBeVisible();
  await common.locator('[data-action="comments"]').first().click();
  await page.locator('#own-comment-input').fill('Comentário de teste na foto da turma!');
  await page.locator('[data-action="add-my-comment"]').click();
  await expect(page.locator('.bottom-sheet')).toContainText('Comentário de teste na foto da turma!');
  await page.locator('[data-action="close-modal"]').click();
  await expect(common.locator('.social-comment-preview')).toContainText('Comentário de teste na foto da turma!');
  const ad=page.locator('.ad-post').first();
  for(let i=0;i<4&&!await ad.count();i++)await page.locator('.load-more').evaluate(el=>el.click());
  await expect(ad).toBeVisible();
  await ad.locator('[data-action="comments"]').click();
  await page.locator('#own-comment-input').fill('Vou comparar preços antes de decidir');
  await page.locator('[data-action="add-my-comment"]').click();
  await expect(page.locator('.bottom-sheet')).toContainText('Vou comparar preços antes de decidir');
  await page.locator('[data-action="close-modal"]').click();
  expect(Object.values(await page.evaluate(()=>JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e')||'{}').postComments)).flat().length).toBeGreaterThanOrEqual(2);
});

test("gancho de saida da segunda mostra foto da Bia e sexta outra pessoa", async ({page}) => {
  await enter(page);
  await page.locator('.day-sleep-control').click();
  await expect(page.locator('.bottom-sheet')).toContainText('Bia publicou uma foto com você');
  await page.locator('[data-action="hook-accept"]').click();
  await expect(page.locator('.tagged-post')).toContainText('bia.m');
  await page.locator('.tagged-post [data-action="comments"]').click();
  await page.locator('#own-comment-input').fill('Adorei nossa foto!');
  await page.locator('[data-action="add-my-comment"]').click();
  await expect(page.locator('.bottom-sheet')).toContainText('Adorei nossa foto!');
  await page.locator('[data-action="close-modal"]').click();
  await page.locator('.day-sleep-control').click();
  for(let day=2;day<=4;day++){
    await page.locator('[data-action="open-day"]').click();
    await page.locator('.day-sleep-control').click();
    await expect(page.locator('.bottom-sheet')).not.toContainText('Bia publicou uma foto com você');
    await page.locator('[data-action="hook-decline"]').click();
  }
  await page.locator('[data-action="open-day"]').click();
  await page.locator('.day-sleep-control').click();
  await expect(page.locator('.bottom-sheet')).toContainText('Gabi publicou uma foto com você');
});
