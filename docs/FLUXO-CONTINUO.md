# Fluxo contínuo do No Feed — proposta implementada

> **Atualização:** a dinâmica principal agora é a [semana até a viagem](SEMANA-ATE-A-VIAGEM.md). O feed contínuo descrito abaixo continua sendo a base do algoritmo, mas foi dividido em cinco dias, ganhou eventos de roteiro e deixou de exibir avisos de bastidor durante a partida.

## Tese educativa

O jogador recebe R$ 620 fictícios e precisa preservar R$ 400 para uma viagem. A missão é anunciada com clareza **antes de abrir a rede**. Depois disso, a plataforma simulada mistura entretenimento, amigos, influenciadores, stories e ofertas em uma única linha do tempo. Não existem capítulos visíveis nem decisões obrigatórias a cada produto.

O conflito pedagógico é intencional: a pessoa quer economizar, mas a plataforma usa os sinais de suas interações para selecionar conteúdo e oportunidades comerciais **sem considerar a meta financeira**. O algoritmo não precisa conhecer a meta para competir por atenção, tempo e orçamento.

## Como funciona

1. **Preparação:** a tela de abertura estabelece o objetivo de preservar R$ 400 dentre R$ 620.
2. **Rede social:** oito temas — fones, tênis, streaming, mochilas, bateria portátil, garrafa, luminária e ingresso fictício — aparecem misturados desde o primeiro lote, inclusive em posts não patrocinados.
3. **Carregamento contínuo:** o primeiro conjunto contém cinco itens; rolar ou acionar “Mais publicações” adiciona lotes. Conteúdos já apresentados ficam no lugar; conteúdos futuros são recalculados a partir dos sinais existentes.
4. **Interações:** clicar em posts, stories, ofertas, avaliações, carrinho, curtir, salvar ou indicar desinteresse pode modificar futuras recomendações.
5. **Publicidade:** anúncios concorrem com posts orgânicos e podem reaparecer após interesse ou visita. Produtos comprados são excluídos da nova seleção promocional.
6. **Escolha livre:** não existe um botão obrigatório de compra ou decisão. O jogador pode sair a qualquer momento para ver o resultado.
7. **Meta opcional:** o jogador consegue recuperar a reserva na área “Minha meta”, mas o valor não é exibido constantemente no feed.
8. **Ajuda crítica contextual:** o botão de ajuda permanece apenas na visita ao produto; o painel lateral de ajuda foi removido para não interromper a imersão.
9. **Revelação final:** apresenta o objetivo inicial, o saldo, o valor gasto, os sinais registrados e o botão **Entender como o algoritmo influenciou meu feed**. A explicação aprofundada fica oculta durante a partida e só pode ser aberta ao terminar.

## Arquitetura

A interface mantém as 12 fotografias originais de posts e 12 de stories, acrescentando 12 fotografias de posts e oito de stories a partir dos arquivos locais do projeto. Os oito temas são apenas uma **base editorial interna**, sem fases visíveis.

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

## Stories rápidos e contínuos

O visualizador agora abre um story e segue uma sequência estável baseada na ordem recomendada da barra de stories. Cada story tem **5,5 segundos** de reprodução automática (exceto quando o navegador solicita redução de movimento), com barras de progresso segmentadas no topo.

- Toque no lado direito / seta para a direita: próximo story.
- Toque no lado esquerdo / seta para a esquerda: anterior.
- Deslize horizontal: avança ou retorna sem sair do visualizador.
- Pressione e segure: pausa até soltar.
- Ícone de pausa/retomada: controle manual.
- Fechar / tecla Esc: retorna ao feed, preservando a rolagem.
- Ao acabar o último story, o visualizador fecha naturalmente.
- Quando o usuário abandona a aba ou abre a confirmação para voltar à página inicial, a contagem pausa automaticamente.

A cada story visto, o sistema registra o interesse fictício daquele conteúdo. A primeira abertura não reordena as demais telas dentro do mesmo visualizador: a sequência é congelada até fechar, evitando saltos ao aprender novas preferências.

## Divulgação do algoritmo só na conclusão

Os atalhos do algoritmo foram removidos do cabeçalho, menu inferior e cartões do feed, assim como o botão lateral **Pedir ajuda crítica**. O menu de três pontos das publicações continua funcional, mas sem exibir pontuações ou informações internas do sistema durante a navegação. Na conclusão, o botão de relatório expande o resumo do algoritmo com a distribuição de sinais, tópicos inferidos e explicação dos anúncios. O controle básico de personalização permanece nas configurações de perfil, como em uma rede social convencional.

O objetivo é que a reflexão aconteça **depois** da experiência, sem apresentar a crítica em todos os estímulos.

## Ajuste de autoria e carregamento dos stories

