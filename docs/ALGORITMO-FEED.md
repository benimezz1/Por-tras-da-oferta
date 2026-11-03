# Motor de recomendação do No Feed — Ciclo 4

## Finalidade e arquitetura

O novo feed possui **8 categorias, 24 posts orgânicos, 20 stories e 8 lojas fictícias**. A rede intercala conteúdos de amigos, páginas, criadores, anúncios e vitrines, sem interromper a experiência com capítulos visíveis. O jogador começa com R$ 620 e pretende guardar R$ 400; **o motor de recomendação não lê saldo nem meta**. O conflito entre publicidade e prioridade individual é a crítica central.

É um sistema heurístico, local, determinístico e explicável. Não é uma rede neural, uma predição psicológica real nem uma cópia do algoritmo do Instagram ou TikTok.

Arquivos: public/recommendation.js (perfil e pontuação), public/stream.js (seleção do próximo lote), public/expansion.js (quatro categorias adicionais) e index.html (feed, lojas, decisões e conclusão).

## 1. Como a rede aprende

O aplicativo registra somente sinais fictícios durante a sessão, quando a personalização está ligada:

| Sinal | Peso |
| :--- | ---: |
| Impressão visível | +0,08 |
| Permanência visível de 1,35 s | +0,55 |
| Story visto | +1,35 |
| Curtir / descurtir | +2,60 / −2,60 |
| Salvar / remover post salvo | +3,15 / −3,15 |
| Abrir comentários | +1,40 |
| Pesquisa de produto | +3,25 |
| Visitar a loja | +3,00 |
| Curtir anúncio | +1,55 |
| Colocar / remover da sacola | +4,60 / −4,60 |
| Comprar ficticiamente | +2,40 |
| Desistir da compra | −3,50 |
| Mostrar menos do tema | −5,10 |

A cada seis conteúdos acrescentados, o contador de época interna avança. O peso de um sinal antigo é multiplicado por 0,82 elevado à idade em épocas. Os coeficientes são decisões de design, não medidas observadas de plataformas reais. O histórico normalizado tem limites de 450 eventos e 420 chaves de impressão. Os sinais não são transmitidos a um serviço externo.

## 2. Grafo de interesses relacionados

Além da afinidade direta, o modelo transfere uma fração limitada dos sinais para assuntos relacionados: áudio → bateria portátil, mochila → garrafa, música → luminária, moda → evento e outras relações. Cada vínculo possui peso explícito e **somente 38%** do interesse de origem é multiplicado por esse peso na transferência. Curtir fones não cria uma curtida falsa em baterias; apenas faz a categoria vizinha disputar mais espaço.

As afinidades diretas têm limites de −11 a +17 e a afinidade por criador possui um limite separado. Essa limitação reduz efeitos exagerados de uma única interação.

## 3. Ranking do conteúdo orgânico

A pontuação de cada candidato soma: atualidade, popularidade transformada de forma logarítmica, proximidade, afinidade com o tema, afinidade com o autor e um componente determinístico de descoberta. Subtrai saturação do assunto e repetição do autor. O modelo compara o histórico recente e evita **três conteúdos consecutivos do mesmo assunto**, sempre que houver alternativa.

Posts já publicados não mudam de lugar. Só novos lotes são recalculados após interações, como curtir, ler avaliações, pesquisar, ignorar ou comprar. Sem personalização, a ordem passa a ser editorial.

## 4. Três campanhas comerciais

Uma vaga patrocinada surge após pelo menos três publicações orgânicas; não existem dois anúncios seguidos.

- **Prospecção:** primeira aparição de um produto, para explorar novos interesses.
- **Retargeting:** reapresentação de uma oferta visitada, curtida ou salva, com espaçamento mínimo de seis posições.
- **Complementaridade:** recomendação relacionada a uma compra anterior, sem repetir o item já comprado.

Para cada campanha o sistema calcula afinidade, interesse relacionado, visita, carrinho, novidade, desgaste por exposição e distância desde o último anúncio do mesmo tema. Cada campanha tem ID único e não aparece duas vezes. Um produto já comprado é excluído de campanhas futuras. Um sinal de “Mostrar menos” rebaixa o tema.

Os quatro temas originais aparecem no começo; powerbank, garrafa, luminária e ingresso fictício entram progressivamente nas épocas internas 1, 2, 3 e 4. **Esses são desbloqueios técnicos, não fases visíveis.**

## 5. Percurso comercial contínuo

O usuário pode abrir uma loja pela foto do anúncio com um clique, pelo botão do anúncio, por posts de parceria, stories ou vitrine. Dois toques continuam curtindo; comentários só abrem pelo balão. A aba Explorar permite procurar produtos, e buscas concluídas registram um sinal local quando a personalização está ligada.

As oito lojas mostram preços, avaliações e descrições fictícios. Há sacola, checkout e confirmação sem qualquer pagamento real. Depois de uma compra fictícia, o recibo sugere até duas categorias complementares e oferece retorno imediato ao feed. As vitrines também reaparecem entre publicações para criar novas oportunidades de escolha. A pessoa pode sempre não comprar e preservar a reserva.

## 6. Controles e revelação final

O perfil pode desligar a personalização: os próximos posts seguem ordem editorial e o sistema deixa de aprender com os novos sinais; anúncios repetidos deixam de ser escolhidos. O menu de três pontos permite “Mostrar menos como este”, ocultando a publicação e registrando o feedback negativo. A explicação completa do algoritmo, com oito interesses inferidos, contagem de anúncios novos, retornos e complementos, **só aparece na conclusão**.

O feed é finito e possui limite técnico de 58 itens para uma demonstração escolar. O jogador pode encerrá-lo antes, sem compras obrigatórias. Meta, orçamento e saldo não são parâmetros de ranking.

## Testes e limites

Executar npm test, npm run build e npm run test:e2e. Os testes verificam ordem determinística, variedade, limites de anúncios, decaimento, relações entre temas, rejeição, buscas, novos assets, percurso por oito lojas, compras fictícias, sugestões após compra, privacidade e conclusão.

Não há modelo treinado, rastreamento de usuários reais, dados sensíveis, diagnóstico de consumismo ou cobrança. Os produtos, preços e depoimentos são criados para o jogo. Estratégias como FOMO, desconto de referência e personalização são mostradas para discussão crítica, não como orientação de compra.

Referências conceituais, sem origem dos pesos: Meta AI, Instagram Feed Ranking System Card (https://ai.meta.com/tools/system-cards/instagram-feed-ranking/); TikTok, Como o conteúdo é recomendado (https://support.tiktok.com/pt_BR/using-tiktok/exploring-videos/how-tiktok-recommends-content).
