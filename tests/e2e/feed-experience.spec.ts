
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

async function enter(page, keepTaggedOverlay = false) {
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
  if (!keepTaggedOverlay) {
    await expect(page.locator(".tag-vibe-overlay")).toBeVisible();
    await page.locator('[data-action="tag-vibe-continue"]').click();
    await expect(page.locator(".tag-vibe-overlay")).toHaveCount(0);
  }
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

test("voltar para os stories atualiza o feed sem criar um loop",async ({page})=>{
 await enter(page);
 const previous=await page.evaluate(()=>JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e')).attention.refreshes);
 const feed=page.locator('#feed-scroll');
 await feed.evaluate(el=>{el.scrollTop=560;el.dispatchEvent(new Event('scroll'));});
 await expect.poll(()=>feed.evaluate(el=>el.scrollTop)).toBeGreaterThan(300);
 await feed.evaluate(el=>{el.scrollTop=0;el.dispatchEvent(new Event('scroll'));});
 await expect(page.locator('.feed-refresh-loading')).toBeVisible();
 await expect(page.locator('.feed-refresh-loading')).toHaveCount(0);
 const updated=await page.evaluate(()=>{
  const s=JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e'));
  return {refreshes:s.attention.refreshes,newPosts:s.feedItems.filter(x=>x.day===s.day&&x.fresh&&x.kind==='post').length,
   ids:s.feedItems.filter(x=>x.day===s.day&&x.kind==='post').map(x=>x.id)};
 });
 expect(updated.refreshes).toBe(previous+1);
 expect(updated.newPosts).toBeGreaterThan(0);
 expect(new Set(updated.ids).size).toBe(updated.ids.length);
 await page.locator('#feed-scroll').evaluate(el=>{
  el.scrollTop=45;el.dispatchEvent(new Event('scroll'));
  el.scrollTop=0;el.dispatchEvent(new Event('scroll'));
 });
 await page.waitForTimeout(1150);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e')).attention.refreshes))
  .toBe(updated.refreshes);
});

test("Enter publica comentario e Shift+Enter insere nova linha",async ({page})=>{
 await enter(page);
 const post=page.locator('.post:not(.ad-post):not(.mine-post):not(.tagged-post)').first();
 const id=await post.getAttribute('data-rec-id');
 await post.locator('[data-action="comments"]').first().click();
 const input=page.locator('#own-comment-input');
 await input.fill('Publicado com Enter');
 await input.press('Enter');
 await expect(page.locator('.sheet-scroll .comment p').filter({hasText:'Publicado com Enter'})).toHaveCount(1);
 await expect(input).toHaveValue('');
 await input.fill('Linha um');
 await input.press('Shift+Enter');
 await input.type('Linha dois');
 await expect(input).toHaveValue('Linha um\nLinha dois');
 await input.press('Enter');
 await expect(page.locator('.sheet-scroll .comment p').filter({hasText:'Linha um'})).toContainText('Linha dois');
 const message=await page.evaluate(id=>{
  const state=JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e'));
  return state.postComments[id]?.at(-1)?.[1];
 },id);
 expect(message).toBe('Linha um\nLinha dois');
});

test("surpresa dispara popup explosivo ao chegar no gatilho, credita uma vez e nao deixa card",async ({page})=>{
 await enter(page);
 // A aplicacao salva o estado ao descarregar a pagina. A injecao deve
 // acontecer antes de inicializar o jogo no novo documento, nao antes de reload.
 await page.addInitScript(()=>{
  const key='nofeed-simulator-v4:user:player-e2e',state=JSON.parse(localStorage.getItem(key)||'null');
  if(!state?.started)return;
  if(!state.feedItems.some(x=>x.id==='sp-e2e'))
   state.feedItems.splice(Math.min(7,state.feedItems.length),0,{
    kind:'event',type:'surprise',variant:'coins',bonus:3,rewardPending:true,id:'sp-e2e',day:state.day
   });
  localStorage.setItem(key,JSON.stringify(state));
 });
 await page.reload();
 await expect(page.locator('.reward-trigger[data-surprise-id="sp-e2e"]')).toHaveCount(1);
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e')).coins);
 await page.locator('.reward-trigger[data-surprise-id="sp-e2e"]').evaluate(el=>{
  const sc=document.querySelector('#feed-scroll'),target=el.getBoundingClientRect().top-sc.getBoundingClientRect().top+sc.scrollTop;
  sc.scrollTop=Math.max(0,target-sc.clientHeight*.5);
  sc.dispatchEvent(new Event('scroll'));
 });
 const reward=page.locator('.reward-celebration');
 await expect(reward).toBeVisible();
 await expect(reward).toContainText('Surpresa!');
 await expect(reward.locator('.reward-particle')).toHaveCount(32);
 await expect(page.locator('.ev-surprise')).toHaveCount(0);
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e')).coins);
 expect(after).toBe(before+3);
 await reward.locator('[data-action="reward-close"]').click();
 await expect(reward).toHaveCount(0);
 await page.reload();
 await expect(page.locator('.reward-celebration')).toHaveCount(0);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e')).coins)).toBe(after);
});

test("publicar foto sobe o feed com carregamento e novos posts recomendados sem duplicatas",async ({page})=>{
 await enter(page);
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e')).feedItems.filter(x=>x.kind==='post').map(x=>x.id));
 await page.locator('[data-action="new-post"]').click();
 await page.locator('[data-action="open-gallery"]').click();
 await page.locator('.ios-gallery-tile').first().click();
 await page.locator('.ios-gallery-done').click();
 await page.locator('#my-post-caption').fill('Post depois da atualização');
 await page.locator('.post-compose [data-action="publish"]').click();
 await expect(page.locator('.feed-refresh-loading')).toBeVisible();
 await expect(page.locator('.feed-refresh-loading')).toHaveCount(0);
 await expect(page.locator('.mine-post').first()).toContainText('Post depois da atualização');
 const data=await page.evaluate(()=>{
  const state=JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e'));
  return {items:state.feedItems.filter(x=>x.day===1),refreshes:state.attention.refreshes,top:document.querySelector('#feed-scroll').scrollTop};
 });
 expect(data.items[0].kind).toBe('mine');
 expect(data.refreshes).toBeGreaterThanOrEqual(1);
 expect(data.top).toBeLessThan(65);
 const now=data.items.filter(x=>x.kind==='post').map(x=>x.id);
 expect(new Set(now).size).toBe(now.length);
 expect(now.length).toBeGreaterThanOrEqual(before.length);
 expect(data.items.some(x=>x.fresh&&x.kind==='post')).toBe(true);
});

test("grupo time Motion aparece depois de comprar o tenis e nao antes",async ({page})=>{
 await enter(page);
 await page.locator('.day-sleep-control').click();
 await page.locator('[data-action="open-day"]').click();
 await page.locator('.phone-head [data-action="inbox"]').click();
 await expect(page.locator('.inbox-row').filter({hasText:'time Motion'})).toHaveCount(0);
 await page.locator('.layer-head [data-action="close-overlay"]').click();
 await page.locator('.phone-head [data-action="shop"]').click();
 await page.locator('.shop-product[data-product="tenis"]').click();
 await page.locator('.shop-footer [data-action="checkout"]').click();
 await page.locator('.shop-footer [data-action="buy"]').click();
 await page.locator('.purchase-modal [data-channel="nenhum"]').click();
 await page.locator('.phone-head [data-action="inbox"]').click();
 const group=page.locator('.inbox-row').filter({hasText:'time Motion'});
 await expect(group).toHaveCount(1);
 await group.click();
 await expect(page.locator('.chat-body')).toContainText('time Motion');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e')));
 expect(saved.threads.motion.days).toEqual([2]);
});

test("contas distintas recebem fotografias iniciais diferentes e a recarga conserva o feed", async ({ page }) => {
  await enter(page);
  const signature=async()=>page.locator(".post:not(.ad-post):not(.mine-post)").evaluateAll(cards=>
    cards.slice(0,4).map(c=>({id:c.id,photo:c.querySelector(".art-photo")?.getAttribute("src")})));
  const first=await signature();
  expect(first).toHaveLength(4);
  expect(first.every(x=>x.photo)).toBe(true);
  await page.reload();
  await expect(page.locator(".phone")).toBeVisible();
  expect(await signature()).toEqual(first);

  await page.locator("#exit-home-trigger").click();
  await page.locator("#exit-accept").click();
  await expect(page.locator(".home")).toBeVisible();
  await page.locator('[data-action="switch-player"]').click();
  await expect(page.locator(".account-screen")).toBeVisible();
  await page.locator('input[name="username"]').fill("outro_jogador");
  await page.locator('input[name="password"]').fill("senha-outro-12345");
  await page.locator('#c4-account-form button[value="signup"]').click();
  await expect(page.locator(".home")).toBeVisible();
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="intro-next"]').click();
  await page.locator('[data-action="open-day"]').click();
  await expect(page.locator(".tag-vibe-overlay")).toBeVisible();
  await page.locator('[data-action="tag-vibe-continue"]').click();
  const second=await signature();
  expect(second).toHaveLength(4);
  expect(second.map(x=>x.id)).not.toEqual(first.map(x=>x.id));
});

test("curtir foto da biblioteca aumenta o ranking visual sem mover posts anteriores", async ({ page }) => {
  await enter(page);
  const suitableId=()=>page.evaluate(()=>{
    const w=window as any,posts=w.NoFeedLibraryV5.posts;
    const categories=Object.create(null);
    for(const p of posts.filter(p=>p.day===1))categories[p.metadata.category]=(categories[p.metadata.category]||0)+1;
    return [...document.querySelectorAll('.post[id^="v5-post-"]')]
      .map(el=>el.id).find(id=>categories[posts.find(p=>p.id===id)?.metadata.category]>1)||null;
  });
  for(let attempt=0;attempt<12&&!await suitableId();attempt++)
    await page.locator(".load-more").evaluate(el=>el.click());
  const id=await suitableId();
  expect(id).toBeTruthy();
  const card=page.locator('#'+id);
  await expect(card).toBeVisible();
  await card.scrollIntoViewIfNeeded();
  const calculate=async()=>page.evaluate(likedId=>{
    const w=window as any;
    const saved=JSON.parse(localStorage.getItem("nofeed-simulator-v4:user:player-e2e")||"{}");
    const posts=w.NoFeedLibraryV5.posts;
    const liked=posts.find(p=>p.id===likedId);
    const target=posts.find(p=>p.day===liked.day&&p.metadata.category===liked.metadata.category&&p.id!==likedId);
    if(!target)return null;
    const postIndex=Object.fromEntries(posts.map(p=>[p.id,p]));
    const opts={day:liked.day,phase:saved.phase,seed:"teste-v6",profile:saved.algorithm,
       postIndex,personalized:true,visualSignals:w.NoFeedFeedRanker.compileSignals(saved.algorithm,{postIndex,phase:saved.phase})};
    return {score:w.NoFeedFeedRanker.scorePost(target,opts).score,
      ids:saved.feedItems.map(item=>item.id),events:saved.algorithm.events.length};
  },id);
  const before=await calculate();
  expect(before).not.toBeNull();
  await card.locator('[data-action="like"]').first().click();
  const after=await calculate();
  expect(after.score).toBeGreaterThan(before.score+1);
  expect(after.ids).toEqual(before.ids);
  expect(after.events).toBeGreaterThan(before.events);
});

test("foto marcada abre card distinto e concede vibe apenas uma vez", async ({ page }) => {
  await enter(page, true);
  const card = page.locator(".tag-vibe-overlay");
  await expect(card).toBeVisible();
  await expect(card).toContainText("bia.m");
  await expect(card.locator(".tag-vibe-photo img")).toBeVisible();
  await expect(card.locator(".tag-vibe-points")).toContainText("VIBE");
  const before = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("nofeed-simulator-v4:user:player-e2e") || "{}");
    return { vibe: state.vibe.value, seen: state.taggedVibeSeen };
  });
  expect(before.seen).toContain("tag-1");
  await card.locator('[data-action="tag-vibe-view"]').click();
  await expect(card).toHaveCount(0);
  await expect(page.locator("#tag-1")).toBeVisible();
  await page.reload();
  await expect(page.locator(".phone")).toBeVisible();
  await expect(page.locator(".tag-vibe-overlay")).toHaveCount(0);
  const after = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("nofeed-simulator-v4:user:player-e2e") || "{}");
    return { vibe: state.vibe.value, seen: state.taggedVibeSeen };
  });
  expect(after.vibe).toBe(before.vibe);
  expect(after.seen.filter(id => id === "tag-1")).toHaveLength(1);
});

