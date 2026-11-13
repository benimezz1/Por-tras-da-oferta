import { describe, expect, it } from "vitest";
await import("../public/week.js");
await import("../public/direct.js");
const D = globalThis.PorTrasDirect, W = globalThis.PorTrasWeek;

describe("motor do direct", () => {
  it("todo roteiro aponta para conversas e nós existentes", () => {
    for (const [id, d] of Object.entries(D.DIALOGS)) {
      expect(W.THREADS[d.thread], id).toBeTruthy();
      expect(d.nodes.start, id).toBeTruthy();
      for (const n of Object.values(d.nodes)) {
        for (const c of n.ask || []) if (c.go) expect(d.nodes[c.go], `${id}:${c.go}`).toBeTruthy();
        if (n.go) expect(d.nodes[n.go]).toBeTruthy();
        if (n.expire) expect(d.nodes[n.expire]).toBeTruthy();
      }
    }
    for (const id of Object.values(D.BY_EVENT)) expect(D.DIALOGS[id]).toBeTruthy();
  });

  it("as falas ficam na fila até o tempo de digitação passar", () => {
    const box = D.emptyBox();
    D.play(box, "lucca-1", "start", { now: 1000, day: 1 });
    expect(box.log).toHaveLength(0);
    expect(D.choices(box)).toHaveLength(0);
    expect(D.pump(box, 1000).delivered).toHaveLength(0);
    D.pump(box, box.queue.at(-1).at);
    expect(box.log).toHaveLength(2);
    expect(D.choices(box).map((c) => c.id)).toEqual(["repair", "no-repair"]);
  });

  it("a resposta entra no histórico e leva ao cartão de contato", () => {
    const box = D.emptyBox();
    D.play(box, "lucca-1", "start", { instant: true, day: 1 });
    D.pump(box, 0, true);
    const r = D.choose(box, "repair", { day: 1 });
    expect(r.go).toBe("contact");
    D.play(box, r.dialog, r.go, { instant: true, day: 1 });
    const fx = D.pump(box, 0, true).fx;
    expect(fx).toContain("contact-tio");
    expect(box.log.some((m) => m.f === "me")).toBe(true);
    expect(box.log.find((m) => m.c)?.c).toMatchObject({ type: "contact", thread: "tio" });
    expect(box.picks[0]).toMatchObject({ dialog: "lucca-1", id: "repair" });
  });

  it("preenche variáveis, cobra uma única vez e encerra ofertas com prazo", () => {
    const box = D.emptyBox();
    D.play(box, "nina-5", "start", { instant: true, day: 5 });
    D.pump(box, 0, true);
    expect(D.nag(box, { day: 5 })).toHaveLength(2);
    expect(D.nag(box, { day: 5 })).toHaveLength(0);
    D.expire(box, { day: 5 });
    expect(box.ask).toBeNull();
    expect(box.log.at(-1).t).toContain("davi");
    const livia = D.emptyBox();
    D.play(livia, "livia-2", "reserva", { instant: true, day: 2, vars: { size: "40" } });
    D.pump(livia, 0, true);
    expect(livia.log[0].t).toContain("separei um 40");
  });
});
