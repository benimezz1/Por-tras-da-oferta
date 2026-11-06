/* Motor de pressão comercial do "Por Trás da Oferta" (C4).
 * Funções puras e deterministas: preços, parcelamento, cupons, cronômetros que
 * reiniciam, estoque que nunca acaba, prova social, humor ("vibe"), registro de
 * exposição às estratégias e análise final. Nada aqui conhece pessoas reais. */
(function(root){
 "use strict";
 const round=n=>Math.round((Number(n)||0)*100)/100;
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
 function hash(text){
  let h=2166136261;
  for(const ch of String(text))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;
  return h;
 }

 /* As dez estratégias estudadas no relatório C3, com a evidência citada,
  * e cinco mecanismos de retenção que o feed usa para prender a atenção. */
 const STRATEGIES={
  urgencia:{icon:"⏱️",name:"Urgência",short:"Cronômetros e “só hoje” reduzem o tempo para pensar.",
   research:"A psicóloga entrevistada liga prazos curtos à sensação de perda e à redução do tempo para avaliar. Mathur et al. (2019) encontraram cronômetros falsos que reiniciavam em lojas reais."},
  escassez:{icon:"📦",name:"Escassez",short:"“Restam 3 unidades” faz o produto parecer mais valioso.",
   research:"Feng et al. (2024), com 837 adultos em transmissões ao vivo, mostraram que a persuasão por escassez altera o processo de compra impulsiva."},
  prova_social:{icon:"👥",name:"Prova social",short:"Vendas, avaliações e amigos que compraram passam confiança.",
   research:"Huang et al. (2025) relacionaram sinais de prova social em vídeos curtos à compra por impulso."},
  influencia:{icon:"🤳",name:"Influenciadores",short:"A publi parece conselho de amiga, não anúncio.",
   research:"Shamim, Azam e Islam (2024) ligaram confiança em influenciadores à vontade de comprar por impulso; De Jans et al. (2020) viram adolescentes preferirem marcas divulgadas por influenciadores."},
  personalizacao:{icon:"🎯",name:"Personalização",short:"O anúncio aparece porque o feed aprendeu com seus cliques.",
   research:"Setyani et al. (2019): anúncios personalizados aumentam o valor percebido e a intenção de compra impulsiva. 65% dos adolescentes da TIC Kids Online 2025 notam mais anúncios depois de pesquisar algo."},
  fomo:{icon:"😰",name:"FOMO",short:"Medo de ficar de fora do grupo ou do evento.",
   research:"Dinh e Lee (2024) relacionaram influenciadores, comparação social e FOMO ao consumo conspícuo. A entrevista destaca o peso do pertencimento na adolescência."},
  preco:{icon:"🏷️",name:"Âncora de preço e parcelamento",short:"O preço “de” riscado e a parcela pequena escondem o custo real.",
   research:"Bandyopadhyay et al. (2021) mostram que promoções imediatas aumentam o impulso; Prelec e Simester (2001) mostraram que pagar com cartão aumenta a disposição a pagar."},
  dark_patterns:{icon:"🕳️",name:"Padrões obscuros",short:"Opções pré-marcadas, taxas tardias e frases que culpam quem recusa.",
   research:"A OCDE (2022) descreve “dark commercial patterns”: opções pré-selecionadas, custos apresentados tardiamente, falsa urgência e dificuldade para cancelar."},
  recompensa:{icon:"🎰",name:"Recompensa imediata",short:"Roletas, moedas e sequências transformam comprar em jogo.",
   research:"Bandyopadhyay et al. (2021): recompensas imediatas pesam mais que recompensas adiadas na compra por impulso."},
  emocao:{icon:"💔",name:"Gatilho emocional",short:"A oferta chega quando você está cansado, triste ou entediado.",
   research:"A psicóloga entrevistada relaciona compras impulsivas a regulação emocional, autoestima e cansaço; Iyer et al. (2020) incluem humor e autocontrole entre os determinantes do impulso."},
  rolagem_infinita:{icon:"♾️",name:"Rolagem infinita",short:"O feed nunca acaba e esconde o botão de parar.",
   research:"A rolagem infinita remove os pontos naturais de parada de uma página. Aza Raskin, criador do recurso, passou a criticá-lo publicamente pelo tempo de tela que ele provoca."},
  recompensa_variavel:{icon:"🎲",name:"Recompensa variável",short:"Às vezes vem surpresa, às vezes não: por isso você continua rolando.",
   research:"Skinner mostrou que recompensas imprevisíveis mantêm um comportamento por mais tempo do que recompensas fixas; Eyal (2014) descreve o mesmo princípio em aplicativos que formam hábito."},
  gancho_saida:{icon:"🪝",name:"Gancho de saída",short:"Quando você tenta sair, aparece algo “imperdível”.",
   research:"A OCDE (2022) inclui a insistência (nagging) e as interrupções que dificultam sair entre os padrões comerciais obscuros."},
  validacao_social:{icon:"❤️",name:"Validação social",short:"Curtidas chegam aos poucos e valem mais quando você tem o produto da moda.",
   research:"A entrevista com a psicóloga destaca o peso da autoestima e da comparação social na adolescência; Dinh e Lee (2024) relacionam comparação social ao consumo para ser visto."},
  personalizacao_dificil:{icon:"🔒",name:"Controle de fachada",short:"“Mostrar menos” e desligar a personalização quase não mudam nada.",
   research:"A OCDE (2022) descreve a obstrução: caminhos difíceis para recusar, cancelar ou mudar configurações que favorecem a plataforma."}
 };
 const KEYS=Object.keys(STRATEGIES);

 /* ---------- registro de exposição e influência ---------- */
 function emptyLedger(){
  return {exposed:Object.fromEntries(KEYS.map(k=>[k,0])),moments:Object.fromEntries(KEYS.map(k=>[k,[]])),influenced:Object.fromEntries(KEYS.map(k=>[k,[]]))};
 }
 function normalizeLedger(raw){
  const base=emptyLedger();
  if(!raw||typeof raw!=="object")return base;
  for(const k of KEYS){
   base.exposed[k]=Math.max(0,Math.floor(Number(raw.exposed?.[k])||0));
   base.moments[k]=Array.isArray(raw.moments?.[k])?raw.moments[k].filter(x=>typeof x==="string").slice(-8):[];
   base.influenced[k]=Array.isArray(raw.influenced?.[k])?raw.influenced[k].filter(x=>typeof x==="string").slice(-8):[];
  }
  return base;
 }
 function expose(ledger,key,moment){
  if(!ledger||!STRATEGIES[key])return false;
  ledger.exposed[key]++;
  if(moment&&!ledger.moments[key].includes(moment)){
   ledger.moments[key].push(String(moment).slice(0,160));
   if(ledger.moments[key].length>8)ledger.moments[key].shift();
  }
  return true;
 }
 function influence(ledger,key,action){
  if(!ledger||!STRATEGIES[key]||!action)return false;
  const text=String(action).slice(0,160);
  if(ledger.influenced[key].includes(text))return false;
  ledger.influenced[key].push(text);
  if(ledger.influenced[key].length>8)ledger.influenced[key].shift();
  return true;
 }

 /* ---------- preço, parcelamento e checkout ---------- */
 const FEES={freeShippingFrom:199,shipping:24.9,service:4.9,pixDiscount:.05,cardRate:.0349,protectionRate:.12,ticketFee:.15};
 function installment(price,n,rate=0){
  price=round(price);n=Math.max(1,Math.floor(n));
  if(!rate||n===1)return {n,each:round(price/n),total:price,interest:0,rate:0};
  const each=price*rate/(1-Math.pow(1+rate,-n));
  const total=round(each*n);
  return {n,each:round(each),total,interest:round(total-price),rate};
 }
 function protectionPrice(price){return round(Math.max(9.9,price*FEES.protectionRate));}
 function couponDiscount(coupon,subtotal){
  if(!coupon||subtotal<(coupon.min||0))return 0;
  const raw=coupon.kind==="pct"?subtotal*coupon.amount/100:coupon.amount;
  return round(Math.min(raw,subtotal));
 }
 function bestCoupon(coupons,subtotal,day,topics){
  const usable=(coupons||[]).filter(c=>!c.used&&(c.expiresDay||9)>=day&&(!c.only||(topics||[]).some(t=>c.only.includes(t))));
  let best=null,value=0;
  for(const c of usable){const v=couponDiscount(c,subtotal);if(v>value){best=c;value=v;}}
  return {coupon:best,value};
 }
 /* lines: [{id,price,protection:boolean,extra:number,ticket:boolean}] */
 function quote(opts){
  const lines=opts.lines||[];
  const subtotal=round(lines.reduce((s,l)=>s+l.price+(l.extra||0),0));
  const protection=round(lines.reduce((s,l)=>s+(l.protection?protectionPrice(l.price):0),0));
  const physical=lines.some(l=>l.physical);
  const shipping=physical&&subtotal<FEES.freeShippingFrom&&!opts.freeShipping?FEES.shipping:0;
  const ticketFee=round(lines.reduce((s,l)=>s+(l.ticket?l.price*FEES.ticketFee:0),0));
  const service=lines.length?FEES.service:0;
  const couponValue=opts.coupon?couponDiscount(opts.coupon,subtotal):0;
  const coins=round(Math.min(opts.coins||0,Math.max(0,subtotal-couponValue)*.2));
  const gross=round(subtotal+protection+shipping+service+ticketFee-couponValue-coins);
  const method=opts.method||"pix";
  const pixDiscount=method==="pix"?round(gross*FEES.pixDiscount):0;
  const total=round(gross-pixDiscount);
  const n=method==="card3"?3:method==="card10"?10:1;
  const plan=installment(total,n,method==="card10"?FEES.cardRate:0);
  return {subtotal,protection,shipping,service,ticketFee,couponValue,coins,pixDiscount,total,
   method,n,each:plan.each,totalPaid:plan.total,interest:plan.interest,missingForFreeShipping:physical&&shipping?round(FEES.freeShippingFrom-subtotal):0};
 }

 /* ---------- cronômetro que reinicia e estoque que não acaba ---------- */
 const TIMER_MS=10*60*1000;
 function visitTimer(timers,id,now){
  const entry=timers[id];
  if(!entry){timers[id]={start:now,resets:0,visits:1};return timers[id];}
  entry.visits=(entry.visits||1)+1;
  entry.resets=(entry.resets||0)+1; /* volta a 09:59 a cada visita */
  entry.start=now;
  return entry;
 }
 function timerLeft(entry,now){
  if(!entry)return TIMER_MS;
  const left=TIMER_MS-((now-entry.start)%TIMER_MS);
  return clamp(left,0,TIMER_MS);
 }
 function formatClock(ms){
  const s=Math.max(0,Math.floor(ms/1000));
  const h=Math.floor(s/3600),m=Math.floor(s%3600/60),sec=s%60;
  const two=x=>String(x).padStart(2,"0");
  return h?`${two(h)}:${two(m)}:${two(sec)}`:`${two(m)}:${two(sec)}`;
 }
 function visitStock(stock,id){
  if(!Number.isFinite(stock[id]))stock[id]=3+(hash("stock:"+id)%3);
  else stock[id]=Math.max(2,stock[id]-1); /* nunca esgota */
  return stock[id];
 }
 function viewers(id,tick){return 17+((hash("v:"+id)+Math.floor(tick||0)*7)%31);}
 function soldToday(id,day){return 600+(hash("s:"+id+":"+day)%1400);}
 function rating(id){const r=hash("r:"+id);return {stars:(47+(r%3))/10,count:900+(r%2600)};}

 /* ---------- vibe: humor que a plataforma mede e explora ---------- */
 function emptyVibe(){return {value:64,afterglow:0,step:0,log:[{x:0,v:64,tag:"start",label:"Início"}]};}
 function normalizeVibe(raw){
  const v=emptyVibe();
  if(!raw||typeof raw!=="object")return v;
  v.value=clamp(Number(raw.value),0,100);
  v.afterglow=clamp(Number(raw.afterglow),0,100);
  v.step=Math.max(0,Math.floor(Number(raw.step)||0));
  v.log=Array.isArray(raw.log)?raw.log.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.v)).slice(-160):v.log;
  return v;
 }
 function vibeChange(vibe,delta,tag,label){
  vibe.value=round(clamp(vibe.value+delta,4,100));
  vibe.log.push({x:vibe.step,v:vibe.value,tag:tag||"",label:label||""});
  if(vibe.log.length>160)vibe.log.shift();
  return vibe.value;
 }
 /* cada conteúdo rolado: tédio leve; depois de uma compra, a empolgação some rápido */
 function vibeTick(vibe){
  vibe.step++;
  let drop=.55;
  if(vibe.afterglow>0){const fade=Math.min(vibe.afterglow,4.5);vibe.afterglow=round(vibe.afterglow-fade);drop+=fade;}
  return vibeChange(vibe,-drop,"tick","");
 }
 function vibeBuy(vibe,amount,label){
  vibe.afterglow=round(vibe.afterglow+amount*.95);
  return vibeChange(vibe,amount,"buy",label);
 }
 function vibeMood(value){
  if(value>=72)return {emoji:"🤩",label:"Radiante"};
  if(value>=55)return {emoji:"🙂",label:"De boa"};
  if(value>=38)return {emoji:"😕",label:"Meio pra baixo"};
  return {emoji:"😞",label:"Pra baixo"};
 }

 /* ---------- fechamento: fatura, viagem e perfil ---------- */
 function settle(s){
  const wallet=round(s.wallet);
  const charges=(s.invoice||[]);
  const dueNow=round(charges.reduce((sum,c)=>sum+(c.dueNow||0),0));
  const future=round(charges.reduce((sum,c)=>sum+(c.future||0),0));
  const monthly=round((s.subscriptions||[]).filter(x=>x.active).reduce((sum,x)=>sum+x.monthly,0));
  const subscriptionDue=round((s.subscriptions||[]).filter(x=>x.active).reduce((sum,x)=>sum+x.monthly,0));
  const finalBalance=round(wallet-dueNow-subscriptionDue);
  const spent=round(620-wallet+dueNow+future+subscriptionDue);
  const tripPaid=finalBalance>=s.goal;
  return {wallet,dueNow,future,monthly,subscriptionDue,finalBalance,spent,tripPaid,missing:tripPaid?0:round(s.goal-finalBalance),interest:round(charges.reduce((sum,c)=>sum+(c.interest||0),0))};
 }
 function profile(ledger){
  return KEYS.map(key=>{
   const exposed=ledger.exposed[key]||0,inf=ledger.influenced[key]||[];
   return {key,...STRATEGIES[key],exposed,influenced:inf.length,actions:inf,moments:ledger.moments[key]||[],score:inf.length*3+Math.min(exposed,8)*.25};
  }).sort((a,b)=>b.score-a.score||b.exposed-a.exposed||KEYS.indexOf(a.key)-KEYS.indexOf(b.key));
 }

 /* ---------- quiz de reconhecimento ---------- */
 const QUIZ_BANK={
  urgencia:"“⚡ Oferta relâmpago: termina em 09:59” — e ao voltar para a página o cronômetro recomeçou.",
  escassez:"“Restam só 3 unidades!” — e o número nunca chegou a zero.",
  prova_social:"“1.284 vendidos hoje · bia.m e mais 12 amigos compraram.”",
  influencia:"Na live, a Lívia diz: “gente, é o tênis que eu mais uso, juro”, com cupom só para quem está assistindo.",
  personalizacao:"“Escolhido para você · combina com o que você curtiu.”",
  fomo:"No grupo: “só falta você comprar o ingresso 👀”.",
  preco:"“De R$ 399,90 por R$ 159,90 — ou 10x de R$ 19,35.” Na segunda, o mesmo produto era “de R$ 279,90”.",
  dark_patterns:"No checkout, a “Proteção Pulso+” já vinha marcada e o botão de recusa dizia “Não, prefiro pagar mais caro”.",
  recompensa:"“Gire a roleta! Prêmio garantido” — e a seta parou do lado do prêmio maior.",
  emocao:"23h12: “Dia puxado? Você merece um mimo 💜”, logo depois de você ver fotos que baixaram sua vibe.",
  rolagem_infinita:"Os 7 posts do dia acabaram, mas o feed continuou com “Sugerido para você” e o botão de dormir sumiu num menu.",
  recompensa_variavel:"Você puxou para atualizar: uma vez vieram posts novos, na outra “nada novo ainda”, e você tentou de novo.",
  gancho_saida:"Você foi encerrar o dia e apareceu: “📸 a Bia postou uma foto com você, ver agora?”.",
  validacao_social:"Seu post rendeu poucas curtidas, e o app avisou que posts com o tênis da moda rendem 3x mais.",
  personalizacao_dificil:"Você clicou em “Mostrar menos”, mas o mesmo tema voltou poucos posts depois por um assunto “parecido”."
 };
 function quiz(ledger,count=5){
  const ranked=profile(ledger);
  const chosen=ranked.filter(x=>x.exposed>0).slice(0,count).map(x=>x.key);
  for(const k of KEYS){if(chosen.length>=count)break;if(!chosen.includes(k))chosen.push(k);}
  return chosen.map((answer,i)=>{
   const others=KEYS.filter(k=>k!==answer).sort((a,b)=>hash(answer+a)-hash(answer+b)).slice(0,2);
   const options=[answer,...others].sort((a,b)=>hash(i+":"+a)-hash(i+":"+b));
   return {id:"q"+i,answer,prompt:QUIZ_BANK[answer],options};
  });
 }

 root.PorTrasPressure=Object.freeze({STRATEGIES,KEYS,FEES,TIMER_MS,hash,round,emptyLedger,normalizeLedger,expose,influence,
  installment,protectionPrice,couponDiscount,bestCoupon,quote,visitTimer,timerLeft,formatClock,visitStock,viewers,soldToday,rating,
  emptyVibe,normalizeVibe,vibeChange,vibeTick,vibeBuy,vibeMood,settle,profile,quiz,QUIZ_BANK});
})(typeof window!=="undefined"?window:globalThis);
