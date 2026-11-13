# Semana até a viagem — a nova dinâmica do jogo

## Por que mudar

A primeira versão do feed era bonita, mas **não puxava o jogador para as estratégias**:

- Cada loja exibia "SITE FICTÍCIO", os anúncios diziam "anúncio fictício" e explicavam a si mesmos ("o anúncio reapareceu porque áudio combinou com suas interações").
- Havia um botão "Ajuda: pensar antes de comprar" em cada produto.
- Não existia cronômetro, estoque, cupom, parcelamento, taxa ou opção pré-marcada: não havia pressão.
- Não comprar não custava nada (nenhum amigo, nenhum evento, nenhuma comparação) e o feed acabava em cerca de 30 cards.

Resultado: o caminho óbvio era rolar até o fim e não comprar. O relatório C3 mostra que as estratégias funcionam **porque** aparecem misturadas com amigos, emoções e pressa; o jogo precisava reproduzir isso para que a revelação final tivesse peso.

## A nova estrutura

**Premissa.** Domingo à noite. A viagem da turma é no sábado e o boleto de **R$ 400** vence no sábado de manhã. O jogador tem **R$ 620**. Folga real: R$ 220.

**Cinco dias** (segunda a sexta), cada um com cerca de 7 conteúdos do algoritmo + eventos de roteiro, terminando num card "Já está tarde · Dormir". Ao acordar, uma tela mostra o dia, quantos dias faltam e as **notificações da madrugada** (carrinho abandonado, "o produto que você viu baixou", sequência em risco). Cada dia tem um foco:

| Dia | Situação | Eventos principais |
| --- | --- | --- |
| Seg | O fone quebrou (necessidade real) | check-in, roleta de cupom, DM do Lucca com conserto por R$ 35, unboxing da Mia |
| Ter | A live da Lívia | DM da influenciadora, Pulso Pay pré-aprovado, Bia com tênis novo, **live shopping** com cupom que "expira", grupo da turma |
| Qua | Semana de provas | MODO+ "3 dias grátis", setup perfeito da Gabi, **anúncio emocional às 23h** |
| Qui | Mega Liquida 48h | liquidação com contagem regressiva e **preço "de" inflado**, Lucca oferece powerbank emprestado, lembrete do carrinho |
| Sex | Véspera da viagem | grupo "Pocket Fest" ("só falta você 👀"), moedas expirando, **lote final** |
| Sáb | Fim | extrato, fatura, viagem (foi ou ficou), revelação, quiz e raio-x |

A partida dura cerca de 10 a 15 minutos.

## Como cada estratégia do relatório aparece

| Estratégia (relatório C3) | Mecânica no jogo |
| --- | --- |
| Urgência | Cronômetro de 10:00 em cada produto que **reinicia a cada visita**; cupom da live que "expira" e é prorrogado; reserva da sacola; "só hoje até 23:59" |
| Escassez | "Restam só 3 unidades", que diminui ao voltar mas **nunca zera**; estoque da live caindo; "92% dos ingressos vendidos" |
| Prova social | "1.843 vendidos hoje", "27 pessoas vendo agora", "bia.m e mais 12 amigos compraram", avaliações ordenadas com as positivas primeiro, chat da live |
| Influenciadores | DM e live da Lívia ("eu nunca indiquei nada que eu não uso"), stories de páginas com link de compra |
| Personalização | "Escolhido para você", retargeting ("Ainda pensando nele? 👀"), notificações noturnas sobre o que você só olhou |
| FOMO | Grupo da turma, grupo do Pocket Fest, posts de amigos com compras; recusar gera "vai perder… tem certeza?" |
| Preço / parcelamento | Preço "de" riscado, modelo isca do fone (Lite / **One "mais vendido"** / Pro), "10x de R$ 26,43", desconto Pix, Mega Liquida com âncora maior, **Pulso Pay "compre agora, pague depois"**, "disponível para compras" somando saldo e limite |
| Padrões obscuros (OCDE) | Proteção Pulso+ **pré-marcada**, VIP pré-marcado, **taxa de serviço só no checkout**, taxa de conveniência no ingresso, *confirmshaming* ("Não, prefiro pagar mais caro"), teste grátis com renovação automática, **cancelamento em quatro telas** |
| Recompensa imediata | Roleta com **quase-acerto** (para colada no prêmio de R$ 100), cupom com valor mínimo, check-in diário, moedas de cashback que só valem no app e expiram |
| Gatilho emocional (entrevista) | Medidor de **vibe** que cai com tédio e comparação social e sobe com compras — mas a empolgação some em poucos posts; anúncio "Dia puxado? Você merece um mimo" quando a vibe está baixa |

