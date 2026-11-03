
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
  expect(organic).toHaveLength(24);
  expect(new Set(organic.map(x=>x.id)).size).toBe(24);
  expect(stream.isDone(pool,shown)).toBe(true);
 });
 it("reduz retargeting repetido e remove produtos comprados",()=>{
  const profile=model.emptyProfile();
  model.record(profile,{type:"cart",topic:"fone",id:"fone",phase:1});
  const shown=[{kind:"ad",id:"ad-main-fone",topic:"fone"},
   ...Array.from({length:5},(_,i)=>({kind:"post",id:"old-"+i,topic:["tenis","plano","mochila","garrafa","tenis"][i],author:"teste"+i}))];
  const options={...cfg(shown,profile,true,1),cart:["fone"],viewed:["fone"]};
  const followup=stream.chooseAd(options);
  expect(followup?.id).toBe("ad-ret-fone");
  shown.push(followup);
  expect(stream.chooseAd(options)?.id).not.toBe("ad-ret-fone");
  const noPurchased=stream.chooseAd({...options,shown:[],purchased:["fone"]});
  expect(noPurchased?.topic).not.toBe("fone");
 });
});

describe("linha do tempo adaptativa com campanhas e novidades",()=>{
 it("libera temas aos poucos sem mostrar capítulos ao jogador",()=>{
  const phases=[0,1,2,3,4];
  const totals=phases.map(phase=>model.topics.filter(t=>stream.release[t]<=phase).length);
  expect(totals).toEqual([4,5,6,7,8]);
  const p=posts().map((post,index)=>({...post,phase:stream.release[post.topic],order:index}));
  const shown=stream.nextBatch(p,cfg());
  expect(shown.filter(x=>x.kind==="ad")).toHaveLength(1);
  expect(shown.every(x=>stream.release[x.topic]<=0)).toBe(true);
  expect(stream.choosePost(p,cfg(shown,model.emptyProfile(),true,2))?.phase).toBeLessThanOrEqual(2);
 });
 it("faz um anúncio a cada três ou mais conteúdos sem adjacência comercial",()=>{
  const shown=[],pool=posts();
  for(let round=0;round<12;round++){
   const newer=stream.nextBatch(pool,cfg(shown,model.emptyProfile(),true,Math.min(round,9)));
   if(!newer.length)break;
   shown.push(...newer);
  }
  expect(shown.length).toBeGreaterThan(24);
  const ads=shown.map((x,i)=>x.kind==="ad"?i:-1).filter(i=>i>=0);
  expect(ads.length).toBeGreaterThanOrEqual(5);
  expect(ads.every((at,i)=>i===0?at>=3:at-ads[i-1]>=4)).toBe(true);
  expect(shown.filter(x=>x.kind==="post")).toHaveLength(24);
  expect(new Set(shown.map(x=>x.id)).size).toBe(shown.length);
 });
 it("faz retargeting apenas depois de interesse e com espaçamento",()=>{
  const profile=model.emptyProfile();
  model.record(profile,{type:"product",topic:"fone",id:"fone",phase:1});
  model.record(profile,{type:"cart",topic:"fone",id:"fone",phase:1});
  const oldAd={kind:"ad",id:"ad-main-fone",topic:"fone"};
  const organic=Array.from({length:5},(_,n)=>({kind:"post",id:"p"+(30+n),topic:"tenis"}));
  const shortly=stream.chooseAd({...cfg([oldAd],profile,true,1),viewed:["fone"],cart:["fone"]});
  expect(shortly?.id).not.toBe("ad-ret-fone");
  const later=stream.chooseAd({...cfg([oldAd,...organic],profile,true,2),viewed:["fone"],cart:["fone"]});
  expect(later?.id).toBe("ad-ret-fone");
 });
 it("recomenda um complemento após comprar sem anunciar o item já adquirido",()=>{
  const profile=model.emptyProfile();
  const purchased=["fone"];
  const shown=[
    {kind:"ad",id:"ad-main-powerbank",topic:"powerbank"},
    {kind:"post",id:"p2",topic:"mochila"},
    {kind:"post",id:"p3",topic:"tenis"},
    {kind:"post",id:"p4",topic:"plano"},
    {kind:"post",id:"p5",topic:"ingresso"},
    {kind:"post",id:"p6",topic:"garrafa"}
  ];
  const score=model.complementaryScore("powerbank",purchased);
  expect(score).toBeGreaterThan(model.complementaryScore("luminaria",purchased));
  const next=stream.chooseAd({...cfg(shown,profile,true,4),purchased});
  expect(next?.topic).not.toBe("fone");
  expect(stream.scoreAd({topic:"powerbank",id:"ad-pair-powerbank",campaign:"pair"},{...cfg(shown,profile,true,4),purchased}).parts.complemento).toBeGreaterThan(0);
  const allAfter=stream.nextBatch(posts(),{...cfg(shown,profile,true,4),purchased},5);
  expect(allAfter.filter(x=>x.kind==="ad").every(x=>x.topic!=="fone")).toBe(true);
 });
 it("personalização desligada não faz retargeting nem usa carrinho na pontuação",()=>{
  const profile=model.emptyProfile();
  model.record(profile,{type:"cart",topic:"fone",id:"fone",phase:1});
  const shown=[{kind:"ad",id:"ad-main-fone",topic:"fone"},...Array.from({length:5},(_,i)=>({kind:"post",id:"q"+i,topic:"tenis"}))];
  const ctx={...cfg(shown,profile,false,2),viewed:["fone"],cart:["fone"]};
  expect(stream.chooseAd(ctx)?.retarget).toBe(false);
  expect(stream.scorePost(posts()[0],ctx).parts.interesse).toBe(0);
 });
 it("a recomendação é determinística para os mesmos sinais e lotes",()=>{
  const profile=model.emptyProfile();
  model.record(profile,{type:"like",topic:"powerbank",id:"p13",phase:1});
  const cfg1=cfg([],profile,true,1);
  expect(stream.nextBatch(posts(),cfg1)).toEqual(stream.nextBatch(posts(),cfg1));
 });
});
