/* Quatro novos momentos editoriais e lojas da simulacao C4.
 * Os momentos ficam nos bastidores: nao ha telas de capitulo no feed. */
(function(root){
 "use strict";
 const products={
  powerbank:{
   name:"Volt 10K",brand:"NEXO TECH",kind:"powerbank",price:89.90,old:129.90,
   label:"Bateria portatil",tag:"Energia para nao perder nada.",
   specs:["Capacidade ilustrativa de 10.000 mAh","Duas saidas USB","Indicador de bateria","Frete e especificacoes ficticios"],
   desc:"Bateria externa ficticia apresentada como a solucao para nao ficar sem celular durante os passeios e estudos.",
   ad:"Sua bateria acaba antes do encontro? O Volt 10K pode acompanhar voce.",
   late:"Voce viu o Volt 10K antes. A loja voltou a aparecer nas recomendacoes.",
   reviews:[["rafa.tech","Parece util em viagens, mas e bom pesquisar capacidade real.","3 h"],["davi","Gostei da praticidade ficticia do modelo.","1 d"],["noah","Ja tenho carregador portatil; nao compraria outro.","2 h"]]
  },
  garrafa:{
   name:"Flow 750",brand:"VERDE LAB",kind:"garrafa",price:69.90,old:99.90,
   label:"Garrafa reutilizavel",tag:"Seu dia em movimento.",
   specs:["750 mL de capacidade","Tampa rosqueavel","Material ilustrativo sem certificacao real","Cores de demonstracao"],
   desc:"Garrafa de uso diario da simulacao, exibida em posts sobre estudo, esporte e viagens.",
   ad:"Leve sua bebida favorita em todos os rolês. Conheca a Flow 750.",
   late:"A Flow 750 apareceu no seu feed depois que voce viu conteudo de viagem.",
   reviews:[["nina.mov","Bonita no post, mas tenho uma parecida.","4 h"],["bruno","Gostei do formato. Compararia preco antes.","8 h"],["marina","Acho util para quem esquece de levar agua.","2 d"]]
  },
  luminaria:{
   name:"Halo Desk",brand:"LUMA HOME",kind:"luminaria",price:79.90,old:119.90,
   label:"Luminaria de estudo",tag:"Seu cantinho, seu foco.",
   specs:["Brilho regulavel ilustrativo","Ligacao USB simulada","Tres tons de luz ficticios","Garantia nao oferecida: demonstracao"],
   desc:"Luminaria ficticia para mesa de estudos, divulgada por perfis de organizacao e produtividade.",
   ad:"Transforme seu canto de estudos. Um detalhe que parece mudar tudo.",
   late:"O Halo Desk voltou porque voce acompanhou posts sobre estudo.",
   reviews:[["isabel","Gostei da iluminacao na foto.","1 d"],["pedro","Talvez uma lampada normal resolva.","10 h"],["juli","Quero comparar tamanhos antes.","5 h"]]
  },
  ingresso:{
   name:"Pocket Fest",brand:"VIVA TICKETS",kind:"ingresso",price:54.90,old:74.90,
   label:"Ingresso ilustrativo",tag:"Nao fique de fora.",
   specs:["Evento imaginario","Ingresso digital ficticio","Data e local nao correspondem a evento real","Sem emissao de ingresso verdadeiro"],
   desc:"Ingresso ficticio de evento criado para simular sensacao de pertencimento, contagem regressiva e compra por impulso.",
   ad:"A turma ja esta comentando o Pocket Fest. Confira o ingresso de demonstracao.",
   late:"Voce viu o evento entre os stories. A oferta apareceu de novo.",
   reviews:[["laura","Se meus amigos fossem, talvez eu animasse.","4 h"],["bia.m","A gente estava combinando!","8 h"],["tomas","Nao compraria antes de confirmar a programacao.","1 d"]]
  }
 };
 const moments=[
  {
   id:"powerbank",name:"Antes de ficar sem bateria",day:"QUINTA · 19:10",emoji:"🔋",
   context:"A turma começa a falar de celulares descarregados no passeio.",
   question:"Precisa de outra bateria?",hook:"A rede transforma um inconveniente possível em uma nova compra.",
   stories:[
    ["rafa.tech","🔋","Meu celular morreu bem na hora da foto! E voces?","bus","powerbank","friends_bus"],
    ["rafa.tech","⚡","Uma bateria extra muda o dia? Link na bio ⚡","bus","powerbank","sneakers"]
   ],
   posts:[
    {id:"p13",who:"rafa.tech",emoji:"⚡",when:"há 12 min · parceria",art:"bus",photo:"bus_close",promoted:true,caption:"Fiquei sem bateria no passeio, então estou testando uma solução compacta: Volt 10K. #publi",likes:1276,comments:[["lucca","Preciso para as fotos"],["ana","Dá para carregar quantas vezes?"]]},
    {id:"p14",who:"lucca.r",emoji:"🎸",when:"há 36 min",art:"playlist",photo:"headphones",caption:"Quando o fone está carregado, mas o celular não… quem nunca? 😅",likes:234,comments:[["bia","Me representa"],["davi","Sempre esqueço o cabo!"]]},
    {id:"p15",who:"papo.tech",emoji:"📱",when:"há 2 h",art:"bus",photo:"study_close",caption:"O que você leva para passar o dia fora? Tem coisa que a gente compra só por precaução.",likes:967,comments:[["isa","Meu carregador, sempre"],["joao","Faz sentido olhar se precisa mesmo."]]}
   ]
  },
  {
   id:"garrafa",name:"Todo mundo montando o kit",day:"QUINTA · 19:30",emoji:"💧",
   context:"Agora que a viagem se aproxima, pequenos acessórios aparecem nos stories.",
   question:"Mais um item para o passeio?",hook:"Os itens baratos podem somar mais do que parecem.",
   stories:[
    ["vida.fit","💧","O que nao pode faltar na mochila?","campus","garrafa","trip_landscape"],
    ["vida.fit","🌿","Meu kit do dia. Cupom na legenda! 💧","campus","garrafa","backpack"]
   ],
   posts:[
    {id:"p16",who:"vida.fit",emoji:"💧",when:"há 18 min · parceria",art:"campus",photo:"trip_close",promoted:true,caption:"Meu kit para sair de casa: tênis confortável, água e garrafa Flow 750. #publi",likes:2134,comments:[["gabi","A cor é linda"],["pedro","Tenho garrafa em casa."]]},
    {id:"p17",who:"nina.mov",emoji:"🏃",when:"há 47 min",art:"campus",photo:"park_trees",caption:"Sol, parque e muita caminhada. Bora beber água! ☀️",likes:523,comments:[["bia","Saudades desse lugar"],["leo","Boa lembrança!"]]},
    {id:"p18",who:"diario.da.turma",emoji:"🧳",when:"há 2 h",art:"campus",photo:"friends_trip",caption:"Checklist coletivo da viagem: cada um levando uma coisa. E o que ninguém precisa repetir?",likes:843,comments:[["mari","Eu levo os copos"],["lucca","Eu levo a playlist!"]]}
   ]
  },
  {
   id:"luminaria",name:"A rotina perfeita",day:"TERÇA · 20:50",emoji:"💡",
   context:"Depois da diversão, o feed sugere acessórios para produtividade e estudo.",
   question:"Uma compra melhora seu foco?",hook:"A propaganda transforma organização em produto.",
   stories:[
    ["estudo.com","✨","Antes e depois do meu cantinho!","playlist","luminaria","fashion_stairs"],
    ["estudo.com","💡","Luz indireta me ajuda a estudar. #publi","playlist","luminaria","park_close"]
   ],
   posts:[
    {id:"p19",who:"estudo.com",emoji:"💡",when:"há 9 min · parceria",art:"playlist",photo:"study_music",promoted:true,caption:"Organizei minha mesa para estudar com Halo Desk. #publi Não existe milagre, mas o ambiente ficou aconchegante.",likes:2890,comments:[["mia","Amei o setup"],["raquel","Já tenho abajur e serve bem."]]},
    {id:"p20",who:"bia.m",emoji:"📚",when:"há 26 min",art:"playlist",photo:"fashion_detail",caption:"Às vezes eu só preciso desligar o celular e terminar a lição 🫠",likes:245,comments:[["mari","Mesmo por aqui"],["noah","Foco é difícil!"]]},
    {id:"p21",who:"rotina.real",emoji:"🗓️",when:"há 1 h",art:"campus",photo:"friends_park",caption:"Seu espaço de estudo diz mais sobre seus hábitos do que o preço dos objetos da mesa.",likes:781,comments:[["tia","Concordo"],["joao","Boa reflexão."]]}
   ]
  },
  {
   id:"ingresso",name:"O evento do grupo",day:"SEXTA · 19:10",emoji:"🎫",
   context:"O grupo comenta um festival de demonstração e a rede puxa convites e ofertas.",
   question:"Vale ir só porque todo mundo vai?",hook:"A sensação de ficar de fora cria urgência.",
   stories:[
    ["agenda.festival","🎫","O grupo inteiro comentando o Pocket Fest!","venue","ingresso","sneaker_worn"],
    ["agenda.festival","🎶","Line-up revelado! Lote 2 quase no fim 🎶","venue","ingresso","sneaker_detail"]
   ],
   posts:[
    {id:"p22",who:"agenda.festival",emoji:"🎫",when:"há 13 min · parceria",art:"venue",photo:"festival_lights",promoted:true,caption:"Pocket Fest: encontro imaginário, ingressos fictícios, memórias que só existem no jogo. #publi",likes:4311,comments:[["lucca","Bora galera"],["leo","Confirma antes de comprar!"]]},
    {id:"p23",who:"bia.m",emoji:"🌸",when:"há 31 min",art:"venue",photo:"festival_people",caption:"A galera está pensando em fazer outra coisa no fim de semana. Qual é o plano? 🎶",likes:529,comments:[["lucca","Eu animo"],["rafa","Depende do valor."]]},
    {id:"p24",who:"cultura.local",emoji:"🎵",when:"há 2 h",art:"venue",photo:"friends_festival",caption:"Nem todo momento inesquecível precisa ter ingresso. Mas essa conversa está no feed de todo mundo.",likes:915,comments:[["livia","Verdade"],["nina","As melhores coisas são espontâneas."]]}
   ]
  }
 ];
 root.NoFeedExpansion=Object.freeze({products,moments});
})(typeof window!=="undefined"?window:globalThis);