test("Gabi marca o jogador no quinto dia e gera uma nova celebração", async ({ page }) => {
  await enter(page);
  for (let day = 2; day <= 5; day++) {
    await page.locator(".day-sleep-control").click();
    await page.locator('[data-action="open-day"]').click();
  }
  const card = page.locator(".tag-vibe-overlay");
  await expect(card).toBeVisible();
  await expect(card).toContainText("gabi.n");
  await card.locator('[data-action="tag-vibe-continue"]').click();
  await expect(card).toHaveCount(0);
});

test("aviso de sono começa às 04h, repete às 05h e não aparece às 14h", async ({ page }) => {
  await enter(page);
  // No reload, a pagina pode salvar o estado atual ao perder visibilidade.
  // Restaurar o horario artificial antes do script do jogo elimina essa corrida.
  await page.addInitScript(() => {
    const override=sessionStorage.getItem("nofeed-e2e-clock-override");
    if(override===null)return;
    const key="nofeed-simulator-v4:user:player-e2e";
    const state=JSON.parse(localStorage.getItem(key)||"{}");
    if(state.started){state.clockViewed=Number(override);localStorage.setItem(key,JSON.stringify(state));}
  });
  const setClock = async viewed => {
    await page.evaluate(value=>sessionStorage.setItem("nofeed-e2e-clock-override",String(value)),viewed);
    await page.reload();
    await expect(page.locator(".phone")).toBeVisible();
  };
  await setClock(30); // 19h + 30 x 18 min = 04:00 do dia seguinte
  const reminder = page.locator(".sleep-reminder");
  await expect(reminder).toBeVisible();
  await expect(reminder.locator(".sleep-reminder-clock")).toContainText("04:");
  await expect(reminder.locator('[data-action="sleep-reminder-sleep"]')).toBeVisible();
  await reminder.locator('[data-action="sleep-reminder-continue"]').click();
  await expect(reminder).toHaveCount(0);
  await page.reload();
  await expect(reminder).toHaveCount(0); // não repete na mesma hora
  await setClock(34); // 05:12
  await expect(reminder).toBeVisible();
  await expect(reminder.locator(".sleep-reminder-clock")).toContainText("05:");
  await reminder.locator('[data-action="sleep-reminder-continue"]').click();
  await setClock(64); // 14:12
  await expect(page.locator(".sb-time")).toContainText("14:");
  await expect(reminder).toHaveCount(0);
});

