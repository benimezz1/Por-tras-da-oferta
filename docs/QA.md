# Verificação da demonstração C4

Registro de entrega: 29 de outubro de 2026. Todos os participantes e valores abaixo são fictícios. Nenhuma conta real ou serviço de produção foi alterado.

## Verificações executadas

- `npm test`: **31 testes aprovados**, cobrindo progressão, orçamento em centavos, escolhas idempotentes, evidências, reflexão, persistência validada, rascunhos e contrato HTTP.
- `npm run build`: **aprovado**, incluindo TypeScript e bundle Vite.
- Campanha completa no navegador desktop: seis capítulos concluídos; compra de fone Essencial e cabo, recusa do tênis, assinatura sem extra e empréstimo final. Saldo de R$ 355 e compromisso mensal futuro de R$ 35. Resultado: 11 evidências e oito estratégias reconhecidas.
- Exportação desktop: JSON baixado e inspecionado, com `campaignId: c4-v1`, seis registros, saldo de 35500 centavos e compromisso de 3500 centavos. Não contém senha ou token.
- Campanha completa em iframe de **390 × 844 pixels**: ignorar o anúncio selecionou o fone Essencial na entrada da loja; depois foram comprados Pulse, tênis e bateria, com assinatura incluindo extra. Saldo de R$ 106 e compromisso futuro de R$ 44. O carrinho do kit de R$ 99 apresentou saldo projetado de -R$ 37 e bloqueou a confirmação. O empréstimo permitiu concluir a campanha. Resultado: oito evidências e cinco estratégias reconhecidas.
- Rascunho móvel: justificativa e critério permaneceram ao sair da reflexão para consultar o histórico de preços e retornar.
- Recarregamento da mesma aba preservou a campanha móvel concluída, o saldo e os resultados.
- Encerramento da sessão de teste seguido por um novo participante iniciou R$ 500 e zero evidências, sem transferir o percurso anterior.
- A opção de movimento reduzido aplicou `data-motion="reduced"`; Escape fechou o diálogo.
- Nas telas móveis verificadas, a largura do conteúdo coincidiu com a largura disponível de 375 pixels (390 menos a barra de rolagem), sem rolagem horizontal.

## Evidências visuais

- [Início desktop](screenshots/01-inicio-desktop.jpg)
- [Loja desktop](screenshots/02-loja-desktop.jpg)
- [Resultado desktop](screenshots/03-resultados-desktop.jpg)
- [Carrinho móvel com limite de orçamento](screenshots/04-carrinho-mobile.jpg)

## Automação preparada e limites

O Playwright contém três cenários em dois tamanhos de tela, totalizando seis casos. `npx playwright test --list` confirmou sua descoberta. **O runner Playwright não foi executado neste ambiente**; os percursos acima foram operados no navegador disponível para a prévia. A execução da CI permanece pendente do envio ao GitHub.

A revisão automática de aprovação bloqueou o envio da branch ao repositório público. Os commits e o código estão preparados localmente; este relatório não afirma publicação, PR aberto ou CI remota aprovada.

Não foram realizados testes em aparelhos físicos, leitores de tela, condições de rede lenta ou participantes reais. A revisão de acessibilidade feita aqui é parcial e não constitui certificação.

Cadastro/login reais, cookies em produção e consulta da campanha pelo MCP ainda precisam de validação integrada. O backend atual não implementa o modelo de seis capítulos: a demonstração mantém o percurso somente na sessão do navegador. A proposta de API está documentada em [INTEGRACAO-MCP.md](INTEGRACAO-MCP.md).
