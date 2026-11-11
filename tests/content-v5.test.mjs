
import { describe, expect, it } from "vitest";
import "../public/library-v5.js";
import "../public/feed-variation.js";
const library=globalThis.NoFeedLibraryV5,variation=globalThis.NoFeedVariation;

describe("biblioteca v5 de imagens reais e posts",()=>{
 it("adiciona 89 fotografias independentes com origem Pexels e metadados",()=>{
   expect(library.photoRecords).toHaveLength(89);
   expect(Object.keys(library.photos)).toHaveLength(89);
   expect(new Set(Object.values(library.photos)).size).toBe(89);
   expect(library.posts).toHaveLength(89);
   expect(library.stories.length).toBeGreaterThan(40);
   for(const p of library.posts){
    expect(p.photo).toMatch(/^v5_\d+$/);
    expect(p.metadata.priorityBase).toBe(1);
    expect(p.metadata.availableFrom).toBe(p.day);
    expect(p.metadata.availableUntil).toBe(p.day);
    expect(p.caption.length).toBeGreaterThan(8);
    expect(p.metadata.tags.length).toBeGreaterThan(0);
   }
 });
 it("cada uma das cinco noites oferece publicacoes exclusivas e varios stories",()=>{
   const allIds=[];
   for(let day=1;day<=5;day++){
    const pool=variation.varyPosts(library.posts,{runId:"aluno-1",day});
    expect(pool.length).toBeGreaterThanOrEqual(15);
    const unique=new Set(pool.map(p=>p.id));
    expect(unique.size).toBe(pool.length);
    const stories=variation.varyStories(library.stories.map((s,i)=>({day:s[6],user:s[0],idx:i})),{runId:"aluno-1",day});
    expect(stories.length).toBeGreaterThanOrEqual(5);
    allIds.push(...unique);
   }
   expect(new Set(allIds).size).toBe(library.posts.length);
 });
 it("a sequencia muda de jogador para jogador e se mantem ao atualizar",()=>{
   const day=2,posts=[...library.posts.filter(x=>x.day===day),...library.posts.filter(x=>x.day===3).map(x=>({...x,day}))];
   const order=seed=>variation.varyPosts(posts,{runId:seed,day}).sort((a,b)=>a.order-b.order).map(x=>x.id);
   expect(order("partida-a")).toEqual(order("partida-a"));
   expect(order("partida-a")).not.toEqual(order("partida-b"));
   expect(order("partida-a")).not.toEqual(order("partida-c"));
   expect(order("partida-a")).toHaveLength(posts.length);
 });
 it("filtra eventos futuros e material de viagem ja realizada antes de sabado",()=>{
   const item={id:"semana",day:5,metadata:{availableFrom:5,availableUntil:5}};
   expect(variation.isEligible(item,4)).toBe(false);
   expect(variation.isEligible(item,5)).toBe(true);
   expect(variation.isEligible({id:"pos-viagem",metadata:{narrative:"viagem_ja_ocorreu",eventOccurredDay:6}},5)).toBe(false);
   expect(variation.isEligible({id:"poster",day:1},2)).toBe(false);
   expect(library.posts.every(p=>!/(ja voltamos da viagem|fotos da viagem de sabado que aconteceu)/i.test(p.caption))).toBe(true);
 });
 it("a foto com Bia na segunda nao e uma foto fixa nem repete Gabi na sexta",()=>{
   const sample=["sessao-bia-1","sessao-bia-2","sessao-bia-3","sessao-bia-4","sessao-bia-5","sessao-bia-6"];
   const photos=sample.map(runId=>variation.taggedPhoto(1,runId));
   expect(new Set(photos).size).toBeGreaterThanOrEqual(3);
   for(const runId of sample){
    const monday=variation.taggedPhoto(1,runId),friday=variation.taggedPhoto(5,runId);
    expect(library.taggedPools[1]).toContain(monday);
    expect(library.taggedPools[5]).toContain(friday);
    expect(friday).not.toBe(monday);
    expect(variation.taggedPhoto(1,runId)).toBe(monday);
   }
 });
 it("varia a foto de Bia dentro do mesmo dia sem trocar fotos da biblioteca nova",()=>{
   const originals=Array.from({length:8},(_,i)=>({id:"bia-"+i,who:"bia.m",topic:"mochila",photo:"friends_trip"}));
   const seen=originals.map(p=>variation.distinctAuthorPhoto(p,{runId:"conta-bia",day:4},originals));
   expect(new Set(seen).size).toBeGreaterThanOrEqual(6);
   const fresh={...originals[0],contentVersion:5,photo:"v5_11"};
   expect(variation.distinctAuthorPhoto(fresh,{runId:"conta-bia",day:4},originals)).toBe("v5_11");
 });
 it("mantem contrato separado para a etapa futura do ranking",()=>{
   expect(variation.FUTURE_RANKING_INTERFACE.invariants).toContain("noFutureEvents");
   expect(variation.FUTURE_RANKING_INTERFACE.context).toContain("runId");
   expect(variation.FUTURE_RANKING_INTERFACE.output).toEqual(["postId","rank","reasons"]);
 });
});