Também existem **saídas legítimas** para quem presta atenção: o conserto do fone por R$ 35, o Atmos Lite de R$ 89,90, o powerbank emprestado, a mochila da escola que "serve sim" e o painel "Minha meta" no rodapé, que mostra saldo e fatura.

## Economia

- Pix sai do saldo na hora (com 5% de desconto, que também é um empurrão).
- Pulso Pay (limite de R$ 500) não mexe no saldo: vai para a **fatura que vence no sábado**. À vista entra inteiro; 3x e 10x cobram a primeira parcela no sábado e deixam o resto como "parcelas nos próximos meses". O 10x tem juros de 3,49% a.m.
- O teste grátis do MODO+ vira cobrança no sábado e segue mensal.
- A viagem só acontece se `saldo − fatura do sábado − assinaturas ≥ R$ 400`. Moedas não pagam a viagem.

Com essas regras, comprar o fone recomendado já consome quase toda a folga; qualquer segunda compra impulsiva (ingresso, garrafa, powerbank) derruba a viagem — a não ser que vá para o cartão, e então a dívida aparece nos meses seguintes.

## Final em quatro etapas

1. **Sábado:** extrato da semana, fatura, viagem aprovada ou recusada (foto em cores ou em preto e branco "pelos stories").
2. **Por trás:** gráfico da vibe com compras e comparações marcadas; as 10 estratégias com *onde apareceu para você*, *o que você fez* e *o que a pesquisa diz*.
3. **Quiz:** cinco momentos da sua partida; o jogador precisa nomear a estratégia.
4. **Raio-x:** reconhecimento, gasto total, estratégias que pegaram você, dicas para a vida real, dados da TIC Kids Online e ODS 12, explicação do algoritmo e referências.

## Arquivos

- `public/pressure.js` — funções puras: estratégias e evidências, parcelamento, cotação do checkout, cupons, cronômetro que reinicia, estoque, vibe, fechamento da fatura, perfil e quiz.
- `public/week.js` — roteiro: dias, eventos, conversas, posts de comparação, modelos do fone, preços por dia, roleta e falas da live.
- `public/pressure.css` — estilos da nova camada.
- `public/stream.js` — aceita `allowed` (temas liberados no dia) e `focus` (temas impulsionados no dia).
- `index.html` — integração no feed existente (estado `nofeed-simulator-v4`).

## Limites e ética

Tudo é fictício e local: nenhuma compra, cobrança ou dado sai do navegador. A introdução avisa isso antes da partida e o final repete. Durante a partida os avisos foram removidos de propósito, para que a experiência se pareça com um app real — a reflexão acontece na revelação. O jogo não diagnostica consumismo: ele mostra em que momentos o ambiente competiu com a meta que o próprio jogador definiu.

Referências complementares usadas na modelagem (além das do relatório): Mathur et al. (2019), *Dark Patterns at Scale*, sobre cronômetros falsos e mensagens de estoque baixo; Prelec e Simester (2001), sobre o efeito do cartão de crédito na disposição a pagar.

## Camada de retenção (algoritmo que prende)

