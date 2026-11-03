import { describe, expect, it } from "vitest";
import "../public/recommendation.js";

const recommender = globalThis.NoFeedRecommender;
const candidate = (id, topic, phase, order, author="bia", source="friend", likes=100) =>
  ({ id, topic, phase, order, author, source, likes });
const context = (profile, phase, personalized=true) => ({ profile, phase, personalized });

describe("motor de recomendação didático", () => {
  it("mantém a ordem inicial e oferece ordem cronológica sem personalização", () => {
    const p = recommender.emptyProfile();
    const posts = [candidate("p1","fone",0,0),candidate("p2","fone",0,1,"agenda","page",800),candidate("p3","fone",0,2,"lucca")];
    expect(recommender.rankPosts(posts,context(p,0)).map(x=>x.id)).toEqual(["p1","p2","p3"]);
    recommender.record(p,{type:"like",topic:"fone",id:"p3",phase:0,author:"lucca"});
    expect(recommender.rankPosts(posts,context(p,0,false)).map(x=>x.id)).toEqual(["p1","p2","p3"]);
  });
  it("aumenta relevância por interação e reduz interesse após Mostrar menos", () => {
    const p = recommender.emptyProfile();
    const before = recommender.affinity(p,"fone",0);
    recommender.record(p,{type:"like",topic:"fone",id:"p1",phase:0,author:"bia"});
    recommender.record(p,{type:"bookmark",topic:"fone",id:"p1",phase:0,author:"bia"});
    expect(recommender.affinity(p,"fone",0)).toBeGreaterThan(before+5);
    const after = recommender.affinity(p,"fone",0);
    recommender.record(p,{type:"less",topic:"fone",id:"p1",phase:0});
    expect(recommender.affinity(p,"fone",0)).toBeLessThan(after);
    expect(recommender.affinity(p,"fone",2)).toBeLessThan(recommender.affinity(p,"fone",0));
  });
  it("não permite repetição ilimitada de impressões e vistas de produto", () => {
    const p = recommender.emptyProfile();
    expect(recommender.record(p,{type:"impression",topic:"tenis",id:"ad-ret-tenis",phase:1})).toBe(true);
    expect(recommender.record(p,{type:"impression",topic:"tenis",id:"ad-ret-tenis",phase:1})).toBe(false);
    expect(recommender.record(p,{type:"product",topic:"tenis",id:"tenis",phase:1})).toBe(true);
    expect(recommender.record(p,{type:"product",topic:"tenis",id:"tenis",phase:1})).toBe(false);
    expect(recommender.exposureCount(p,"ad-ret-tenis")).toBe(1);
  });
  it("recomenda produto salvo sem insistir em itens comprados", () => {
    const p = recommender.emptyProfile();
    recommender.record(p,{type:"cart",topic:"fone",id:"fone",phase:0});
    const args = {profile:p,phase:1,personalized:true,current:"tenis",cart:["fone"],purchased:[]};
    expect(recommender.pickRetarget(args)?.topic).toBe("fone");
    expect(recommender.pickRetarget({...args,personalized:false})).toBeNull();
    expect(recommender.pickRetarget({...args,purchased:["fone"]})).toBeNull();
  });
  it("aplica limite de frequência ao mesmo anúncio", () => {
    const p = recommender.emptyProfile();
    recommender.record(p,{type:"cart",topic:"fone",id:"fone",phase:0});
    for(const phase of [1,2]) recommender.record(p,{type:"impression",topic:"fone",id:"ad-ret-fone",phase});
    const result = recommender.pickRetarget({profile:p,phase:3,personalized:true,current:"mochila",cart:["fone"],purchased:[]});
    expect(result).toBeNull();
  });
  it("considera popularidade, idade e afinidade sem depender de sorteio", () => {
    const p = recommender.emptyProfile(), options = context(p,1);
    const recent = candidate("p4","tenis",1,0,"gabi","friend",100);
    const old = candidate("p1","fone",0,0,"bia","friend",100);
    expect(recommender.scorePost(recent,options).score).toBeGreaterThan(recommender.scorePost(old,options).score);
    expect(recommender.scorePost(recent,options).score).toEqual(recommender.scorePost(recent,options).score);
    expect(recommender.rankPosts([recent,old],options).map(x=>x.id)).toEqual(recommender.rankPosts([recent,old],options).map(x=>x.id));
  });
  it("preserva os sinais válidos na restauração, rejeitando eventos impróprios", () => {
    const p = recommender.emptyProfile();
    recommender.record(p,{type:"story",topic:"mochila",id:"s3-0",phase:3,author:"gabi"});
    expect(recommender.record(p,{type:"buy",topic:"localizacao",id:"x",phase:3})).toBe(false);
    expect(recommender.record(p,{type:"story",topic:"mochila",id:"x",phase:9})).toBe(false);
    const restored = recommender.normalize(JSON.parse(JSON.stringify(p)));
    expect(restored.events).toHaveLength(1);
    expect(restored.events[0].topic).toBe("mochila");
  });
});
