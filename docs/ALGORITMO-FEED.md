# Motor de recomendações do No Feed (demonstração C4)

## Objetivo

Simular uma lógica **multissinal, transparente e local** de seleção de posts e anúncios para tornar visível, durante a apresentação do jogo, o ciclo *interagir → inferir interesse → classificar conteúdo → recomendar → receber novos sinais*. **Não reproduz nem tem acesso ao algoritmo proprietário do Instagram, TikTok ou outras plataformas.**

## Processo de decisão

1. **Candidatos.** O sistema busca as publicações do momento atual e de um momento anterior. Os três posts do momento atual permanecem disponíveis; até dois anteriores podem reaparecer. Os três stories atuais são classificados separadamente.
2. **Sinais.** Curtir, salvar, ler comentários, abrir stories, visitar lojas, salvar no carrinho e comprar enviam sinais positivos; descurtir, retirar do carrinho, decidir não comprar e selecionar *Mostrar menos* enviam sinais negativos. Uma leitura visível por 1,35 s pode registrar um sinal fraco, com limitação para uma vez por conteúdo e momento.
3. **Decaimento temporal.** O peso de cada sinal diminui para 72% do valor a cada novo momento da história. É um tempo **fictício, por fase**, não um monitoramento contínuo do relógio.
4. **Pontuação de posts.** Combinam-se atualidade, popularidade simulada, proximidade (amigo/página), interesse no assunto, afinidade com o autor e uma pequena oportunidade determinística de descoberta. Exposição anterior subtrai pontuação. A classificação reduz repetições consecutivas do mesmo autor e assunto.
5. **Anúncios.** O anúncio principal é **obrigatório pela narrativa pedagógica**, e tem selo de patrocinado. Apenas anúncios repetidos concorrem entre temas anteriores com base em interesse inferido, itens no carrinho e uma prioridade comercial fictícia. O mesmo anúncio repetido não aparece após duas impressões qualificadas; produtos já comprados não voltam na seleção de retargeting.
6. **Explicação.** A opção *Por que apareceu?* apresenta os fatores e os pesos em pontos fictícios. O painel *Algoritmo* exibe interesses inferidos, quantidade de sinais e controles.
7. **Controle.** Desativar personalização coloca o feed em ordem cronológica, bloqueia retargeting e interrompe o registro de novos sinais de recomendação. *Apagar histórico de recomendações* zera apenas eventos e impressões do algoritmo, sem apagar escolhas, compras ou carrinho fictícios. Itens ainda no carrinho continuam disponíveis e poderão influenciar recomendações após a reativação.

## Pesos exemplificativos

| Ação | Peso no tema |
| --- | ---: |
| Curtida em post | +2,5 |
| Salvar publicação | +3,1 |
| Abrir story | +1,2 |
| Visitar produto | +2,8 |
| Adicionar ao carrinho | +4,1 |
| Decidir não comprar | −3,2 |
| Pedir menos desse tema | −4,5 |
| Leitura de conteúdo visível (1,35 s) | +0,55 |
| Impressão visível | +0,08 |

A fórmula ilustrativa do post é: `score = atualidade + popularidade + proximidade + interesse + criador + novidade − repetição`. Uma penalidade de diversidade é aplicada ao ordenar conteúdos semelhantes em sequência. Os anúncios possuem uma fórmula independente que soma prioridade comercial, interesse e carrinho e subtrai repetição. Os valores são **decisões de design para o jogo**, não valores públicos de sistemas reais nem probabilidades de compra.

## Privacidade e limitações

- O histórico existe apenas no estado da demonstração salvo no `localStorage` deste navegador. Não é transmitido para serviços externos pelo motor de recomendação.
- O jogo não lê localização, contas reais, microfone, contatos, dados sensíveis ou informações de fora da sessão.
- Não há machine learning treinado em usuários reais nem predição de consumismo. A pontuação é uma heurística explicável com alguns elementos de ranking típicos de sistemas de recomendação.
- Os anúncios, seus lances, o preço, a popularidade, o engajamento e os personagens são fictícios.
- O botão de retorno ao início descarta o progresso quando a saída é confirmada. Uma nova partida zera também o perfil do algoritmo.

## Referências conceituais

- Meta AI, *Instagram Feed Ranking System Card*: etapas de seleção de candidatos, classificação, diversidade e sinais de interação. https://ai.meta.com/tools/system-cards/instagram-feed-ranking/
- TikTok, *Como o conteúdo é recomendado*: interações, informações do conteúdo e classificação de relevância. https://support.tiktok.com/pt_BR/using-tiktok/exploring-videos/how-tiktok-recommends-content

Estas fontes explicam princípios gerais; elas **não validam os pesos numéricos** atribuídos à simulação.

## Verificações

- `npm test` cobre a função de ranking e privacidade, incluindo decaimento, sinais positivos e negativos, retargeting, frequência, determinismo e restauração.
- `npm run build` compila o restante do projeto e distribui `public/recommendation.js`.
- `npm run test:e2e` valida que o jogador vê as publicações, acessa o painel, pode desligar a personalização e recebe explicações dos anúncios.
