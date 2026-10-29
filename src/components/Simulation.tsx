import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Globe,
  Home,
  LockKeyhole,
  MessageCircle,
  ShoppingBag,
  Star,
} from "lucide-react";
import { Store, Reviews, Subscription, FinalScene } from "./Scenes";
import type { SceneProps } from "./Scenes";
import type { SimulationState, SimRoute } from "../game/simulation";
import { initialSimulation, navigateSimulation } from "../game/simulation";
import { missions, money } from "../game/content";
import { campaigns } from "../game/socialContent";
import { Social, LifestyleArt } from "./Social";
import { Modal } from "./Modal";

type Props = Omit<SceneProps, "select"> & {
  update: (patch: Partial<SimulationState>) => void;
  discover: (id: string) => void;
};
export function Simulation(props: Props) {
  const { state, record, update, discover } = props;
  const mission = missions[state.current].id;
  const c = campaigns[mission];
  const world = record.world ?? initialSimulation(mission);
  const route = world.trail[world.cursor];
  const frame = useRef<HTMLDivElement>(null);
  const previousRoute = useRef(route);
  useEffect(() => {
    if (
      previousRoute.current.page !== route.page ||
      previousRoute.current.person !== route.person
    ) {
      frame.current?.scrollIntoView({ block: "start", behavior: "instant" });
    }
    previousRoute.current = route;
  }, [route]);
  const [detail, setDetail] = useState<{ title: string; body: string } | null>(
    null,
  );
  const navigate = (r: SimRoute) => update(navigateSimulation(world, r));
  const select = (key: string, value: string) =>
    update({ selections: { ...world.selections, [key]: value } });
  const findEvidence = (id: string) =>
    missions[state.current].evidence.find((e) => e.id === id);
  const inspect = (id: string) => {
    const source = mission === "feed" ? missions[1] : missions[state.current];
    const evidence = source.evidence.find((e) => e.id === id);
    if (findEvidence(id)) discover(id);
    // These controls reveal the evidence on the actual page, without interrupting browsing.
    if (["history", "compare", "verified", "plans", "cancelpath"].includes(id))
      return;
    if (id === "clock") {
      props.notify("Oferta reaberta. O prazo voltou para 04:59.");
      return;
    }
    if (evidence) setDetail({ title: evidence.label, body: evidence.detail });
  };
  const sceneProps: SceneProps = { ...props, inspect, select };
  const isShop = route.page === "shop" || route.page === "account";
  return (
    <div className="simulation-world" ref={frame}>
      <div className="world-tabs">
        <button
          className={!isShop ? "active" : ""}
          onClick={() => navigate({ page: "feed" })}
        >
          <span className="loop-tab-icon">l</span>Loop{" "}
          <small>Rede social</small>
        </button>
        <button
          className={isShop ? "active" : ""}
          aria-label={`${c.brand} Loja`}
          onClick={() => navigate({ page: "shop" })}
        >
          <ShoppingBag size={15} />
          {c.brand}
          <small>Loja</small>
        </button>
        <span>
          <LockKeyhole size={12} /> Simulação
        </span>
      </div>
      <div className="world-address">
        <button
          aria-label="Voltar no ambiente"
          disabled={world.cursor === 0}
          onClick={() => update({ cursor: world.cursor - 1 })}
        >
          <ArrowLeft size={17} />
        </button>
        <button
          aria-label="Avançar no ambiente"
          disabled={world.cursor === world.trail.length - 1}
          onClick={() => update({ cursor: world.cursor + 1 })}
        >
          <ArrowRight size={17} />
        </button>
        <div>
          <LockKeyhole size={12} />
          <span>
            {isShop
              ? c.domain + "/"
              : `loop.example/${route.page === "feed" ? "" : route.page === "profile" ? route.person : route.page}`}
          </span>
        </div>
        <button
          aria-label="Ir para o feed"
          onClick={() => navigate({ page: "feed" })}
        >
          <Home size={16} />
        </button>
      </div>
      {isShop ? (
        <div className="sim-website">
          <div className="shop-return">
            <button onClick={() => navigate({ page: "feed" })}>
              <ArrowLeft size={14} />
              Voltar à publicação
            </button>
            <span>Você veio da Loop</span>
          </div>
          {(mission === "feed" || mission === "store") && (
            <Store {...sceneProps} />
          )}
          {mission === "live" && <ShoeStore {...sceneProps} />}
          {mission === "reviews" && <Reviews {...sceneProps} />}
          {mission === "subscription" && <Subscription {...sceneProps} />}
          {mission === "final" && <FinalScene {...sceneProps} />}
          <footer className="shop-footer">
            <b>{c.brand}</b>
            <span>
              <Globe size={14} /> Loja fictícia · Frete incluído · Sem pagamento
              real
            </span>
            <button
              onClick={() => navigate({ page: "messages", person: "oficina" })}
            >
              Dúvidas sobre a oficina <MessageCircle size={14} />
            </button>
          </footer>
        </div>
      ) : (
        <Social
          mission={mission}
          name={state.player.name}
          record={record}
          world={world}
          route={route}
          navigate={navigate}
          update={update}
          toggle={props.like}
          discover={discover}
          decide={props.decide}
        />
      )}
      {!record.outcome && !isShop && (
        <div className="world-decision">
          <span>Terminou de explorar?</span>
          {mission === "feed" ? (
            <>
              <button
                className="dark-button"
                onClick={() =>
                  props.decide({
                    kind: "wait",
                    label: "Guardar oferta para comparar",
                    cost: 0,
                    recurring: 0,
                  })
                }
              >
                Guardar e comparar <ArrowRight size={15} />
              </button>
              <button
                className="text-link"
                onClick={() =>
                  props.decide({
                    kind: "skip",
                    label: "Seguir sem guardar a oferta",
                    cost: 0,
                    recurring: 0,
                  })
                }
              >
                Seguir sem guardar
              </button>
            </>
          ) : (
            <>
              <button
                className="dark-button"
                onClick={() => navigate({ page: "shop" })}
              >
                Abrir {c.brand} <ChevronRight size={16} />
              </button>
              <button
                className="text-link"
                onClick={() =>
                  props.decide({
                    kind: "wait",
                    label: "Adiar a oferta vista na rede social",
                    cost: 0,
                    recurring: 0,
                  })
                }
              >
                Decidir depois
              </button>
            </>
          )}
        </div>
      )}
      {record.outcome && (
        <div className="world-receipt">
          <Check size={17} />
          <div>
            <b>{record.outcome.label}</b>
            <span>
              {record.outcome.cost > 0
                ? `${money(record.outcome.cost)} registrados no seu orçamento.`
                : "Escolha registrada."}{" "}
              Você pode continuar explorando ou abrir a reflexão.
            </span>
          </div>
        </div>
      )}
      {detail && (
        <Modal title={detail.title} onClose={() => setDetail(null)}>
          <div className="site-detail">
            <small>{c.domain} · INFORMAÇÕES</small>
            <p>{detail.body}</p>
            <button
              className="dark-button full"
              onClick={() => setDetail(null)}
            >
              Voltar à página
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ShoeStore({ record, inspect, select, offer, decide }: SceneProps) {
  const selections = record.world?.selections ?? {};
  const size = selections.size ?? "";
  const photo = Number(selections.photo ?? 0);
  const [tab, setTab] = useState("Detalhes");
  return (
    <div className="shoe-store">
      <header className="app-bar">
        <span className="app-wordmark">
          passo<span className="brand-dot">®</span>
        </span>
        <span className="tiny">PARA IR ALÉM DO ÓBVIO.</span>
        <ShoppingBag size={21} />
      </header>
      <div className="shoe-shop-promo">LIA12 / A seleção de Lia Martins</div>
      <div className="shoe-shop-grid">
        <div>
          <div className="shoe-product-image">
            <LifestyleArt kind="shoe" slide={photo} />
            <span>
              {photo === 0
                ? "PASSO / ARGILA"
                : photo === 1
                  ? "DETALHE / SOLADO"
                  : "VISTA / PERFIL"}
            </span>
          </div>
          <div className="shoe-thumbnails">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                aria-label={`Ver foto ${i + 1} do tênis`}
                aria-pressed={i === photo}
                onClick={() => select("photo", String(i))}
              >
                <LifestyleArt kind="shoe" slide={i} />
              </button>
            ))}
          </div>
        </div>
        <div className="shoe-product-info">
          <small>CASUAL · COLEÇÃO CRIAR</small>
          <h2>
            Seu próximo
            <br />
            passo.
          </h2>
          <div className="shoe-rating">
            <Star fill="currentColor" size={15} /> 4,7{" "}
            <span>· 128 avaliações simuladas</span>
          </div>
          <p>
            Um tênis para acompanhar seus dias. Cabedal em tecido, solado de
            borracha e acabamento em argila.
          </p>
          <strong className="price">
            R$ 125<small>,00</small>
          </strong>
          <span className="shipping">
            Preço final com cupom LIA12 · Frete incluído
          </span>
          <b className="size-title">Tamanho {size && `· ${size}`}</b>
          <div className="shoe-sizes">
            {["36", "37", "38", "39", "40", "41", "42", "43"].map((n) => (
              <button
                key={n}
                aria-pressed={size === n}
                onClick={() => select("size", n)}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            className="dark-button full"
            disabled={!size || !!record.outcome}
            onClick={() =>
              offer({
                kind: "buy",
                label: "Tênis Passo",
                cost: 12500,
                recurring: 0,
              })
            }
          >
            Adicionar ao carrinho <ShoppingBag size={17} />
          </button>
          {!size && <small>Selecione um tamanho para continuar.</small>}
          <button className="text-link" onClick={() => inspect("disclosure")}>
            Parceria paga · Ver detalhes
          </button>
        </div>
      </div>
      <div className="product-tabs">
        {["Detalhes", "Avaliações", "Entrega e troca"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => {
              setTab(t);
              if (t === "Detalhes") inspect("spec");
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="shoe-info-panel">
        {tab === "Detalhes" ? (
          <>
            <h3>Feito para o dia a dia.</h3>
            <p>
              Uso casual. Tecido leve, solado em borracha. Não é equipamento
              esportivo. A ficha não promete melhorar a criatividade.
            </p>
            <button className="text-link" onClick={() => inspect("spec")}>
              Ver ficha do produto
            </button>
          </>
        ) : tab === "Avaliações" ? (
          <>
            <p>
              <b>Marina · ★★★★☆</b> Confortável para caminhar. Escolhi meu
              tamanho habitual.
            </p>
            <p>
              <b>Caio · ★★★★☆</b> Gostei da cor, mas meu antigo também serve
              para a oficina.
            </p>
          </>
        ) : (
          <>
            <h3>Frete incluído</h3>
            <p>
              Entrega fictícia antes de sábado. Nenhum endereço ou dado de
              pagamento é necessário nesta simulação.
            </p>
          </>
        )}
      </div>
      {!record.outcome && (
        <div className="scene-actions">
          <button
            className="light-button"
            onClick={() =>
              decide({
                kind: "skip",
                label: "Ir com o tênis que já tenho",
                cost: 0,
                recurring: 0,
              })
            }
          >
            Ir com o meu tênis
          </button>
          <button
            className="text-link"
            onClick={() =>
              decide({
                kind: "wait",
                label: "Esperar para decidir sobre o tênis",
                cost: 0,
                recurring: 0,
              })
            }
          >
            Pensar mais um pouco
          </button>
        </div>
      )}
    </div>
  );
}
