import { test, expect, type Page } from "@playwright/test";
async function begin(page: Page, name = "Visitante de teste") {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Entrar no jogo", exact: true })
    .click();
  await page.getByLabel("Como podemos chamar você?").fill(name);
  await page.getByRole("button", { name: "Começar minha jornada" }).click();
  await page
    .getByRole("button", { name: /Só mais um scroll Seu próximo capítulo/ })
    .click();
}
async function reflect(page: Page, reason: string) {
  await page.getByRole("button", { name: "Abrir reflexão" }).click();
  await page
    .getByRole("button", { name: "Necessidade e uso", exact: true })
    .click();
  await page.getByRole("textbox").fill(reason);
  await page.getByRole("button", { name: "Revelar os mecanismos" }).click();
}
async function next(page: Page) {
  await page.getByRole("button", { name: "Próximo capítulo" }).click();
}
async function evidence(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Continuar explorando" }).click();
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
}
test("campanha completa: investigar, comprar, recusar, concluir e exportar", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await begin(page);
  await noOverflow(page);
  await evidence(page, "Por que estou vendo este anúncio?");
  await page
    .getByRole("button", { name: "Curtir publicação", exact: true })
    .click();
  await expect(page.getByText("Mais áudio para você")).toBeVisible();
  await page
    .getByRole("button", { name: "Guardar e comparar", exact: true })
    .click();
  await page.getByRole("button", { name: "Abrir reflexão" }).click();
  await page
    .getByRole("checkbox", { name: "Personalização", exact: true })
    .check();
  await page
    .getByRole("button", { name: "Confiabilidade", exact: true })
    .click();
  await page
    .getByRole("textbox")
    .fill(
      "Vou comparar o produto e seu preço sem tomar o anúncio como necessidade.",
    );
  await page.getByRole("button", { name: "Revelar os mecanismos" }).click();
  await next(page);
  await evidence(page, "Comparar");
  await page.getByRole("button", { name: "Escolher Essencial" }).click();
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await expect(page.getByRole("dialog")).toContainText("R$ 120,00");
  await page
    .getByRole("button", { name: "Confirmar escolha fictícia" })
    .click();
  await expect(page.locator(".wallet-card")).toContainText("380,00");
  await expect(
    page.getByRole("button", { name: "Adicionar ao carrinho" }),
  ).toBeDisabled();
  await reflect(
    page,
    "O modelo básico resolve o áudio e deixa dinheiro reservado para o sábado.",
  );
  await next(page);
  await page.getByRole("button", { name: "Ir ao trecho 4" }).click();
  await expect(
    page.getByRole("heading", { name: "Um cupom para você" }),
  ).toBeVisible();
  await evidence(page, "Parceria paga · Ver detalhes");
  await page
    .getByRole("button", { name: "Ir com o meu tênis", exact: true })
    .click();
  await reflect(
    page,
    "A criadora recebe comissão e meu tênis atual ainda atende à oficina.",
  );
  await next(page);
  await evidence(page, "Só compras verificadas");
  await expect(
    page.getByText("86 compras verificadas", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Escolher cabo" }).click();
  await page
    .getByRole("button", { name: "Confirmar escolha fictícia" })
    .click();
  await reflect(
    page,
    "A tomada da oficina e um cabo novo atendem melhor ao meu problema.",
  );
  await next(page);
  await page.getByRole("button", { name: "Minha conta", exact: true }).click();
  await page
    .getByRole("button", { name: "Gerenciar cancelamento", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Continuar cancelamento", exact: false })
    .click();
  await page.getByRole("button", { name: "Continuar explorando" }).click();
  await page
    .getByRole("button", { name: "Encerrar sem assinar", exact: true })
    .click();
  await reflect(
    page,
    "Explorei o caminho de cancelamento e prefiro evitar a renovação automática.",
  );
  await next(page);
  await evidence(page, "Consultar empréstimos");
  await page
    .getByRole("button", { name: "Pedir suporte emprestado", exact: true })
    .click();
  await reflect(
    page,
    "O empréstimo atende à necessidade pontual e preserva a reserva para sábado.",
  );
  await page.getByRole("button", { name: "Ver meu percurso" }).click();
  await expect(
    page.getByRole("heading", { name: /A próxima escolha/ }),
  ).toBeVisible();
  await expect(page.locator(".money-result")).toContainText("355,00");
  await noOverflow(page);
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar percurso", exact: true })
    .click();
  expect((await pending).suggestedFilename()).toBe(
    "por-tras-da-oferta-percurso.json",
  );
  expect(errors).toEqual([]);
});
test("recarregar retoma a sessão, encerrar não transfere dados ao próximo jogador", async ({
  page,
}) => {
  await begin(page, "Primeira pessoa");
  await page
    .getByRole("button", { name: "Guardar e comparar", exact: true })
    .click();
  await reflect(
    page,
    "Guardarei a oferta para comparar e entender melhor o preço total.",
  );
  await page.reload();
  await page.getByRole("button", { name: "Continuar minha jornada" }).click();
  await expect(
    page.getByRole("button", {
      name: /A última chance. De novo. Seu próximo capítulo/,
    }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Encerrar sessão", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Encerrar e apagar progresso local" })
    .click();
  await begin(page, "Outra pessoa");
  await expect(page.locator(".wallet-card")).toContainText("500,00");
  await expect(
    page.getByRole("button", { name: /Caderno de pistas 0 evidências/ }),
  ).toBeVisible();
});
test("teclado, modal, movimento reduzido e comparação sem resultado", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ajustes de acessibilidade" }).click();
  await page.getByRole("checkbox", { name: /Reduzir movimento/ }).check();
  await page.getByRole("dialog").press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await begin(page);
  await page.getByRole("button", { name: "Seguir sem guardar" }).click();
  await reflect(
    page,
    "Quero investigar uma alternativa antes de assumir uma nova compra.",
  );
  await next(page);
  await page
    .getByRole("textbox", { name: "Buscar na loja" })
    .fill("produto inexistente");
  await expect(
    page.getByRole("heading", { name: /Nenhum produto/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpar busca" }).click();
  await expect(
    page.getByRole("heading", { name: "Essencial by onda" }),
  ).toBeVisible();
});
