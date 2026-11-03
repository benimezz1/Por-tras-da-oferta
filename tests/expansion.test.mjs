import {describe,expect,it} from "vitest";
import {existsSync,statSync,readFileSync} from "node:fs";
import {resolve} from "node:path";
import "../public/recommendation.js";
import "../public/expansion.js";

const base=resolve(process.cwd(),"public/assets/social");
const expansion=globalThis.NoFeedExpansion;
const model=globalThis.NoFeedRecommender;

describe("momentos editoriais e novos produtos comerciais",()=>{
 it("acrescenta quatro lojas e quatro momentos que nunca aparecem como capítulos obrigatórios",()=>{
  expect(Object.keys(expansion.products)).toEqual(["powerbank","garrafa","luminaria","ingresso"]);
  expect(expansion.moments).toHaveLength(4);
  for(const m of expansion.moments)expect(model.topics).toContain(m.id);
  const html=readFileSync(resolve(process.cwd(),"index.html"),"utf8");
  expect(html).toContain('phases.push(...window.NoFeedExpansion.moments)');
  expect(html).not.toContain('data-action="decision"');
 });
 it("cada loja tem descrição, preço, argumento publicitário e avaliações fictícios",()=>{
  for(const product of Object.values(expansion.products)){
   expect(product.price).toBeGreaterThan(0);
   expect(product.price).toBeLessThan(220);
   expect(product.name.length).toBeGreaterThan(3);
   expect(product.specs.length).toBeGreaterThanOrEqual(3);
   expect(product.reviews.length).toBeGreaterThan(1);
   expect(product.desc.length).toBeGreaterThan(30);
   expect(product.ad.length).toBeGreaterThan(20);
  }
 });
 it("adiciona doze posts originais e oito stories com vinte imagens locais distintas",()=>{
  const posts=expansion.moments.flatMap(m=>m.posts);
  const stories=expansion.moments.flatMap(m=>m.stories);
  expect(posts).toHaveLength(12);
  expect(stories).toHaveLength(8);
  expect(new Set(posts.map(p=>p.id)).size).toBe(12);
  expect(posts.every(p=>/^p(?:1[3-9]|2[0-4])$/.test(p.id))).toBe(true);
  const photos=[...posts.map(p=>p.photo),...stories.map(s=>s[5])];
  expect(new Set(photos).size).toBe(20);
  for(const name of photos){
   const path=resolve(base,name+".webp");
   expect(existsSync(path),name).toBe(true);
   expect(statSync(path).size,name).toBeGreaterThan(15000);
  }
 });
 it("mantém autoria, identificação publicitária e acessos a lojas conectados",()=>{
  for(const moment of expansion.moments){
   expect(moment.stories).toHaveLength(2);
   expect(moment.posts).toHaveLength(3);
   expect(moment.posts.some(p=>p.promoted&&p.when.includes("parceria"))).toBe(true);
   expect(moment.stories[0][0]).toBe(moment.stories[1][0]);
   expect(moment.stories.every(s=>s[4]===moment.id)).toBe(true);
  }
 });
});
