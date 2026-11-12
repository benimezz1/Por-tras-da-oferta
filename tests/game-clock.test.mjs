import {describe,it,expect} from "vitest";
import "../public/game-clock.js";

const clock=globalThis.NoFeedClock;
const state=()=>({clockViewed:0,clockSeen:[],clockProgress:0});

describe("relogio do feed simulado",()=>{
 it("avanca 18 minutos depois de 2, depois 3, depois 2, depois 3 posts",()=>{
  const session=state();
  const ticks=[];
  for(let n=1;n<=12;n++){
   const res=clock.advanceViewedPost(session,1,"post-"+n);
   expect(res.seen).toBe(true);
   ticks.push(session.clockViewed);
  }
  expect(ticks).toEqual([0,1,1,1,2,2,3,3,3,4,4,5]);
  expect(clock.minutes(session)).toBe(19*60+5*18);
 });
 it("nao adianta hora ao rever post ou recarregar com estado persistido",()=>{
  const session=state();
  clock.advanceViewedPost(session,1,"a");
  const reloaded=JSON.parse(JSON.stringify(session));
  expect(clock.advanceViewedPost(reloaded,1,"a").tick).toBe(false);
  expect(clock.advanceViewedPost(reloaded,1,"a").seen).toBe(false);
  expect(reloaded.clockSeen).toHaveLength(1);
  expect(clock.advanceViewedPost(reloaded,1,"b").tick).toBe(true);
  expect(reloaded.clockViewed).toBe(1);
 });
 it("ao voltar ao inicio os posts antigos nao contam de novo, mas novos contam",()=>{
  const session=state();
  for(let i=1;i<=5;i++)clock.advanceViewedPost(session,2,"post-"+i);
  expect(session.clockViewed).toBe(2);
  for(let i=1;i<=5;i++)clock.advanceViewedPost(session,2,"post-"+i);
  expect(session.clockViewed).toBe(2);
  clock.advanceViewedPost(session,2,"recomendado-6");
  expect(session.clockViewed).toBe(2);
  clock.advanceViewedPost(session,2,"recomendado-7");
  expect(session.clockViewed).toBe(3);
 });
 it("proximo dia recomeça as 19h sem reaproveitar contagem anterior",()=>{
  const session=state();
  clock.advanceViewedPost(session,1,"a");
  clock.advanceViewedPost(session,1,"b");
  expect(session.clockViewed).toBe(1);
  clock.resetDay(session);
  expect(clock.minutes(session)).toBe(19*60);
  expect(session.clockSeen).toEqual([]);
  clock.advanceViewedPost(session,2,"a");
  expect(session.clockViewed).toBe(0);
  clock.advanceViewedPost(session,2,"b");
  expect(session.clockViewed).toBe(1);
 });
});
