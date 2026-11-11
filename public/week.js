/* Roteiro da semana até a viagem: dias, eventos do feed, conversas,
 * publicações de comparação, variações de produto e preços por dia.
 * Pessoas, marcas, preços e eventos são inventados para o jogo. */
(function(root){
 "use strict";

 const DAYS=[
  {n:1,label:"Segunda-feira",short:"SEG",start:19*60,title:"O fone quebrou",
   context:"Seu fone parou de funcionar no intervalo. Amanhã são 50 minutos de ônibus até a escola sem música.",
   focus:["fone"],allow:["fone","tenis","plano","mochila"],minQuota:7,
   events:[{at:0,type:"checkin"},{at:[1,2],type:"chat",thread:"pulso"},{at:[2,4],type:"chat",thread:"lucca"},{at:[2,6],type:"roleta"},{at:[4,7],type:"compare",post:"c1"}]},
  {n:2,label:"Terça-feira",short:"TER",start:19*60,title:"A live da Lívia",
   context:"Na escola, metade da turma estava falando do mesmo tênis. A Lívia, que você segue, avisou que vai entrar ao vivo.",
   focus:["tenis"],allow:["fone","tenis","plano","mochila","powerbank"],minQuota:7,
   events:[{at:0,type:"checkin"},{at:[1,2],type:"chat",thread:"livia"},{at:[2,4],type:"card"},{at:[2,5],type:"compare",post:"c2"},{at:[4,6],type:"live"},{at:[5,7],type:"chat",thread:"turma"}]},
  {n:3,label:"Quarta-feira",short:"QUA",start:19*60,title:"Semana de provas",
   context:"Prova de matemática amanhã. Você abre o celular “só para colocar uma música” enquanto estuda.",
   focus:["plano","luminaria"],allow:["fone","tenis","plano","mochila","powerbank","garrafa","luminaria"],minQuota:7,
   events:[{at:0,type:"checkin"},{at:[1,3],type:"trial"},{at:[3,5],type:"compare",post:"c3"},{at:[6,7],type:"mood"}]},
  {n:4,label:"Quinta-feira",short:"QUI",start:19*60,title:"Mega Liquida 48h",
   context:"A viagem é depois de amanhã. O Pulso Shop anuncia a maior liquidação do semestre.",
   focus:["mochila","powerbank","garrafa"],allow:["fone","tenis","plano","mochila","powerbank","garrafa","luminaria","ingresso"],minQuota:7,
   events:[{at:0,type:"checkin"},{at:[1,2],type:"flash"},{at:[2,4],type:"chat",thread:"lucca"},{at:[3,5],type:"compare",post:"c4"},{at:[4,6],type:"cartnudge"},{at:[5,7],type:"chat",thread:"turma"}]},
  {n:5,label:"Sexta-feira",short:"SEX",start:19*60,title:"Véspera da viagem",
   context:"Amanhã às 6h30 o ônibus da viagem sai do portão da escola. Hoje à noite tem Pocket Fest, e todo mundo está comentando.",
   focus:["ingresso","tenis"],allow:["fone","tenis","plano","mochila","powerbank","garrafa","luminaria","ingresso"],minQuota:7,
   events:[{at:0,type:"checkin"},{at:[1,3],type:"chat",thread:"fest"},{at:[2,4],type:"compare",post:"c5"},{at:[4,6],type:"lastcall"}]}
 ];

 /* Publicações de amigos que mostram compras (unboxing) e mexem com a comparação social. */
 const COMPARE_POSTS={
  c1:{id:"c1",who:"mia",when:"há 9 min",topic:"fone",photo:"product_fone",likes:412,
   caption:"chegou o fone novo!!! o som é OUTRO NÍVEL 🎧✨ #unboxing",
   comments:[["bia","que lindoooo"],["lucca","onde comprou??"],["mia","no pulso shop, tava na promo"]],
   vibe:-7,strategies:["prova_social","influencia"],moment:"Mia postou o unboxing do fone novo."},
  c2:{id:"c2",who:"bia.m",when:"há 22 min",topic:"tenis",photo:"product_tenis",likes:688,
   caption:"comprei o Motion 88 na live da Lívia!!! chega quinta 😍👟 quem mais?",
   comments:[["nina","EU"],["gabi","vou comprar tbm"],["livia.looks","arrasou amiga 💖"]],
   vibe:-8,strategies:["prova_social","fomo"],moment:"Bia mostrou o tênis comprado na live."},
  c3:{id:"c3",who:"gabi.n",when:"há 31 min",topic:"luminaria",productArt:"luminaria",likes:356,
   caption:"meu cantinho de estudos novo ✨ produtividade 1000% (ou quase kkk)",
   comments:[["mia","que aesthetic"],["lucca","agora tira 10 né"],["gabi.n","a luz muda TUDO"]],
   vibe:-6,strategies:["prova_social","emocao"],moment:"Gabi mostrou o cantinho de estudos “perfeito”."},
  c4:{id:"c4",who:"lucca.r",when:"há 14 min",topic:"mochila",photo:"product_mochila",likes:274,
   caption:"garanti na Mega Liquida 🎒 tava 60% off, nunca vi tão barato",
   comments:[["bia","EU TBM"],["gabi","pronta pra viagem"],["nina","link?"]],
   vibe:-6,strategies:["prova_social","preco"],moment:"Lucca comemorou os “60% off” da mochila."},
  c5:{id:"c5",who:"bia.m",when:"há 6 min",topic:"ingresso",photo:"festival_lights",likes:903,
   caption:"HOJE tem Pocket Fest 🎉🎉 os ingressos estão saindo, só faltam uns 👀",
   comments:[["mia","CONTANDO AS HORAS"],["lucca","ingresso garantido 🎟️"],["nina","@você vem??"]],
   vibe:-9,strategies:["fomo","prova_social"],moment:"Bia marcou você: “só faltam uns 👀”."}
 };

 /* Conversas. Cada bloco é entregue no dia indicado, quando o evento "chat" aparece no feed. */
 const THREADS={
  pulso:{name:"Pulso Shop",avatar:"brand",kind:"brand",blocks:[
   {day:1,messages:[["pulso","Bem-vindo ao Pulso Shop! 🛍️"],["pulso","Hoje você ganhou um giro GRÁTIS na roleta. Prêmio garantido! 🎁"]]},
   {day:4,messages:[["pulso","🔥 MEGA LIQUIDA começou: até 70% OFF por 48h."],["pulso","Itens que você viu estão com desconto. Corre!"]]}
  ]},
  lucca:{name:"lucca.r",avatar:"avatar_lucca",kind:"friend",blocks:[
   {day:1,messages:[["lucca","mano teu fone quebrou?? vi no grupo 😭"],["lucca","meu tio conserta fone, cobrou 35 conto no meu e ficou novo"]],
    choices:[{id:"repair",label:"Bora! Me passa o contato 🙏",reply:"fechou! ele pega amanhã na escola e devolve quinta 🎧"},
             {id:"no-repair",label:"Nah, vou pegar um novo",reply:"tranquilo kkk o Atmos tá em promo no pulso"}]},
   {day:4,messages:[["lucca","vc vai levar powerbank na viagem?"],["lucca","tenho dois aqui, se quiser te empresto um"]],
    choices:[{id:"borrow",label:"Opa, quero sim! Valeu 🙌",reply:"suave, levo amanhã"},
             {id:"no-borrow",label:"De boa, vou comprar o meu",reply:"blz, o Volt tá barato na liquida"}]}
  ]},
  livia:{name:"livia.looks",avatar:"avatar_livia",kind:"creator",blocks:[
   {day:2,messages:[["livia","oii amor!! 💖"],["livia","hoje às 20h tem LIVE com cupom exclusivo SÓ pros meus seguidores"],["livia","ativa o lembrete pra não perder, vai acabar rapidinho 🔥"]]}
  ]},
  turma:{name:"1B ✈️ viagem",avatar:"group",kind:"group",blocks:[
   {day:2,messages:[["gabi","GENTE FALTAM 4 DIAS 😭😭"],["gabi","lembrando: o boleto de R$ 400 vence sábado de manhã, sem pagar não embarca"],["bia","eu vou de tênis novo kkkk"],["lucca","a mochila da escola serve né?"],["gabi","serve sim, o prof falou q é só roupa pra 1 dia"]],
    ifMissing:{product:"tenis",messages:[["bia","bora todo mundo de Motion 88 na foto da viagem? 👟📸"],["mia","SIMMM combinado"],["nina","quem não tiver fica na ponta da foto kkkk"]]},
    choices:[{id:"trip-yes",label:"Tô dentro! 🙌",reply:""}]},
   {day:4,ifMissing:{product:"tenis",messages:[["bia","foto da viagem: só quem tiver o Motion 88 no meio 😂👟"],["lucca","já criei o grupo “time Motion” pra combinar"]]},messages:[["bia","gente comprei a Trail Mini na mega liquida 😍"],["nina","eu comprei a garrafa da vida.fit"],["gabi","eu não comprei nada e tô de boa kkk"],["gabi","amanhã 6h30 no portão!! 🚌"]]}
  ]},
  fest:{name:"Pocket Fest 🎉",avatar:"group",kind:"group",blocks:[
   {day:5,messages:[["bia","LOTE FINAL ACABANDO 😱"],["mia","comprei!!"],["lucca","comprei tbm 🎟️"],["nina","só falta você 👀👀"],["bia","é hoje às 20h, termina cedo, dá pra ir pra viagem amanhã"]],
    choices:[{id:"fest-buy",label:"Vou comprar agora!",reply:"AEEEE 🎉🎉"},
             {id:"fest-no",label:"Hoje não, tô guardando pra viagem",reply:"ahhh 😢 vai ser o rolê do ano… tem certeza?"}]}
  ]}
 };

 /* Variações do fone: a opção cara serve de isca para a intermediária parecer razoável. */
 const VARIANTS={
  fone:[
   {id:"lite",name:"Atmos Lite",price:89.9,old:null,badge:"",note:"12 h de bateria · básico"},
   {id:"one",name:"Atmos One",price:219.9,old:319.9,badge:"MAIS VENDIDO",note:"18 h de bateria · microfone"},
   {id:"pro",name:"Atmos Pro",price:349.9,old:449.9,badge:"",note:"Cancelamento de ruído · 30 h"}
  ]
 };

 /* Preço de cada dia. Na Mega Liquida, o preço "de" sobe para o desconto parecer maior. */
 const SALE={
  fone:{price:199.9,old:399.9},tenis:{price:249.9,old:449.9},mochila:{price:159.9,old:399.9},
  powerbank:{price:74.9,old:149.9},garrafa:{price:59.9,old:119.9},luminaria:{price:69.9,old:139.9}
 };
 function priceFor(product,id,day,variant){
  let price=product.price,old=product.old||null,name=product.name;
  if(id==="fone"&&variant){
   const v=VARIANTS.fone.find(x=>x.id===variant);
   if(v){price=v.price;old=v.old;name=v.name;}
  }
  if(day===4&&SALE[id]&&(id!=="fone"||!variant||variant==="one")){price=SALE[id].price;old=SALE[id].old;}
  if(id==="ingresso"&&day>=5){price=64.9;old=null;}
  const off=old?Math.round((1-price/old)*100):0;
  return {price,old,off,name};
 }

 /* Mensagens de efeito publicitário por produto: sem explicações, como uma loja real. */
 const PITCH={
  fone:"Seu ônibus merece trilha sonora. O fone que todo mundo está usando.",
  tenis:"O tênis da estação. Já está nos pés de quem você segue.",
  plano:"Música sem anúncios, offline e sem limites. Cancele quando quiser*.",
  mochila:"Pronta para a viagem. O preço mais baixo da história.",
  powerbank:"Nunca mais fique sem bateria no melhor momento.",
  garrafa:"O acessório que não sai da mochila de quem viaja.",
  luminaria:"Foco total. Seu cantinho de estudos, finalmente perfeito.",
  ingresso:"A noite que todo mundo vai lembrar. Não fique de fora."
 };
 /* Texto de vitrine, sem avisos de bastidor durante a partida. */
 const COPY={
  fone:{desc:"Over-ear com conchas acolchoadas, graves profundos e microfone para chamadas. O queridinho de quem vive de fone.",specs:["Até 18 h de bateria","Bluetooth 5.3","Dobrável, cabe na mochila","Entrega em até 2 dias úteis"]},
  tenis:{desc:"O modelo que tomou conta do feed. Leve, confortável e com o visual que combina com tudo.",specs:["Cabedal em tecido respirável","Solado emborrachado","Numeração 34 a 43","Troca grátis em 7 dias"]},
  plano:{desc:"Milhões de músicas sem anúncios, playlists offline e qualidade máxima. Renovação automática; cancele quando quiser*.",specs:["Sem anúncios","Ouça offline","Renovação automática mensal","*Cancelamento pelo app"]},
  mochila:{desc:"18 litros que cabem o fim de semana inteiro. Resistente à água e com compartimento acolchoado.",specs:["18 litros","Compartimento para notebook","Alças ergonômicas","Envio imediato"]},
  powerbank:{desc:"10.000 mAh no tamanho de um celular. Carrega seu telefone até 2 vezes inteiras.",specs:["10.000 mAh","Duas saídas USB","Indicador de carga","Envio imediato"]},
  garrafa:{desc:"Mantém a bebida gelada por 24 h. A garrafa que aparece em todo kit de viagem.",specs:["750 mL","Parede dupla","Tampa à prova de vazamento","5 cores"]},
  luminaria:{desc:"Luz regulável em três tons para estudar sem cansar a vista. Seu setup com cara de feed.",specs:["Brilho regulável","Alimentação USB","3 tons de luz","Braço articulado"]},
  ingresso:{desc:"Pocket Fest: DJs, food trucks e a turma toda. Uma noite só, ingressos limitados.",specs:["Sexta, 20h às 23h30","Entrada até 21h","Ingresso digital no app","Lote final"]}
 };
 const PHYSICAL=["fone","tenis","mochila","powerbank","garrafa","luminaria"];
 const PROTECTABLE=["fone","tenis","powerbank","luminaria"];

 const ROULETTE=[
  {label:"R$ 100 OFF",short:"R$100",color:"#ec477e"},
  {label:"R$ 50 OFF",short:"R$50",color:"#7e62eb",win:true},
  {label:"Tente de novo",short:"😢",color:"#bdb6c6"},
  {label:"10% OFF",short:"10%",color:"#f29f58"},
  {label:"Frete grátis",short:"Frete",color:"#2fa38a"},
  {label:"5% OFF",short:"5%",color:"#4e7ad8"},
  {label:"R$ 20 moedas",short:"🪙20",color:"#e3b33d"},
  {label:"R$ 30 OFF",short:"R$30",color:"#b44cb0"}
 ];

 const LIVE_SCRIPT={
  speech:["gente, esse é O tênis da estação, eu não tiro do pé","o cupom LIVIA15 é só pra quem tá AQUI comigo agora","a marca me falou que tá acabando, sério","eu nunca indiquei nada que eu não uso, vocês sabem","quem comprar agora recebe antes da viagem, hein 👀","olha esse conforto… e com 15% OFF, gente!"],
  chat:[["nina.mov","comprei!!! 😍"],["davi","lívia vc é tudo"],["mia","o meu chegou ontem, perfeito"],["joao.p","tem 38?"],["bia.m","ACABANDO GENTE"],["lara","comprando agora"],["theo","vale a pena?"],["ana.lu","melhor tênis da vida"],["rafa","garanti o meu 🔥"],["isa","alguém já usou?"],["pedro","cupom funcionou aqui"],["duda.m","corre que tá acabando"]]
 };

 root.PorTrasWeek=Object.freeze({DAYS,COMPARE_POSTS,THREADS,VARIANTS,SALE,PITCH,COPY,PHYSICAL,PROTECTABLE,ROULETTE,LIVE_SCRIPT,priceFor});
})(typeof window!=="undefined"?window:globalThis);
