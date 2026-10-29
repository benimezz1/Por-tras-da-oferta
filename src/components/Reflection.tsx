import { useState } from "react";
import { ArrowRight, Check, Eye, Lightbulb, ArrowLeft } from "lucide-react";
import { strategies, criteriaOptions, money } from "../game/content";
import type {
  Mission,
  MissionRecord,
  Reflection as ReflectionData,
  Strategy,
} from "../game/types";
export function Reflection({
  mission,
  record,
  onSubmit,
  onBack,
}: {
  mission: Mission;
  record: MissionRecord;
  onSubmit: (data: ReflectionData) => void;
  onBack: () => void;
}) {
  const [assignments, setAssignments] = useState<Record<string, Strategy[]>>(
    {},
  );
  const [reason, setReason] = useState("");
  const [criteria, setCriteria] = useState<string[]>([]);
  const [active, setActive] = useState(record.seen[0] ?? "");
  const evidence = mission.evidence.filter((e) => record.seen.includes(e.id));
  return (
    <div className="reflection-page">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> Voltar ao ambiente
      </button>
      <div className="eyebrow lime">PAUSA PARA ENXERGAR ALÉM</div>
      <h1 data-screen-heading tabIndex={-1}>
        O que estava
        <br />
        <em>por trás da oferta?</em>
      </h1>
      <p className="reflection-lead">
        Sua decisão foi <b>{record.outcome?.label.toLowerCase()}</b>. Agora,
        conecte os sinais que você encontrou às estratégias. Você pode associar
        mais de uma a cada evidência.
      </p>
      <div className="reflection-grid">
        <section className="reflection-card">
          <h2>
            <Eye size={20} /> 01. Conecte as evidências
          </h2>
          {evidence.length === 0 ? (
            <div className="empty-state">
              <p>
                Você ainda não abriu nenhuma evidência. Pode voltar para
                investigar ou registrar sua reflexão com essa informação em
                falta.
              </p>
              <button className="light-button" onClick={onBack}>
                Voltar e investigar
              </button>
            </div>
          ) : (
            <>
              <div className="evidence-tabs">
                {evidence.map((e) => (
                  <button
                    key={e.id}
                    className={active === e.id ? "active" : ""}
                    onClick={() => setActive(e.id)}
                  >
                    {e.label}
                    {assignments[e.id]?.length ? <Check size={14} /> : null}
                  </button>
                ))}
              </div>
              <div className="evidence-quote">
                {evidence.find((e) => e.id === active)?.detail}
              </div>
              <div className="strategy-options">
                {Object.entries(strategies).map(([code, s]) => (
                  <label
                    className={
                      assignments[active]?.includes(code as Strategy)
                        ? "selected"
                        : ""
                    }
                    key={code}
                  >
                    <input
                      type="checkbox"
                      checked={
                        assignments[active]?.includes(code as Strategy) ?? false
                      }
                      onChange={(e) =>
                        setAssignments({
                          ...assignments,
                          [active]: e.target.checked
                            ? [...(assignments[active] ?? []), code as Strategy]
                            : (assignments[active] ?? []).filter(
                                (x) => x !== code,
                              ),
                        })
                      }
                    />
                    {s.name}
                  </label>
                ))}
              </div>
              <p className="field-hint">
                Se uma informação apenas ajuda a comparar alternativas, você
                pode deixá-la sem estratégia.
              </p>
            </>
          )}
        </section>
        <section className="reflection-card">
          <h2>
            <Lightbulb size={20} /> 02. Conte o seu raciocínio
          </h2>
          <p>O que pesou na sua escolha?</p>
          <div className="criteria-options">
            {criteriaOptions.map((c) => (
              <button
                key={c}
                className={criteria.includes(c) ? "selected" : ""}
                aria-pressed={criteria.includes(c)}
                onClick={() =>
                  setCriteria(
                    criteria.includes(c)
                      ? criteria.filter((x) => x !== c)
                      : [...criteria, c],
                  )
                }
              >
                {c}
              </button>
            ))}
          </div>
          <label className="reason-label" htmlFor="reason">
            Qual informação fez diferença? O que ainda faltou saber?
          </label>
          <textarea
            id="reason"
            value={reason}
            maxLength={1500}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex.: O histórico mudou minha impressão do desconto. Ainda assim, o fone pode ser útil porque…"
            rows={6}
          />
          <div className="field-hint">
            {reason.length}/1500 · Escreva ao menos 15 caracteres e selecione um
            critério. Seu texto será guardado, sem correção automática por IA.
          </div>
          <div className="reflection-outcome">
            <span>Gasto nesta decisão</span>
            <b>{money(record.outcome?.cost ?? 0)}</b>
            {!!record.outcome?.recurring && (
              <small>
                Compromisso: {money(record.outcome.recurring)}/mês após o teste.
              </small>
            )}
          </div>
          <button
            className="primary full"
            disabled={reason.trim().length < 15 || !criteria.length}
            onClick={() => onSubmit({ assignments, reason, criteria })}
          >
            Revelar os mecanismos <ArrowRight size={18} />
          </button>
        </section>
      </div>
    </div>
  );
}
