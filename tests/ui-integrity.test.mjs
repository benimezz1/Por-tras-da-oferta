import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Script } from "node:vm";

const html=readFileSync(resolve(process.cwd(),"index.html"),"utf8");
const match=html.match(/<script>([\s\S]*?)<\/script>/);
const source=match?.[1]||"";
const defined=new Set([...source.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1]));

describe("integridade das interações do No Feed",()=>{
 it("o JavaScript inline do jogo é sintaticamente válido",()=>{
  expect(source.length).toBeGreaterThan(5000);
  expect(()=>new Script(source,{filename:"index.html:inline"})).not.toThrow();
 });
 it("fluxo de rede, loja, carrinho e checkout mantém os handlers necessários",()=>{
  const required=["renderGame","stageFeed","drawOverlay","drawModal","openShop","shopPage","productPage","cartPage","checkoutPage","receiptPage","openProduct","openComments","closeModal","closeOverlay","addToCart","buy","checkout","backFromShop","scheduleShopFromPhoto","cancelPhotoShopClick","renderEnd"];
  for(const name of required)expect(defined.has(name),name+" ausente").toBe(true);
 });
 it("ofertas, lojas e checkout possuem ações conectadas",()=>{
  for(const action of ["shop","product","checkout","checkout-cart","buy","close-overlay","open-photo","story-product"]){
   expect(source.includes("data-action=\""+action+"\""),"faltou ação "+action).toBe(true);
  }
  expect(source).toContain('"add-cart"');
  for(const action of ["roleta","spin","live","live-buy","pay","activate-card","inbox","chat","chat-choice","sleep","open-day","end-next","quiz","pass","exit-accept","exit-decline","add-to-order","cancel-sub"]){
   expect(source.includes("'"+action+"'")||source.includes('"'+action+'"'),"faltou ação "+action).toBe(true);
  }
 });
 it("a partida não interrompe a imersão com avisos de bastidor; o aviso fica na abertura e no final",()=>{
  expect(source).not.toContain("SITE FICTÍCIO");
  expect(source).not.toContain("anúncio fictício");
  expect(source).not.toContain("Ajuda: pensar antes de comprar");
  expect(source).toContain("Tudo aqui é simulado");
  expect(source).toContain("Nenhuma compra é real");
 });
});
