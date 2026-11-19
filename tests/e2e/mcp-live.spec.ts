import { test, expect } from "@playwright/test";

/**
 * Integração do jogo com a API MCP real, sem interceptar /api/c4/client.
 * Requer um servidor MCP local na porta 38123 e VITE_C4_MCP_ORIGIN correspondente.
 * A CI inicia ambos em bancos efêmeros; não toca em contas de produção.
 */
test.skip(process.env.RUN_C4_INTEGRATION !== "1", "Execute no job de integração MCP.");
test.use({ reducedMotion: "reduce" });

test("jogo completo envia percurso ao MCP e permite consulta somente pela conta correta",async ({page})=>{
 const username="ci_c4_"+Date.now().toString(36).slice(-7);
 const password="CI-senha-segura-1234";
 const mcp="http://127.0.0.1:38123";
 await page.goto("/");
 await expect(page.locator(".account-screen")).toBeVisible();
 await page.locator('input[name="username"]').fill(username);
 await page.locator('input[name="password"]').fill(password);
 await page.locator('#c4-account-form button[value="signup"]').click();
 await expect(page.locator(".home")).toBeVisible();
 const session=await page.evaluate(()=>JSON.parse(sessionStorage.getItem("pto-c4-game-session-v1")||"null"));
 expect(session?.usuario?.id).toMatch(/^usr_/);
 await page.locator('[data-action="start"]').click();
 await page.locator('[data-action="intro-next"]').click();
 await page.locator('[data-action="open-day"]').click();
 await expect(page.locator('.tag-vibe-overlay')).toBeVisible();
 await page.locator('[data-action="tag-vibe-continue"]').click();

 await page.addInitScript(()=>{
  const key=Object.keys(localStorage).find(k=>k.startsWith("nofeed-simulator-v4:user:")&&JSON.parse(localStorage.getItem(k)||"null")?.started);
  if(!key)return;
  const state=JSON.parse(localStorage.getItem(key)||"null");
  state.day=5;state.finished=true;state.endStep=0;state.endPrelude="guess";
  state.finishedAt=new Date().toISOString();state.attention.realMs=12*60*1000;
  localStorage.setItem(key,JSON.stringify(state));
 });
 await page.reload();
 await expect(page.locator('.time-guess')).toBeVisible();
 await page.locator('[data-action="guess-time"]').click();
 await page.locator('[data-action="time-reveal-next"]').click();
 await expect(page.locator('.trip-impact')).toBeVisible();
 await page.locator('[data-action="trip-details"]').click();
 for(let i=0;i<3;i++)await page.locator('.end-next').click();
 const quiz=page.locator('.quiz-q');
 await expect(quiz).toHaveCount(5);
 for(let i=0;i<5;i++)await quiz.nth(i).locator('.quiz-opt').first().click();
 await page.locator('[data-action="end-next"]').click();
 await expect(page.locator('#c4-sync-status')).toContainText('Percurso recebido pelo MCP');

 const raw=await fetch(mcp+"/api/login",{method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({username,password})});
 expect(raw.status).toBe(200);
 const cookie=raw.headers.get("set-cookie")?.split(";")[0];
 expect(cookie).toBeTruthy();
 const progress=await fetch(mcp+"/api/c4/progress",{headers:{Cookie:cookie!}});
 expect(progress.status).toBe(200);
 const result=await progress.json();
 expect(result.importado).toBe(true);
 expect(result.resumo.participante).toEqual({id:session.usuario.id,apelido:username});
 expect(result.resumo.partida.diaAtual).toBe(5);
 expect(result.resumo.quiz.respondidas).toBe(5);
 expect(result.resumo.partida.modoEnvio).toBe('quiz-completo');

 const outsider="ci_c4_outro_"+Date.now().toString(36).slice(-6);
 const created=await fetch(mcp+"/api/c4/client/signup",{method:"POST",
  headers:{"Content-Type":"application/json",Origin:"http://127.0.0.1:4174"},
  body:JSON.stringify({username:outsider,password})});
 expect(created.status).toBe(201);
 const secondLogin=await fetch(mcp+"/api/login",{method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({username:outsider,password})});
 const otherCookie=secondLogin.headers.get("set-cookie")?.split(";")[0];
 const otherProgress=await fetch(mcp+"/api/c4/progress",{headers:{Cookie:otherCookie!}});
 expect(otherProgress.status).toBe(200);
 expect((await otherProgress.json()).importado).toBe(false);
});
