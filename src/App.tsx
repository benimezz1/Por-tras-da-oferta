import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Tag,
  Compass,
  Wallet,
  BookOpen,
  Check,
  CheckCircle2,
  Lock,
  ChevronRight,
  Eye,
  RotateCcw,
  Download,
  Settings2,
  X,
  LogOut,
  ShieldCheck,
  Target,
  Sparkles,
  Play,
  Clock,
  Info,
  ScanLine,
  Headphones as HeadphoneIcon,
} from "lucide-react";
import { missions, money, strategies } from "./game/content";
import { createGame, gameReducer, emptyRecord, assess } from "./game/engine";
import type {
  GameState,
  GameAction,
  Outcome,
  Reflection as ReflectionData,
} from "./game/types";
import { TabProgressStore, exportProgress } from "./services/persistence";
import { LegacyApi, backendEnabled } from "./services/api";
import { Headphones } from "./components/Art";
import { Modal } from "./components/Modal";
import { sceneComponents } from "./components/Scenes";
import { Reflection } from "./components/Reflection";
let store: TabProgressStore | undefined;
try {
  store = new TabProgressStore(sessionStorage);
} catch {
  /* blocked storage: memory-only with an explicit notice */
}
const api = new LegacyApi();
const restored = store?.load() ?? null;
type View = "home" | "map" | "play" | "reflection" | "reveal" | "results";
type Overlay =
  "start" | "help" | "settings" | "journal" | "exit" | "account" | null;
