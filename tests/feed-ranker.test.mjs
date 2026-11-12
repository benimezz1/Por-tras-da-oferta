import { describe, it, expect } from "vitest";
import "../public/recommendation.js";
import "../public/feed-variation.js";
import "../public/library-v5.js";
import "../public/feed-ranker.js";
import "../public/stream.js";

const model=globalThis.NoFeedRecommender;
const visual=globalThis.NoFeedFeedRanker;
const stream=globalThis.NoFeedStream;
const library=globalThis.NoFeedLibraryV5;

function photo(id,category,topic,day=1){
 return {id,day,topic,author:"autor-"+category,source:"friend",likes:250,phase:0,order:2,photo:"img-"+id,
  metadata:{kind:"organic",category,tags:[category,"cotidiano"],availableFrom:day,availableUntil:day,
   priorityBase:1,exposureCap:1,author:"autor-"+category,narrative:"antes_da_viagem"}};
}
const startProfile=()=>model.emptyProfile();
const context=(postIndex,profile,seed="conta-a")=>({
 day:1,seed,phase:0,profile,personalized:true,postIndex,
 visualSignals:visual.compileSignals(profile,{postIndex,phase:0})
});

describe("ranqueador V6 de fotos por conta e interesses",()=>{
 it("usa um embaralhamento inicial reproduzivel e diferente entre contas",()=>{
  const posts=Array.from({length:28},(_,i)=>photo("foto-"+i,["music","fashion","friends","pets"][i%4],"fone"));
  const args={posts,day:1,profile:startProfile(),personalized:true};
  const a=visual.rank({...args,seed:"conta-1"}).map(x=>x.postId);
  const same=visual.rank({...args,seed:"conta-1"}).map(x=>x.postId);
  const b=visual.rank({...args,seed:"conta-2"}).map(x=>x.postId);
  expect(a).toEqual(same);
  expect(a).not.toEqual(b);
  expect(new Set(a).size).toBe(28);
  expect(visual.rank({...args,seed:"conta-1"})[0]).toEqual(expect.objectContaining({
   postId:expect.any(String),rank:1,reasons:expect.any(Array)
  }));
 });
 it("curtidas reforcam a categoria da foto, inclusive de dias anteriores",()=>{
  const music=photo("musica-2","music","fone"),fashion=photo("moda-2","fashion","tenis");
  const liked=photo("musica-antiga","music","fone",1);
  const postIndex={[liked.id]:liked};
  const p=startProfile();
  const before=visual.scorePost(music,context(postIndex,p));
  model.record(p,{type:"like",topic:"fone",id:liked.id,author:liked.author,phase:0});
  const after=visual.scorePost(music,context(postIndex,p));
  const irrelevant=visual.scorePost(fashion,context(postIndex,p));
  expect(after.score).toBeGreaterThan(before.score+2);
  expect(after.score-before.score).toBeGreaterThan(irrelevant.score-visual.scorePost(fashion,context(postIndex,startProfile())).score);
  const tomorrow=photo("musica-amanha","music","fone",2);
  const carried=visual.scorePost(tomorrow,{...context(postIndex,p),day:2,phase:1,
   visualSignals:visual.compileSignals(p,{postIndex,phase:1})});
  expect(carried.parts.afinidadeVisual).toBeGreaterThan(0);
 });
 it("descurtir e mostrar menos reduzem o interesse visual",()=>{
  const p=startProfile(),liked=photo("liked","pets","garrafa"),other=photo("other","pets","garrafa");
  const postIndex={liked};
  model.record(p,{type:"like",topic:"garrafa",id:"liked",phase:0});
  const start=visual.scorePost(other,context(postIndex,p)).score;
  model.record(p,{type:"unlike",topic:"garrafa",id:"liked",phase:0});
  expect(visual.scorePost(other,context(postIndex,p)).score).toBeLessThan(start);
  model.record(p,{type:"less",topic:"garrafa",id:"liked",phase:0});
  expect(visual.scorePost(other,context(postIndex,p)).score).toBeLessThan(start-2);
 });
 it("bloqueia fotos futuras, fotos repetidas e respeita cronologia",()=>{
  const present=photo("presente","friends","mochila"),future=photo("futuro","city","ingresso",5);
  const tomorrow=photo("amanha","music","plano",2);
  const pastTrip={...photo("sabado","friends","mochila"),metadata:{narrative:"viagem_ja_ocorreu",eventOccurredDay:6}};
  expect(visual.rank({posts:[present,future,tomorrow,pastTrip],day:1,shownPostIds:[]})
   .map(p=>p.postId)).toEqual(["presente"]);
  expect(visual.rank({posts:[present,future],day:1,shownPostIds:["presente"]})).toEqual([]);
 });
 it("não infere gosto por fotos quando a personalizacao esta desligada",()=>{
  const p=startProfile(),source=photo("curtida","study","luminaria"),other=photo("outro","study","luminaria");
  const index={curtida:source};
  const before=visual.scorePost(other,{...context(index,p),personalized:false}).score;
  model.record(p,{type:"like",topic:"luminaria",id:"curtida",phase:0});
  expect(visual.scorePost(other,{...context(index,p),personalized:false}).score).toBe(before);
  expect(visual.summarize(p,index,0)[0].label).toBe("estudos");
 });
 it("acrescenta gosto visual ao motor existente sem modificar posts ja mostrados",()=>{
  const music=photo("musica","music","fone"),fashion=photo("moda","fashion","tenis");
  const source=photo("amado","music","fone"),p=startProfile(),postIndex={amado:source};
  const base=stream.scorePost(music,{...context(postIndex,p),shown:[]});
  model.record(p,{type:"like",topic:"fone",id:"amado",phase:0});
  const personalized=stream.scorePost(music,{...context(postIndex,p),shown:[]});
  expect(personalized.score).toBeGreaterThan(base.score+1);
  expect(visual.scorePost(music,context(postIndex,p)).score-visual.scorePost(music,context(postIndex,startProfile())).score).toBeGreaterThan(
   visual.scorePost(fashion,context(postIndex,p)).score-visual.scorePost(fashion,context(postIndex,startProfile())).score
  );
  const selected=stream.nextBatch([music,fashion],{...context(postIndex,p),shown:[],allowed:["fone","tenis"]},1);
  expect(selected).toHaveLength(1);
  expect(selected[0].kind).toBe("post");
  const next=stream.nextBatch([music,fashion],{...context(postIndex,p),shown:selected,allowed:["fone","tenis"]},1);
  expect(next.map(x=>x.id)).not.toContain(selected[0].id);
 });
 it("usa a biblioteca V5 para dar aberturas diferentes a dois jogadores",()=>{
  const posts=library.posts.filter(p=>p.day===1).map(p=>({...p,phase:0,author:p.who,order:0}));
  const p=startProfile(),seeds=["aluno-a","aluno-b"];
  const initial=seeds.map(seed=>stream.nextBatch(posts,{shown:[],profile:p,personalized:true,phase:0,
    day:1,seed,allowed:["fone","tenis","plano","mochila","powerbank","garrafa","luminaria","ingresso"]},5)
    .filter(x=>x.kind==="post").map(x=>x.id));
  expect(initial[0]).not.toEqual(initial[1]);
  expect(initial[0]).toEqual(stream.nextBatch(posts,{shown:[],profile:p,personalized:true,phase:0,
    day:1,seed:seeds[0],allowed:["fone","tenis","plano","mochila","powerbank","garrafa","luminaria","ingresso"]},5).filter(x=>x.kind==="post").map(x=>x.id));
 });
});
