# Conteúdo social V5 — biblioteca e preparação do algoritmo

## O que foi implementado agora
- 89 fotografias novas **reais, identificadas por IDs Pexels**, além das 86 já existentes: **175 fotografias distintas**. A importação em `tools/download_social_photos.py` converte todos os arquivos para JPEG local e mantém as fontes em `public/assets/social/unique/sources.json`.
- Novos posts e stories orgânicos distribuídos por segunda a sexta; fotos de estudo, café, música, esportes, estilo, amigos, cidade e animais. Cada cena tem **dia permitido**, foto, autor, legenda, classificação e tags.
- A ordem das publicações muda entre jogadores e novas partidas, mas permanece **estável quando o jogador recarrega**: `state.runId` e o dia formam uma semente determinística.
- O feed não retorna ao início quando acaba: posts mostrados anteriormente não são reciclados na mesma noite. Cada dia recebe novos IDs.
- Bia e Gabi usam variedade de retratos, inclusive nas marcações da segunda e da sexta. Fotos de **sábado depois da viagem** nunca são apresentadas como se tivessem acontecido antes da partida terminar.
- A galeria de publicar contém fotos adicionais da biblioteca, com legendas iniciais. Continua sem acesso às fotos reais do dispositivo.

## Estrutura de código
- `public/editorial.js`: biblioteca V4, preservada por compatibilidade.
- `public/library-v5.js`: **fontes fotográficas V5** e cenas adicionais. `photoRecords` é o inventário de origem e classificação; `posts` e `stories` são as exibições autorais simuladas.
- `public/feed-variation.js`: variedade **não preditiva**, estabilidade por sessão, verificação temporal e escolha de fotos dos amigos. Também expõe `FUTURE_RANKING_INTERFACE`.
- `public/stream.js`: motor de feed educativo existente. Apenas recebe uma semente da partida para empatar/diversificar os conteúdos. O algoritmo científico novo **NÃO** foi implementado.
- `index.html`: interface, histórico salvo, opções de compra, criador de post e ligação entre as camadas.
- `tools/download_social_photos.py`: baixa fotos somente na construção. O jogo online serve arquivos otimizados locais; não envia interações ou dados do jogador ao Pexels.

## Metadados para próximo algoritmo
Os posts V5 têm `metadata` com `kind, category, topic, tags, availableFrom, availableUntil, narrative, priorityBase, exposureCap, proofSocial, fomo, author`.

Na próxima etapa, criar o módulo de ranqueamento que recebe `{runId, day, shownPostIds, recentTopics, recentAuthors, signals}`, valida a elegibilidade e devolve `{postId, rank, reasons}`.

**Invariantes:** não apresentar fatos futuros; não repetir o mesmo post na mesma partida; não usar dados pessoais reais; não interpretar cliques como diagnósticos.

## Regras temporais
A viagem acontece no **sábado após a sexta-feira**. Segunda a sexta são preparação, escola, rotina, mensagens e ofertas. Fotos de shows antigos podem ser lembranças; imagens do Pocket Fest da sexta podem aparecer na sexta, mas nunca como registro do sábado. A mensagem da Bia de segunda usa foto da escola/turma, e a da Gabi na sexta usa foto feita **antes** da viagem.

## QA antes da banca
- Testar 2 novas contas / 2 novas partidas: ordem inicial e fotos da Bia diferentes.
- Reabrir uma partida: a ordem já mostrada e as escolhas precisam persistir.
- Avançar a quinta e a sexta: nenhuma imagem deve indicar a viagem de sábado já realizada.
- Confirmar que a galeria, os stories e as fotos de anúncios carregam sem internet de Pexels.
- Conferir `sources.json` e toda a suíte de testes do GitHub Actions antes do merge/deploy.

Fotografias Pexels: https://www.pexels.com/license/. O conjunto fotográfico é de terceiros; personagens, perfis, comentários e publicações são fictícios.