A semana agora também reproduz o que uma rede faz **antes** de vender: prender a atenção. Cada mecanismo tem revelação correspondente no final.

| Mecanismo | Como funciona no jogo | Arquivo |
| --- | --- | --- |
| Rolagem infinita | Cada dia tem `minQuota: 7`; depois disso o feed continua, reciclando posts como "Sugerido para você". O dia só termina pelo menu ⋯ → "Encerrar o dia". Depois de 15 itens extras aparece uma dica discreta. | `public/week.js`, `public/stream.js` (`recycle`), `index.html` (`appendNext`) |
| Relógio que avança | Cada item soma 14 min fictícios. Passou das 23h: entra o anúncio emocional e a manhã seguinte começa com vibe −10. | `index.html` (`checkLate`, `sleep`) |
| Roteiro imprevisível | Os eventos têm janela (`at:[2,6]`) e a posição é sorteada com a semente da partida (`runId`). | `public/week.js`, `index.html` (`evAt`) |
| Recompensa variável | ~1/6 de chance de "surpresa" por item (~1/3 depois do mínimo do dia): moedas, comentário, item com 15% OFF ou nada. "↻ Novidades" às vezes traz 2 posts novos, às vezes "nada novo ainda". | `index.html` (`maybeSurprise`, `refreshFeed`) |
| Algoritmo de retenção | Posts são ranqueados por `0,6 × retenção + 0,4 × interesse/venda`. Rolagem acima de ~900 px/s suspende anúncios por 4 s e prioriza amigos. | `public/recommendation.js` (`engagement`), `public/stream.js` |
| "Mostrar menos" fraco | O sinal negativo cai pela metade a cada época e não se transfere aos temas vizinhos, que continuam crescendo. | `public/recommendation.js` |
| Gancho de saída | Uma vez por dia, ao encerrar o dia, trocar de aba ou levar o mouse para fora: "📸 a Bia postou uma foto com você". | `index.html` (`tryExitHook`) |
| Validação social | "＋ Postar" (1 por dia): as curtidas chegam aos poucos em ~2 min e triplicam se o post mostra um produto que você comprou. | `index.html` (`publishPost`) |
| Vibe e consumo | Vibe abaixo de 40: feed com cores apagadas e anúncio a cada 2 itens. A compra dá ânimo imediato, que vira −10 na manhã seguinte. | `public/stream.js` (`wantsAd`), `index.html` |
| Exclusão do grupo | Sem o tênis, o grupo da turma combina a foto da viagem "só para quem tem o Motion 88". | `public/week.js` (`ifMissing`) |

**Limite real:** depois de 30 minutos reais de jogo, a partida vai direto para o sábado ("Plataformas reais não fazem isso. Nós fazemos.").

**Revelação:** antes do resultado, o jogador estima quanto tempo jogou. O raio-x ganhou o bloco **Raio-X da atenção** (tempo estimado × real, itens extras, noites após 23h, ganchos, surpresas, trocas de anúncio, curtidas). O quiz e o perfil agora cobrem 15 estratégias: as 10 do relatório + rolagem infinita, recompensa variável, gancho de saída, validação social e controle de fachada.

## Direct como jogo de dilemas e brechas fechadas

A versão anterior deixava um caminho fácil: ignorar o direct, dormir logo e não comprar nada. Esta etapa fecha essas saídas sem tirar as alternativas honestas, e transforma o direct em conversas com escolhas.

### Motor de conversas (`public/direct.js`)

Cada conversa é uma árvore de nós com falas (`say`), respostas (`ask`), efeitos (`fx`) e saltos (`go`). O motor entrega as falas com indicador de "digitando…", aceita 2 a 4 respostas por pergunta, cobra quem não responde (`nag`) e encerra ofertas com prazo ao dormir (`expire`). As conversas correm em paralelo: o aviso de uma chega enquanto o jogador está em outra. Três tipos de cartão aparecem dentro da conversa: contato ("Abrir conversa"), produto e cupom.

