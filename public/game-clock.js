/* Relogio simulado do Pulso.
 * Uma passagem do tempo a cada 2, depois 3, depois 2, depois 3
 * publicacoes distintas vistas. Contagem local, reproduzivel e persistida.
 */
(function(root){
 "use strict";
 const MINUTES_PER_TICK=18;
 const DAY_START=19*60;
 function int(n){return Number.isFinite(Number(n))?Math.max(0,Math.floor(Number(n))):0;}
 function nextThreshold(state){return int(state?.clockViewed)%2===0?2:3;}
 function minutes(state){return DAY_START+int(state?.clockViewed)*MINUTES_PER_TICK;}
 function advanceViewedPost(state,day,id){
  if(!state||!id)return {seen:false,tick:false};
  if(!Array.isArray(state.clockSeen))state.clockSeen=[];
  const key=String(day)+':'+String(id);
  if(state.clockSeen.includes(key))return {seen:false,tick:false};
  state.clockSeen.push(key);
  const goal=nextThreshold(state);
  const progress=Math.min(goal,int(state.clockProgress))+1;
  const tick=progress>=goal;
  state.clockProgress=tick?0:progress;
  if(tick)state.clockViewed=int(state.clockViewed)+1;
  return {seen:true,tick,progress:state.clockProgress,nextThreshold:nextThreshold(state)};
 }
 function resetDay(state){
  if(!state)return;
  state.clockViewed=0;state.clockSeen=[];state.clockProgress=0;
 }
 root.NoFeedClock=Object.freeze({MINUTES_PER_TICK,DAY_START,nextThreshold,minutes,advanceViewedPost,resetDay});
})(typeof window!=="undefined"?window:globalThis);