- A barra de stories apresenta **um avatar por perfil**, e não um avatar por fotografia. Os 12 stories existentes são agrupados por 9 autores fictícios; Bia possui dois stories e Lucca possui três.
- A sequência percorre primeiro todas as publicações de um perfil e só então muda para o próximo. As barras de progresso passam a representar **apenas os stories do autor atual**. Ao mudar de autor, a foto de perfil, o nome, o horário e as barras são atualizados juntos.
- As imagens locais são carregadas e decodificadas **antes** de mudar a tela. Enquanto a próxima foto não estiver pronta, a anterior permanece visível, evitando a passagem por um quadro vazio. As duas fotos seguintes são pré-carregadas para tornar a navegação mais fluida.
- Fotos usam o original com preenchimento desfocado nas laterais para preservar enquadramento, fundo escuro e cabeçalho contrastante. A navegação por toque, deslize, setas, pausa e fechamento continua.
- Um evento de story é registrado uma vez por publicação vista, sem atribuir todos os eventos a um único autor.

Este ajuste é principalmente de experiência e clareza de autoria; as fotos e os produtos fictícios existentes foram preservados.

## Curtidas e comentários no feed

- O usuário curte a publicação ou anúncio com **dois cliques/toques diretamente na fotografia**, inclusive em telas touch; um toque simples não abre comentários nem a loja.
- Curtidas são idempotentes pelo gesto duplo: repetir dois toques mantém a publicação curtida, em vez de desfazer a curtida. Para descurtir, utiliza-se o próprio botão de coração.
- O coração fica **com o interior totalmente preenchido** na cor rosa da interface e mantém o estado ao navegar ou recarregar a partida, inclusive em anúncios.
- A fotografia exibe uma breve animação de coração ao receber dois toques. A animação não obstrui os cliques ou a rolagem.
- Os comentários de publicações e anúncios são acessados **somente pelo ícone de balão de comentário**, não tocando a fotografia.
- A página do produto patrocinado continua acessível pelo botão "Conhecer o produto" e pelo ícone de visualização, mas não por um toque na imagem.

## Reformulação das compras e do comércio social

O caminho principal da experiência foi simplificado para **publicação patrocinada → loja simulada → carrinho ou comprar agora → confirmação de pedido → continuar o feed**. Não há site externo real nem cobrança. Os quatro sites são páginas internas da simulação identificadas com endereços `.example`, explicados como ilustrativos.

A foto de um anúncio abre a loja com um toque ou clique simples; dois toques rápidos continuam curtindo, sem abrir a loja. O balão é o único acesso aos comentários. O botão rosa **Visitar loja e comprar** fica visível em cada anúncio, assim como os preços. A nova vitrine **Talvez você curta também**, a aba Explorar e o botão Ofertas do cabeçalho levam diretamente aos quatro catálogos fictícios.

Alguns posts e stories relacionados a produtos oferecem **links de compra**, preservando a identificação de publicações e parcerias. A loja mostra preço, especificações, análises fictícias, mensagens comerciais e a opção de avaliação crítica. Há uma sacola para combinar compras, checkout de confirmação sem solicitação de dados pessoais e recibo fictício; os gastos ficam no estado local do jogo e aparecem no balanço final.

Para demonstrar mecanismos psicológicos de marketing, as páginas apresentam descontos de referência, personalização pelos interesses demonstrados, recorrência de anúncios e um adicional opcional previamente marcado na assinatura. Todos esses elementos são explicitamente apresentados como fictícios; a experiência permite não comprar e preservar a meta original.

## Ampliação do motor — oito situações editoriais, sem capítulos

A versão ampliada traz quatro novos produtos fictícios — **Volt 10K (bateria portátil)**, **Flow 750 (garrafa)**, **Halo Desk (luminária)** e **Pocket Fest (ingresso de evento imaginário)** — além das quatro ofertas originais. São 24 posts, 20 stories e oito lojas com acesso direto. Os novos posts e stories recebem fotos locais distintas dentro do repertório adicional; os produtos possuem ilustrações vetoriais originais.

Os conteúdos continuam em uma única linha do tempo. A variável de época interna avança conforme o feed recebe novos lotes e libera assuntos progressivamente, mas não interrompe a partida para informar "fase 2", "fase 3" etc. A seleção pode reagir a curtidas, histórias, pesquisas na loja, visitas, sacola, compra, cancelamento e "Mostrar menos".

O motor separa: **descoberta** de oferta, **retargeting** de produto visto ou salvo e **sugestão complementar** depois de uma compra. Sinais antigos decaem, interesses relacionados se propagam com peso reduzido, não há anúncios adjacentes nem repetição do mesmo anúncio, e um item comprado deixa de concorrer na publicidade. Há no máximo uma vaga patrocinada após três posts orgânicos. As vitrines de recomendações reaparecem em posições do feed para que novos itens sejam explorados ao longo da sessão.

No recibo fictício surgem até duas opções relacionadas ao pedido, sem compra obrigatória. Também é possível buscar diretamente nas oito lojas, ocultar conteúdo indesejado e desativar personalização. A explicação quantitativa e o relatório de influência continuam **somente na conclusão**. Tudo fica no navegador, sem pagamento real e sem que o ranking tenha acesso à meta de economia.

Para fórmulas, pesos, grafo de relações e limites, consultar o arquivo ALGORITMO-FEED.md.