| Dia | Conversa | O que testa |
| --- | --- | --- |
| Seg | Lucca manda o contato do tio Jorge; o tio responde devagar ("pego quarta, devolvo sexta, uns R$ 35") | Esforço e espera do caminho barato |
| Seg | Pulso Shop interrompe a conversa com o tio: "ENTREGA AMANHÃ" e cupom FONEJA até 23:59 | Personalização e urgência |
| Seg a Sex | Gabi e a surpresa do professor (sem venda) | Motivo para voltar ao direct |
| Ter | Lívia pergunta a numeração e "separa um par no seu nome" até o fim da live | Influência, compromisso, escassez |
| A partir de Ter | Duda, a atendente: 10% para quem diz "tá caro", 15% "do gerente" por 5 minutos reais | Negociação encenada |
| Qua | Bia e o cupom de indicação: "se você usar, eu ganho R$ 20 também" | Reciprocidade entre amigos |
| Qui | Mia pede opinião sobre a cor e depois manda "tem a sua também" | Envolvimento antes do link |
| Sex | Nina tem um ingresso sobrando: "preciso saber AGORA, o Davi também quer" | Urgência e escassez vindas de amiga |
| Sex | Lucca: "só achei o powerbank velho, serve?" | Atrito na alternativa gratuita |

Depois de cada compra, um amigo comenta no direct. Quem só olhou um produto pode receber, no dia seguinte, "vi que você estava olhando…".

### Brechas fechadas

| Antes | Agora |
| --- | --- |
| A introdução avisava que o app "vai fazer de tudo para você gastar" e dava a missão de guardar R$ 400 | A introdução apresenta a semana e o boleto, sem antecipar a lição |
| Dormir cedo pulava live, roleta e conversas | Conversas chegam mesmo assim; live (em replay), roleta, cartão, teste grátis e posts de comparação voltam no dia seguinte |
| O conserto de R$ 35 era um toque e resolvia na hora | O conserto passa pela conversa com o tio, só é pago na entrega e deixa o jogador dias sem fone |
| O fone quebrado não pesava depois da segunda | Toda manhã: "mais 50 minutos de ônibus em silêncio" e vibe −5, até resolver |
| Comprar não mudava nada no jogo | Amigos reagem no direct e o ônibus com música sobe a vibe |
| Cupons vencidos sumiam em silêncio | A manhã seguinte mostra "você perdeu o cupom…": um prazo real entre os blefes |
| "Minha meta" dizia se a viagem estava garantida | O painel mostra saldo e fatura; a conta é do jogador |
| Proteção Pulso+ e VIP saíam com um clique | Desmarcar abre "Tem certeza?" uma vez por item |
| A Gabi desarmava a pressão nos picos | A voz honesta continua, mas fora do pico e abafada pelo grupo |

### Estratégias novas fora do direct

- **Microcompra**: Tema Neon por R$ 4,90, com R$ 3,00 pagos em moedas (segunda-feira).
- **Kit viagem**: barra "1 de 6" na loja a partir de quarta, com o primeiro item já marcado.
- **Perda no lugar de ganho**: "não perca seus R$ 50", "você vai perder R$ X em moedas".

### Revelação

A etapa **Aprenda** ganhou o bloco **Seu direct, por trás**, que explica cada conversa pela qual o jogador passou. O quiz troca o enunciado pela cena do direct quando ela aconteceu na partida. Nenhuma estratégia nova foi criada: as conversas registram momentos nas 15 estratégias existentes.

### Dados e MCP

O contrato `c4-semana` versão 1 não mudou. `threads` mantém o formato anterior (dias, não lidas e a última resposta de cada dia). O histórico das falas fica em `state.dm`, e as microcompras em `state.extras`; nenhum dos dois é exportado. O servidor MCP não foi alterado nem testado com estas mudanças.
