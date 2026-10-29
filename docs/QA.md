# Verificação da demonstração C4

Registro de entrega: 29 de outubro de 2026. Todos os participantes e valores abaixo são fictícios. Nenhuma conta real ou serviço de produção foi alterado.

## Simulação social — revisão de 29/10/2026

- `npm test`: **39 testes aprovados**; domínio, orçamento, persistência, histórico de navegação, legado, interações, compra antecipada sem duplicidade e cancelamento idempotente.
- `npm run build`: aprovado, incluindo TypeScript estrito e bundle Vite.
- Campanha completa operada no navegador desktop: compra do Essencial diretamente pelo anúncio (R$ 120), manutenção da compra na fase seguinte, stories com divulgação da comissão, recusa do tênis, filtro de compras verificadas e compra de cabo (R$ 25), assinatura com extra (R$ 44/mês) seguida de cancelamento, reserva do suporte pelo direct. Resultado: seis capítulos, saldo de R$ 355, nenhuma recorrência, sete evidências. Não foram marcadas estratégias nesse percurso.
- Rede social: comentário publicado, curtida, salvo, compartilhamento no grupo, mensagem com resposta roteirizada, perfil seguido, stories e retorno à loja com produto selecionado preservado.
- Mobile em iframe de **390 × 844**: feed, perfil próprio e de Lia, anúncio abrindo loja, retorno, enquete com voto confirmado, direct e restauração após reload. Feed/direct sem overflow horizontal (375 pixels úteis).
- Corrigido retorno a um story anterior depois do término automático: o tempo do último slide não deve avançar novamente ao selecionar um slide anterior.
- Playwright contém **cinco cenários em desktop e iPhone 13 (10 casos)**: campanha e exportação; restauração/isolamento; teclado e movimento reduzido; fluxo social e reload; compra antecipada. O runner será executado pela CI do PR; não foi executado localmente. A inspeção interativa usa a prévia gerenciada.

## Evidências visuais

- [Início desktop](screenshots/01-inicio-desktop.jpg)
- [Loja desktop](screenshots/02-loja-desktop.jpg)
- [Resultado desktop](screenshots/03-resultados-desktop.jpg)
- [Carrinho móvel com limite de orçamento](screenshots/04-carrinho-mobile.jpg)

- [Rede social desktop](screenshots/05-rede-social-desktop.jpg)
- [Stories e enquete mobile](screenshots/06-stories-mobile.jpg)

## Limites

O estado efetivo da CI deve ser consultado no PR; a existência de um teste escrito não prova sua aprovação. Os screenshots 01–04 registram a entrega anterior e 05–06 registram a simulação social atual.

Não foram realizados testes em aparelhos físicos, leitores de tela, condições de rede lenta ou participantes reais. A revisão de acessibilidade feita aqui é parcial e não constitui certificação.

Cadastro/login reais, cookies em produção e consulta da campanha pelo MCP ainda precisam de validação integrada. O backend atual não implementa o modelo de seis capítulos: a demonstração mantém o percurso somente na sessão do navegador. A proposta de API está documentada em [INTEGRACAO-MCP.md](INTEGRACAO-MCP.md).
