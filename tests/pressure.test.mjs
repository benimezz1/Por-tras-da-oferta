import {describe,expect,it} from "vitest";
import "../public/recommendation.js";
import "../public/stream.js";
import "../public/pressure.js";
import "../public/week.js";
import "../public/direct.js";

const P=globalThis.PorTrasPressure,W=globalThis.PorTrasWeek,S=globalThis.NoFeedStream;

describe("motor de pressão comercial",()=>{
 it("cobre as dez estratégias do relatório, cada uma com evidência",()=>{
  expect(P.KEYS).toHaveLength(15);
  for(const k of P.KEYS){expect(P.STRATEGIES[k].research.length).toBeGreaterThan(40);expect(P.QUIZ_BANK[k]).toBeTruthy();}
 });
 it("parcelamento com juros custa mais que o preço à vista",()=>{
  const plan=P.installment(219.9,10,P.FEES.cardRate);
  expect(plan.total).toBeGreaterThan(219.9);
  expect(plan.interest).toBeCloseTo(plan.total-219.9,2);
  expect(P.installment(300,3).each).toBe(100);
 });
 it("o checkout soma custos tardios e respeita o mínimo do cupom",()=>{
  const coupon={code:"ROLETA50",kind:"value",amount:50,min:249};
  const small=P.quote({lines:[{id:"fone",price:219.9,protection:true,physical:true}],coupon,method:"pix"});
  expect(small.couponValue).toBe(0);
  expect(small.shipping).toBe(0);
  expect(small.protection).toBeGreaterThan(0);
  expect(small.service).toBe(P.FEES.service);
  const cheap=P.quote({lines:[{id:"garrafa",price:69.9,physical:true}],method:"card1"});
  expect(cheap.shipping).toBe(P.FEES.shipping);
  expect(cheap.missingForFreeShipping).toBeCloseTo(199-69.9,2);
  const big=P.quote({lines:[{id:"tenis",price:279.9,physical:true}],coupon,method:"card10"});
  expect(big.couponValue).toBe(50);
  expect(big.n).toBe(10);
  expect(big.totalPaid).toBeGreaterThan(big.total);
 });
 it("o cronômetro reinicia a cada visita e o estoque nunca zera",()=>{
  const timers={},stock={};
  P.visitTimer(timers,"fone",0);
  expect(P.timerLeft(timers.fone,120000)).toBe(P.TIMER_MS-120000);
  P.visitTimer(timers,"fone",500000);
  expect(timers.fone.resets).toBe(1);
  expect(P.timerLeft(timers.fone,500000)).toBe(P.TIMER_MS);
  for(let i=0;i<20;i++)P.visitStock(stock,"fone");
  expect(stock.fone).toBe(2);
 });
 it("a empolgação da compra some em poucos conteúdos",()=>{
  const v=P.emptyVibe();
  const before=v.value;
  P.vibeBuy(v,16,"compra");
  expect(v.value).toBe(before+16);
  for(let i=0;i<6;i++)P.vibeTick(v);
  expect(v.value).toBeLessThan(before);
 });
 it("registra exposição e influência sem duplicar e gera quiz com a resposta entre as opções",()=>{
  const l=P.emptyLedger();
  P.expose(l,"escassez","Restam 3");P.expose(l,"escassez","Restam 3");
  expect(l.exposed.escassez).toBe(2);
  expect(l.moments.escassez).toEqual(["Restam 3"]);
  expect(P.influence(l,"fomo","comprou")).toBe(true);
  expect(P.influence(l,"fomo","comprou")).toBe(false);
  expect(P.profile(l)[0].key).toBe("fomo");
  const q=P.quiz(l,5);
  expect(q).toHaveLength(5);
  for(const item of q){expect(item.options).toContain(item.answer);expect(new Set(item.options).size).toBe(3);}
 });
 it("fecha a semana: fatura e assinatura vencem no sábado, parcelas futuras ficam registradas",()=>{
  const s={wallet:500,goal:400,invoice:[{dueNow:40,future:360,interest:30}],subscriptions:[{active:true,monthly:39.8}]};
  const r=P.settle(s);
  expect(r.finalBalance).toBeCloseTo(500-40-39.8,2);
  expect(r.tripPaid).toBe(true);
  expect(r.future).toBe(360);
  expect(P.settle({...s,wallet:450}).tripPaid).toBe(false);
 });
});

describe("roteiro da semana",()=>{
 it("tem cinco dias com eventos, foco e posts de comparação válidos",()=>{
  expect(W.DAYS.map(d=>d.n)).toEqual([1,2,3,4,5]);
  for(const d of W.DAYS){
   for(const t of d.focus)expect(d.allow).toContain(t);
   for(const e of d.events){
    if(e.type==="compare")expect(W.COMPARE_POSTS[e.post]).toBeTruthy();
    if(e.type==="chat")expect(W.THREADS[e.thread].blocks.some(b=>b.day===d.n)||!!globalThis.PorTrasDirect.BY_EVENT[e.thread+":"+d.n]).toBe(true);
   }
  }
 });
 it("na Mega Liquida o preço “de” sobe para o desconto parecer maior",()=>{
  const mochila={name:"Trail Mini",price:159.9,old:279.9};
  const seg=W.priceFor(mochila,"mochila",1),qui=W.priceFor(mochila,"mochila",4);
  expect(qui.price).toBe(seg.price);
  expect(qui.old).toBeGreaterThan(seg.old);
  expect(qui.off).toBeGreaterThan(seg.off);
 });
 it("o feed respeita os temas liberados e prioriza o foco do dia",()=>{
  const posts=[{id:"a",topic:"fone",author:"x",likes:10,order:0},{id:"b",topic:"ingresso",author:"y",likes:9000,order:1},{id:"c",topic:"tenis",author:"z",likes:10,order:2}];
  const pick=S.choosePost(posts,{shown:[],personalized:true,profile:globalThis.NoFeedRecommender.emptyProfile(),phase:0,allowed:["fone","tenis"],focus:["tenis"]});
  expect(pick.id).toBe("c");
 });
});
