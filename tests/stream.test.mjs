
import { describe, expect, it } from "vitest";
import "../public/recommendation.js";
import "../public/stream.js";

const stream=globalThis.NoFeedStream;
const model=globalThis.NoFeedRecommender;
const posts=()=>stream.topics.flatMap((topic,themeIndex)=>
  Array.from({length:3},(_,n)=>({
    id:"p"+(themeIndex*3+n+1),topic,author:topic,
    source:n===0?"friend":"page",likes:110+themeIndex*40,
    phase:0,order:n*4+themeIndex
  }))
);
const cfg=(shown=[],profile=model.emptyProfile(),personalized=true,phase=0)=>
 ({shown,profile,personalized,phase,cart:[],viewed:[],purchased:[]});

describe("motor de linha do tempo contínua",()=>{
 it("mistura temas e intercalada anúncios já no primeiro lote",()=>{
  const first=stream.nextBatch(posts(),cfg());
  expect(first).toHaveLength(5);
  expect(first.filter(x=>x.kind==="ad")).toHaveLength(1);
  expect(new Set(first.map(x=>x.topic)).size).toBeGreaterThanOrEqual(3);
  expect(new Set(first.map(x=>x.id)).size).toBe(5);
 });
 it("usa sinais para selecionar conteúdos futuros",()=>{
  const first=stream.nextBatch(posts(),cfg());
  const profile=model.emptyProfile();
  model.record(profile,{type:"like",topic:"mochila",id:"p10",phase:1,author:"mochila"});
  model.record(profile,{type:"cart",topic:"mochila",id:"mochila",phase:1});
  const options=cfg(first,profile,true,1);
  const next=stream.nextBatch(posts(),options);
  expect(next).toHaveLength(5);
  expect(next.every(x=>!first.some(y=>y.id===x.id))).toBe(true);
  expect(stream.scorePost(posts().find(p=>p.topic==="mochila"),options).parts.interesse).toBeGreaterThan(1);
 });
 it("usa uma ordem editorial misturada sem perfil",()=>{
  const first=stream.nextBatch(posts(),cfg([],model.emptyProfile(),false));
  expect(first.slice(0,3).map(x=>x.id)).toEqual(["p1","p4","p7"]);
  expect(first.some(x=>x.kind==="ad")).toBe(true);
 });
 it("não reapresenta o mesmo post durante o percurso",()=>{
  const pool=posts(),shown=[];
  for(let round=0;round<10;round++){
   const next=stream.nextBatch(pool,cfg(shown,model.emptyProfile(),true,Math.min(3,round)));
   if(!next.length)break;
   shown.push(...next);
  }
  const organic=shown.filter(x=>x.kind==="post");
  expect(organic).toHaveLength(12);
  expect(new Set(organic.map(x=>x.id)).size).toBe(12);
  expect(stream.isDone(pool,shown)).toBe(true);
 });
 it("reduz retargeting repetido e remove produtos comprados",()=>{
  const profile=model.emptyProfile();
  model.record(profile,{type:"cart",topic:"fone",id:"fone",phase:1});
  const shown=[{kind:"ad",id:"ad-main-fone",topic:"fone"}];
  const options={...cfg(shown,profile,true,1),cart:["fone"],viewed:["fone"]};
  const followup=stream.chooseAd(options);
  expect(followup?.id).toBe("ad-ret-fone");
  shown.push(followup);
  expect(stream.chooseAd(options)?.id).not.toBe("ad-ret-fone");
  const noPurchased=stream.chooseAd({...options,shown:[],purchased:["fone"]});
  expect(noPurchased?.topic).not.toBe("fone");
 });
});
