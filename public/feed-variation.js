/* Camada de variedade e cronologia v5, ANTES do futuro algoritmo.
 * Nao usa dados pessoais, consumo real, rastreamento nem IA.
 * Seed por partida/dia: ordem diferente entre jogadores, estavel ao recarregar.
 * Todo conteudo conserva seu ID e nao retorna em outro dia sem autorizacao.
 */
(function(root){"use strict";
const normalized=v=>String(v==null?"":v);
function hash(text){
 let h=2166136261>>>0;
 for(let i=0;i<normalized(text).length;i++)
  h=Math.imul(h^normalized(text).charCodeAt(i),16777619)>>>0;
 h^=h>>>16;h=Math.imul(h,0x85ebca6b)>>>0;
 h^=h>>>13;h=Math.imul(h,0xc2b2ae35)>>>0;
 return (h^(h>>>16))>>>0;
}
const order=(runId,day,id,scope="feed")=>hash([runId,day,scope,id].join("|"));
function isEligible(item,day){
 if(!item||!Number.isInteger(day)||day<1||day>5)return false;
 if(Number.isInteger(item.day)&&item.day!==day)return false;
 const m=item.metadata||{};
 if(Number.isInteger(m.availableFrom)&&day<m.availableFrom)return false;
 if(Number.isInteger(m.availableUntil)&&day>m.availableUntil)return false;
 if(Number.isInteger(m.eventOccurredDay)&&day<m.eventOccurredDay)return false;
 if(m.narrative==="viagem_ja_ocorreu"&&day<6)return false;
 return true;
}
function varyPosts(items,options){
 const runId=normalized(options?.runId||"demo"),day=Number(options?.day)||1;
 return (items||[]).filter(p=>isEligible(p,day))
  .map(p=>({...p,order:order(runId,day,p.id)}));
}
function varyStories(items,options){
 const runId=normalized(options?.runId||"demo"),day=Number(options?.day)||1;
 return (items||[]).filter(p=>isEligible(p,day))
  .sort((a,b)=>order(runId,day,a.user+":"+a.idx,"story")-order(runId,day,b.user+":"+b.idx,"story"));
}
function distinctAuthorPhoto(post,options,dayPosts){
 const who=normalized(post?.who||post?.author).replace(/^@/,"");
 if(!["bia.m","gabi.n"].includes(who)||post.contentVersion===5)return post.photo;
 const day=options?.day||1,runId=normalized(options?.runId||"demo");
 const catalog=root.NoFeedLibraryV5;
 if(!catalog)return post.photo;
 // Fotos do tema certo; evitar fotos que sugiram evento de sabado ja realizado.
 const suitable={fone:["music"],tenis:["fashion","friends"],plano:["study"],
    mochila:["friends","city"],powerbank:["tech","study"],garrafa:["food","fitness"],
    luminaria:["study"],ingresso:["friends","music"]};
 const allowedKinds=suitable[post.topic]||[];
 const keys=catalog.photoRecords.filter(x=>x.day<=day&&allowedKinds.includes(x.kind)
    &&!(x.kind==="music"&&[1179581,38125616,12657546,35555156,35777520,35777518].includes(x.pexels)&&day<5))
    .map(x=>x.key);
 if(!keys.length)return post.photo;
 const same=(dayPosts||[]).filter(x=>
  normalized(x.who||x.author).replace(/^@/,"")===who&&x.contentVersion!==5
 ).map(x=>x.id).sort();
 const index=Math.max(0,same.indexOf(post.id));
 const start=hash(runId+":"+day+":"+who)%keys.length;
 // Permutacao por partida: as varias fotos do mesmo autor nao se repetem no dia.
 const shuffled=[...keys].sort((a,b)=>order(runId,day,a,"author-photo")-order(runId,day,b,"author-photo"));
 return shuffled[(start+index)%shuffled.length]||post.photo;
}
function taggedPhoto(day,runId){
 const catalog=root.NoFeedLibraryV5,options=catalog?.taggedPools?.[day];
 if(!options?.length)return null;
 const idx=hash(runId+":tag:"+day)%options.length;
 let choice=options[idx];
 if(day===5){
  const monday=taggedPhoto(1,runId);
  if(choice===monday)choice=options[(idx+1)%options.length];
 }
 return choice;
}
/* Contrato para a etapa futura: substituir apenas a classificacao, nao os dados.
 * scorePost/scoreAd existentes continuam como prototipo. */
const FUTURE_RANKING_INTERFACE=Object.freeze({
 item:["id","topic","author","source","day","photo","metadata","likes"],
 metadata:["kind","category","tags","availableFrom","availableUntil","narrative",
  "priorityBase","exposureCap","proofSocial","fomo","author"],
 context:["runId","day","shownPostIds","recentTopics","recentAuthors","signals"],
 output:["postId","rank","reasons"],
 invariants:["sameRunSameSequence","noFutureEvents","noRepeatedPosts","noPrivateUserData"]
});
root.NoFeedVariation=Object.freeze({hash,order,isEligible,varyPosts,varyStories,distinctAuthorPhoto,taggedPhoto,FUTURE_RANKING_INTERFACE,version:5});
})(typeof window!=="undefined"?window:globalThis);
