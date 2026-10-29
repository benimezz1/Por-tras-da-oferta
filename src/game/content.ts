import type { Mission, Strategy } from "./types";
export const strategies: Record<
  Strategy,
  { name: string; explanation: string; question: string }
> = {
  urgencia: {
    name: "Urgência",
    explanation:
      "Um prazo curto pode reduzir o tempo dedicado à comparação. Um prazo real não torna uma oferta automaticamente ruim.",
    question: "Eu escolheria isso se tivesse mais tempo?",
  },
  escassez: {
    name: "Escassez",
    explanation:
      "A disponibilidade limitada pode aumentar o valor percebido. O aviso sozinho não comprova o estoque.",
    question: "Há evidência de que restam poucas unidades?",
  },
  prova_social: {
    name: "Prova social",
    explanation:
      "Avaliações e sinais de popularidade podem servir de atalho para construir confiança. Quantidade não garante independência nem adequação.",
    question: "Quem avaliou, em que condições e com qual experiência?",
  },
  influenciadores: {
    name: "Influência de criadores",
    explanation:
      "A identificação e a confiança em um criador podem se transferir para um produto. Uma parceria comercial merece ser considerada na leitura da recomendação.",
    question: "É experiência pessoal, publicidade ou as duas coisas?",
  },
  fomo: {
    name: "FOMO e pertencimento",
    explanation:
      "O receio de ficar de fora pode aproximar uma compra do desejo de pertencer a um grupo.",
    question: "Esse desejo continuaria se ninguém mais tivesse o produto?",
  },
  descontos: {
    name: "Ancoragem e descontos",
    explanation:
      "Um preço de referência destacado pode fazer o preço atual parecer melhor. Compare o histórico e o custo total.",
    question: "O preço anterior era realmente praticado?",
  },
  personalizacao: {
    name: "Personalização",
    explanation:
      "Interações anteriores podem orientar quais anúncios aparecem. Relevância percebida não demonstra necessidade.",
    question: "Por que esta oferta apareceu para mim?",
  },
  padroes_obscuros: {
    name: "Padrões comerciais obscuros",
    explanation:
      "Seleções automáticas e obstáculos para recusar podem direcionar escolhas. Observe custos, consentimento e facilidade para sair.",
    question: "Recusar é tão simples quanto aceitar?",
  },
};
export const missions: Mission[] = [
  {
    id: "feed",
    title: "Só mais um scroll",
    app: "loop",
    category: "REDE SOCIAL",
    subtitle: "O feed infinito",
    brief:
      "Sábado tem uma oficina de criação com seus amigos. Você tem R$ 500 para a semana e quer reservar R$ 180 para transporte e alimentação. Seu fone falha de um lado. No feed, uma novidade chama sua atenção.",
    need: "Um fone que funcione. E dinheiro para o sábado.",
    duration: "4–6 min",
    color: "#a98aff",
    evidence: [
      {
        id: "ad",
        label: "Por que estou vendo isto?",
        detail:
          "A Loop usou sua interação com vídeos sobre áudio e seu interesse em música. A loja pagou para aparecer neste espaço.",
        strategies: ["personalizacao"],
      },
      {
        id: "trend",
        label: "A conversa do grupo",
        detail:
          "“Todo mundo vai de Pulse no sábado. Só falta você.” A mensagem associa o produto a fazer parte do encontro.",
        strategies: ["fomo"],
      },
      {
        id: "profile",
        label: "O perfil de Lia",
        detail:
          "Lia produz conteúdo de música. A publicação tem parceria paga com a Onda; ela recebe comissão pelo link.",
        strategies: ["influenciadores"],
      },
    ],
  },
  {
    id: "store",
    title: "A última chance. De novo.",
    app: "onda",
    category: "LOJA VIRTUAL",
    subtitle: "A promoção imperdível",
    brief:
      "O fone ainda precisa de uma solução. A Onda anuncia um desconto enorme. Explore as especificações, compare alternativas e confira o que mudou no preço antes de fechar o carrinho.",
    need: "Resolver o áudio sem perder de vista a reserva de R$ 180.",
    duration: "5–7 min",
    color: "#8dcbb7",
    evidence: [
      {
        id: "history",
        label: "Histórico de preço",
        detail:
          "O Pulse custou R$ 189 há 30 dias, R$ 179 há 7 dias e R$ 180 hoje. O preço riscado de R$ 360 não aparece nesse histórico.",
        strategies: ["descontos"],
      },
      {
        id: "clock",
        label: "Reabrir a oferta",
        detail:
          "Ao reabrir a promoção, o contador volta para 04:59. Nesta simulação, o prazo reinicia: ele não representa um término fixo da oferta.",
        strategies: ["urgencia", "padroes_obscuros"],
      },
      {
        id: "stock",
        label: "Consultar disponibilidade",
        detail:
          "A página diz “últimas 3 unidades”, mas não informa quando o estoque foi atualizado. Não há confirmação independente da quantidade.",
        strategies: ["escassez"],
      },
      {
        id: "compare",
        label: "Comparação de alternativas",
        detail:
          "Pulse: R$ 180, sem fio, garantia de 12 meses. Essencial: R$ 120, com fio, mesma garantia. O Essencial também resolve a falha de áudio.",
        strategies: [],
      },
    ],
  },
  {
    id: "live",
    title: "Se ela usa, eu preciso?",
    app: "viva",
    category: "CRIADORES",
    subtitle: "O poder da influência",
    brief:
      "Lia está mostrando seu “kit perfeito para criar”. O tênis de R$ 125 combina com o encontro, mas o seu ainda está em bom estado. Veja a apresentação e investigue a recomendação.",
    need: "Separar admiração pelo criador de utilidade do produto.",
    duration: "4–6 min",
    color: "#f5b59c",
    evidence: [
      {
        id: "disclosure",
        label: "Detalhes da parceria",
        detail:
          "Conteúdo patrocinado pela Passo. Lia recebeu o produto e recebe 12% das compras com o cupom. A recomendação tem um incentivo comercial.",
        strategies: ["influenciadores"],
      },
      {
        id: "comments",
        label: "Comentários da transmissão",
        detail:
          "Mensagens como “se você é do nosso grupo, vem com o mesmo tênis” relacionam o produto ao pertencimento. Um contador de 2,4 mil espectadores reforça a popularidade.",
        strategies: ["fomo", "prova_social"],
      },
      {
        id: "spec",
        label: "Ficha do produto",
        detail:
          "O tênis é casual. A apresentação fala em “criar melhor”, mas a ficha não oferece evidência de melhora de criatividade.",
        strategies: ["influenciadores"],
      },
    ],
  },
  {
    id: "reviews",
    title: "Cinco estrelas para quê?",
    app: "vitrine",
    category: "AVALIAÇÕES",
    subtitle: "Todo mundo está comprando",
    brief:
      "Para gravar na oficina, você pensa em uma bateria portátil. A mais popular custa R$ 89. Seu cabo também está falhando; trocar só o cabo custa R$ 25. O ranking parece convincente.",
    need: "Descobrir o que as avaliações realmente sustentam.",
    duration: "4–6 min",
    color: "#e9ca73",
    evidence: [
      {
        id: "verified",
        label: "Filtrar compras verificadas",
        detail:
          "Das 1.284 avaliações exibidas, 86 são de compras verificadas. Esse grupo tem média 3,2 e relatos mais detalhados sobre capacidade.",
        strategies: ["prova_social"],
      },
      {
        id: "repeated",
        label: "Comparar comentários",
        detail:
          "Três perfis publicam a mesma frase no mesmo minuto. É um indício para investigar a independência dos relatos; isoladamente não prova fraude.",
        strategies: ["prova_social"],
      },
      {
        id: "ranking",
        label: "Como o ranking funciona",
        detail:
          "O primeiro lugar é um destaque patrocinado. A posição depende de pagamento à plataforma e não apenas da qualidade.",
        strategies: ["prova_social"],
      },
    ],
  },
  {
    id: "subscription",
    title: "Grátis. Até quando?",
    app: "clube+",
    category: "ASSINATURAS",
    subtitle: "A assinatura perfeita",
    brief:
      "Um app oferece recursos para editar os vídeos da oficina. O teste é grátis por 7 dias, depois R$ 35/mês. Um pacote adicional de R$ 9 vem marcado. Explore os termos e a saída antes de decidir.",
    need: "Entender o compromisso além do botão “grátis”.",
    duration: "4–6 min",
    color: "#aabdf7",
    evidence: [
      {
        id: "terms",
        label: "Ler renovação e extras",
        detail:
          "Após 7 dias: R$ 35/mês, mais R$ 9/mês do pacote pré-selecionado. Não há cobrança hoje. A renovação é automática.",
        strategies: ["padroes_obscuros", "descontos"],
      },
      {
        id: "cancelpath",
        label: "Percorrer o cancelamento",
        detail:
          "Para cancelar, é preciso abrir a conta, recusar uma oferta de retenção e confirmar. A assinatura começa com um único clique.",
        strategies: ["padroes_obscuros"],
      },
      {
        id: "plans",
        label: "Ver o plano gratuito",
        detail:
          "O plano gratuito permite três exportações por mês; a oficina exige apenas uma. A opção aparece com menos destaque.",
        strategies: ["padroes_obscuros"],
      },
    ],
  },
  {
    id: "final",
    title: "A escolha é sua",
    app: "mercado 21",
    category: "DESAFIO FINAL",
    subtitle: "Por Trás da Oferta",
    brief:
      "Chegou sexta. Um kit de luz e suporte aparece por R$ 99. A escola também empresta um suporte. Cruze tudo o que aprendeu e decida como chegar ao sábado.",
    need: "Uma decisão que considere necessidade, evidências e orçamento.",
    duration: "5–7 min",
    color: "#c8f36b",
    evidence: [
      {
        id: "bundle",
        label: "Abrir detalhes da oferta",
        detail:
          "Kit por R$ 99, de R$ 199. Os itens separados custam R$ 59 e R$ 40: somam os mesmos R$ 99. O valor riscado não sustenta uma economia.",
        strategies: ["descontos"],
      },
      {
        id: "audience",
        label: "Investigar anúncio e público",
        detail:
          "O anúncio usa suas interações com equipamentos de criação. “Criadores de verdade já garantiram” associa a compra à identidade do grupo.",
        strategies: ["personalizacao", "fomo"],
      },
      {
        id: "finalstock",
        label: "Ver condições e estoque",
        detail:
          "“Só hoje, últimas unidades” não vem acompanhado de quantidade ou data de atualização. Há pressão de tempo e disponibilidade, mas pouca informação verificável.",
        strategies: ["urgencia", "escassez"],
      },
      {
        id: "borrow",
        label: "Consultar empréstimo da escola",
        detail:
          "Um suporte está disponível para a oficina, sem cobrança. A retirada precisa ser combinada com a equipe. Comprar pode fazer sentido para uso futuro; emprestar atende ao sábado.",
        strategies: [],
      },
    ],
  },
];
export const criteriaOptions = [
  "Necessidade e uso",
  "Preço total",
  "Orçamento e reserva",
  "Confiabilidade",
  "Influência do grupo",
  "Possibilidade de esperar",
];
export const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
