/* Ranqueador editorial V6 para a simulacao educativa No Feed.
 * Combina sorteio reproduzivel por conta/partida com preferencias locais
 * (curtidas, salvos, permanencia e rejeicoes) e metadados V5 de fotografias.
 * Nao le saldo, meta, senha, atributos pessoais nem solicita dados externos.
 */
(function(root){
 "use strict";
 const model=root.NoFeedRecommender;
 const variation=root.NoFeedVariation;
 const labels=Object.freeze({friends:"amigos",study:"estudos",music:"musica",fashion:"moda",food:"gastronomia",tech:"tecnologia",fitness:"atividade fisica",city:"cidade",pets:"animais"});
 const eventWeight=Object.freeze({like:3.4,unlike:-3.4,bookmark:4.4,unbookmark:-4.4,comments:1.5,dwell:.65,impression:.08,less:-5.0});
 const cap=(v,a,b)=>Math.min(b,Math.max(a,Number.isFinite(v)?v:0));
 const hash=text=>model.stableNumber(String(text));
 const asTags=post=>Array.isArray(post?.metadata?.tags)?[...new Set(post.metadata.tags.map(x=>String(x).trim().toLowerCase()).filter(Boolean))].slice(0,8):[];
 const indexGet=(index,id)=>index instanceof Map?index.get(id):index?.[id];
 function eligible(post,day,shownPostIds=[]){
  if(!post||!post.id)return false;
  if(Number.isInteger(day)&&!variation.isEligible(post,day))return false;
  if(shownPostIds.includes(post.id))return false;
  const capExposure=post.metadata?.exposureCap;
  if(Number.isFinite(capExposure)&&capExposure<=0)return false;
  return true;
 }
 /* Consolidar sinais uma unica vez por lote, inclusive dos dias anteriores.
  * Somente eventos associados a publicacoes de metadados conhecidos
  * geram inferencia visual; uma curtida nunca altera a foto ja publicada. */
 function compileSignals(profile={},options={}){
  const byCategory=Object.create(null),byTag=Object.create(null);
  const events=Array.isArray(profile.events)?profile.events.slice(-450):[];
  const phase=Math.max(0,Number(options.phase)||0);
  let recognized=0;
  for(const event of events){
   if(!event||!Object.prototype.hasOwnProperty.call(eventWeight,event.type)
      ||!Number.isFinite(event.phase)||event.phase>phase)continue;
   const source=indexGet(options.postIndex,event.id);
   if(!source?.metadata?.category)continue;
   const m=source.metadata,category=String(m.category).toLowerCase();
   const age=phase-event.phase,decay=Math.pow(event.type==="less"?.5:.82,Math.max(0,age));
   const amount=eventWeight[event.type]*decay;
   byCategory[category]=(byCategory[category]||0)+amount;
   const tags=asTags(source);
   for(const tag of tags)byTag[tag]=(byTag[tag]||0)+amount/Math.sqrt(tags.length);
   recognized++;
  }
  for(const key of Object.keys(byCategory))byCategory[key]=cap(byCategory[key],-12,12);
  for(const key of Object.keys(byTag))byTag[key]=cap(byTag[key],-9,9);
  return {byCategory,byTag,recognized};
 }
 function scorePost(post,options={}){
  if(!eligible(post,options.day,options.shownPostIds||[]))
   return {score:-Infinity,eligible:false,parts:{},reasons:["publicacao indisponivel"]};
  const tags=asTags(post),category=String(post.metadata?.category||"").toLowerCase();
  const sig=options.visualSignals||compileSignals(options.profile,{postIndex:options.postIndex,phase:options.phase});
  const personalized=options.personalized!==false;
  const categoryScore=personalized?cap(sig.byCategory?.[category]||0,-12,12):0;
  const tagScore=personalized&&tags.length
   ?cap(tags.reduce((n,tag)=>n+(sig.byTag?.[tag]||0),0)/Math.sqrt(tags.length),-10,10):0;
  const affinity=cap(categoryScore*.65+tagScore*.42,-8,10);
  const seed=String(options.seed||options.runId||"feed-demo");
  const discovery=(hash("v6|"+seed+"|"+post.id)/4294967295-.5)*4.8;
  const boost=post.metadata?.kind==="organic"?1.15:0;
  const editorial=cap(Number(post.metadata?.priorityBase)||0,0,3)*.15;
  const shown=options.recentTopics||[];
  const recentPenalty=shown.slice(-3).filter(topic=>topic===post.topic).length*.18;
  const score=discovery+boost+editorial+affinity*.9-recentPenalty;
  const reasons=[];
  if(personalized&&affinity>1.3)reasons.push("afinidade com fotos e temas curtidos");
  if(personalized&&affinity<-.9)reasons.push("preferencia reduzida por feedback");
  if(category&&labels[category])reasons.push("categoria visual: "+labels[category]);
  if(!reasons.length)reasons.push("descoberta e variedade por partida");
  return {eligible:true,score,parts:{descoberta:discovery,categoria:categoryScore,tags:tagScore,afinidadeVisual:affinity,biblioteca:boost,prioridade:editorial,diversidade:-recentPenalty},reasons};
 }
 function rank(options={}){
  const posts=Array.isArray(options.posts)?options.posts:[];
  const sig=options.visualSignals||compileSignals(options.signals||options.profile,{postIndex:options.postIndex||Object.fromEntries(posts.map(p=>[p.id,p])),phase:options.phase});
  return posts.filter(p=>eligible(p,options.day,options.shownPostIds||[]))
   .map(post=>({postId:post.id,...scorePost(post,{...options,profile:options.signals||options.profile,visualSignals:sig})}))
   .sort((a,b)=>b.score-a.score||a.postId.localeCompare(b.postId))
   .map(({postId,score,reasons},i)=>({postId,rank:i+1,reasons}));
 }
 function summarize(profile,postIndex,phase){
  const s=compileSignals(profile,{postIndex,phase});
  return Object.entries(s.byCategory).sort((a,b)=>b[1]-a[1])
   .filter(([,score])=>score>0.1).slice(0,4)
   .map(([category,score])=>({category,label:labels[category]||category,score:Number(score.toFixed(1))}));
 }
 root.NoFeedFeedRanker=Object.freeze({version:6,labels,eligible,compileSignals,scorePost,rank,summarize});
})(typeof window!=="undefined"?window:globalThis);
