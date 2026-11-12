# No Feed V6 — ranqueamento visual por conta e curtidas

## Objetivo

**Entrega:** dois jogadores podem entrar no mesmo navegador e receber publicações e fotografias iniciais diferentes. Ao interagir, cada jogador fortalece *somente* o próprio perfil, e as próximas publicações passam a disputar o feed de forma personalizada. Recarregar não altera o conteúdo já sorteado.

Esse algoritmo é **uma heurística local, pedagógica e explicável**. Não usa reconhecimento facial, dados pessoais reais, informações financeiras, API de redes sociais ou IA treinada. As fotografias são ilustrativas de personagens fictícios.

## Arquitetura

| Camada | Arquivo | Responsabilidade |
| --- | --- | --- |
| Conteúdo | `public/library-v5.js` e `public/editorial.js` | Publicações e fotos locais, assunto, autor, tags, dia e origem |
| Variação e cronologia | `public/feed-variation.js` | Filtrar publicações do dia; sorteio determinístico por semente; preservar IDs |
| Sinais de interesse | `public/recommendation.js` | Eventos fictícios e pesos com decaimento |
| **Ranqueador visual V6** | **`public/feed-ranker.js`** | Transformar eventos em afinidades por categoria visual e tags; dar pontuação auditável |
| Seleção do feed | `public/stream.js` | Misturar pontuação anterior e ranking V6, diversidade, carga de posts e anúncios |
| Integração | `index.html` | Semente por conta, histórico por jogador, entrada e saída das lojas, revelação final |

## Primeiras fotografias por conta

A semente combina o `runId` da partida com o **identificador fictício da conta**, e é usada na ordem editorial, nas fotos alternativas de Bia e Gabi, nos stories e no motor de descoberta.

1. Dois jogadores recebem uma ordenação determinística própria mesmo com o mesmo `runId`.
2. O primeiro lote seleciona assuntos e fotos variados, ainda sem saber do que a pessoa gosta.
3. Cada novo lote é pontuado novamente; a ordem **já mostrada** nunca muda em consequência de uma curtida.
4. O histórico `feedItems` e os eventos ficam no armazenamento local da conta (`nofeed-simulator-v4:user:` + identificador), com limites de retenção internos.
5. Iniciar uma partida nova permite outro sorteio. Reabrir uma partida antiga usa o mesmo `runId` e mantém fotos e posts anteriores.

Trata-se de variedade **pseudoaleatória reproduzível**, não de uma chamada a um serviço externo. A biblioteca contém atualmente 175 fotografias distintas; cada post da V5 tem uma imagem identificada e licenciada.

## Como os likes alteram as próximas fotos

O ranqueador constrói um resumo de categorias visuais (amigos, estudos, música, moda, gastronomia, tecnologia, atividade física, cidade e animais) e tags **apenas dos posts com metadados verificados na biblioteca**.

| Sinal | Peso do ajuste visual |
| --- | ---: |
| Curtir | +3,40 |
| Descurtir | −3,40 |
| Salvar | +4,40 |
| Remover dos salvos | −4,40 |
| Abrir comentários | +1,50 |
| Permanência visível | +0,65 |
| Impressão rápida | +0,08 |
| Mostrar menos | −5,00 |

Os pesos ficam sujeitos a decaimento por época (`0,82 ^ idade`, ou `0,5 ^ idade` para “Mostrar menos”) e limites internos. Curtidas de posts sem metadados continuam alimentando o antigo motor por **assunto e autor**, mas não inventam tags de fotografia.

**Exemplo:** se um jogador curte algumas fotos de música, novas publicações com categoria `music` ou tags relacionadas ganham pontos extras. Um amigo que recebe muitas curtidas também ganha relevância pelo modelo já existente. O sistema continua mostrando outros assuntos por descoberta e diversidade — não prende a pessoa a uma categoria única.

A pontuação final preserva o mecanismo `60% retenção + 40% pontuação histórica` e soma a camada visual V6. O motor evita repetições recentes de foto, autor e tópico e respeita a cronologia do jogo.

## Interface e proteção da partida

- O jogo não informa os pesos durante a rolagem. A conclusão mostra os temas de interesse e, agora, as **preferências visuais inferidas**, explicitando que elas resultam de tags, não do rosto das pessoas.
- **Desativar a personalização** interrompe o aprendizado e elimina o ajuste visual por sinais; a ordem editorial permanece determinística.
- Produtos comprados ficam fora de anúncios futuros, e a meta pessoal de poupar R$ 400 não participa do ranking.
- Eventos futuros, como supostas fotos da viagem de sábado, continuam proibidos antes do sábado.
- O resumo permanece separado por conta. A senha de login não é transmitida ao ranking.

## Testes e critérios de aceitação

1. Contas diferentes, mesma semente de partida: fotos/ordem inicial diferentes.
2. Mesma conta, recarga: fotos e IDs exibidos preservados.
3. Curtir uma foto de uma categoria aumenta a pontuação das próximas fotos relacionadas; descurtir e “Mostrar menos” diminuem.
4. A preferência visual pode atravessar dias, com decaimento; a cronologia bloqueia fotos futuras.
5. Uma foto não reaparece como o mesmo post dentro da mesma partida.
6. Personalização desligada não altera a pontuação visual com base nas curtidas.
7. Rodar `npm test`, `npm run build`, `npm run test:e2e` e verificar a implantação Cloudflare após o merge.

Para detalhes do motor anterior, consultar [ALGORITMO-FEED.md](ALGORITMO-FEED.md). Para o inventário fotográfico, consultar [BIBLIOTECA-FEED-V5.md](BIBLIOTECA-FEED-V5.md).
