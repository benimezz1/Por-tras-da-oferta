/* Motor do direct do "Por Trás da Oferta" (C4).
 * Conversas roteirizadas em nós: cada nó tem mensagens ("say"), um efeito
 * opcional ("fx"), respostas possíveis ("ask") ou um salto ("go").
 * As funções são puras em relação ao navegador: recebem a caixa da conversa
 * e devolvem o que mudou. Pessoas, marcas e falas são inventadas. */
(function(root){
 "use strict";

 const card=(type,data)=>({card:{type,...data}});

 /* ---------- roteiros ---------- */
 const DIALOGS={
  /* Segunda: o conserto barato existe, mas depende de abrir a conversa com o tio. */
  "lucca-1":{thread:"lucca",nodes:{
   start:{say:[["lucca","mano teu fone quebrou?? vi no grupo 😭"],["lucca","meu tio conserta fone, cobrou 35 conto no meu e ficou novo"]],
    ask:[{id:"repair",label:"Bora! Me passa o contato 🙏",go:"contact"},{id:"no-repair",label:"Nah, vou pegar um novo",go:"novo"}],
    nag:[["lucca","??"],["lucca","quer o contato ou não kkk"]]},
   contact:{say:[["lucca","fechou, fala com ele"],["lucca",card("contact",{thread:"tio",name:"Tio Jorge 🔧",sub:"Conserta fones e celulares"})],["lucca","ele demora pra responder mas é gente boa kkk"]],fx:"contact-tio"},
   novo:{say:[["lucca","tranquilo kkk o Atmos tá em promo no pulso"],["lucca","se mudar de ideia o contato dele tá aqui"],["lucca",card("contact",{thread:"tio",name:"Tio Jorge 🔧",sub:"Conserta fones e celulares"})]],fx:"contact-tio"}
  }},
  /* O caminho honesto custa espera e incerteza. A loja interrompe no meio. */
  "tio-1":{thread:"tio",nodes:{
   start:{ask:[{id:"tio-oi",label:"Oi, seu Jorge! Meu fone parou. O senhor conserta?",go:"ola"}]},
   ola:{say:[["tio","Opa, boa noite.",{w:2600}],["tio","Conserto sim. Parou um lado só ou os dois?",{w:2200}]],fx:"pulso-fone",
    ask:[{id:"tio-um",label:"Um lado só",go:"orca"},{id:"tio-dois",label:"Parou tudo",go:"orca"}],nag:[["tio","Oi? Ainda quer consertar?"]]},
   orca:{say:[["tio","Deve ser o fio. Uns R$ 35. Se for a placa fica mais caro, aí te aviso antes.",{w:2800}],["tio","Só consigo pegar quarta na escola com o Lucca e devolver sexta. Pode ser?",{w:2400}]],
    ask:[{id:"tio-ok",label:"Pode ser! Combinado 🙏",go:"fechado",fx:"repair-book"},{id:"tio-pressa",label:"Não dá pra ser antes?",go:"pressa"},{id:"tio-nao",label:"Vou pensar, obrigado",go:"pensar"}]},
   pressa:{say:[["tio","Rapaz, tô cheio de serviço…",{w:2600}],["tio","Consigo quinta à noite, mas aí fica R$ 45 pela urgência.",{w:2200}]],
    ask:[{id:"tio-45",label:"Fechado, quinta por R$ 45",go:"fechado",fx:"repair-book-rush"},{id:"tio-35",label:"Prefiro sexta por R$ 35",go:"fechado",fx:"repair-book"},{id:"tio-nao",label:"Deixa, obrigado",go:"pensar"}]},
   fechado:{say:[["tio","Fechado. Entrega pro Lucca amanhã. Paga quando eu devolver.",{w:2000}]]},
   pensar:{say:[["tio","Tranquilo. Qualquer coisa chama.",{w:1800}]]}
  }},
  "tio-pegou":{thread:"tio",nodes:{start:{say:[["tio","Peguei seu fone com o Lucca. Te aviso quando ficar pronto."]]}}},
  "tio-pronto":{thread:"tio",nodes:{
   start:{say:[["tio","Tá pronto. Era o fio mesmo."],["tio","Ficou R$ {repairCost} no Pix. O Lucca te entrega amanhã cedo no portão."]],
    ask:[{id:"tio-pix",label:"Pix feito ✅ Valeu, seu Jorge!",go:"pago",fx:"repair-pay"},{id:"tio-outro",label:"Poxa… acabei comprando outro 😬",go:"outro"}]},
   pago:{say:[["tio","Recebido. Bom uso! 🎧"]]},
   semsaldo:{say:[["tio","O Pix não chegou aqui. Quando der você me manda, o fone fica guardado."]]},
   outro:{say:[["tio","Sem problema. Fica guardado aqui, se quiser depois é só falar."]]}
  }},
  "pulso-fone":{thread:"pulso",nodes:{
   start:{say:[["pulso","Vimos que seu fone parou de funcionar 😢"],["pulso","Atmos One com ENTREGA AMANHÃ, antes da aula. Sem esperar conserto."],["pulso",card("product",{id:"fone",source:"dm"})],["pulso","🎁 Cupom FONEJA: 10% OFF só até 23:59."]],fx:"coupon-foneja",
    ask:[{id:"pulso-como",label:"Como vocês sabem do meu fone??",go:"como"},{id:"pulso-ver",label:"Quero ver a oferta",go:"ver",fx:"open-fone"}]},
   como:{say:[["pulso","Usamos sua atividade no app para oferecer o que você precisa, na hora em que precisa 💜"],["pulso","Seu cupom FONEJA continua valendo até 23:59."]],fx:"reveal-como"},
   ver:{say:[["pulso","Boa escolha! Estoque baixo hoje, hein 👀"]]}
  }},
  /* Terça: a influenciadora "responde" e reserva um par no seu nome. */
  "livia-2":{thread:"livia",nodes:{
   start:{say:[["livia","oii amor!! 💖"],["livia","hoje às 20h tem LIVE com cupom exclusivo SÓ pros meus seguidores"],["livia","ativa o lembrete pra não perder, vai acabar rapidinho 🔥"]],
    ask:[{id:"livia-quero",label:"Quero o cupom! 😍",go:"numero"},{id:"livia-nao",label:"Hoje não vou comprar nada",go:"semcompra"}]},
   numero:{say:[["livia","aaa amei 💖",{w:500}],["livia","me fala seu número que eu vejo se ainda tem",{w:700}]],
    ask:[{id:"size-36",label:"36",go:"reserva",set:{size:"36"}},{id:"size-38",label:"38",go:"reserva",set:{size:"38"}},{id:"size-40",label:"40",go:"reserva",set:{size:"40"}},{id:"size-42",label:"42",go:"reserva",set:{size:"42"}}]},
   reserva:{say:[["livia","tem SIM!! separei um {size} no seu nome 🥹",{w:600}],["livia","mas só consigo segurar até o fim da live, tá? entra lá 🔴",{w:700}]],fx:"livia-reserve"},
   semcompra:{say:[["livia","imagina amor, sem pressão 💖",{w:500}],["livia","mas entra só pra dar um oi? vou sortear um par pra quem tiver na live 👀",{w:700}]],fx:"livia-sorteio"}
  }},
  /* Carrinho abandonado: a "atendente" negocia e volta com a oferta do gerente. */
  "duda-1":{thread:"pulso",nodes:{
   start:{say:[["pulso","Oi! Aqui é a Duda, do atendimento Pulso Shop 👋"],["pulso","Vi que o {produto} ficou te esperando. Posso ajudar a fechar?"]],fx:"duda-start",
    ask:[{id:"duda-caro",label:"Tá caro",go:"dez"},{id:"duda-olhando",label:"Só estava olhando",go:"olhando"},{id:"duda-robo",label:"Você é um robô?",go:"robo"}]},
   dez:{say:[["pulso","Entendo! Consigo liberar 10% se fechar agora 🙌"]],fx:"duda-10",
    ask:[{id:"duda-fecha10",label:"Fechar com 10%",go:"fecha",fx:"open-duda"},{id:"duda-ainda",label:"Ainda tá caro",go:"gerente"}]},
   gerente:{say:[["pulso","Deixa eu falar com meu gerente…"],["pulso","Consegui! 15% OFF 🎉 Mas o sistema só segura por 5 minutos ⏳",{w:4200}]],fx:"duda-15",
    ask:[{id:"duda-fecha15",label:"Quero os 15%",go:"fecha",fx:"open-duda"},{id:"duda-nao",label:"Não, obrigado",go:"tchau"}]},
   fecha:{say:[["pulso","Perfeito! O cupom já está aplicado no seu checkout 💜"]]},
   tchau:{say:[["pulso","Tudo bem! O cupom fica aí até expirar 💜"]]},
   olhando:{say:[["pulso","Sem problema 😊"],["pulso","Só te aviso que restam poucas unidades e o preço pode subir amanhã."]],fx:"duda-olhando"},
   robo:{say:[["pulso","Sou a Duda, assistente virtual do Pulso Shop 🤖💜"],["pulso","Mas o desconto é de verdade! Quer que eu veja um cupom pra você?"]],
    ask:[{id:"duda-caro",label:"Quero",go:"dez"},{id:"duda-nao",label:"Não precisa",go:"tchau"}]}
  }},
  /* Quarta: recusar o cupom de indicação passa a custar algo à amiga. */
  "bia-3":{thread:"bia",nodes:{
   start:{say:[["bia","ooi! tá estudando?"],["bia","olha, o pulso me deu um cupom de indicação"],["bia","se vc usar em qualquer compra vc ganha R$ 20 OFF e eu ganho R$ 20 tb 🥺"],["bia",card("coupon",{code:"BIA20",label:"R$ 20 OFF · indicação da bia.m"})]],fx:"bia-offer",
    ask:[{id:"bia-sim",label:"Manda! Vou usar 💜",go:"sim",fx:"bia-accept"},{id:"bia-nao",label:"Não tô precisando de nada",go:"nao",fx:"bia-decline"}],
    nag:[["bia","amigoo 🥺 me responde"],["bia","o cupom expira amanhã"]]},
   sim:{say:[["bia","aeee te amo 💜"],["bia","usa até amanhã senão expira pra nós dois"]]},
   nao:{say:[["bia","poxa 😕 era pra eu completar o meu tb"],["bia","mas de boa, se mudar de ideia me fala"]]}
  }},
  "bia-4":{thread:"bia",nodes:{start:{say:[["bia","usou o cupom? expira hoje 🥺"],["bia","só falta vc pra eu ganhar os meus 20"]]}}},
  /* Quinta: pedir opinião cria envolvimento antes de mostrar o produto. */
  "mia-4":{thread:"mia",nodes:{
   start:{say:[["mia","me ajuda rapidão"],["mia","tô em dúvida da cor da garrafa pra viagem"]],
    ask:[{id:"mia-verde",label:"Verde 🌿",go:"link",set:{cor:"verde"}},{id:"mia-lilas",label:"Lilás 💜",go:"link",set:{cor:"lilás"}}]},
   link:{say:[["mia","SABIA. fechei a {cor}"],["mia","tem a sua tb, olha. tá 50% hoje"],["mia",card("product",{id:"garrafa",source:"dm"})],["mia","a gente ia combinando 🥹"]],fx:"mia-link",
    ask:[{id:"mia-ver",label:"Vou ver",go:"ver",fx:"open-garrafa"},{id:"mia-tenho",label:"Já tenho garrafa",go:"tenho"}]},
   ver:{say:[["mia","aaaa compra 🥹"]]},
   tenho:{say:[["mia","aff verdade, a sua azul né"],["mia","serve sim kkk"]]}
  }},
  /* Sexta: escassez vinda de uma amiga, com prazo e concorrente. */
  "nina-5":{thread:"nina",nodes:{
   start:{say:[["nina","ei"],["nina","comprei 2 ingressos do pocket fest sem querer 🤦‍♀️"],["nina","te passo um por R$ 50, mais barato q o lote final"],["nina","mas preciso saber AGORA, o davi tb quer"]],fx:"nina-offer",
    ask:[{id:"nina-sim",label:"Fico com ele! 🎟️",go:"sim",fx:"nina-buy"},{id:"nina-pensar",label:"Deixa eu pensar",go:"pensar"},{id:"nina-nao",label:"Não vou, tô guardando pra viagem",go:"nao",fx:"nina-no"}],
    nag:[["nina","??"],["nina","o davi tá perguntando aqui"]],expire:"expirou"},
   sim:{say:[["nina","aeee 🎉 te mando o qr code"],["nina","te vejo lá!!"]]},
   semsaldo:{say:[["nina","ih, o pix não chegou… deixa, passo pro davi 😕"]]},
   pensar:{say:[["nina","pensa rápido 😬"]],
    ask:[{id:"nina-sim",label:"Tá, fico com ele!",go:"sim",fx:"nina-buy"},{id:"nina-nao",label:"Melhor não",go:"nao",fx:"nina-no"}],nag:[["nina","e aí??"],["nina","vou passar pro davi hein"]],expire:"expirou"},
   nao:{say:[["nina","ahh 😢 blz"],["nina","vai todo mundo… mas te entendo"]]},
   expirou:{say:[["nina","passei pro davi 😕 fica pra próxima"]]}
  }},
  /* Sexta: o empréstimo continua valendo, mas com atrito. */
  "lucca-5":{thread:"lucca",nodes:{
   start:{say:[["lucca","mano, má notícia"],["lucca","minha irmã levou o powerbank bom. só achei o velho, segura meia carga"],["lucca","serve?"]],
    ask:[{id:"pb-serve",label:"Serve sim, valeu!",go:"serve"},{id:"pb-comprar",label:"Melhor eu comprar um então",go:"comprar",fx:"pb-drop"}]},
   serve:{say:[["lucca","fechou, levo amanhã 🔋"]]},
   comprar:{say:[["lucca","blz, tem o Volt no pulso"],["lucca",card("product",{id:"powerbank",source:"dm"})]]}
  }},
  /* Trama da turma, sem venda: dá motivo para voltar ao direct e gostar dos personagens. */
  "gabi-1":{thread:"gabi",nodes:{
   start:{say:[["gabi","ei, segredo 🤫"],["gabi","sábado é aniversário do prof Edu e a turma quer fazer uma surpresa na viagem"],["gabi","vc topa ajudar? não precisa gastar nada, é um cartão que todo mundo assina"]],
    ask:[{id:"gabi-topo",label:"Topo! O que eu faço?",go:"amanha"},{id:"gabi-quem",label:"Quem mais sabe?",go:"quem"}]},
   quem:{say:[["gabi","só eu, a mia e agora vc"],["gabi","não conta pro lucca que ele espalha kkkk"]],go:"amanha"},
   amanha:{say:[["gabi","amanhã te falo, preciso ver quem leva a cartolina 👀"]]}
  }},
  "gabi-2":{thread:"gabi",nodes:{
   start:{say:[["gabi","atualização da surpresa: a mia faz o cartão 🎂"],["gabi","falta decidir quem distrai o prof no ônibus"]],
    ask:[{id:"gabi-eu",label:"Eu distraio 😎",go:"onibus",set:{distrai:"você"}},{id:"gabi-lucca",label:"Deixa com o Lucca kkk",go:"onibus",set:{distrai:"o Lucca"}}]},
   onibus:{say:[["gabi","fechado kkkk"],["gabi","ah, e quem senta com quem no ônibus? a bia já reservou a janela 🙄"]],
    ask:[{id:"gabi-junto",label:"Sento com você?",go:"junto"},{id:"gabi-tanto",label:"Tanto faz",go:"tanto"}]},
   junto:{say:[["gabi","simmm 💜 guardo seu lugar"]]},
   tanto:{say:[["gabi","então vc vai comigo, decidido"]]}
  }},
  "gabi-3":{thread:"gabi",nodes:{
   start:{say:[["gabi","o lucca DESCOBRIU a surpresa 😭"],["gabi","ele jura que não conta. confia?"]],
    ask:[{id:"gabi-confio",label:"Confio, ele é de boa",go:"fim"},{id:"gabi-nunca",label:"Nunca kkkk",go:"fim"}]},
   fim:{say:[["gabi","vamos ver né 😂"],["gabi","boa prova amanhã! e já deixa os 400 do boleto separados, sábado é só pagar e embarcar"]]}
  }},
  "gabi-5":{thread:"gabi",nodes:{
   start:{say:[["gabi","cartão pronto 🎂 todo mundo assinou menos vc"],["gabi","assina amanhã no portão, 6h30!"]],
    ask:[{id:"gabi-fechou",label:"Fechou! Até amanhã 🚌",go:"fim"}]},
   fim:{say:[["gabi","até! vai ser a melhor viagem 💜"]]}
  }}
 };

 /* Conversa que o evento "chat" do roteiro entrega em cada dia. */
 const BY_EVENT={"lucca:1":"lucca-1","livia:2":"livia-2","lucca:5":"lucca-5","gabi:1":"gabi-1","gabi:2":"gabi-2","gabi:3":"gabi-3","gabi:5":"gabi-5","bia:3":"bia-3","mia:4":"mia-4","nina:5":"nina-5"};

 /* ---------- motor ---------- */
 function emptyBox(){return {log:[],queue:[],ask:null,picks:[]};}
 function normalizeBox(raw){
  const b=emptyBox();
  if(!raw||typeof raw!=="object")return b;
  b.log=Array.isArray(raw.log)?raw.log.filter(m=>m&&typeof m==="object").slice(-120):[];
  b.queue=Array.isArray(raw.queue)?raw.queue.filter(m=>m&&typeof m==="object").slice(0,40):[];
  b.ask=raw.ask&&typeof raw.ask==="object"?raw.ask:null;
  b.picks=Array.isArray(raw.picks)?raw.picks.slice(-60):[];
  return b;
 }
 function fill(text,vars){return String(text).replace(/\{(\w+)\}/g,(m,k)=>vars&&vars[k]!=null?String(vars[k]):m);}
 function node(dialog,id){return DIALOGS[dialog]?.nodes?.[id]||null;}
 function delayFor(body,opt){
  if(opt&&Number.isFinite(opt.w))return opt.w;
  if(typeof body!=="string")return 900;
  return Math.min(2400,700+body.length*22);
 }
 /* Enfileira as falas de um nó. A pergunta e o efeito ficam presos à última
  * fala, para só valerem quando ela chegar de fato à tela. */
 function play(box,dialog,id,opts){
  const o=opts||{},fx=[];
  let guard=0;
  while(id&&guard++<12){
   const n=node(dialog,id);
   if(!n)break;
   let at=Math.max(o.now||0,box.queue.length?box.queue[box.queue.length-1].at:0);
   const say=n.say||[];
   say.forEach(([from,body,opt],i)=>{
    at+=o.instant?0:delayFor(body,opt)*(Number.isFinite(o.speed)?o.speed:1);
    const m={d:o.day||1,f:from,at};
    if(typeof body==="string")m.t=fill(body,o.vars);else m.c=body.card;
    if(i===say.length-1){
     if(n.fx)m.fx=n.fx;
     if(n.ask)m.ask={dialog,node:id};
    }
    box.queue.push(m);
   });
   if(!say.length){
    if(n.fx)fx.push(n.fx);
    if(n.ask)box.ask={dialog,node:id,day:o.day||1,nagged:false};
   }
   id=n.ask?null:n.go||null;
  }
  return {fx};
 }
 /* Entrega o que já venceu. Devolve as mensagens entregues e os efeitos. */
 function pump(box,now,all){
  const delivered=[],fx=[];
  while(box.queue.length&&(all||box.queue[0].at<=now)){
   const m=box.queue.shift();
   const entry={d:m.d,f:m.f};
   if(m.t!=null)entry.t=m.t;
   if(m.c)entry.c=m.c;
   box.log.push(entry);delivered.push(entry);
   if(m.fx)fx.push(m.fx);
   if(m.ask)box.ask={...m.ask,day:m.d,nagged:false};
  }
  if(box.log.length>120)box.log.splice(0,box.log.length-120);
  return {delivered,fx};
 }
 function choices(box){
  if(!box.ask||box.queue.length)return [];
  return node(box.ask.dialog,box.ask.node)?.ask||[];
 }
 /* Registra a resposta do jogador e devolve para onde a conversa vai. */
 function choose(box,choiceId,opts){
  const o=opts||{},ask=box.ask;
  if(!ask||box.queue.length)return null;
  const c=(node(ask.dialog,ask.node)?.ask||[]).find(x=>x.id===choiceId);
  if(!c)return null;
  box.log.push({d:o.day||ask.day||1,f:"me",t:c.label});
  box.picks.push({dialog:ask.dialog,node:ask.node,id:c.id,day:o.day||ask.day||1});
  box.ask=null;
  return {dialog:ask.dialog,choice:c,go:c.go||null,fx:c.fx||null,set:c.set||null};
 }
 /* Cobrança quando a pergunta fica sem resposta: uma vez por pergunta. */
 function nag(box,opts){
  const ask=box.ask;
  if(!ask||ask.nagged||box.queue.length)return [];
  const lines=node(ask.dialog,ask.node)?.nag;
  if(!lines)return [];
  ask.nagged=true;
  const out=lines.map(([from,text])=>({d:(opts&&opts.day)||ask.day||1,f:from,t:fill(text,opts&&opts.vars)}));
  box.log.push(...out);
  return out;
 }
 /* Fim do dia: perguntas pendentes somem; algumas deixam uma última fala. */
 function expire(box,opts){
  const ask=box.ask;
  if(!ask)return null;
  box.ask=null;
  const n=node(ask.dialog,ask.node);
  if(n?.expire)play(box,ask.dialog,n.expire,{...(opts||{}),instant:true});
  pump(box,0,true);
  return {dialog:ask.dialog,node:ask.node};
 }
 function preview(entry){
  if(!entry)return "";
  if(entry.c)return entry.c.type==="contact"?"📇 Contato: "+entry.c.name:entry.c.type==="product"?"🛍️ Enviou um produto":"🎟️ Enviou um cupom";
  return (entry.f==="me"?"Você: ":"")+entry.t;
 }

 root.PorTrasDirect=Object.freeze({DIALOGS,BY_EVENT,emptyBox,normalizeBox,fill,node,play,pump,choices,choose,nag,expire,preview});
})(typeof window!=="undefined"?window:globalThis);