export default function App() {
  const [state, setState] = useState<GameState | null>(() =>
    restored?.player.mode === "demo" ? restored : null,
  );
  const [view, setView] = useState<View>("home");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [inspecting, setInspecting] = useState<string | null>(null);
  const [cart, setCart] = useState<Outcome | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [storageFailed, setStorageFailed] = useState(!store);
  const [checkingAccount, setCheckingAccount] = useState(
    !!restored && restored.player.mode === "account" && backendEnabled,
  );
  const notify = useCallback((text: string) => setToast(text), []);
  const closeOverlay = useCallback(() => {
    setOverlay(null);
    setError("");
  }, []);
  useEffect(() => {
    if (!state) return;
    try {
      store?.save(state);
    } catch {
      setStorageFailed(true);
    }
  }, [state]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 5500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
  }, [reduced]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const el = document.querySelector<HTMLElement>("[data-screen-heading]");
    el?.focus();
  }, [view, state?.current]);
  useEffect(() => {
    if (restored?.player.mode !== "account") return;
    let active = true;
    if (!backendEnabled) {
      try {
        store?.clear();
      } catch {
        setStorageFailed(true);
      }
      return;
    }
    api
      .me()
      .then(({ usuario }) => {
        if (!active) return;
        if (usuario.id === restored.player.id) setState(restored);
        else {
          store?.clear();
          setToast("A conta mudou. A campanha local anterior foi encerrada.");
        }
      })
      .catch(() => {
        if (active) {
          try {
            store?.clear();
          } catch {
            setStorageFailed(true);
          }
          setToast(
            "Sua sessão anterior expirou. Entre novamente para usar a conta.",
          );
        }
      })
      .finally(() => {
        if (active) setCheckingAccount(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const dispatch = (action: GameAction) =>
    setState((s) => (s ? gameReducer(s, action) : s));
  const mission = missions[state?.current ?? 0];
  const record =
    state && mission
      ? (state.records[mission.id] ?? emptyRecord())
      : emptyRecord();
  function startDemo(e: FormEvent) {
    e.preventDefault();
    try {
      store?.clear();
    } catch {
      setStorageFailed(true);
    }
    setState(createGame(name));
    setOverlay(null);
    setView("map");
  }
  async function authenticate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(e.currentTarget);
    try {
      if (register)
        await api.register(
          String(data.get("username")),
          String(data.get("password")),
          String(data.get("invite")),
        );
      else
        await api.login(
          String(data.get("username")),
          String(data.get("password")),
        );
      const { usuario } = await api.me();
      store?.clear();
      setState(createGame(usuario.username, "account", usuario.id));
      setOverlay(null);
      setView("map");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }
  function inspect(id: string) {
    dispatch({ type: "inspect", mission: mission.id, evidence: id });
    setInspecting(id);
  }
  function decide(outcome: Outcome) {
    dispatch({ type: "decide", mission: mission.id, outcome });
    notify("Decisão registrada. Abra a reflexão para descobrir os mecanismos.");
  }
  function complete(reflection: ReflectionData) {
    setRevealIndex(state!.current);
    dispatch({ type: "complete", mission: mission.id, reflection });
    setView("reveal");
  }
  async function leave() {
    setBusy(true);
    setError("");
    try {
      if (state?.player.mode === "account") await api.logout();
      store?.clear();
      setState(null);
      setOverlay(null);
      setView("home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao encerrar a sessão.");
    } finally {
      setBusy(false);
    }
  }
  const saved = state
    ? Object.values(state.records).filter((r) => r.completedAt).length
    : 0;
  if (checkingAccount)
    return (
      <main className="fatal" aria-busy="true">
        <h1>Conferindo sua sessão…</h1>
        <p>Seu percurso só será reaberto após confirmar a conta conectada.</p>
      </main>
    );
  return (
    <div className={`app ${view === "home" ? "landing" : ""}`}>
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      <header className="global-header">
        <button
          className="brand"
          onClick={() => setView("home")}
          aria-label="Por Trás da Oferta, início"
        >
          <span className="logo-mark">
            <Tag size={21} />
          </span>
          <span>
            por trás
            <br />
            <b>da oferta.</b>
          </span>
        </button>
        <nav aria-label="Principal">
          <button
            className={view === "home" ? "active" : ""}
            onClick={() => setView("home")}
          >
            O jogo
          </button>
          <button
            className={view === "map" ? "active" : ""}
            onClick={() =>
              state
                ? setView("map")
                : document.getElementById("chapters")?.scrollIntoView({
                    behavior: reduced ? "instant" : "smooth",
                  })
            }
          >
            A jornada
          </button>
          <button onClick={() => setOverlay("help")}>
            Como jogar <ArrowUpRight size={13} />
          </button>
        </nav>
        <div className="header-actions">
          {state ? (
            <>
              <span className="player-chip">
                <span className="status-dot" />
                {state.player.name}
              </span>
              <button
                className="icon-button"
                aria-label="Encerrar sessão"
                onClick={() => setOverlay("exit")}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <span className="school-label">
              PROJETO C4 <span>↗</span>
            </span>
          )}
          <button
            className="icon-button"
            aria-label="Ajustes de acessibilidade"
            onClick={() => setOverlay("settings")}
          >
            <Settings2 size={18} />
          </button>
        </div>
      </header>
      {storageFailed && (
        <div className="storage-alert" role="status">
          O navegador não permitiu salvar. Seu progresso ficará só na memória;
          exporte o percurso antes de sair.
        </div>
      )}
      <main id="main">
        {view === "home" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="status-dot" /> UMA EXPERIÊNCIA SOBRE SUAS
                  ESCOLHAS
                </div>
                <h1 data-screen-heading tabIndex={-1}>
                  Você escolhe.
                  <br />
                  Mas <span className="outlined">quem</span>
                  <br />
                  <em>influencia?</em>
                </h1>
                <p>
                  Um scroll. Uma oferta. Uma decisão.
                  <br />
                  Entre no jogo e descubra o que acontece
                  <br className="desktop-only" /> entre o desejo e o clique.
                </p>
                <div className="hero-actions">
                  <button
                    className="primary"
                    onClick={() =>
                      state
                        ? setView(state.current === 6 ? "results" : "map")
                        : setOverlay("start")
                    }
                  >
                    {state ? "Continuar minha jornada" : "Entrar no jogo"}{" "}
                    <ArrowUpRight size={20} />
                  </button>
                  <button
                    className="hero-help"
                    onClick={() => setOverlay("help")}
                  >
                    <span>
                      <Play size={15} fill="currentColor" />
                    </span>
                    Como funciona
                  </button>
                </div>
                <div className="hero-facts">
                  <span>
                    <Clock size={14} /> 25–35 minutos
                  </span>
                  <span>
                    <Wallet size={14} /> Dinheiro fictício
                  </span>
                  <span>
                    <Compass size={14} /> 6 capítulos
                  </span>
                </div>
              </div>
              <div
                className="hero-stage"
                aria-label="Uma oferta fictícia de fones cercada por estímulos de marketing"
              >
                <span className="orbit orbit-one" />
                <span className="orbit orbit-two" />
                <span className="stage-cross cross-one">+</span>
                <span className="stage-cross cross-two">+</span>
                <div className="floating-chip chip-top">
                  <span className="pulse-dot" /> SÓ HOJE! <b>04:59</b>
                </div>
                <div className="hero-product">
                  <div className="product-top">
                    <span>
                      onda<span>®</span>
                    </span>
                    <span>DROP 001 ↗</span>
                  </div>
                  <div className="hero-art-title">
                    SINTA.
                    <br />
                    OUÇA.
                    <br />
                    <i>REPITA.</i>
                  </div>
                  <Headphones />
                  <div className="hero-product-footer">
                    <div>
                      <span>PULSE / SÁLVIA</span>
                      <b>
                        R$ 180<small>,00</small>
                      </b>
                    </div>
                    <span className="round-arrow">
                      <ArrowUpRight size={25} />
                    </span>
                  </div>
                </div>
                <div className="floating-chip chip-left">
                  <span className="mini-avatars">
                    <i>L</i>
                    <i>C</i>
                    <i>B</i>
                  </span>
                  <span>
                    <b>Todo mundo está usando.</b>
                    <small>Você vai ficar de fora?</small>
                  </span>
                </div>
                <div className="floating-chip chip-bottom">
                  <ScanLine size={22} />
                  <span>
                    Uma boa oferta.
                    <br />
                    <b>Ou uma boa estratégia?</b>
                  </span>
                </div>
                <span className="scribble-note">olhe de novo ↗</span>
              </div>
            </section>
            <div className="marquee" aria-hidden="true">
              <span>URGÊNCIA</span>
              <i>✳</i>
              <span>PERTENCIMENTO</span>
              <i>✳</i>
              <span>INFLUÊNCIA</span>
              <i>✳</i>
              <span>ESCOLHAS</span>
              <i>✳</i>
              <span>CONSCIÊNCIA</span>
            </div>
            <section className="journey-preview" id="chapters">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">A JORNADA</div>
                  <h2>
                    Seis ambientes.
                    <br />
                    Um novo jeito de olhar.
                  </h2>
                </div>
                <p>
                  Explore plataformas fictícias que parecem familiares.
                  <br />
                  Investigue os sinais. Decida por você.
                </p>
              </div>
              <div className="chapter-preview-list">
                {missions.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() =>
                      state ? setView("map") : setOverlay("start")
                    }
                  >
                    <span className="chapter-num">0{i + 1}</span>
                    <span className="chapter-preview-content">
                      <small>{m.category}</small>
                      <b>{m.subtitle}</b>
                    </span>
                    <span className="chapter-symbol" style={{ color: m.color }}>
                      {["↗", "◒", "✳", "★", "∞", "◎"][i]}
                    </span>
                    <ArrowUpRight size={20} />
                  </button>
                ))}
              </div>
            </section>
            <section className="purpose">
              <span>
                COMPRAR É UMA ESCOLHA.
                <br />
                ENTENDER TAMBÉM.
              </span>
              <p>
                Não existe ponto por gastar menos ou por recusar tudo. O jogo
                valoriza as informações que você investiga e como você explica
                sua decisão.
              </p>
              <span className="ods">
                12{" "}
                <small>
                  CONSUMO E PRODUÇÃO
                  <br />
                  RESPONSÁVEIS
                </small>
              </span>
            </section>
          </>
        )}
        {state && view === "map" && (
          <div className="map-page">
            <div className="map-intro">
              <div className="eyebrow lime">SUA SEMANA COMEÇA AQUI</div>
              <h1 data-screen-heading tabIndex={-1}>
                Oi, {state.player.name}.<br />
                <em>Vamos olhar de novo?</em>
              </h1>
              <p>
                Sábado tem oficina de criação. Até lá, você vai encontrar
                ofertas, recomendações e decisões. Seu objetivo: chegar com o
                que precisa e entender o que influenciou cada escolha.
              </p>
              <div className="map-wallet">
                <Wallet />
                <div>
                  <small>SEU SALDO FICTÍCIO</small>
                  <b>{money(state.balance)}</b>
                </div>
                <span>
                  Reserva desejada
                  <br />
                  <strong>R$ 180 para sábado</strong>
                </span>
              </div>
              <p className="save-note">
                <ShieldCheck size={15} />
                {state.player.mode === "account"
                  ? "Conta conectada. Campanha salva apenas nesta aba; sincronização C4 ainda indisponível."
                  : "Modo demonstração. Progresso salvo apenas nesta aba; sem cadastro ou envio ao servidor."}
              </p>
              <button
                className="text-link light"
                onClick={() => setOverlay("journal")}
              >
                Abrir meu caderno <BookOpen size={16} />
              </button>
            </div>
            <div className="mission-list">
              {missions.map((m, i) => {
                const done = i < state.current;
                const available = i === state.current;
                return (
                  <button
                    className={`mission-row ${available ? "current" : ""} ${done ? "done" : ""}`}
                    key={m.id}
                    disabled={!done && !available}
                    onClick={() => {
                      if (done) {
                        setRevealIndex(i);
                        setView("reveal");
                      } else setView("play");
                    }}
                  >
                    <span className="mission-index">
                      {done ? (
                        <Check size={22} />
                      ) : (
                        String(i + 1).padStart(2, "0")
                      )}
                    </span>
                    <div>
                      <small>
                        {m.category} · {m.duration}
                      </small>
                      <h2>{m.title}</h2>
                      <span>
                        {available
                          ? "Seu próximo capítulo"
                          : done
                            ? "Rever descobertas"
                            : "Desbloqueie o capítulo anterior"}
                      </span>
                    </div>
                    <span>
                      {available ? (
                        <ArrowUpRight />
                      ) : done ? (
                        <ChevronRight />
                      ) : (
                        <Lock size={16} />
                      )}
                    </span>
                  </button>
                );
              })}
              {state.current === 6 && (
                <button
                  className="primary full"
                  onClick={() => setView("results")}
                >
                  Ver meu percurso completo <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        )}
        {state && mission && view === "play" && (
          <div className="game-shell">
            <aside className="mission-sidebar">
              <button className="back-link" onClick={() => setView("map")}>
                <ArrowLeft size={16} /> Minha jornada
              </button>
              <div className="chapter-label">
                <span>CAPÍTULO 0{state.current + 1}</span>
                <span>/ 06</span>
              </div>
              <h1 data-screen-heading tabIndex={-1}>
                {mission.title}
              </h1>
              <p>{mission.brief}</p>
              <div className="mission-goal">
                <Target size={19} />
                <div>
                  <small>LEMBRE DO SEU CONTEXTO</small>
                  <p>{mission.need}</p>
                </div>
              </div>
              <div className="wallet-card">
                <span>
                  <Wallet size={16} /> Saldo fictício
                </span>
                <b>{money(state.balance)}</b>
                <small>Reserva desejada: R$ 180,00</small>
                {state.recurring > 0 && (
                  <small>
                    Comprometido após teste: {money(state.recurring)}/mês
                  </small>
                )}
              </div>
              <button
                className="notebook-button"
                onClick={() => setOverlay("journal")}
              >
                <BookOpen size={18} />
                <span>
                  Caderno de pistas
                  <small>{record.seen.length} evidências neste capítulo</small>
                </span>
                <ChevronRight size={17} />
              </button>
              <div className="chapter-progress">
                {missions.map((m, i) => (
                  <span
                    key={m.id}
                    className={i <= state.current ? "filled" : ""}
                  />
                ))}
              </div>
              <div className="demo-note">
                <ShieldCheck size={14} />
                <span>
                  Ambiente fictício · Nada será cobrado.
                  <br />
                  Progresso apenas nesta aba.
                </span>
              </div>
            </aside>
            <div className="game-main">
              <div className="simulation-bar">
                <span>
                  <span className="status-dot" /> AMBIENTE SIMULADO
                </span>
                <span>
                  {mission.category} <Lock size={11} />
                </span>
              </div>
              {(() => {
                const Scene = sceneComponents[state.current];
                return (
                  <Scene
                    key={mission.id}
                    state={state}
                    record={record}
                    inspect={inspect}
                    like={(target) =>
                      dispatch({ type: "like", mission: mission.id, target })
                    }
                    decide={decide}
                    offer={setCart}
                    notify={notify}
                  />
                );
              })()}
              <div className="mission-footer">
                <span>
                  <Eye size={17} />
                  {record.outcome
                    ? "Agora, conecte os sinais à sua decisão."
                    : "Explore o ambiente e faça uma escolha para avançar."}
                </span>
                <button
                  className="primary"
                  disabled={!record.outcome}
                  onClick={() => setView("reflection")}
                >
                  Abrir reflexão <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </div>
        )}
        {state && mission && view === "reflection" && (
          <Reflection
            key={mission.id}
            mission={mission}
            record={record}
            onSubmit={complete}
            onDraft={(reflection) =>
              dispatch({ type: "draft", mission: mission.id, reflection })
            }
            onBack={() => setView("play")}
          />
        )}
        {state &&
          view === "reveal" &&
          (() => {
            const m = missions[revealIndex];
            const r = state.records[m.id];
            if (!r?.completedAt) return null;
            const result = assess(m.id, r);
            return (
              <div className="reveal-page">
                <div className="eyebrow lime">
                  CAPÍTULO 0{revealIndex + 1} · POR TRÁS DA CENA
                </div>
                <h1 data-screen-heading tabIndex={-1}>
                  Agora você vê
                  <br />
                  <em>o que estava ali.</em>
                </h1>
                <p className="reveal-intro">
                  {m.subtitle}. Sua escolha: <b>{r.outcome?.label}</b>. Comprar
                  ou recusar não muda a avaliação de reconhecimento.
                </p>
                <div className="reveal-summary">
                  <span>
                    <b>
                      {result.investigated}/{result.total}
                    </b>{" "}
                    evidências exploradas
                  </span>
                  <span>
                    <b>{result.recognized.length}</b> estratégias reconhecidas
                  </span>
                  <span>
                    <b>{money(r.outcome?.cost ?? 0)}</b> gasto fictício
                  </span>
                </div>
                <div className="reveal-grid">
                  {m.evidence.map((e) => (
                    <article key={e.id}>
                      <span
                        className={`evidence-state ${r.seen.includes(e.id) ? "seen" : ""}`}
                      >
                        {r.seen.includes(e.id)
                          ? "INVESTIGADA"
                          : "FICOU FORA DO SEU PERCURSO"}
                      </span>
                      <h2>{e.label}</h2>
                      <p>{e.detail}</p>
                      <div className="reveal-tags">
                        {e.strategies.map((s) => (
                          <span key={s}>
                            {r.reflection?.assignments[e.id]?.includes(s) ? (
                              <Check size={13} />
                            ) : (
                              <Eye size={13} />
                            )}{" "}
                            {strategies[s].name}
                          </span>
                        ))}
                      </div>
                      {e.strategies.map((s) => (
                        <p className="mechanism" key={s}>
                          {strategies[s].explanation}
                        </p>
                      ))}
                    </article>
                  ))}
                </div>
                {result.unsupported.length > 0 && (
                  <div className="review-note">
                    <Info size={20} />
                    <div>
                      <b>Algumas associações precisam de mais evidência.</b>
                      <p>
                        {result.unsupported
                          .map(
                            (x) =>
                              `${strategies[x.strategy]?.name ?? x.strategy} em “${x.evidence}”`,
                          )
                          .join("; ")}
                        . O material observado não sustenta diretamente essas
                        associações. Isso não é uma avaliação da sua capacidade
                        de decidir.
                      </p>
                    </div>
                  </div>
                )}
                <blockquote>
                  <span>SEU RACIOCÍNIO</span>
                  <p>“{r.reflection?.reason}”</p>
                  <small>{r.reflection?.criteria.join(" · ")}</small>
                </blockquote>
                <div className="reveal-bottom">
                  <button
                    className="light-button"
                    onClick={() => setView("map")}
                  >
                    Ver jornada
                  </button>
                  <button
                    className="primary"
                    onClick={() =>
                      setView(state.current === 6 ? "results" : "play")
                    }
                  >
                    {state.current === 6
                      ? "Ver meu percurso"
                      : "Próximo capítulo"}{" "}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            );
          })()}
        {state &&
          view === "results" &&
          (() => {
            const completed = missions.filter(
              (m) => state.records[m.id]?.completedAt,
            );
            const recognized = new Set(
              completed.flatMap(
                (m) => assess(m.id, state.records[m.id]).recognized,
              ),
            );
            const review = Object.keys(strategies).filter(
              (s) => !recognized.has(s as keyof typeof strategies),
            );
            const count = completed.reduce(
              (n, m) => n + state.records[m.id].seen.length,
              0,
            );
            return (
              <div className="results-page">
                <div className="result-hero">
                  <div className="result-seal">
                    <Eye size={48} />
                    <span>
                      OLHAR
                      <br />
                      EM CONSTRUÇÃO
                    </span>
                  </div>
                  <div className="eyebrow lime">
                    SEU PERCURSO · {saved}/6 CAPÍTULOS
                  </div>
                  <h1 data-screen-heading tabIndex={-1}>
                    A próxima escolha
                    <br />
                    <em>vem com outro olhar.</em>
                  </h1>
                  <p>
                    {state.player.name}, aqui estão as evidências do seu
                    percurso.
                    <br />
                    Um registro de aprendizagem, sem rótulos sobre você.
                  </p>
                </div>
                <div className="results-stats">
                  <div>
                    <small>ESTRATÉGIAS RECONHECIDAS</small>
                    <b>
                      {recognized.size}
                      <span>/8</span>
                    </b>
                    <p>Associadas a evidências corretas ao menos uma vez.</p>
                  </div>
                  <div>
                    <small>EVIDÊNCIAS EXPLORADAS</small>
                    <b>
                      {count}
                      <span>
                        /{missions.reduce((a, m) => a + m.evidence.length, 0)}
                      </span>
                    </b>
                    <p>Informações abertas durante suas decisões.</p>
                  </div>
                  <div>
                    <small>SALDO FICTÍCIO</small>
                    <b className="money-result">{money(state.balance)}</b>
                    <p>
                      {state.recurring
                        ? `${money(state.recurring)} comprometidos por mês após o teste.`
                        : "Sem assinaturas futuras nesta campanha."}
                    </p>
                  </div>
                </div>
                <div className="results-columns">
                  <section>
                    <h2>O que você passou a enxergar</h2>
                    <div className="skills-list">
                      {Object.entries(strategies).map(([code, s]) => (
                        <div key={code}>
                          <span
                            className={
                              recognized.has(code as keyof typeof strategies)
                                ? "skill-icon earned"
                                : "skill-icon"
                            }
                          >
                            {recognized.has(code as keyof typeof strategies) ? (
                              <Check size={18} />
                            ) : (
                              <RotateCcw size={16} />
                            )}
                          </span>
                          <div>
                            <b>{s.name}</b>
                            <p>
                              {recognized.has(code as keyof typeof strategies)
                                ? "Reconhecida em pelo menos uma evidência."
                                : s.question}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="method-note">
                      Este indicador usa as associações registradas. Não mede
                      sua personalidade nem comprova domínio fora do jogo.{" "}
                      {review.length === 0
                        ? "Experimente aplicar as perguntas a novas ofertas."
                        : `${review.length} estratégias merecem outra visita.`}
                    </p>
                  </section>
                  <section>
                    <h2>Escolhas que contam sua história</h2>
                    <div className="decision-timeline">
                      {completed.map((m, i) => {
                        const r = state.records[m.id];
                        return (
                          <button
                            key={m.id}
                            onClick={() => {
                              setRevealIndex(i);
                              setView("reveal");
                            }}
                          >
                            <span>0{i + 1}</span>
                            <div>
                              <small>{m.subtitle}</small>
                              <b>{r.outcome?.label}</b>
                              <p>{r.reflection?.criteria.join(" · ")}</p>
                            </div>
                            <ArrowUpRight size={17} />
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </div>
                <div className="achievement-row">
                  {[
                    {
                      icon: <SearchBadge />,
                      label: "Olhar investigativo",
                      earned: count >= 12,
                      text: "Explore 12 evidências",
                    },
                    {
                      icon: <BookOpen />,
                      label: "Percurso registrado",
                      earned: saved === 6,
                      text: "Conclua os seis capítulos",
                    },
                    {
                      icon: <Compass />,
                      label: "Conexões construídas",
                      earned: recognized.size >= 6,
                      text: "Reconheça seis estratégias",
                    },
                  ].map((a) => (
                    <div key={a.label} className={a.earned ? "earned" : ""}>
                      {a.icon}
                      <span>
                        <b>{a.label}</b>
                        <small>
                          {a.earned ? "Conquista desbloqueada" : a.text}
                        </small>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="reserve-summary">
                  <Wallet size={23} />
                  <p>
                    {state.balance - state.recurring >= 18000
                      ? "Sua reserva de R$ 180 cabe no saldo disponível após os compromissos."
                      : "O saldo após compromissos ficou abaixo da reserva desejada de R$ 180. Vale rever o que pode ser adiado para o sábado."}{" "}
                    Isso descreve o orçamento fictício, não atribui uma nota à
                    compra.
                  </p>
                </div>
                <div className="mcp-card">
                  <span className="mcp-icon">
                    <Sparkles size={25} />
                  </span>
                  <div>
                    <span className="eyebrow">O APRENDIZADO CONTINUA</span>
                    <h2>Leve esse olhar para fora do jogo.</h2>
                    <p>
                      A integração futura com o assistente permitirá consultar o
                      percurso e refletir sobre anúncios. Nesta versão, a
                      campanha está apenas no navegador. Você já pode exportar
                      seu registro.
                    </p>
                  </div>
                  <button
                    className="primary"
                    onClick={() => exportProgress(state)}
                  >
                    Exportar percurso <Download size={17} />
                  </button>
                </div>
                <div className="reveal-bottom">
                  <button
                    className="light-button"
                    onClick={() => setView("map")}
                  >
                    Rever capítulos
                  </button>
                  <button
                    className="text-link light"
                    onClick={() => setOverlay("exit")}
                  >
                    Encerrar e apagar esta sessão <LogOut size={16} />
                  </button>
                </div>
              </div>
            );
          })()}
      </main>
      <footer className="site-footer">
        <span>
          POR TRÁS DA OFERTA <span>© 2026</span>
        </span>
        <span>Pesquisa, tecnologia e escolhas conscientes.</span>
        <button onClick={() => setOverlay("help")}>
          Colégio Rio Branco · C4 <ArrowUpRight size={13} />
        </button>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Dispensar aviso"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {overlay && (
        <Modal
          title={
            overlay === "start"
              ? "Sua jornada começa aqui"
              : overlay === "help"
                ? "Antes do primeiro clique"
                : overlay === "settings"
                  ? "No seu ritmo"
                  : overlay === "journal"
                    ? "Seu caderno de pistas"
                    : overlay === "exit"
                      ? "Encerrar esta sessão?"
                      : "Conectar minha conta"
          }
          onClose={closeOverlay}
          wide={overlay === "journal"}
        >
          {overlay === "start" && (
            <form onSubmit={startDemo}>
              <p>
                Um orçamento de <b>R$ 500 fictícios</b>. Seis ambientes para
                explorar. Uma oficina no sábado.
              </p>
              <label className="form-label" htmlFor="nickname">
                Como podemos chamar você?
              </label>
              <input
                id="nickname"
                className="text-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                placeholder="Um apelido (opcional)"
                autoComplete="off"
              />
              <div className="privacy-note">
                <ShieldCheck size={20} />
                <p>
                  Esta demonstração não cria conta. As escolhas ficam nesta aba
                  do navegador. Use “Encerrar sessão” para apagá-las ao
                  terminar, especialmente em um computador compartilhado.
                </p>
              </div>
              <button className="primary full" type="submit">
                Começar minha jornada <ArrowRight size={18} />
              </button>
              {backendEnabled && (
                <button
                  className="text-link auth-link"
                  type="button"
                  onClick={() => setOverlay("account")}
                >
                  Já tenho uma conta / cadastrar
                </button>
              )}
            </form>
          )}
          {overlay === "help" && (
            <div className="help-content">
              <p>
                Você está se preparando para uma oficina de criação. Precisa
                resolver o áudio e quer reservar R$ 180 para transporte e
                alimentação.
              </p>
              <ol>
                <li>
                  <b>Explore de verdade.</b> Abra perfis, compare produtos,
                  filtre avaliações e percorra os menus.
                </li>
                <li>
                  <b>Investigue.</b> Informações abertas entram no seu caderno
                  de pistas.
                </li>
                <li>
                  <b>Escolha.</b> Comprar, esperar ou usar uma alternativa muda
                  seu percurso e seu saldo.
                </li>
                <li>
                  <b>Conecte os sinais.</b> Associe estratégias às evidências e
                  explique seu raciocínio.
                </li>
              </ol>
              <p>
                As explicações aparecem após a decisão. Reconhecer uma técnica e
                decidir comprar são coisas diferentes.
              </p>
              <div className="privacy-note">
                <Info size={20} />
                <p>
                  Projeto baseado no Relatório Final C3, especialmente a
                  proposta do capítulo 5. Marcas, anúncios e valores são
                  fictícios. O jogo não realiza pagamentos nem diagnostica
                  comportamentos.
                </p>
              </div>
              <button className="primary full" onClick={closeOverlay}>
                Entendi <Check size={18} />
              </button>
            </div>
          )}
          {overlay === "settings" && (
            <>
              <p>
                Use Tab para navegar, Enter para ativar botões e Escape para
                fechar janelas.
              </p>
              <label className="settings-option">
                <span>
                  Reduzir movimento
                  <small>Desativa animações e transições decorativas.</small>
                </span>
                <input
                  type="checkbox"
                  checked={reduced}
                  onChange={(e) => setReduced(e.target.checked)}
                />
              </label>
              <p>
                As apresentações têm texto visível e não dependem de áudio. Você
                pode pausar e explorar sem limite de tempo; os contadores fazem
                parte das ofertas simuladas.
              </p>
            </>
          )}
          {overlay === "journal" && (
            <div className="journal-content">
              {!state ||
              Object.values(state.records).every((r) => r.seen.length === 0) ? (
                <div className="empty-state">
                  <BookOpen size={35} />
                  <h3>Seu olhar deixa pistas.</h3>
                  <p>
                    As informações que você abrir nos ambientes aparecerão aqui.
                  </p>
                </div>
              ) : (
                missions
                  .filter((m) => state.records[m.id]?.seen.length)
                  .map((m) => (
                    <section key={m.id}>
                      <h3>{m.subtitle}</h3>
                      {m.evidence
                        .filter((e) => state.records[m.id].seen.includes(e.id))
                        .map((e) => (
                          <article key={e.id}>
                            <Eye size={17} />
                            <div>
                              <b>{e.label}</b>
                              <p>{e.detail}</p>
                            </div>
                          </article>
                        ))}
                    </section>
                  ))
              )}
              {state && (
                <button
                  className="light-button"
                  onClick={() => exportProgress(state)}
                >
                  Exportar registro da sessão <Download size={16} />
                </button>
              )}
            </div>
          )}
          {overlay === "exit" && (
            <>
              <p>
                Isso apaga o progresso desta aba e, se houver conta conectada,
                encerra o login. Você pode exportar seu registro antes de sair.
              </p>
              {state && (
                <button
                  className="light-button full"
                  onClick={() => exportProgress(state)}
                >
                  Exportar antes de sair <Download size={17} />
                </button>
              )}
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
              <button
                className="danger-button full"
                disabled={busy}
                onClick={leave}
              >
                {busy ? "Encerrando…" : "Encerrar e apagar progresso local"}
              </button>
            </>
          )}
          {overlay === "account" && (
            <form onSubmit={authenticate}>
              <p>
                O login usa o backend na mesma origem. A campanha C4 continua
                salva apenas nesta aba até existir sincronização compatível.
              </p>
              <label className="form-label">
                Apelido
                <input
                  className="text-input"
                  name="username"
                  required
                  minLength={3}
                  maxLength={24}
                  pattern="[a-zA-Z0-9_.\-]+"
                  autoComplete="username"
                />
              </label>
              <label className="form-label">
                Senha
                <input
                  className="text-input"
                  name="password"
                  type="password"
                  required
                  minLength={register ? 10 : 1}
                  maxLength={128}
                  autoComplete={register ? "new-password" : "current-password"}
                />
              </label>
              {register && (
                <label className="form-label">
                  Código de inscrição
                  <input
                    className="text-input"
                    name="invite"
                    required
                    autoComplete="off"
                  />
                </label>
              )}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <button className="primary full" disabled={busy}>
                {busy ? "Conectando…" : register ? "Criar conta" : "Entrar"}
              </button>
              <button
                type="button"
                className="text-link auth-link"
                onClick={() => setRegister(!register)}
              >
                {register
                  ? "Já tenho conta"
                  : "Cadastrar com código de inscrição"}
              </button>
            </form>
          )}
        </Modal>
      )}
      {inspecting && mission && (
        <Modal
          title={mission.evidence.find((e) => e.id === inspecting)!.label}
          onClose={() => setInspecting(null)}
        >
          <div className="evidence-modal">
            <span className="eyebrow">
              <Eye size={15} /> INFORMAÇÃO ENCONTRADA
            </span>
            <p>{mission.evidence.find((e) => e.id === inspecting)!.detail}</p>
            <div className="evidence-saved">
              <BookOpen size={17} /> Adicionada ao seu caderno. A interpretação
              vem depois da sua escolha.
            </div>
            <button
              className="primary full"
              onClick={() => setInspecting(null)}
            >
              Continuar explorando <ArrowRight size={17} />
            </button>
          </div>
        </Modal>
      )}
      {cart && state && (
        <Modal title="Seu carrinho fictício" onClose={() => setCart(null)}>
          <div className="cart-line">
            <ShoppingIcon />
            <div>
              <b>{cart.label}</b>
              <small>
                {cart.kind === "subscribe"
                  ? "Teste de 7 dias · renovação automática"
                  : "Uma unidade · frete incluído"}
              </small>
            </div>
            <b>{money(cart.cost)}</b>
          </div>
          {cart.recurring > 0 && (
            <div className="recurring-warning">
              <Clock size={18} />
              <p>
                Depois do teste: <b>{money(cart.recurring)}/mês</b>. Esse
                compromisso ficará separado do saldo atual. Nenhuma cobrança
                real será feita.
              </p>
            </div>
          )}
          <dl className="cart-totals">
            <div>
              <dt>Saldo atual</dt>
              <dd>{money(state.balance)}</dd>
            </div>
            <div>
              <dt>Total hoje</dt>
              <dd>{money(cart.cost)}</dd>
            </div>
            <div>
              <dt>Disponível após compra e compromissos</dt>
              <dd>
                {money(
                  state.balance - cart.cost - state.recurring - cart.recurring,
                )}
              </dd>
            </div>
          </dl>
          {state.balance - cart.cost - state.recurring - cart.recurring <
            18000 && (
            <p className="budget-note">
              Essa escolha reduz o disponível para sábado abaixo da reserva
              desejada de R$ 180. Considere isso na sua decisão.
            </p>
          )}
          <button
            className="primary full"
            disabled={
              !!record.outcome ||
              cart.cost + cart.recurring + state.recurring > state.balance
            }
            onClick={() => {
              decide(cart);
              setCart(null);
            }}
          >
            Confirmar escolha fictícia <Check size={18} />
          </button>
          {cart.cost + cart.recurring + state.recurring > state.balance && (
            <p className="error" role="alert">
              O saldo não cobre esta escolha e os compromissos já assumidos.
            </p>
          )}
          <button className="text-link auth-link" onClick={() => setCart(null)}>
            Voltar e comparar
          </button>
        </Modal>
      )}
    </div>
  );
}
function SearchBadge() {
  return <Eye />;
}
function ShoppingIcon() {
  return (
    <span className="cart-icon">
      <HeadphoneIcon size={23} />
    </span>
  );
}