test("surpresas ficam raras e espaçadas durante a rolagem", async ({ page }) => {
  await enter(page);
  await loadAll(page);
  const items = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("nofeed-simulator-v4:user:player-e2e") || "{}");
    return (state.feedItems || []).filter(item => item.day === 1);
  });
  let postsSeen = 0;
  let previousSurpriseAt = -1;
  let surprises = 0;
  for (const item of items) {
    if (item.kind === "post" || item.kind === "ad") postsSeen += 1;
    if (item.type !== "surprise") continue;
    surprises += 1;
    expect(postsSeen).toBeGreaterThanOrEqual(12);
    if (previousSurpriseAt !== -1) expect(postsSeen - previousSurpriseAt).toBeGreaterThanOrEqual(16);
    previousSurpriseAt = postsSeen;
  }
  expect(surprises).toBeLessThanOrEqual(5);
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
  // O feed atual apresenta posts do dia sem reciclar publicações antigas.
  const photos = await page.locator('.post:not(.ad-post):not(.mine-post) .post-media img.art-photo').evaluateAll(imgs => imgs.map(img => img.getAttribute("src")));
  expect(photos.length).toBeGreaterThanOrEqual(12);
  expect(new Set(photos).size).toBeGreaterThanOrEqual(9);
  expect(photos.every(src => /(?:unique\/[a-z0-9-]+[.]jpg|social\/[a-z0-9_-]+[.]webp)$/.test(src || ""))).toBe(true);
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
  // Barras medem apenas os stories do autor; avancar por todos os autores
  // ate fechar naturalmente, sem assumir que o ultimo avatar e o ultimo item.
  for(let i=0;i<180&&await layer.count();i++){
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
  await card.locator('.post-actions [data-action="comments"]').click();
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
test("relogio avanca apos grupos alternados de 2 e 3 posts",async ({page})=>{
 await enter(page);
 await expect(page.locator('.sb-time')).toContainText('SEG · 19:');
 await page.locator('.day-sleep-control').click();
 await page.locator('[data-action="open-day"]').click();
 await expect(page.locator('.sb-time')).toContainText('TER · 19:');
 const posts=page.locator('.post[data-rec-id]');
 for(let i=0;i<12;i++){
  while(await posts.count()<=i&&await page.locator('.load-more').count())
   await page.locator('.load-more').evaluate(el=>el.click());
  await posts.nth(i).scrollIntoViewIfNeeded();
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e')).clockSeen.length))
   .toBeGreaterThanOrEqual(i+1);
  const progress=await page.evaluate(()=>{
   const state=JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e'));
   return {seen:state.clockSeen.length,ticks:state.clockViewed};
  });
  expect(progress.ticks).toBe(Math.floor(progress.seen/5)*2+(progress.seen%5>=2?1:0));
 }
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e')).clockViewed);
 await page.reload();
 await expect(page.locator('.phone')).toBeVisible();
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e')).clockViewed);
 expect(after).toBe(before);
});

test("cada novo dia mostra publicações inéditas e stories renovados", async ({page}) => {
  await enter(page);
  const firstPosts=await page.locator('.post:not(.ad-post):not(.tagged-post):not(.mine-post)[data-rec-id]').evaluateAll(cards=>cards.map(c=>c.getAttribute('data-rec-id')));
  const firstStories=await page.locator('.story-rail .story').evaluateAll(cards=>cards.map(c=>c.getAttribute('data-story-user')));
  expect(firstPosts.length).toBeGreaterThan(0);
  await page.locator('.day-sleep-control').click();
  await page.locator('[data-action="open-day"]').click();
  const secondPosts=await page.locator('.post:not(.ad-post):not(.tagged-post):not(.mine-post)[data-rec-id]').evaluateAll(cards=>cards.map(c=>c.getAttribute('data-rec-id')));
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
  await ad.locator('.post-actions [data-action="comments"]').click();
  await page.locator('#own-comment-input').fill('Vou comparar preços antes de decidir');
  await page.locator('[data-action="add-my-comment"]').click();
  await expect(page.locator('.bottom-sheet')).toContainText('Vou comparar preços antes de decidir');
  await page.locator('[data-action="close-modal"]').click();
  expect(Object.values(await page.evaluate(()=>JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e')||'{}').postComments)).flat().length).toBeGreaterThanOrEqual(2);
});

test("Bia e Gabi sao notificadas so uma vez, sem segundo aviso de saida",async ({page})=>{
 await enter(page);
 await expect(page.locator('.tagged-post')).toContainText('bia.m');
 await page.locator('[data-action="day-menu"]').click();
 await page.locator('[data-action="end-day"]').click();
 await expect(page.locator('.wake')).toBeVisible();
 await expect(page.locator('.bottom-sheet')).toHaveCount(0);
 for(let day=2;day<=5;day++){
  await page.locator('[data-action="open-day"]').click();
  if(day<5)await page.locator('.day-sleep-control').click();
 }
 const card=page.locator('.tag-vibe-overlay');
 await expect(card).toBeVisible();
 await expect(card).toContainText('gabi.n');
 await card.locator('[data-action="tag-vibe-continue"]').click();
 await page.locator('[data-action="day-menu"]').click();
 await page.locator('[data-action="end-day"]').click();
 await expect(page.locator('.bottom-sheet')).toHaveCount(0);
 await expect(page.locator('.time-guess')).toBeVisible();
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('nofeed-simulator-v4:user:player-e2e')));
 expect(state.taggedVibeSeen.filter(id=>id==='tag-1')).toHaveLength(1);
 expect(state.taggedVibeSeen.filter(id=>id==='tag-5')).toHaveLength(1);
});
