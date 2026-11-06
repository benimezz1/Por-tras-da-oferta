/* Motor local de recomendacao explicavel do jogo No Feed.
 * Sinais ficticios -> interesses -> ranking -> novas exposicoes.
 * O sistema NAO tem acesso ao objetivo financeiro nem copia rankings proprietarios. */
(function (root) {
  root.NoFeedRecommender = (function () {
    "use strict";
    const topics = ["fone","tenis","plano","mochila","powerbank","garrafa","luminaria","ingresso"];
    const labels = {
      fone:"Audio e fones",tenis:"Moda e tenis",plano:"Musica e assinaturas",
      mochila:"Viagens e mochilas",powerbank:"Tecnologia e bateria",
      garrafa:"Hidratacao e rotina",luminaria:"Estudo e escritorio",ingresso:"Eventos e experiencias"
    };
    const related = {
      fone:{plano:.36,powerbank:.52,ingresso:.25},
      tenis:{ingresso:.36,garrafa:.28,mochila:.16},
      plano:{fone:.4,luminaria:.36,powerbank:.2},
      mochila:{garrafa:.58,powerbank:.32,ingresso:.24},
      powerbank:{fone:.5,mochila:.36,plano:.22},
      garrafa:{mochila:.52,tenis:.25},
      luminaria:{plano:.45,powerbank:.15},
      ingresso:{tenis:.34,fone:.38,mochila:.18}
    };
    const weights = {
      impression:.08,dwell:.55,story:1.35,like:2.6,unlike:-2.6,
      bookmark:3.15,unbookmark:-3.15,comments:1.4,search:3.25,
      product:3.0,adLike:1.55,cart:4.6,removeCart:-4.6,
      buy:2.4,skip:-3.5,less:-5.1
    };
    const once = new Set(["impression","dwell","story","comments","search","product","adLike","less"]);
    const cap = (n,min,max) => Math.min(max,Math.max(min,Number.isFinite(n)?n:0));
    const decay = (age) => Math.pow(.82,Math.max(0,age));
    const has = (obj,key) => Object.prototype.hasOwnProperty.call(obj,key);
    const countEvents = 450, countImpressions = 420, maxPhase = 15;
    function emptyProfile() { return {version:2,events:[],impressions:{}}; }
    function normalize(raw) {
      const p=emptyProfile();
      if(!raw || typeof raw!=="object")return p;
      if(Array.isArray(raw.events))p.events=raw.events.filter(e=>
        e && topics.includes(e.topic) && has(weights,e.type)
        && Number.isInteger(e.phase) && e.phase>=0 && e.phase<=maxPhase
      ).slice(-countEvents).map(e=>({
        type:e.type,topic:e.topic,author:String(e.author||"").slice(0,40),
        id:String(e.id||"").slice(0,100),phase:e.phase
      }));
      if(raw.impressions && typeof raw.impressions==="object" && !Array.isArray(raw.impressions)){
        for(const [key,value] of Object.entries(raw.impressions).slice(-countImpressions)){
          if(/^(?:[0-9]|1[0-5]):[a-z0-9-]{1,100}$/i.test(key) && value===true)p.impressions[key]=true;
        }
      }
      return p;
    }
    function record(profile,event){
      if(!profile || !Array.isArray(profile.events) || !event
        || !topics.includes(event.topic) || !has(weights,event.type))return false;
      const phase=Number(event.phase),type=event.type,id=String(event.id||"").slice(0,100);
      if(!Number.isInteger(phase)||phase<0||phase>maxPhase)return false;
      if(once.has(type) && profile.events.some(e=>e.type===type&&e.phase===phase&&e.id===id))return false;
      if(type==="impression"){
        const key=phase+":"+id;
        if(profile.impressions[key])return false;
        profile.impressions[key]=true;
        const all=Object.keys(profile.impressions);
        if(all.length>countImpressions)delete profile.impressions[all[0]];
      }
      profile.events.push({type,topic:event.topic,id,author:String(event.author||"").slice(0,40),phase});
      if(profile.events.length>countEvents)profile.events.splice(0,profile.events.length-countEvents);
      return true;
    }
    /* "Mostrar menos" perde força rápido (metade a cada época): a plataforma
     * registra o pedido, mas o tema volta logo. */
    const decayFor = (type,age) => type==="less"?Math.pow(.5,Math.max(0,age)):decay(age);
    function directAffinity(profile,topic,phase){
      return cap((profile?.events||[]).reduce((sum,e)=>
        e.topic===topic&&e.phase<=phase?sum+weights[e.type]*decayFor(e.type,phase-e.phase):sum,0),-11,17);
    }
    /* Retenção: só sinais de atenção (tempo olhando, stories, curtidas, comentários).
     * Mede o que prende o jogador na tela, não o que ele quer comprar. */
    const attentionTypes = new Set(["impression","dwell","story","like","bookmark","comments"]);
    function engagement(profile,topic,phase){
      return cap((profile?.events||[]).reduce((sum,e)=>
        e.topic===topic&&e.phase<=phase&&attentionTypes.has(e.type)?sum+weights[e.type]*decay(phase-e.phase):sum,0),0,12);
    }
    function affinity(profile,topic,phase){
      if(!topics.includes(topic))return 0;
      const direct=directAffinity(profile,topic,phase);
      const neighbors=Object.entries(related);
      const transferred=neighbors.reduce((sum,[from,edges])=>
        sum+(edges[topic]||0)*Math.max(0,directAffinity(profile,from,phase))*.38,0);
      return cap(direct+transferred,-11,17);
    }
    function authorAffinity(profile,author,phase){
      if(!author)return 0;
      return cap((profile?.events||[]).reduce((sum,e)=>
        e.author===author&&e.phase<=phase?sum+weights[e.type]*decay(phase-e.phase):sum,0),-7,9);
    }
    function exposureCount(profile,id){
      return Object.keys(profile?.impressions||{}).reduce((n,key)=>
        n+(key.endsWith(":"+id)?1:0),0);
    }
    function stableNumber(text){
      let h=2166136261>>>0;
      for(const ch of String(text))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;
      return h;
    }
    function scorePost(item,opts){
      const phase=opts.phase||0,age=Math.max(0,phase-(item.phase||0));
      const history=opts.recent||[];
      const parts={
        atualidade:cap(3.3-age*.25,.5,3.3),
        popularidade:cap(Math.log10(1+(item.likes||0))*.29,0,1.2),
        proximidade:item.source==="friend"?.65:.35,
        interesse:opts.personalized?cap(affinity(opts.profile,item.topic,phase)*.55,-5,7):0,
        criador:opts.personalized?cap(authorAffinity(opts.profile,item.author,phase)*.28,-2,2.5):0,
        exploracao:opts.personalized?(stableNumber("post:"+item.id)%19)/19*.6:0,
        diversidade:history.some(x=>x.topic===item.topic)?-1.25:0,
        autorRepetido:history.at(-1)?.author===item.author?-1.15:0,
        repeticao:opts.personalized?-exposureCount(opts.profile,item.id)*.75:0
      };
      return {score:Object.values(parts).reduce((a,b)=>a+b,0),parts};
    }
    function rankPosts(items,opts){
      const phase=opts.phase||0,eligible=items.filter(p=>(p.phase||0)<=phase);
      if(!opts.personalized || (phase===0&&!opts.profile?.events?.length))
        return [...eligible].sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
      const remaining=[...eligible],out=[];
      while(remaining.length){
        const recent=out.slice(-3);
        remaining.sort((a,b)=>scorePost(b,{...opts,recent}).score-scorePost(a,{...opts,recent}).score
          ||a.order-b.order||a.id.localeCompare(b.id));
        out.push(remaining.shift());
      }
      return out;
    }
    function rankStories(items,opts){
      if(!opts.personalized||!opts.profile?.events?.length)return [...items];
      return [...items].sort((a,b)=>{
        const score=s=>authorAffinity(opts.profile,s.user,opts.phase)*.32
          +affinity(opts.profile,s.product,opts.phase)*.24+(s.source==="friend"?.5:.15);
        return score(b)-score(a)||a.idx-b.idx;
      });
    }
    function complementaryScore(topic,purchased){
      return (purchased||[]).reduce((sum,id)=>sum+(related[id]?.[topic]||0),0);
    }
    function scoreAd(topic,opts={}){
      const profile=opts.profile||emptyProfile(),phase=opts.phase||0;
      const personalized=opts.personalized!==false,purchased=opts.purchased||[];
      const interest=affinity(profile,topic,phase),inCart=(opts.cart||[]).includes(topic);
      const viewed=(opts.viewed||[]).includes(topic);
      const impressions=exposureCount(profile,"ad-main-"+topic)
        +exposureCount(profile,"ad-ret-"+topic)+exposureCount(profile,"ad-pair-"+topic);
      const parts={
        relevanciaComercial:1.4,
        interesse:personalized?interest*.59:0,
        interesseRelacionado:personalized?complementaryScore(topic,purchased)*4.1:0,
        carrinho:personalized&&inCart?3.5:0,
        visita:personalized&&viewed?1.7:0,
        fadiga:-impressions*1.7
      };
      return {score:Object.values(parts).reduce((a,b)=>a+b,0),parts,interest,impressions};
    }
    function pickRetarget(opts){
      if(!opts.personalized||opts.phase<1)return null;
      const candidates=topics.filter(t=>t!==opts.current&&!(opts.purchased||[]).includes(t))
        .map(topic=>({topic,...scoreAd(topic,opts)}))
        .filter(x=>exposureCount(opts.profile,"ad-ret-"+x.topic)<2
          &&(x.interest>1.1||(opts.cart||[]).includes(x.topic)))
        .sort((a,b)=>b.score-a.score||topics.indexOf(a.topic)-topics.indexOf(b.topic));
      return candidates[0]&&candidates[0].score>2.2?candidates[0]:null;
    }
    function summary(profile,phase){
      const affinities=Object.fromEntries(topics.map(t=>[t,affinity(profile,t,phase)]));
      const eventCounts={};
      for(const event of profile?.events||[])eventCounts[event.type]=(eventCounts[event.type]||0)+1;
      return {
        events:profile?.events?.length||0,affinities,eventCounts,
        topTopics:[...topics].sort((a,b)=>affinities[b]-affinities[a]||topics.indexOf(a)-topics.indexOf(b)).slice(0,4),
        last:(profile?.events||[]).slice(-8)
      };
    }
    return Object.freeze({
      topics,labels,related,weights,emptyProfile,normalize,record,affinity,directAffinity,engagement,
      authorAffinity,exposureCount,stableNumber,scorePost,rankPosts,rankStories,
      complementaryScore,scoreAd,pickRetarget,summary
    });
  })();
})(typeof window!=="undefined"?window:globalThis);
