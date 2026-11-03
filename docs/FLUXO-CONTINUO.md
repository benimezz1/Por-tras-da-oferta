
# Fluxo contínuo do No Feed — proposta implementada

## Tese educativa

O jogador recebe R$ 620 fictícios e precisa preservar R$ 400 para uma viagem. A missão é anunciada com clareza **antes de abrir a rede**. Depois disso, a plataforma simulada mistura entretenimento, amigos, influenciadores, stories e ofertas em uma única linha do tempo. Não existem capítulos visíveis nem decisões obrigatórias a cada produto.

O conflito pedagógico é intencional: a pessoa quer economizar, mas a plataforma usa os sinais de suas interações para selecionar conteúdo e oportunidades comerciais **sem considerar a meta financeira**. O algoritmo não precisa conhecer a meta para competir por atenção, tempo e orçamento.

## Como funciona

1. **Preparação:** a tela de abertura estabelece o objetivo de preservar R$ 400 dentre R$ 620.
2. **Rede social:** quatro temas — fones, tênis, streaming e mochilas — aparecem misturados desde o primeiro lote, inclusive em posts não patrocinados.
3. **Carregamento contínuo:** o primeiro conjunto contém cinco itens; rolar ou acionar “Mais publicações” adiciona lotes. Conteúdos já apresentados ficam no lugar; conteúdos futuros são recalculados a partir dos sinais existentes.
4. **Interações:** clicar em posts, stories, ofertas, avaliações, carrinho, curtir, salvar ou indicar desinteresse pode modificar futuras recomendações.
5. **Publicidade:** anúncios concorrem com posts orgânicos e podem reaparecer após interesse ou visita. Produtos comprados são excluídos da nova seleção promocional.
6. **Escolha livre:** não existe um botão obrigatório de compra ou decisão. O jogador pode sair a qualquer momento para ver o resultado.
7. **Meta opcional:** o jogador consegue recuperar a reserva na área “Minha meta”, mas o valor não é exibido constantemente no feed.
8. **Ajuda crítica:** a prévia local explica técnicas persuasivas e calcula se o preço de uma oferta cabe no orçamento desejado.
9. **Revelação final:** apresenta o objetivo inicial, o saldo, o valor gasto, os sinais registrados e como a lógica de recomendações se relacionou com as escolhas.

## Arquitetura

A interface reutiliza as 12 fotografias de posts e 12 fotografias de stories do projeto. O catálogo anterior de quatro temas continua existindo somente como **base editorial**, não como fases visíveis.

O módulo public/stream.js produz uma ordem contínua e adaptativa. Ele calcula pontuações por afinidade temática, autor, popularidade fictícia, diversidade e novidade, e reserva posições para publicidade. A variável interna phase é usada somente para decaimento de sinais após cada novo lote; não corresponde a um capítulo da narrativa. O módulo public/recommendation.js preserva o histórico explicável de sinais e os controles de personalização.

Um ponto importante: as recomendações **não têm acesso à reserva do jogador**, e a meta financeira não entra na função de pontuação. O sistema não garante que o jogador falhará: ele precisa continuar podendo preservar o dinheiro.

## MCP e limites

O painel de ajuda crítica na interface atual é uma **prévia calculada localmente**, não uma chamada autenticada ao MCP. Não exibe uma resposta do serviço conectado nem envia escolhas para o servidor. Uma integração futura poderá usar as ferramentas MCP de análise de anúncio, estratégias de persuasão e avaliação de compra, mas somente mediante vínculo seguro, escopo autorizado e isolamento entre participantes.

Não altere o Worker MCP ao publicar o site. O front-end continua no Worker jogo e usa localStorage com a chave nofeed-simulator-v3.

## Limitações e transparência

- É uma heurística educativa, não um algoritmo treinado por dados reais ou cópia de sistemas proprietários.
- O feed é **finito**, pois foi dimensionado para demonstração escolar; a dinâmica de carregamento, personalização e distração é contínua durante a sessão.
- Não há transações reais, diagnóstico de consumismo ou coleta de dados do usuário fora da simulação.
- O fim não é moralizar compras, mas comparar a intenção original ao ambiente de influência.
- O botão de volta à home mantém a confirmação e limpa o progresso quando solicitado.

## Referências conceituais

- TikTok, Como o conteúdo é recomendado: https://support.tiktok.com/pt_BR/using-tiktok/exploring-videos/how-tiktok-recommends-content
- Meta AI, Instagram Feed Ranking System Card: https://ai.meta.com/tools/system-cards/instagram-feed-ranking/

Os pesos da simulação foram inventados para o jogo; as fontes acima suportam apenas princípios gerais de seleção e classificação, não esses valores.

## Verificação

Executar npm test, npm run build e npm run test:e2e. Testes de navegador devem cobrir a meta inicial, ausência de fases visuais, mistura de temas, carregamento, compras, painéis de ajuda, controle de personalização, fotografia por post/story e retorno ao início.
