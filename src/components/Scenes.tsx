import { useEffect, useState } from "react";
import {
  ArrowRight,
  Heart,
  Bookmark,
  MessageCircle,
  MoreHorizontal,
  Search,
  ShoppingBag,
  Star,
  ArrowUpRight,
  Check,
  Play,
  Pause,
  Volume2,
  Info,
  ChevronRight,
  Clock,
  SlidersHorizontal,
  Headphones as HeadphoneIcon,
  CheckCircle2,
  Package,
  RefreshCw,
  Plus,
  Minus,
} from "lucide-react";
import type { GameState, MissionRecord, Outcome } from "../game/types";
import { money } from "../game/content";
import { Headphones, Sneaker, Battery, Lamp } from "./Art";
type Props = {
  state: GameState;
  record: MissionRecord;
  inspect: (id: string) => void;
  like: (id: string) => void;
  decide: (outcome: Outcome) => void;
  offer: (outcome: Outcome) => void;
  notify: (text: string) => void;
};
const choice = (
  kind: Outcome["kind"],
  label: string,
  cost = 0,
  recurring = 0,
): Outcome => ({ kind, label, cost, recurring });
function AppBar({
  name,
  children,
}: {
  name: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="app-bar">
      <span className="app-wordmark">
        {name}
        <span className="brand-dot">.</span>
      </span>
      {children}
    </div>
  );
}
function Decision({
  record,
  children,
}: {
  record: MissionRecord;
  children: React.ReactNode;
}) {
  return record.outcome ? (
    <div className="decision-made">
      <CheckCircle2 size={19} />
      <span>
        Decisão registrada: <strong>{record.outcome.label}</strong>. Abra a
        reflexão para continuar.
      </span>
    </div>
  ) : (
    <div className="scene-actions">{children}</div>
  );
}
export function Feed({ record, inspect, like, decide, notify }: Props) {
  const [tab, setTab] = useState("Para você");
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="feed-scene">
      <AppBar name="loop">
        <span className="tiny">Seu mundo, um pouco mais perto.</span>
        <button
          className="icon-button"
          aria-label="Mensagem do grupo"
          onClick={() => inspect("trend")}
        >
          <MessageCircle size={21} />
          <span className="notification-dot" />
        </button>
      </AppBar>
      <div className="feed-tabs">
        {["Para você", "Seguindo", "Salvos"].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="stories">
        {["Seu grupo", "Lia M.", "Caio", "Oficina"].map((n, i) => (
          <button
            key={n}
            onClick={() =>
              i === 1
                ? inspect("profile")
                : i === 0
                  ? inspect("trend")
                  : notify(
                      i === 2
                        ? "Caio: “Vou levar o fone que já tenho. Nos vemos sábado!”"
                        : "Oficina: sábado, às 14h. Equipamentos compartilhados estarão disponíveis.",
                    )
            }
          >
            <span className={`avatar story a${i}`}>
              {["G", "L", "C", "O"][i]}
            </span>
            {n}
          </button>
        ))}
      </div>
      {(tab === "Para você" ||
        (tab === "Salvos" && record.likes.includes("saved"))) && (
        <article className="post">
          <div className="post-author">
            <button className="avatar a1" onClick={() => inspect("profile")}>
              L
            </button>
            <button className="author" onClick={() => inspect("profile")}>
              <strong>
                lia.movimento <CheckCircle2 size={13} />
              </strong>
              <small>Parceria paga com Onda</small>
            </button>
            <button
              className="icon-button"
              aria-label="Por que estou vendo este anúncio?"
              onClick={() => inspect("ad")}
            >
              <MoreHorizontal />
            </button>
          </div>
          <button
            className="feed-visual"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            <span className="image-overline">ONDA / PULSE</span>
            <span className="feed-art-copy">
              O mundo lá fora.
              <br />
              <em>Seu som aqui.</em>
            </span>
            <Headphones />
            <span className="image-bottom">
              NOVAS CORES. NOVAS POSSIBILIDADES. <ArrowUpRight size={20} />
            </span>
          </button>
          <button
            className="sponsored-link"
            onClick={() => setExpanded(!expanded)}
          >
            Conhecer o Pulse <ArrowRight size={18} />
          </button>
          <div className="post-toolbar">
            <button
              className={`icon-button ${record.likes.includes("lia") ? "liked" : ""}`}
              onClick={() => {
                like("lia");
                notify(
                  record.likes.includes("lia")
                    ? "Curtida removida."
                    : "Você curtiu. Seu feed agora dará mais destaque a conteúdos de áudio.",
                );
              }}
              aria-label="Curtir publicação"
              aria-pressed={record.likes.includes("lia")}
            >
              <Heart
                fill={record.likes.includes("lia") ? "currentColor" : "none"}
              />
            </button>
            <button
              className="icon-button"
              aria-label="Ver comentários"
              onClick={() => inspect("trend")}
            >
              <MessageCircle />
            </button>
            <span />
            <button
              className="icon-button"
              aria-label="Salvar publicação"
              aria-pressed={record.likes.includes("saved")}
              onClick={() => {
                like("saved");
                notify(
                  record.likes.includes("saved")
                    ? "Publicação removida dos salvos."
                    : "Publicação salva. Você pode encontrá-la na aba Salvos.",
                );
              }}
            >
              <Bookmark
                fill={record.likes.includes("saved") ? "currentColor" : "none"}
              />
            </button>
          </div>
          <div className="post-caption">
            <strong>
              {record.likes.includes("lia") ? "2.849" : "2.848"} curtidas
            </strong>
            <p>
              <b>lia.movimento</b> Meu novo companheiro de criação. Quem vai de
              Pulse no sábado? 🎧 <span>#publi</span>
            </p>
            <button className="text-link" onClick={() => inspect("ad")}>
              Por que este anúncio apareceu para mim?
            </button>
          </div>
          {expanded && (
            <div className="inline-detail">
              <h3>Onda Pulse · R$ 180</h3>
              <p>
                Fone sem fio, bateria de 30 horas. A loja pode ter outras
                opções. Guarde esta oferta para comparar no próximo capítulo.
              </p>
              <button
                className="dark-button"
                onClick={() => {
                  if (!record.likes.includes("saved")) like("saved");
                  notify("Oferta guardada para a visita à loja Onda.");
                }}
              >
                Guardar oferta <Bookmark size={16} />
              </button>
            </div>
          )}
        </article>
      )}
      {(tab === "Seguindo" || tab === "Para você") && (
        <article className="organic-post">
          <span className="avatar a2">C</span>
          <div>
            <b>caio.faz</b>
            <p>
              Um caderno, uma ideia e o que a gente já tem. Preparando a oficina
              de sábado ✨
            </p>
            <button
              className="text-link"
              onClick={() =>
                notify(
                  "Caio comentou: “Não precisa comprar equipamento para participar. A escola vai emprestar alguns materiais.”",
                )
              }
            >
              Ver conversa
            </button>
          </div>
        </article>
      )}
      {tab === "Salvos" && !record.likes.includes("saved") && (
        <div className="empty-state">
          <Bookmark />
          <h3>Suas referências ficam aqui.</h3>
          <p>Toque no marcador de uma publicação para guardar.</p>
        </div>
      )}
      {record.likes.includes("lia") && tab === "Para você" && (
        <div className="recommended">
          <HeadphoneIcon size={22} />
          <div>
            <b>Mais áudio para você</b>
            <p>Novos acessórios selecionados após sua curtida.</p>
          </div>
          <button className="text-link" onClick={() => inspect("ad")}>
            Entender
          </button>
        </div>
      )}
      <Decision record={record}>
        <button
          className="dark-button"
          onClick={() => decide(choice("wait", "Guardar e comparar na loja"))}
        >
          Guardar e comparar <ArrowRight size={17} />
        </button>
        <button
          className="light-button"
          onClick={() => decide(choice("skip", "Seguir sem guardar a oferta"))}
        >
          Seguir sem guardar
        </button>
      </Decision>
    </div>
  );
}
export function Store({
  state,
  record,
  inspect,
  offer,
  decide,
  notify,
}: Props) {
  const [remaining, setRemaining] = useState(299);
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState<"pulse" | "basic">(
    state.records.feed?.outcome?.kind === "skip" ? "basic" : "pulse",
  );
  const [tab, setTab] = useState("Visão geral");
  useEffect(() => {
    const timer = setInterval(
      () => setRemaining((v) => Math.max(0, v - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);
  const isBasic = product === "basic";
  const match =
    !query ||
    "pulse essencial fone áudio sem fio".includes(query.toLowerCase());
  return (
    <div className="store-scene">
      <AppBar name="onda">
        <span className="tiny">Áudio para a vida real.</span>
        <ShoppingBag size={21} />
      </AppBar>
      <div className="store-context">
        {state.records.feed?.outcome?.kind === "wait"
          ? "A oferta que você guardou no feed está aqui. Compare com o Essencial antes de decidir."
          : "Você seguiu sem guardar a oferta do feed. A loja começa pela alternativa Essencial; o Pulse continua disponível em Comparar."}
      </div>
      <div className="store-search">
        <Search size={17} />
        <input
          aria-label="Buscar na loja"
          placeholder="O que você quer ouvir hoje?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="promo-strip">
        <span>
          <span className="pulse-dot" /> DROP DA SEMANA
        </span>
        <button
          aria-label="Reabrir oferta e conferir prazo"
          onClick={() => {
            setRemaining(299);
            inspect("clock");
          }}
        >
          <Clock size={14} />{" "}
          {Math.floor(remaining / 60)
            .toString()
            .padStart(2, "0")}
          :{(remaining % 60).toString().padStart(2, "0")}{" "}
          <RefreshCw size={12} />
        </button>
      </div>
      {!match ? (
        <div className="empty-state">
          <Search />
          <h3>Nenhum produto para “{query}”.</h3>
          <button onClick={() => setQuery("")} className="text-link">
            Limpar busca
          </button>
        </div>
      ) : (
        <>
          <div className="product-hero">
            <div className={`product-art ${isBasic ? "basic" : ""}`}>
              <span className="product-number">
                {isBasic ? "02" : "01"} / ONDA AUDIO
              </span>
              <Headphones tone={isBasic ? "ink" : "mint"} />
              <span className="art-detail">
                {isBasic ? "ESSENCIAL / COM FIO" : "PULSE / SEM FIO"}
              </span>
            </div>
            <div className="product-info">
              <div className="eyebrow">OUÇA NO SEU RITMO</div>
              <h2>
                {isBasic ? "Essencial" : "Pulse"}
                <span>by onda</span>
              </h2>
              <button className="rating" onClick={() => inspect("compare")}>
                <Star size={14} fill="currentColor" /> 4,8{" "}
                <span>Compare antes de escolher</span>
              </button>
              <p>
                {isBasic
                  ? "Tudo o que você precisa para ouvir e criar. Conexão por cabo, sem recarga."
                  : "Silencie o ruído. Aumente as ideias. Seu próximo companheiro de criação."}
              </p>
              {!isBasic && <span className="old-price">R$ 360,00</span>}
              <div className="price">
                {isBasic ? "R$ 120" : "R$ 180"}
                <small>,00</small>
                {!isBasic && <span className="discount">−50%</span>}
              </div>
              <span className="shipping">Frete incluído · Compra fictícia</span>
              <div className="color-selector">
                <span>Cor: {isBasic ? "Grafite" : "Sálvia"}</span>
                <span className={`swatch ${isBasic ? "ink" : ""}`} />
              </div>
              <button
                className="stock-link"
                onClick={() =>
                  isBasic
                    ? notify(
                        "O Essencial está disponível para a oficina. O aviso de últimas 3 unidades pertence ao Pulse; você pode abrir esse modelo em Comparar.",
                      )
                    : inspect("stock")
                }
              >
                {isBasic ? "Disponível para a oficina" : "● Últimas 3 unidades"}{" "}
                <Info size={13} />
              </button>
              <button
                className="dark-button full"
                disabled={!!record.outcome}
                onClick={() =>
                  offer(
                    choice(
                      "buy",
                      isBasic ? "Fone Essencial" : "Fone Pulse",
                      isBasic ? 12000 : 18000,
                    ),
                  )
                }
              >
                Adicionar ao carrinho <ShoppingBag size={17} />
              </button>
            </div>
          </div>
          <div className="product-tabs">
            {["Visão geral", "Comparar", "Histórico de preço"].map((t) => (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => {
                  setTab(t);
                  if (t === "Comparar") inspect("compare");
                  if (t === "Histórico de preço") inspect("history");
                }}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "Visão geral" ? (
            <div className="spec-grid">
              <div>
                <HeadphoneIcon />
                <b>{isBasic ? "Conexão direta" : "30 horas"}</b>
                <small>{isBasic ? "Cabo de 1,2 metro" : "de bateria"}</small>
              </div>
              <div>
                <Package />
                <b>12 meses</b>
                <small>de garantia</small>
              </div>
              <div>
                <CheckCircle2 />
                <b>Áudio estéreo</b>
                <small>nos dois modelos</small>
              </div>
            </div>
          ) : tab === "Comparar" ? (
            <div className="comparison">
              <div>
                <b>Pulse</b>
                <p>Sem fio · 30h · R$ 180</p>
                <button
                  className="light-button"
                  onClick={() => setProduct("pulse")}
                >
                  Escolher Pulse
                </button>
              </div>
              <div>
                <b>Essencial</b>
                <p>Com fio · sem recarga · R$ 120</p>
                <button
                  className="light-button"
                  onClick={() => setProduct("basic")}
                >
                  Escolher Essencial
                </button>
              </div>
            </div>
          ) : (
            <div className="price-history">
              <p>Preços registrados nesta simulação</p>
              <div>
                <span>
                  Há 30 dias <b>R$ 189</b>
                </span>
                <span>
                  Há 7 dias <b>R$ 179</b>
                </span>
                <span>
                  Hoje <b>R$ 180</b>
                </span>
              </div>
              <small>R$ 360 não aparece no histórico disponível.</small>
            </div>
          )}
        </>
      )}
      <Decision record={record}>
        <button
          className="light-button"
          onClick={() => decide(choice("wait", "Adiar a compra do fone"))}
        >
          Decidir depois
        </button>
        <button
          className="text-link"
          onClick={() => decide(choice("skip", "Usar um fone emprestado"))}
        >
          Usar um fone emprestado
        </button>
      </Decision>
    </div>
  );
}
const frames = [
  [
    "O meu kit para criar",
    "“Vocês sempre perguntam o que eu uso para gravar…”",
  ],
  [
    "O tênis que me acompanha",
    "“Esse Passo virou parte do meu estilo. Olha a cor!”",
  ],
  ["Vem com a gente", "“Quero ver todo mundo com o mesmo no sábado.”"],
  [
    "Um cupom para você",
    "“Meu cupom LIA12 está no link. Parceria paga com Passo.”",
  ],
];
export function Live({ record, inspect, offer, decide }: Props) {
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(
      () =>
        setFrame((f) => {
          if (f === 3) {
            setPlaying(false);
            return f;
          }
          return f + 1;
        }),
      4500,
    );
    return () => clearInterval(id);
  }, [playing]);
  return (
    <div className="live-scene">
      <AppBar name="viva">
        <span className="tiny">Ideias que se encontram.</span>
        <span className="live-badge">REPLAY</span>
      </AppBar>
      <div className="live-grid">
        <div>
          <div className={`video-stage frame-${frame}`}>
            <div className="video-top">
              <span className="avatar a1">L</span>
              <div>
                <b>lia.movimento</b>
                <small>2,4 mil espectadores no original</small>
              </div>
            </div>
            <span className="video-chapter">0{frame + 1} / 04</span>
            <div className="video-art">
              <Sneaker />
            </div>
            <h2>{frames[frame][0]}</h2>
            <p className="video-caption">{frames[frame][1]}</p>
            <div className="video-controls">
              <button
                className="icon-button"
                onClick={() => {
                  if (frame === 3) setFrame(0);
                  setPlaying(!playing);
                }}
                aria-label={
                  playing ? "Pausar apresentação" : "Reproduzir apresentação"
                }
              >
                {playing ? <Pause /> : <Play fill="currentColor" />}
              </button>
              <div className="video-progress">
                {frames.map((_, i) => (
                  <button
                    key={i}
                    className={i <= frame ? "watched" : ""}
                    aria-label={`Ir ao trecho ${i + 1}`}
                    onClick={() => setFrame(i)}
                  />
                ))}
              </div>
              <Volume2 size={18} />
              <span>legendas • sem áudio</span>
            </div>
          </div>
          <div className="live-description">
            <h3>Meu kit para o sábado ✨</h3>
            <p>
              Uma apresentação simulada em quatro trechos. Use o play ou avance
              pela barra para assistir.
            </p>
            <button className="text-link" onClick={() => inspect("disclosure")}>
              Parceria paga · Ver detalhes <Info size={14} />
            </button>
          </div>
        </div>
        <aside className="chat-panel">
          <h3>
            <MessageCircle size={17} /> Na conversa
          </h3>
          <div className="chat-message">
            <b>bia.cria</b>
            <p>se é do nosso grupo, vem com o mesmo!!</p>
          </div>
          <div className="chat-message">
            <b>joao.zip</b>
            <p>ela recomenda tudo que eu gosto 👀</p>
          </div>
          <div className="chat-message">
            <b>luiza.faz</b>
            <p>mas precisa desse tênis para ir?</p>
          </div>
          <button className="text-link" onClick={() => inspect("comments")}>
            Investigar a conversa <ArrowUpRight size={14} />
          </button>
          <div className="live-product">
            <span className="eyebrow">PASSO / CRIAR</span>
            <b>Tênis casual</b>
            <span>R$ 125,00</span>
            <button className="text-link" onClick={() => inspect("spec")}>
              Ver ficha do produto
            </button>
            <button
              className="dark-button"
              disabled={!!record.outcome}
              onClick={() => offer(choice("buy", "Tênis Passo", 12500))}
            >
              Ver oferta <ArrowRight size={16} />
            </button>
          </div>
        </aside>
      </div>
      <Decision record={record}>
        <button
          className="light-button"
          onClick={() =>
            decide(choice("wait", "Esperar para decidir sobre o tênis"))
          }
        >
          Pensar mais um pouco
        </button>
        <button
          className="text-link"
          onClick={() => decide(choice("skip", "Ir com o tênis que já tenho"))}
        >
          Ir com o meu tênis
        </button>
      </Decision>
    </div>
  );
}
export function Reviews({ record, inspect, offer, decide }: Props) {
  const [verified, setVerified] = useState(false);
  const [sort, setSort] = useState("relevantes");
  const reviews = verified
    ? [
        [
          "Marina",
          "3",
          "Compra verificada",
          "Serve para uma recarga. A capacidade real ficou abaixo do que eu esperava.",
        ],
        [
          "Pedro",
          "2",
          "Compra verificada",
          "A bateria estava boa. Descobri que o problema era o meu cabo.",
        ],
        [
          "Iara",
          "4",
          "Compra verificada",
          "Para um dia curto funciona bem. Pesquise seu aparelho antes.",
        ],
      ]
    : [
        [
          "leo_991",
          "5",
          "Hoje · 12:01",
          "Melhor compra da minha vida! Recomendo demais!",
        ],
        [
          "ana_824",
          "5",
          "Hoje · 12:01",
          "Melhor compra da minha vida! Recomendo demais!",
        ],
        [
          "gui_170",
          "5",
          "Hoje · 12:01",
          "Melhor compra da minha vida! Recomendo demais!",
        ],
      ];
  const shown =
    sort === "menor"
      ? [...reviews].sort((a, b) => Number(a[1]) - Number(b[1]))
      : reviews;
  return (
    <div className="reviews-scene">
      <AppBar name="vitrine">
        <span className="tiny">Encontre seu próximo favorito.</span>
        <Star size={20} />
      </AppBar>
      <div className="review-product">
        <div className="battery-art">
          <Battery />
        </div>
        <div>
          <button className="rank-badge" onClick={() => inspect("ranking")}>
            #1 EM ACESSÓRIOS <Info size={13} />
          </button>
          <h2>Volt pocket</h2>
          <p>Energia para suas ideias.</p>
          <div className="review-rating">
            {verified ? "3,2" : "4,9"} <span>★★★★★</span>
          </div>
          <p>
            {verified ? "86 compras verificadas" : "1.284 avaliações"}{" "}
            <span className="muted">· média simulada</span>
          </p>
          <strong className="price">
            R$ 89<small>,00</small>
          </strong>
          <button
            className="dark-button"
            disabled={!!record.outcome}
            onClick={() => offer(choice("buy", "Bateria Volt Pocket", 8900))}
          >
            Ver oferta <ArrowRight size={17} />
          </button>
        </div>
      </div>
      <div className="review-filters">
        <button
          className={verified ? "filter selected" : "filter"}
          onClick={() => {
            setVerified(!verified);
            if (!verified) inspect("verified");
          }}
          aria-pressed={verified}
        >
          <CheckCircle2 size={16} /> Só compras verificadas
        </button>
        <label>
          <SlidersHorizontal size={15} />
          <select
            aria-label="Ordenar avaliações"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="relevantes">Mais relevantes</option>
            <option value="menor">Menor nota</option>
          </select>
        </label>
      </div>
      <div className="reviews-list">
        {shown.map(([name, rating, meta, body]) => (
          <article className="review" key={name}>
            <span className="avatar">{name[0].toUpperCase()}</span>
            <div>
              <b>{name}</b>
              <span className="review-stars">{"★".repeat(Number(rating))}</span>
              <small>{meta}</small>
              <p>{body}</p>
            </div>
          </article>
        ))}
      </div>
      <button
        className="text-link review-inspect"
        onClick={() => inspect("repeated")}
      >
        Comparar a origem dos comentários <Search size={15} />
      </button>
      <div className="alternative">
        <div>
          <b>E se o problema for o cabo?</b>
          <p>
            Um cabo novo custa R$ 25. A oficina também disponibiliza tomadas.
          </p>
        </div>
        <button
          className="light-button"
          disabled={!!record.outcome}
          onClick={() => offer(choice("buy", "Cabo de reposição", 2500))}
        >
          Escolher cabo
        </button>
      </div>
      <Decision record={record}>
        <button
          className="light-button"
          onClick={() =>
            decide(choice("wait", "Testar meu cabo antes de comprar"))
          }
        >
          Testar antes de comprar
        </button>
        <button
          className="text-link"
          onClick={() => decide(choice("skip", "Usar a tomada da oficina"))}
        >
          Usar a tomada da oficina
        </button>
      </Decision>
    </div>
  );
}
export function Subscription({
  record,
  inspect,
  offer,
  decide,
  notify,
}: Props) {
  const [extra, setExtra] = useState(true);
  const [cancelStep, setCancelStep] = useState(0);
  const [showFree, setShowFree] = useState(false);
  return (
    <div className="subscription-scene">
      <AppBar name="clube+">
        <span className="tiny">Um espaço para suas ideias.</span>
        <button
          className="text-link"
          onClick={() => {
            setCancelStep(1);
            notify(
              "Exploração do cancelamento: nenhuma assinatura real foi iniciada.",
            );
          }}
        >
          Minha conta
        </button>
      </AppBar>
      <div className="subscription-hero">
        <span className="eyebrow">SEU PRÓXIMO PASSO CRIATIVO</span>
        <h2>
          Crie sem limites.
          <br />
          <em>Comece sem pagar.</em>
        </h2>
        <p>As ferramentas que acompanham suas ideias.</p>
        <div className="plan">
          <span className="plan-label">MAIS ESCOLHIDO</span>
          <div className="plan-title">
            <b>Clube Criador</b>
            <span className="plan-orb">✳</span>
          </div>
          <div className="price">
            7 dias <small>grátis</small>
          </div>
          <p>Depois, R$ 35,00/mês</p>
          <ul>
            <li>
              <Check size={16} /> Exportações ilimitadas
            </li>
            <li>
              <Check size={16} /> Biblioteca de efeitos
            </li>
            <li>
              <Check size={16} /> Projetos em alta resolução
            </li>
          </ul>
          <label className="extra-option">
            <input
              type="checkbox"
              checked={extra}
              onChange={(e) => {
                setExtra(e.target.checked);
                inspect("terms");
              }}
            />
            <span>
              Adicionar pacote de modelos
              <small>+ R$ 9,00/mês após o teste</small>
            </span>
          </label>
          <button
            className="dark-button full"
            disabled={!!record.outcome}
            onClick={() =>
              offer(
                choice(
                  "subscribe",
                  extra ? "Teste com pacote de modelos" : "Teste sem extras",
                  0,
                  extra ? 4400 : 3500,
                ),
              )
            }
          >
            Começar meu teste <ArrowRight size={17} />
          </button>
          <button
            className="text-link terms-link"
            onClick={() => inspect("terms")}
          >
            Renovação automática · Ler condições
          </button>
        </div>
        <button
          className="text-link free-link"
          onClick={() => {
            setShowFree(!showFree);
            inspect("plans");
          }}
        >
          {showFree ? <Minus size={14} /> : <Plus size={14} />} Conhecer a opção
          gratuita
        </button>
        {showFree && (
          <div className="free-plan">
            <b>Clube Essencial · R$ 0</b>
            <p>3 exportações por mês. Você precisa de uma para a oficina.</p>
            <button
              className="light-button"
              disabled={!!record.outcome}
              onClick={() => decide(choice("skip", "Usar o plano gratuito"))}
            >
              Continuar no gratuito
            </button>
          </div>
        )}
      </div>
      {cancelStep > 0 && (
        <section className="cancel-demo">
          <span className="eyebrow">EXPLORAR A SAÍDA · {cancelStep}/3</span>
          <h3>
            {cancelStep === 1
              ? "Assinatura e cobrança"
              : cancelStep === 2
                ? "Tem certeza que quer ir?"
                : "Confirmar cancelamento"}
          </h3>
          <p>
            {cancelStep === 1
              ? "Seu teste pode ser encerrado pelo gerenciamento da conta."
              : cancelStep === 2
                ? "Você vai perder todos os recursos premium. Que tal pensar mais um pouco?"
                : "Na simulação, cancelar encerra a renovação. Não há cobrança ou assinatura real."}
          </p>
          {cancelStep < 3 ? (
            <button
              className="light-button"
              onClick={() => {
                setCancelStep(cancelStep + 1);
                if (cancelStep === 2) inspect("cancelpath");
              }}
            >
              {cancelStep === 1
                ? "Gerenciar cancelamento"
                : "Continuar cancelamento"}{" "}
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              className="light-button"
              disabled={!!record.outcome}
              onClick={() =>
                decide(
                  choice(
                    "cancel",
                    "Recusar teste após explorar o cancelamento",
                  ),
                )
              }
            >
              Encerrar sem assinar
            </button>
          )}
          <button className="text-link" onClick={() => setCancelStep(0)}>
            Voltar aos planos
          </button>
        </section>
      )}
      <Decision record={record}>
        <button
          className="text-link"
          onClick={() =>
            decide(choice("wait", "Pensar antes de iniciar o teste"))
          }
        >
          Decidir depois
        </button>
      </Decision>
    </div>
  );
}
export function FinalScene({ state, record, inspect, offer, decide }: Props) {
  const borrowed = record.seen.includes("borrow");
  return (
    <div className="final-scene">
      <AppBar name="mercado 21">
        <span className="tiny">Seu próximo projeto começa aqui.</span>
        <ShoppingBag size={20} />
      </AppBar>
      <div className="final-banner">
        <span>SEXTA CRIATIVA</span>
        <span>Só hoje. Últimas unidades.</span>
      </div>
      <div className="final-product">
        <div className="lamp-art">
          <span className="eyebrow">KIT / LUZ + SUPORTE</span>
          <Lamp />
          <span className="stamp">
            FAÇA
            <br />
            ACONTECER ↗
          </span>
        </div>
        <div>
          <span className="eyebrow">ESCOLHIDO PARA VOCÊ</span>
          <h2>
            Uma ideia.
            <br />
            Outro nível.
          </h2>
          <p>
            Criadores de verdade já garantiram. Seu kit para tirar o projeto do
            papel.
          </p>
          <span className="old-price">R$ 199,00</span>
          <div className="price">
            R$ 99<small>,00</small>
          </div>
          <button
            className="dark-button"
            disabled={!!record.outcome}
            onClick={() => offer(choice("buy", "Kit de luz e suporte", 9900))}
          >
            Ver carrinho <ShoppingBag size={17} />
          </button>
        </div>
      </div>
      <div className="investigation-links">
        <button onClick={() => inspect("bundle")}>
          Detalhes e itens do kit <ArrowUpRight size={16} />
        </button>
        <button onClick={() => inspect("audience")}>
          Por que este anúncio? <ArrowUpRight size={16} />
        </button>
        <button onClick={() => inspect("finalstock")}>
          Condições e disponibilidade <ArrowUpRight size={16} />
        </button>
      </div>
      <div className="school-message">
        <span className="avatar a3">O</span>
        <div>
          <b>Uma mensagem da oficina</b>
          <p>
            Temos equipamentos compartilhados. Consulte o que está disponível
            antes de sábado.
          </p>
          <button className="text-link" onClick={() => inspect("borrow")}>
            Consultar empréstimos
          </button>
        </div>
      </div>
      <div className="final-wallet">
        <span>Disponível após compromissos</span>
        <b>{money(state.balance - state.recurring)}</b>
        <span>Reserva desejada para sábado: R$ 180</span>
      </div>
      <Decision record={record}>
        <button
          className="light-button"
          onClick={() => {
            if (!borrowed) {
              inspect("borrow");
              return;
            }
            decide(choice("skip", "Pedir o suporte emprestado à escola"));
          }}
        >
          {borrowed
            ? "Pedir suporte emprestado"
            : "Consultar suporte emprestado"}
        </button>
        <button
          className="text-link"
          onClick={() =>
            decide(choice("wait", "Adiar o kit e avaliar depois da oficina"))
          }
        >
          Avaliar depois da oficina
        </button>
      </Decision>
    </div>
  );
}
export const sceneComponents = [
  Feed,
  Store,
  Live,
  Reviews,
  Subscription,
  FinalScene,
];
