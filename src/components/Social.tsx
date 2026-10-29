import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Heart,
  Home,
  Link,
  MessageCircle,
  MoreHorizontal,
  Pause,
  Play,
  Search,
  Send,
  ShoppingBag,
  VolumeX,
} from "lucide-react";
import { actors, actor, campaigns, storySlides } from "../game/socialContent";
import type { Actor } from "../game/socialContent";
import type { MissionRecord, Outcome } from "../game/types";
import type { SimRoute, SimulationState } from "../game/simulation";
import { sessionId } from "../game/engine";
import { Headphones, Sneaker, Battery, Lamp } from "./Art";
import { Modal } from "./Modal";

export function Portrait({
  person,
  small = false,
}: {
  person: Actor;
  small?: boolean;
}) {
  return (
    <span
      className={`social-avatar ${small ? "small" : ""}`}
      style={{ background: person.color }}
    >
      {person.id === "oficina" ? (
        <span className="oficina-symbol">✳</span>
      ) : (
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <path
            d="M8 84Q11 51 40 53Q70 51 74 84"
            fill={
              person.id === "lia"
                ? "#663b47"
                : person.id === "caio"
                  ? "#344b56"
                  : "#696286"
            }
          />
          <path
            d="M20 38Q15 6 40 7Q68 9 61 46L54 63H23Z"
            fill={person.id === "caio" ? "#2d2928" : "#43302c"}
          />
          <path d="M35 46H47V61Q40 67 33 59Z" fill="#b97957" />
          <ellipse
            cx="40"
            cy="33"
            rx="17"
            ry="22"
            fill={person.id === "bia" ? "#9e654e" : "#dba17d"}
          />
          <path
            d="M22 30Q17 6 42 8Q64 9 59 31Q47 24 42 16Q33 30 22 30"
            fill="#43302c"
          />
          <path
            d="M30 34H34M46 34H50M36 44Q40 47 45 43"
            fill="none"
            stroke="#50352f"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </span>
  );
}
export function LifestyleArt({
  kind,
  slide = 0,
}: {
  kind: string;
  slide?: number;
}) {
  if (kind === "headphones")
    return (
      <div className={`social-art headphones slide-${slide}`}>
        <Headphones tone={slide === 1 ? "ink" : "mint"} />
      </div>
    );
  if (kind === "shoe")
    return (
      <div className={`social-art shoe slide-${slide}`}>
        <Sneaker />
      </div>
    );
  if (kind === "battery")
    return (
      <div className="social-art battery">
        <Battery />
      </div>
    );
  if (kind === "lamp")
    return (
      <div className="social-art lamp">
        <Lamp />
      </div>
    );
  return (
    <div
      className={`social-art studio ${kind === "desk" ? "desk" : ""}`}
      aria-label="Mesa de criação com caderno, café e edição de vídeo"
      role="img"
    >
      <div className="studio-grid" />
      <div className="studio-sheet">
        <span>
          IDEIAS
          <br />
          QUE
          <br />
          <i>VIRAM.</i>
        </span>
        <small>SÁBADO / 14H</small>
      </div>
      <div className="studio-cup" />
      <div className="studio-pencil" />
      <div className="studio-player">
        <Play fill="currentColor" />
        <span>MEU PRIMEIRO FILME</span>
        <div className="studio-timeline" />
      </div>
    </div>
  );
}
type SocialProps = {
  mission: string;
  name: string;
  record: MissionRecord;
  world: SimulationState;
  route: SimRoute;
  navigate: (route: SimRoute) => void;
  update: (patch: Partial<SimulationState>) => void;
  toggle: (id: string) => void;
  discover: (id: string) => void;
  decide: (o: Outcome) => void;
};
export function Social(props: SocialProps) {
  const {
    mission,
    name,
    record,
    world,
    route,
    navigate,
    update,
    toggle,
    discover,
    decide,
  } = props;
  const c = campaigns[mission];
  const [story, setStory] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [sheet, setSheet] = useState<"ad" | "share" | null>(null);
  const [slide, setSlide] = useState(0);
  const [tab, setTab] = useState("Para você");
  const threadEnd = useRef<HTMLDivElement>(null);
  const liked = record.likes.includes("lia");
  const saved = record.likes.includes("saved");
  const person = actor(route.person);
  const profile = (id: string) => {
    navigate({ page: "profile", person: id });
    if (id === "lia")
      discover(
        mission === "feed" ? "profile" : mission === "live" ? "disclosure" : "",
      );
  };
  const openComments = () => {
    setCommentsOpen((v) => !v);
    discover(
      mission === "feed" ? "trend" : mission === "live" ? "comments" : "",
    );
  };
  const openDM = (id = "grupo") => {
    navigate({ page: "messages", person: id });
    discover(
      mission === "feed"
        ? "trend"
        : mission === "live"
          ? "comments"
          : mission === "final" && id === "oficina"
            ? "borrow"
            : "",
    );
  };
  const shop = () => {
    setStory(null);
    navigate({ page: "shop" });
  };
  const postComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    update({
      comments: [
        ...world.comments,
        { id: sessionId(), thread: "lia", author: name, text: comment.trim() },
      ].slice(-80),
    });
    setComment("");
  };
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const thread = route.person ?? "grupo";
    const text = message.trim();
    const reply =
      thread === "oficina"
        ? "Pode vir com o que você já tem! O suporte está disponível para empréstimo, sem custo. Retirada no sábado, às 13h45."
        : /preço|preco|quanto|cust|caro|valor/i.test(text)
          ? `O anúncio diz ${c.price}. Vale abrir a loja e conferir o total.`
          : /precis|obrig|meu|tenho/i.test(text)
            ? "Não precisa comprar para participar. A oficina recebe todo mundo, com qualquer equipamento."
            : thread === "lia"
              ? `Obrigada! O link da ${c.brand} é uma parceria paga. Compare com o que você precisa :)`
              : "Bia: eu gostei do novo! Caio: vou comparar primeiro. A gente se encontra lá de qualquer jeito.";
    update({
      messages: [
        ...world.messages,
        { id: sessionId(), thread, text, author: name },
        {
          id: sessionId(),
          thread,
          text: reply,
          author:
            thread === "oficina"
              ? "Oficina"
              : thread === "lia"
                ? "Lia"
                : "Grupo",
        },
      ].slice(-80),
    });
    if (thread === "oficina" && mission === "final") discover("borrow");
    setMessage("");
  };
  useEffect(() => {
    if (route.page === "messages")
      threadEnd.current?.scrollIntoView({ block: "nearest" });
  }, [world.messages.length, route.page]);
  const socialNav = [
    ["feed", Home, "Início"],
    ["explore", Search, "Pesquisar"],
    ["messages", Send, "Mensagens"],
    ["saved", Bookmark, "Salvos"],
    ["profile", Grid3X3, "Perfil"],
  ] as const;
  const followers = actors.filter((a) =>
    record.likes.includes("follow:" + a.id),
  );
  const showAd =
    route.page === "saved"
      ? saved
      : tab !== "Seguindo" || record.likes.includes("follow:lia");
  const currentThread = route.person ?? "grupo";
  return (
    <div className="social-app">
      <nav className="social-rail" aria-label="Navegação da rede social">
        <button
          className="loop-script"
          onClick={() => navigate({ page: "feed" })}
          aria-label="Loop, início"
        >
          loop
        </button>
        {socialNav.map(([page, Icon, label]) => (
          <button
            key={page}
            aria-label={label}
            aria-current={route.page === page ? "page" : undefined}
            onClick={() =>
              page === "messages"
                ? openDM()
                : navigate({
                    page,
                    person: page === "profile" ? "you" : undefined,
                  })
            }
          >
            <Icon size={23} />
            <span>{label}</span>
            {page === "messages" && <i className="social-dot" />}
          </button>
        ))}
        <span className="rail-footer">
          UMA REDE
          <br />
          SIMULADA
        </span>
      </nav>
      <div className="social-content">
        <header className="social-mobile-head">
          <button
            className="loop-script"
            onClick={() => navigate({ page: "feed" })}
          >
            loop
          </button>
          <div>
            <button
              aria-label="Ver salvos"
              onClick={() => navigate({ page: "saved" })}
            >
              <Bookmark />
            </button>
            <button aria-label="Mensagem do grupo" onClick={() => openDM()}>
              <Send />
            </button>
          </div>
        </header>
        {(route.page === "feed" || route.page === "saved") && (
          <>
            <div className="social-feed-heading">
              <div>
                {route.page === "saved" ? (
                  <h2>Salvos</h2>
                ) : (
                  ["Para você", "Seguindo"].map((t) => (
                    <button
                      key={t}
                      className={tab === t ? "selected" : ""}
                      onClick={() => setTab(t)}
                    >
                      {t}
                    </button>
                  ))
                )}
              </div>
              <span>LOOP / SEU DIA</span>
            </div>
            {route.page === "feed" && (
              <div className="social-stories" aria-label="Stories dos amigos">
                {actors.map((a) => (
                  <button
                    key={a.id}
                    aria-label={`Ver stories de ${a.name}`}
                    onClick={() => setStory(a.id)}
                  >
                    <span
                      className={`story-ring ${world.storyViews.includes(a.id + ":0") ? "seen" : ""}`}
                    >
                      <Portrait person={a} />
                    </span>
                    <span>{a.handle}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="social-feed-body">
              {showAd ? (
                <article className="social-post">
                  <header>
                    <button
                      onClick={() => setStory("lia")}
                      aria-label="Abrir story de Lia"
                    >
                      <Portrait person={actors[0]} small />
                    </button>
                    <button
                      className="post-person"
                      aria-label="Ver perfil de Lia"
                      onClick={() => profile("lia")}
                    >
                      <b>
                        lia.movimento <CheckCircle2 size={13} />
                        <span>· 2 h</span>
                      </b>
                      <small>Parceria paga com {c.brand}</small>
                    </button>
                    <button
                      className="social-icon"
                      aria-label="Opções do anúncio"
                      onClick={() => {
                        setSheet("ad");
                        discover(
                          mission === "feed"
                            ? "ad"
                            : mission === "final"
                              ? "audience"
                              : mission === "live"
                                ? "disclosure"
                                : mission === "reviews"
                                  ? "ranking"
                                  : "",
                        );
                      }}
                    >
                      <MoreHorizontal />
                    </button>
                  </header>
                  <div
                    className="social-post-image"
                    onDoubleClick={() => {
                      if (!liked) toggle("lia");
                    }}
                  >
                    <LifestyleArt kind={c.art} slide={slide} />
                    <div className="post-art-type">
                      <span>
                        {c.brand.toUpperCase()} /{" "}
                        {slide === 0
                          ? "NOVA COLEÇÃO"
                          : slide === 1
                            ? "OS DETALHES"
                            : "PARA O SEU DIA"}
                      </span>
                      <h2>
                        {slide === 0
                          ? c.headline
                          : slide === 1
                            ? "Olhe mais\nde perto."
                            : "Leve suas\nideias junto."}
                      </h2>
                    </div>
                    <span className="carousel-count">{slide + 1}/3</span>
                    {slide > 0 && (
                      <button
                        className="carousel-prev"
                        aria-label="Imagem anterior"
                        onClick={() => setSlide(slide - 1)}
                      >
                        <ChevronLeft size={19} />
                      </button>
                    )}
                    {slide < 2 && (
                      <button
                        className="carousel-next"
                        aria-label="Próxima imagem"
                        onClick={() => setSlide(slide + 1)}
                      >
                        <ChevronRight size={19} />
                      </button>
                    )}
                    <span className="product-tag">
                      <ShoppingBag size={13} />
                      {c.product}
                    </span>
                  </div>
                  <button
                    className="social-ad-link"
                    aria-label={`${c.cta} ${c.domain}`}
                    onClick={shop}
                  >
                    <span>{c.cta}</span>
                    <span>
                      {c.domain} <ChevronRight size={17} />
                    </span>
                  </button>
                  <div className="social-post-actions">
                    <button
                      aria-label="Curtir publicação"
                      aria-pressed={liked}
                      className={liked ? "hearted" : ""}
                      onClick={() => toggle("lia")}
                    >
                      <Heart fill={liked ? "currentColor" : "none"} />
                    </button>
                    <button aria-label="Ver comentários" onClick={openComments}>
                      <MessageCircle />
                    </button>
                    <button
                      aria-label="Compartilhar publicação"
                      onClick={() => setSheet("share")}
                    >
                      <Send />
                    </button>
                    <div className="carousel-dots">
                      {[0, 1, 2].map((i) => (
                        <button
                          key={i}
                          aria-label={`Ver imagem ${i + 1}`}
                          aria-pressed={slide === i}
                          onClick={() => setSlide(i)}
                          className={i === slide ? "active" : ""}
                        />
                      ))}
                    </div>
                    <button
                      aria-label="Salvar publicação"
                      aria-pressed={saved}
                      onClick={() => toggle("saved")}
                    >
                      <Bookmark fill={saved ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="social-caption">
                    <b>{liked ? "2.849" : "2.848"} curtidas</b>
                    <p>
                      <button onClick={() => profile("lia")}>
                        <b>lia.movimento</b>
                      </button>{" "}
                      {c.copy}
                    </p>
                    <button className="social-muted" onClick={openComments}>
                      Ver todos os {3 + world.comments.length} comentários
                    </button>
                    {commentsOpen && (
                      <div className="social-comments">
                        <p>
                          <b>bia.cria</b>{" "}
                          {mission === "feed"
                            ? "Todo mundo vai de Pulse no sábado. Só falta você!"
                            : "Se é do nosso grupo, vem com o mesmo!!"}
                        </p>
                        <p>
                          <b>caio.faz</b> Vou com o que eu já tenho. Precisa
                          mesmo trocar?
                        </p>
                        <p>
                          <b>luiza.faz</b> Ela recebe por essa indicação?
                        </p>
                        {world.comments.map((e) => (
                          <p key={e.id}>
                            <b>{e.author}</b> {e.text}
                          </p>
                        ))}
                      </div>
                    )}
                    <form
                      className="social-comment-form"
                      onSubmit={postComment}
                    >
                      <input
                        aria-label="Adicionar comentário"
                        placeholder="Adicione um comentário…"
                        value={comment}
                        maxLength={280}
                        onFocus={() => {
                          setCommentsOpen(true);
                          discover(
                            mission === "feed"
                              ? "trend"
                              : mission === "live"
                                ? "comments"
                                : "",
                          );
                        }}
                        onChange={(e) => setComment(e.target.value)}
                      />
                      <button disabled={!comment.trim()}>Publicar</button>
                    </form>
                  </div>
                </article>
              ) : (
                <div className="social-empty">
                  <Bookmark />
                  <h3>
                    {route.page === "saved"
                      ? "Suas referências ficam aqui."
                      : "Seu feed de quem você segue."}
                  </h3>
                  <p>
                    {route.page === "saved"
                      ? "Toque no marcador de uma publicação para salvá-la."
                      : "Siga Lia no perfil para ver também suas publicações."}
                  </p>
                  <button
                    onClick={() =>
                      route.page === "saved"
                        ? navigate({ page: "feed" })
                        : profile("lia")
                    }
                  >
                    {route.page === "saved"
                      ? "Explorar feed"
                      : "Ver perfil de Lia"}
                  </button>
                </div>
              )}
              {route.page === "feed" && (
                <article className="social-post organic-post">
                  <header>
                    <button
                      aria-label="Ver story de Caio"
                      onClick={() => setStory("caio")}
                    >
                      <Portrait person={actors[2]} small />
                    </button>
                    <button
                      className="post-person"
                      onClick={() => profile("caio")}
                    >
                      <b>
                        caio.faz <span>· 4 h</span>
                      </b>
                      <small>São Paulo</small>
                    </button>
                  </header>
                  <button
                    className="organic-image"
                    aria-label="Ver preparação de Caio"
                    onClick={() => setStory("caio")}
                  >
                    <LifestyleArt kind="studio" />
                  </button>
                  <div className="social-post-actions">
                    <button
                      aria-label="Curtir publicação de Caio"
                      aria-pressed={record.likes.includes("caio")}
                      onClick={() => toggle("caio")}
                    >
                      <Heart
                        fill={
                          record.likes.includes("caio")
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                    <button
                      aria-label="Conversar com Caio"
                      onClick={() => openDM("caio")}
                    >
                      <MessageCircle />
                    </button>
                    <button
                      aria-label="Ver perfil de Caio"
                      onClick={() => profile("caio")}
                    >
                      <Send />
                    </button>
                  </div>
                  <div className="social-caption">
                    <b>{record.likes.includes("caio") ? 189 : 188} curtidas</b>
                    <p>
                      <b>caio.faz</b> Um caderno, uma ideia e o que a gente já
                      tem. Preparando sábado ✨
                    </p>
                  </div>
                </article>
              )}
              {route.page === "feed" && liked && (
                <button className="social-recommendation" onClick={shop}>
                  <span>
                    Mais {mission === "feed" ? "áudio" : "ideias"} para você
                  </span>
                  <b>
                    Você interagiu com {c.brand}. Veja {c.product}.
                  </b>
                  <ArrowRight />
                </button>
              )}
            </div>
          </>
        )}
        {route.page === "profile" && route.person === "you" && (
          <section className="social-profile own-profile">
            <header>
              <span className="your-avatar">{name[0]}</span>
              <div>
                <h2>{name}</h2>
                <p>Seu perfil nesta simulação</p>
                <div className="profile-actions">
                  <button
                    className="social-blue"
                    onClick={() => navigate({ page: "saved" })}
                  >
                    Ver meus salvos
                  </button>
                  <button onClick={() => openDM()}>Mensagens</button>
                </div>
              </div>
            </header>
            <div className="profile-bio">
              <b>Seguindo · {followers.length}</b>
              <p>
                Suas conversas e perfis seguidos acompanham você nos capítulos.
                Comentários e salvos pertencem à publicação de cada fase.
              </p>
            </div>
            <div className="search-results">
              {followers.map((a) => (
                <button key={a.id} onClick={() => profile(a.id)}>
                  <Portrait person={a} small />
                  <span>
                    <b>{a.handle}</b>
                    <small>{a.name}</small>
                  </span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
            {!followers.length && (
              <div className="social-empty">
                <Grid3X3 />
                <h3>Seu olhar, suas referências.</h3>
                <p>
                  Visite perfis, siga criadores e salve publicações para voltar
                  a elas.
                </p>
                <button onClick={() => navigate({ page: "explore" })}>
                  Encontrar pessoas
                </button>
              </div>
            )}
          </section>
        )}
        {route.page === "profile" && route.person !== "you" && (
          <section className="social-profile">
            <header>
              <button
                onClick={() => setStory(person.id)}
                aria-label={`Ver stories de ${person.name}`}
              >
                <span className="story-ring">
                  <Portrait person={person} />
                </span>
              </button>
              <div>
                <h2>
                  {person.handle}{" "}
                  {person.id === "lia" && <CheckCircle2 size={18} />}
                </h2>
                <div className="profile-actions">
                  <button
                    className="social-blue"
                    onClick={() => toggle("follow:" + person.id)}
                  >
                    {record.likes.includes("follow:" + person.id)
                      ? "Seguindo"
                      : "Seguir"}
                  </button>
                  <button onClick={() => openDM(person.id)}>Mensagem</button>
                </div>
                <div className="profile-stats">
                  <span>
                    <b>128</b> publicações
                  </span>
                  <span>
                    <b>{person.followers}</b> seguidores
                  </span>
                  <span>
                    <b>382</b> seguindo
                  </span>
                </div>
              </div>
            </header>
            <div className="profile-bio">
              <b>{person.name}</b>
              <p>{person.bio}</p>
              {person.id === "lia" && (
                <>
                  <p>
                    Parceria paga com {c.brand} ·{" "}
                    {mission === "live"
                      ? "12% de comissão pelo cupom LIA12"
                      : "Comissão pelas compras do link"}
                  </p>
                  <button onClick={shop}>
                    <Link size={14} />
                    {c.domain}/{mission === "live" ? "lia12" : "colecao"}
                  </button>
                </>
              )}
            </div>
            <div className="profile-highlights">
              {["Meu dia", "Sábado", "Parcerias"].map((t, i) => (
                <button
                  key={t}
                  onClick={() => setStory(i === 1 ? "oficina" : person.id)}
                >
                  <span>{["☀", "✳", "↗"][i]}</span>
                  {t}
                </button>
              ))}
            </div>
            <div className="profile-grid-label">
              <Grid3X3 size={14} /> PUBLICAÇÕES
            </div>
            <div className="profile-grid">
              {[
                person.id === "lia" ? c.art : "studio",
                "studio",
                "desk",
                person.id === "lia" ? c.art : "desk",
                "lamp",
                "studio",
              ].map((kind, i) => (
                <button
                  key={i}
                  aria-label={`Abrir publicação ${i + 1} de ${person.name}`}
                  onClick={() =>
                    i === 0 && person.id === "lia"
                      ? shop()
                      : setStory(person.id)
                  }
                >
                  <LifestyleArt kind={kind} />
                  {i === 0 && person.id === "lia" && <ShoppingBag size={17} />}
                </button>
              ))}
            </div>
          </section>
        )}
        {route.page === "explore" && (
          <section className="social-explore">
            <h2>Pesquisar</h2>
            <label className="social-search">
              <Search size={18} />
              <input
                aria-label="Pesquisar perfis e produtos"
                placeholder="Pesquisar pessoas, produtos…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="search-results">
              {actors
                .filter((a) =>
                  (a.name + " " + a.handle)
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((a) => (
                  <button key={a.id} onClick={() => profile(a.id)}>
                    <Portrait person={a} small />
                    <span>
                      <b>{a.handle}</b>
                      <small>{a.name}</small>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                ))}
            </div>
            {(!search ||
              (c.product + " " + c.brand)
                .toLowerCase()
                .includes(search.toLowerCase())) && (
              <button className="search-product" onClick={shop}>
                <LifestyleArt kind={c.art} />
                <span>
                  {c.product}
                  <b>{c.price}</b>Visitar loja <ArrowRight size={15} />
                </span>
              </button>
            )}
            {search &&
              !actors.some((a) =>
                (a.name + " " + a.handle)
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              ) &&
              !(c.product + " " + c.brand)
                .toLowerCase()
                .includes(search.toLowerCase()) && (
                <p className="social-empty">
                  Nenhum resultado para “{search}”.
                </p>
              )}
          </section>
        )}
        {route.page === "messages" && (
          <section className="social-direct">
            <aside>
              <h2>Mensagens</h2>
              <small>CONTATOS DA SIMULAÇÃO</small>
              {["grupo", "lia", "caio", "oficina"].map((id) => (
                <button
                  key={id}
                  aria-current={currentThread === id ? "page" : undefined}
                  aria-label={
                    id === "grupo"
                      ? "Conversa do grupo"
                      : `Conversa com ${actor(id).name}`
                  }
                  onClick={() => openDM(id)}
                >
                  {id === "grupo" ? (
                    <span className="group-avatar">✳</span>
                  ) : (
                    <Portrait person={actor(id)} small />
                  )}
                  <span>
                    <b>{id === "grupo" ? "Sábado criativo" : actor(id).name}</b>
                    <small>
                      {id === "oficina"
                        ? "Equipamentos e retirada"
                        : id === "grupo"
                          ? "Bia, Caio, Lia e você"
                          : "Abrir conversa"}
                    </small>
                  </span>
                </button>
              ))}
            </aside>
            <div className="direct-thread">
              <header>
                <b>
                  {currentThread === "grupo"
                    ? "Sábado criativo ✳"
                    : actor(currentThread).name}
                </b>
                <small>Conversa fictícia · respostas roteirizadas</small>
              </header>
              <div className="direct-messages">
                <span className="message-date">HOJE</span>
                {currentThread === "grupo" ? (
                  <>
                    <div className="message-bubble">
                      <b>Bia</b>
                      <p>
                        {mission === "feed"
                          ? "Todo mundo vai de Pulse no sábado. Só falta você!"
                          : mission === "live"
                            ? "Se é do nosso grupo, vem com o mesmo tênis!!"
                            : "Olha o que eu achei para a oficina 👀"}
                      </p>
                    </div>
                    <button className="message-link" onClick={shop}>
                      <LifestyleArt kind={c.art} />
                      <b>
                        {c.brand} · {c.product}
                      </b>
                      <span>
                        {c.price} · Abrir link <ArrowRight size={14} />
                      </span>
                    </button>
                    <div className="message-bubble">
                      <b>Caio</b>
                      <p>
                        Vou levar o que já tenho. A oficina também empresta
                        material.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="message-bubble">
                    <b>{actor(currentThread).name}</b>
                    <p>
                      {currentThread === "oficina"
                        ? "Olá! A oficina é sábado às 14h. Temos um suporte para emprestar sem custo; a retirada deve ser combinada."
                        : currentThread === "lia"
                          ? `Oi! O link do ${c.product} está na bio. É parceria paga com ${c.brand}.`
                          : "Oi! Vou com meu material mesmo. Acho melhor testar o que a gente já tem antes."}
                    </p>
                  </div>
                )}
                {world.messages
                  .filter((e) => e.thread === currentThread)
                  .map((e) => (
                    <div
                      key={e.id}
                      className={`message-bubble ${e.author === name ? "mine" : ""}`}
                    >
                      <b>{e.author}</b>
                      <p>{e.text}</p>
                    </div>
                  ))}
                <div ref={threadEnd} />
              </div>
              {mission === "final" &&
                currentThread === "oficina" &&
                !record.outcome && (
                  <button
                    className="reserve-support"
                    onClick={() => {
                      discover("borrow");
                      decide({
                        kind: "skip",
                        label: "Pedir o suporte emprestado à escola",
                        cost: 0,
                        recurring: 0,
                      });
                    }}
                  >
                    Reservar suporte para sábado <Check size={15} />
                  </button>
                )}
              <form className="direct-compose" onSubmit={sendMessage}>
                <input
                  aria-label="Escrever mensagem"
                  value={message}
                  maxLength={280}
                  placeholder="Mensagem…"
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button aria-label="Enviar mensagem" disabled={!message.trim()}>
                  <Send size={19} />
                </button>
              </form>
            </div>
          </section>
        )}
      </div>
      <aside className="social-suggestions">
        <div className="suggestion-you">
          <span className="your-avatar">{name[0]}</span>
          <div>
            <b>{name}</b>
            <small>Seu perfil nesta simulação</small>
          </div>
        </div>
        <div className="suggestion-title">Pessoas para acompanhar</div>
        {actors.slice(0, 3).map((a) => (
          <div className="suggestion" key={a.id}>
            <button onClick={() => profile(a.id)}>
              <Portrait person={a} small />
              <span>
                <b>{a.handle}</b>
                <small>
                  {a.id === "lia" ? "Criadora de conteúdo" : "Do seu grupo"}
                </small>
              </span>
            </button>
            <button onClick={() => toggle("follow:" + a.id)}>
              {record.likes.includes("follow:" + a.id) ? "Seguindo" : "Seguir"}
            </button>
          </div>
        ))}
        <button className="weekend-card" onClick={() => openDM("oficina")}>
          <span>SÁBADO / 14H</span>
          <h3>
            Uma ideia.
            <br />
            Muitas mãos.
          </h3>
          <p>Oficina aberta. Veja o que levar e o que pegar emprestado.</p>
          <ArrowRight size={20} />
        </button>
        <small>
          {followers.length} perfis seguidos · Interações ficam nesta aba.
          <br />
          LOOP — AMBIENTE EDUCACIONAL FICTÍCIO
        </small>
      </aside>
      {sheet && (
        <Modal
          title={sheet === "ad" ? "Sobre este anúncio" : "Enviar publicação"}
          onClose={() => setSheet(null)}
        >
          {sheet === "ad" ? (
            <div className="social-sheet">
              <b>{c.brand} · Patrocinado</b>
              <p>{c.details}</p>
              <button
                className="dark-button full"
                onClick={() => {
                  setSheet(null);
                  shop();
                }}
              >
                Visitar site do anunciante <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <div className="social-share">
              {["grupo", "caio"].map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    update({
                      messages: [
                        ...world.messages,
                        {
                          id: sessionId(),
                          thread: id,
                          author: name,
                          text: `Compartilhei: ${c.product} — ${c.price}. ${c.domain}`,
                        },
                      ].slice(-80),
                    });
                    setSheet(null);
                    openDM(id);
                  }}
                >
                  <Send size={18} />
                  {id === "grupo" ? "Sábado criativo" : "Caio Oliveira"}
                  <span>Enviar</span>
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
      {story && (
        <Stories
          person={actor(story)}
          mission={mission}
          viewed={world.storyViews}
          selections={world.selections}
          close={() => setStory(null)}
          openShop={shop}
          discover={discover}
          seen={(id) => {
            if (!world.storyViews.includes(id))
              update({ storyViews: [...world.storyViews, id].slice(-100) });
          }}
          vote={(key, value) =>
            update({ selections: { ...world.selections, [key]: value } })
          }
          reply={(text) => {
            update({
              messages: [
                ...world.messages,
                { id: sessionId(), thread: story, author: name, text },
              ].slice(-80),
            });
            setStory(null);
            openDM(story);
          }}
        />
      )}
    </div>
  );
}

function Stories({
  person,
  mission,
  close,
  openShop,
  discover,
  seen,
  vote,
  reply,
  selections,
}: {
  person: Actor;
  mission: string;
  viewed: string[];
  selections: Record<string, string>;
  close: () => void;
  openShop: () => void;
  discover: (id: string) => void;
  seen: (id: string) => void;
  vote: (key: string, value: string) => void;
  reply: (text: string) => void;
}) {
  const slides = storySlides(mission, person.id);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(
    () => document.documentElement.dataset.motion === "reduced",
  );
  const [held, setHeld] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [text, setText] = useState("");
  const slide = slides[index];
  const callbacks = useRef({ seen, discover, close });
  callbacks.current = { seen, discover, close };
  useEffect(() => {
    setElapsed(0);
    callbacks.current.seen(person.id + ":" + index);
    if (slide.evidence) callbacks.current.discover(slide.evidence);
  }, [index, person.id, slide.evidence]);
  useEffect(() => {
    if (paused || held) return;
    const id = setInterval(() => setElapsed((x) => x + 100), 100);
    return () => clearInterval(id);
  }, [paused, held, index]);
  useEffect(() => {
    if (paused || elapsed < 6500) return;
    setElapsed(0);
    if (index < slides.length - 1) setIndex((i) => i + 1);
    else setPaused(true);
  }, [elapsed, index, slides.length, paused]);
  const key = "poll:" + person.id + ":" + index;
  return (
    <Modal title={`Stories de ${person.name}`} onClose={close} wide>
      <div
        className="story-player"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.target as HTMLElement).tagName === "INPUT") return;
          if (e.key === "ArrowRight") {
            e.preventDefault();
            setIndex((i) => Math.min(slides.length - 1, i + 1));
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            setIndex((i) => Math.max(0, i - 1));
          }
          if (e.key === " ") {
            e.preventDefault();
            setPaused((p) => !p);
          }
        }}
      >
        <div className="story-progress">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Ir ao story ${i + 1}`}
              onClick={() => setIndex(i)}
            >
              <span
                style={{
                  width:
                    i < index
                      ? "100%"
                      : i > index
                        ? "0%"
                        : `${Math.min(100, elapsed / 65)}%`,
                }}
              />
            </button>
          ))}
        </div>
        <header>
          <Portrait person={person} small />
          <div>
            <b>{person.handle}</b>
            <small>
              2 h · {index + 1}/{slides.length}
            </small>
          </div>
          <button
            aria-label={paused ? "Reproduzir stories" : "Pausar stories"}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play size={19} /> : <Pause size={19} />}
          </button>
          <VolumeX size={17} />
        </header>
        <div
          className="story-canvas"
          onPointerDown={() => setHeld(true)}
          onPointerUp={() => setHeld(false)}
          onPointerCancel={() => setHeld(false)}
          onPointerLeave={() => setHeld(false)}
        >
          <LifestyleArt kind={slide.art} />
          <div className="story-type">
            <small>
              {person.id === "lia" ? "DIÁRIO DE CRIAÇÃO" : "ENTRE AMIGOS"}
            </small>
            <h2>{slide.title}</h2>
            <p>{slide.caption}</p>
          </div>
        </div>
        <button
          className="story-prev"
          aria-label="Story anterior"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <ChevronLeft />
        </button>
        <button
          className="story-next"
          aria-label={
            index === slides.length - 1 ? "Fechar stories" : "Próximo story"
          }
          onClick={() =>
            index === slides.length - 1 ? close() : setIndex((i) => i + 1)
          }
        >
          <ChevronRight />
        </button>
        {slide.link && (
          <button className="story-link" onClick={openShop}>
            <Link size={18} /> VISITAR {campaigns[mission].brand.toUpperCase()}{" "}
            <ArrowRight size={17} />
          </button>
        )}
        {slide.poll && (
          <div className="story-poll">
            {slide.poll.map((option) => (
              <button
                key={option}
                aria-pressed={selections[key] === option}
                onClick={() => {
                  vote(key, option);
                  setPaused(true);
                }}
              >
                {option}
                {selections[key] === option && <Check size={16} />}
              </button>
            ))}
            {selections[key] && <small>Seu voto: {selections[key]}</small>}
          </div>
        )}
        <form
          className="story-reply"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) reply("Resposta ao story: " + text.trim());
          }}
        >
          <input
            aria-label="Responder ao story"
            placeholder="Responder ao story…"
            value={text}
            maxLength={240}
            onFocus={() => setPaused(true)}
            onChange={(e) => setText(e.target.value)}
          />
          <button aria-label="Enviar resposta ao story" disabled={!text.trim()}>
            <Send size={19} />
          </button>
          <button
            type="button"
            aria-label="Reagir ao story"
            aria-pressed={
              selections["heart:" + person.id + ":" + index] === "yes"
            }
            onClick={() =>
              vote(
                "heart:" + person.id + ":" + index,
                selections["heart:" + person.id + ":" + index] === "yes"
                  ? "no"
                  : "yes",
              )
            }
          >
            <Heart
              fill={
                selections["heart:" + person.id + ":" + index] === "yes"
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </form>
      </div>
    </Modal>
  );
}
