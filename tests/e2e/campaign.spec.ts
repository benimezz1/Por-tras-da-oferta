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
  await page
    .getByRole("button", { name: "Opções do anúncio", exact: true })
    .click();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
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
  await page.getByRole("button", { name: "Comparar", exact: true }).click();
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
  await page
    .getByRole("button", { name: "Ver stories de Lia Martins", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ir ao story 3", exact: true })
    .click();
  await expect(page.getByText(/Ganho 12% por compra/)).toBeVisible();
  await page
    .getByRole("button", { name: "Ir ao story 4", exact: true })
    .click();
  await page
    .getByRole("button", { name: "VISITAR PASSO", exact: true })
    .click();
  await expect(page.locator(".shoe-store")).toBeVisible();
  await page
    .getByRole("button", { name: "Ir com o meu tênis", exact: true })
    .click();
  await reflect(
    page,
    "A criadora recebe comissão e meu tênis atual ainda atende à oficina.",
  );
  await next(page);
  await page
    .getByRole("button", { name: /Ver avaliações vitrine.example/ })
    .click();
  await page
    .getByRole("button", { name: "Só compras verificadas", exact: true })
    .click();
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
  await page
    .getByRole("button", { name: /Experimentar clube.example/ })
    .click();
  await page
    .getByRole("button", { name: "Começar meu teste", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar escolha fictícia" })
    .click();
  await expect(page.locator(".wallet-card")).toContainText("44,00");
  await page.getByRole("button", { name: "Minha conta", exact: true }).click();
  await page
    .getByRole("button", { name: "Gerenciar cancelamento", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Continuar cancelamento", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Confirmar cancelamento", exact: true })
    .click();
  await reflect(
    page,
    "Explorei o caminho de cancelamento e prefiro evitar a renovação automática.",
  );
  await next(page);
  await page.getByRole("button", { name: "Mensagens", exact: true }).click();
  await page
    .getByRole("button", { name: "Conversa com Oficina Aberta", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reservar suporte para sábado", exact: true })
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

test("rede social: comentário, salvos, story, loja, conversa e reload", async ({
  page,
}) => {
  await begin(page, "Teste social");
  await page
    .getByRole("button", { name: "Curtir publicação", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Salvar publicação", exact: true })
    .click();
  await page
    .getByLabel("Adicionar comentário")
    .fill("Quero conferir o preço antes.");
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.locator(".social-comments")).toContainText(
    "Quero conferir o preço antes.",
  );
  await page.getByRole("button", { name: "Salvos", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Comprar agora onda.example",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver perfil de Lia" }).click();
  await page
    .locator(".profile-actions")
    .getByRole("button", { name: "Seguir", exact: true })
    .click();
  await expect(
    page
      .locator(".profile-actions")
      .getByRole("button", { name: "Seguindo", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ir para o feed", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ver stories de Lia Martins", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ir ao story 4", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Reproduzir stories", exact: true }),
  ).toBeVisible({ timeout: 10000 });
  await page
    .getByRole("button", { name: "Ir ao story 1", exact: true })
    .click();
  await expect(page.locator(".story-player header")).toContainText("1/4");
  await page
    .getByRole("button", { name: "Ir ao story 4", exact: true })
    .click();
  await page.getByRole("button", { name: "VISITAR ONDA", exact: true }).click();
  await page.getByRole("button", { name: "Comparar", exact: true }).click();
  await page
    .getByRole("button", { name: "Escolher Essencial", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Voltar à publicação", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Curtir publicação", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Compartilhar publicação", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Sábado criativo Enviar", exact: true })
    .click();
  await page.getByLabel("Escrever mensagem").fill("Precisa comprar para ir?");
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(page.locator(".direct-messages")).toContainText(
    "Não precisa comprar para participar",
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Continuar minha jornada", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Só mais um scroll Seu próximo capítulo/ })
    .click();
  await expect(page.locator(".direct-messages")).toContainText(
    "Precisa comprar para ir?",
  );
  await page.getByRole("button", { name: "Onda Loja", exact: true }).click();
  await expect(page.locator(".product-info h2")).toContainText("Essencial");
  await noOverflow(page);
});

test("comprar direto do anúncio não repete a cobrança no capítulo seguinte", async ({
  page,
}) => {
  await begin(page);
  await page
    .getByRole("button", { name: "Comprar agora onda.example", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Adicionar ao carrinho", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar escolha fictícia", exact: true })
    .click();
  await expect(page.locator(".wallet-card")).toContainText("320,00");
  await reflect(
    page,
    "Vi a loja pelo anúncio e escolhi o fone para substituir o quebrado.",
  );
  await next(page);
  await expect(
    page.getByRole("button", { name: "Compra já registrada", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Histórico de preço", exact: true })
    .click();
  await expect(page.locator(".price-history")).toContainText("R$ 179");
  await page
    .getByRole("button", { name: "Manter minha escolha", exact: true })
    .click();
  await expect(page.locator(".wallet-card")).toContainText("320,00");
});
