export type Actor = {
  id: string;
  handle: string;
  name: string;
  bio: string;
  followers: string;
  color: string;
};
export const actors: Actor[] = [
  {
    id: "lia",
    handle: "lia.movimento",
    name: "Lia Martins",
    bio: "música, movimento e dias de criação ☀\ncriadora · parcerias comerciais nos posts",
    followers: "24,8 mil",
    color: "#dd957e",
  },
  {
    id: "bia",
    handle: "bia.cria",
    name: "Bia Costa",
    bio: "ideias demais, café de menos. sábado tem oficina ✶",
    followers: "846",
    color: "#b6a3d4",
  },
  {
    id: "caio",
    handle: "caio.faz",
    name: "Caio Oliveira",
    bio: "criando com o que já tenho. SP / 011",
    followers: "512",
    color: "#8caeaa",
  },
  {
    id: "oficina",
    handle: "oficina.aberta",
    name: "Oficina Aberta",
    bio: "Sábado às 14h · criar é para todo mundo. Materiais compartilhados disponíveis.",
    followers: "1.203",
    color: "#d8bf72",
  },
];
export const actor = (id?: string) =>
  actors.find((a) => a.id === id) ?? actors[0];
export const campaigns: Record<
  string,
  {
    brand: string;
    domain: string;
    product: string;
    price: string;
    headline: string;
    copy: string;
    cta: string;
    art: string;
    details: string;
  }
> = {
  feed: {
    brand: "Onda",
    domain: "onda.example",
    product: "Pulse",
    price: "R$ 180",
    headline: "Seu mundo.\nSeu som.",
    copy: "Meu companheiro de criação chegou. Quem vai de Pulse no sábado? 🎧 #publi",
    cta: "Comprar agora",
    art: "headphones",
    details:
      "Onda pagou por este espaço. Você interagiu com conteúdos de áudio e música. Lia recebe comissão pelas compras do link.",
  },
  store: {
    brand: "Onda",
    domain: "onda.example",
    product: "Pulse",
    price: "R$ 180",
    headline: "O último drop.\nOu não?",
    copy: "O Pulse voltou com uma oferta especial. Corre no link para conferir o prazo e as opções. #publi",
    cta: "Ver oferta",
    art: "headphones",
    details:
      "Anúncio da Onda para pessoas interessadas em áudio. Compare o preço anunciado com o histórico na loja.",
  },
  live: {
    brand: "Passo",
    domain: "passo.example",
    product: "Tênis Passo",
    price: "R$ 125",
    headline: "Vai no\nseu ritmo.",
    copy: "Vocês pediram meu kit para sábado! Esse tênis virou parte de mim. Cupom LIA12 no link. #publi",
    cta: "Ver produto",
    art: "shoe",
    details:
      "Parceria paga com Passo. Lia recebeu o produto e recebe 12% de comissão pelas compras com o cupom. O preço final anunciado é R$ 125.",
  },
  reviews: {
    brand: "Vitrine",
    domain: "vitrine.example",
    product: "Volt Pocket",
    price: "R$ 89",
    headline: "Energia para\no dia inteiro*",
    copy: "A bateria que aparece em todo lugar. 4,9 estrelas e mais de mil avaliações. Será que funciona para você? #publi",
    cta: "Ver avaliações",
    art: "battery",
    details:
      "Destaque patrocinado pela Vitrine. A posição do produto no ranking é um espaço pago. A autonomia varia conforme o aparelho.",
  },
  subscription: {
    brand: "Clube+",
    domain: "clube.example",
    product: "Clube Criador",
    price: "7 dias grátis",
    headline: "Crie mais.\nComece grátis.",
    copy: "Meus vídeos agora têm outra cara ✨ Testei os efeitos do Clube+. Tem 7 dias para experimentar. #publi",
    cta: "Experimentar",
    art: "studio",
    details:
      "Publicidade do Clube+. Após 7 dias há renovação automática de R$ 35/mês. Serviços opcionais podem acrescentar valores.",
  },
  final: {
    brand: "Mercado 21",
    domain: "mercado21.example",
    product: "Kit de criação",
    price: "R$ 99",
    headline: "Uma ideia.\nOutro nível.",
    copy: "Sextou com kit novo! Criadores de verdade já garantiram. Últimas unidades, só hoje. #publi",
    cta: "Ver kit",
    art: "lamp",
    details:
      "Anúncio baseado nas suas interações com equipamentos de criação. A mensagem “criadores de verdade” vincula o produto à identidade do grupo.",
  },
};
export type StorySlide = {
  title: string;
  caption: string;
  art: string;
  link?: boolean;
  evidence?: string;
  poll?: string[];
};
export function storySlides(mission: string, person: string): StorySlide[] {
  const c = campaigns[mission];
  if (person === "lia")
    return [
      {
        title: "Um pedaço do meu dia.",
        caption: "Preparando tudo para a oficina de sábado ✶",
        art: "studio",
      },
      {
        title: c.headline,
        caption:
          mission === "live"
            ? "“Quero ver todo mundo com o mesmo tênis.” · 2,4 mil viram"
            : `“Todo mundo está falando do ${c.product}.”`,
        art: c.art,
        evidence:
          mission === "live"
            ? "comments"
            : mission === "feed"
              ? "trend"
              : undefined,
      },
      {
        title: "Vocês me perguntaram…",
        caption:
          mission === "live"
            ? "Parceria paga com Passo. Ganho 12% por compra pelo cupom LIA12."
            : `Parceria paga com ${c.brand}. Este story é publicidade.`,
        art: c.art,
        evidence:
          mission === "live"
            ? "disclosure"
            : mission === "feed"
              ? "profile"
              : undefined,
      },
      {
        title: c.price,
        caption: `O link do ${c.product} está aqui embaixo.`,
        art: c.art,
        link: true,
      },
    ];
  if (person === "bia")
    return [
      {
        title: "O grupo já está pronto 👀",
        caption:
          mission === "feed"
            ? "“Todo mundo vai de Pulse no sábado. Só falta você.”"
            : "“Se é do nosso grupo, vem com o mesmo!”",
        art: c.art,
        evidence:
          mission === "feed"
            ? "trend"
            : mission === "live"
              ? "comments"
              : undefined,
      },
      {
        title: "Qual é a sua?",
        caption: "Uma enquete entre amigos",
        art: "studio",
        poll: ["Quero o novo", "Vou com o meu"],
      },
      {
        title: "Achei o link!",
        caption: c.brand + " · " + c.price,
        art: c.art,
        link: true,
      },
    ];
  if (person === "caio")
    return [
      {
        title: "Meu kit de criação.",
        caption: "Um caderno, uma ideia e o que a gente já tem.",
        art: "studio",
      },
      {
        title: "Precisa mesmo trocar?",
        caption:
          mission === "reviews"
            ? "Meu celular parecia descarregar. Troquei o cabo e resolveu."
            : "Vou com meu tênis e um fone emprestado. Nos vemos lá!",
        art: "desk",
      },
    ];
  return [
    {
      title: "Sábado · 14h",
      caption:
        "Oficina de criação. Todo mundo é bem-vindo, com qualquer equipamento.",
      art: "studio",
    },
    {
      title: "Pode pegar emprestado.",
      caption:
        "Temos suporte disponível, sem cobrança. Combine a retirada pelo direct.",
      art: "lamp",
      evidence: mission === "final" ? "borrow" : undefined,
    },
  ];
}
