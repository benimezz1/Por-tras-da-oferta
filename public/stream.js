/* Linha do tempo em lotes, de duracao limitada para apresentacao.
 * Explorar novos assuntos + reforcar sinais + anuncios complementares, sem
 * conhecer saldo, meta, perfil real ou dados externos do jogador. */
(function(root){
 root.NoFeedStream=(function(model){
  "use strict";
  const topics=model.topics;
  const release={fone:0,tenis:0,plano:0,mochila:0,powerbank:1,garrafa:2,luminaria:3,ingresso:4};
  const MAX_FEED_ITEMS=58;
  const hash=value=>model.stableNumber(value)/4294967295;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:0));
  const count=(items,pred)=>items.filter(pred).length;
  function scorePost(post,args){
   const shown=args.shown||[],recent=shown.slice(-4),age=Math.max(0,(args.phase||0)-(post.phase||0));
   const recentTopic=count(recent,x=>x.topic===post.topic);
   const recentAuthor=count(recent,x=>x.author===post.author);
   const affinity=args.personalized?model.affinity(args.profile,post.topic,args.phase||0):0;
   const parts={
    atualidade:clamp(2.2-age*.20,.3,2.2),
    popularidade:Math.log10(1+Math.max(0,post.likes||0))*.32,
    proximidade:post.source==="friend"?.67:.30,
    interesse:args.personalized?affinity*.60:0,
    criador:args.personalized?model.authorAffinity(args.profile,post.author,args.phase||0)*.27:0,
    diversidade:-recentTopic*1.1,
    autorRepetido:-recentAuthor*.72,
    descoberta:args.personalized?hash("p:"+post.id)*.42:0
   };
   return {score:Object.values(parts).reduce((a,b)=>a+b,0),parts};
  }
  function choosePost(posts,args){
   const published=new Set((args.shown||[]).filter(x=>x.kind==="post").map(x=>x.id));
   const available=posts.filter(post=>!published.has(post.id)&&(post.phase||0)<=(args.phase||0));
   if(!available.length)return null;
   if(!args.personalized){
    available.sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
    return available[0];
   }
   const lastTwo=(args.shown||[]).slice(-2);
   const repeated=lastTwo.length===2&&lastTwo.every(x=>x.topic===lastTwo[0].topic);
   const varied=repeated?available.filter(x=>x.topic!==lastTwo[0].topic):available;
   const pool=varied.length?varied:available;
   pool.sort((a,b)=>scorePost(b,args).score-scorePost(a,args).score
     ||a.order-b.order||a.id.localeCompare(b.id));
   return pool[0];
  }
  function adSpacing(topic,args){
   const shown=args.shown||[];
   let last=-100;
   for(let i=shown.length-1;i>=0;i--){
    if(shown[i].kind==="ad"&&shown[i].topic===topic){last=i;break;}
   }
   return shown.length-last;
  }
  function scoreAd(ad,args){
   const shown=args.shown||[],recent=shown.slice(-8);
   const baseline=model.scoreAd(ad.topic,args),isRet=ad.campaign==="retarget";
   const firstExposure=!shown.some(x=>x.kind==="ad"&&x.topic===ad.topic);
   const complementary=model.complementaryScore(ad.topic,args.purchased||[]);
   const parts={
    comercial:1.5,
    afinidade:args.personalized?model.affinity(args.profile,ad.topic,args.phase||0)*.50:0,
    visita:args.personalized&&(args.viewed||[]).includes(ad.topic)?1.2:0,
    carrinho:args.personalized&&(args.cart||[]).includes(ad.topic)?3.3:0,
    complemento:args.personalized?complementary*4.2:0,
    novidade:firstExposure?3.4:0,
    campanha:isRet?1.45:ad.campaign==="pair"?1.6:0,
    saturacao:-recent.filter(x=>x.kind==="ad"&&x.topic===ad.topic).length*2.9,
    fadiga:-baseline.impressions*1.25,
    exploracao:hash("ad:"+ad.id)*.38
   };
   return {score:Object.values(parts).reduce((a,b)=>a+b,0),parts};
  }
  function chooseAd(args){
   const shown=args.shown||[],used=new Set(shown.map(x=>x.id));
   const purchased=args.purchased||[],phase=args.phase||0;
   const candidates=[];
   for(const topic of topics){
    if(purchased.includes(topic)||phase<(release[topic]||0))continue;
    const alreadyMain=used.has("ad-main-"+topic);
    const recentEnough=adSpacing(topic,args)>=6;
    const interest=model.affinity(args.profile,topic,phase);
    const known=(args.viewed||[]).includes(topic)||(args.cart||[]).includes(topic)||interest>=2.0;
    const paired=model.complementaryScore(topic,purchased)>.22;
    if(!alreadyMain)candidates.push({kind:"ad",id:"ad-main-"+topic,topic,retarget:false,campaign:"prospecting"});
    if(args.personalized&&alreadyMain&&recentEnough&&known&&!used.has("ad-ret-"+topic))
      candidates.push({kind:"ad",id:"ad-ret-"+topic,topic,retarget:true,campaign:"retarget"});
    if(args.personalized&&alreadyMain&&recentEnough&&paired&&!used.has("ad-pair-"+topic))
      candidates.push({kind:"ad",id:"ad-pair-"+topic,topic,retarget:true,campaign:"pair"});
   }
   if(!candidates.length)return null;
   if(!args.personalized){
    const mains=candidates.filter(x=>x.campaign==="prospecting");
    mains.sort((a,b)=>(release[a.topic]||0)-(release[b.topic]||0)||topics.indexOf(a.topic)-topics.indexOf(b.topic));
    return mains[0]||null;
   }
   candidates.sort((a,b)=>scoreAd(b,args).score-scoreAd(a,args).score
     ||topics.indexOf(a.topic)-topics.indexOf(b.topic)||a.id.localeCompare(b.id));
   return candidates[0];
  }
  function wantsAd(shown){
   const n=shown.length;
   if(n<3||shown.at(-1)?.kind==="ad")return false;
   const sinceLast=(()=>{
    for(let i=n-1;i>=0;i--)if(shown[i].kind==="ad")return n-i-1;
    return n;
   })();
   return sinceLast>=3;
  }
  function nextBatch(posts,opts,size=5){
   const args={...opts,phase:Math.max(0,opts.phase||0),shown:[...(opts.shown||[])],cart:opts.cart||[],viewed:opts.viewed||[],purchased:opts.purchased||[]};
   const result=[];
   for(let attempt=0;result.length<size&&attempt<size+10&&args.shown.length<MAX_FEED_ITEMS;attempt++){
    let picked=null;
    if(wantsAd(args.shown))picked=chooseAd(args);
    if(!picked){
     const post=choosePost(posts,args);
     if(post)picked={kind:"post",id:post.id,topic:post.topic,author:post.author};
    }
    if(!picked)break;
    args.shown.push(picked);result.push(picked);
   }
   return result;
  }
  function isDone(posts,shown){
   return shown.length>=MAX_FEED_ITEMS||posts.every(p=>shown.some(item=>item.kind==="post"&&item.id===p.id));
  }
  return Object.freeze({topics,release,MAX_FEED_ITEMS,scorePost,choosePost,scoreAd,chooseAd,nextBatch,isDone});
 })(root.NoFeedRecommender);
})(typeof window!=="undefined"?window:globalThis);
