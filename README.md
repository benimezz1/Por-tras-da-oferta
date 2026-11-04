# Por Trás da Oferta

Jogo educativo do Ciclo 4, Colégio Rio Branco. A **experiência principal** é a **semana até a viagem**: o jogador tem R$ 620 fictícios e precisa chegar ao sábado com R$ 400 para pagar a viagem da turma. Entre segunda e sexta, usa o **pulso.**, uma rede social com loja integrada que aplica, de forma imersiva, as estratégias psicológicas estudadas no relatório C3: cronômetros que reiniciam, estoque que nunca acaba, live de influenciadora, roleta de cupons, cartão "compre agora, pague depois", taxas tardias, opções pré-marcadas, grupos de amigos com FOMO e anúncios para quando a "vibe" está baixa. No sábado chegam a fatura, a viagem (ou não) e a revelação de cada estratégia, com quiz de reconhecimento. Design completo: [docs/SEMANA-ATE-A-VIAGEM.md](docs/SEMANA-ATE-A-VIAGEM.md).

- **Fotografias da experiência:** 36 fotografias distintas de posts, stories, produtos e perfis, selecionadas do Pexels e importadas em JPEG otimizado para `public/assets/social/unique/`. Os 20 WebPs anteriores continuam disponíveis como reserva. Veja `docs/IMAGENS-JOGO.md`.
- **Jogo atual:** abra a raiz do site (`/`). Cinco dias, oito lojas, conversas, live, roleta, Pulso Pay e um final em quatro etapas (extrato, por trás da oferta, quiz e raio-x).
- **Versão anterior:** abra `/classico.html` para acessar a campanha React original de seis capítulos. O código e seus testes foram preservados.
- **Privacidade:** marcas, pessoas, preços e compras são fictícios. Nenhum pagamento é realizado. Antes de jogar, a tela de login informa que o registro fictício será enviado automaticamente ao MCP quando o quiz terminar. A senha nunca integra o JSON; o jogador pode solicitar a exclusão do percurso. O conteúdo dentro do feed segue imersivo.

O novo protótipo está em `index.html`; o modo clássico segue em `src/` e `classico.html`. O Vite gera as duas entradas no mesmo build. O backend/MCP é mantido no projeto separado [Por-tras-da-oferta-MCP](https://github.com/benimezz1/Por-tras-da-oferta-MCP).

## Identificação e sincronização automática com o MCP

A campanha atual (`/`) **exige login antes de começar**. O jogador informa
apenas **apelido de 3–24 caracteres e senha de 10–128 caracteres**. Não precisa
ser o nome real. A opção **Criar conta e continuar** cria a primeira conta;
**Já tenho conta** recupera a conta existente. O frontend usa uma sessão opaca
de 8 horas guardada só na aba (`sessionStorage`). O progresso é salvo em
`localStorage` com chave individual do usuário. Na bancada, **Trocar jogador**
encerra a sessão sem mostrar a partida de outro usuário.

Ao completar os cinco dias, responder as cinco questões do quiz e abrir o
**Raio-x**, o jogo cria automaticamente o JSON
`por-tras-da-oferta/c4-semana` (versão 1) e o envia via
`POST /api/c4/client/complete`, protegido por token, **para o mesmo usuário
autenticado do MCP**. O servidor valida a campanha, associa o documento à conta
e recalcula os indicadores; `consultar_progresso` e
`consultar_percurso_c4` passam a consultar esse percurso. A interface mostra
**recebido pelo MCP** apenas após confirmação real da API. Sem conexão, o
progresso continua salvo e o jogador pode tentar novamente (ou entrar de novo
se a sessão expirou). O download JSON continua opcional como cópia de segurança,
**não é mais o fluxo principal**.

**Privacidade e transparência:** a tela inicial informa sobre o envio automático
antes da partida. São escolhas fictícias, não compras reais, e não se pede nome
completo, e-mail ou dados pessoais. A senha não integra o JSON. O usuário pode
excluir a importação no portal MCP. Para ler o registro no ChatGPT, ainda é
necessário **vincular a conta** via login OAuth ou pelo código temporário no
fluxo de conversa; o assistente não adivinha a identidade de uma conversa.

**Configuração de publicação:** compile o frontend com
`VITE_C4_MCP_ORIGIN=https://DOMINIO_REAL_DO_MCP` (somente origem, sem `/mcp`)
e configure o backend com `C4_GAME_ORIGIN=https://jogo.portrasdaoferta.workers.dev`.
Se a variável de frontend não for fornecida, o cliente tentará o endereço
`https://mcp.portrasdaoferta.workers.dev` como fallback de demonstração,
que **precisa ser conferido** com o domínio de fato publicado.
O MCP e o jogo são projetos/deploys separados: as duas versões precisam
estar atualizadas. [Contrato e endpoints](docs/INTEGRACAO-MCP.md).

## Executar

Node.js 22 ou superior e npm:

```sh
npm ci
npm run dev
```

Abra o endereço indicado pelo Vite (normalmente `http://localhost:5173`). Para criar e inspecionar a versão de distribuição:

```sh
npm run build
npm run preview
```

## Versão anterior (modo clássico): o que está implementado

1. **Loop / rede social:** feed e carrosséis, curtidas, comentários editáveis antes de publicar, salvos, pesquisa, perfis, seguir pessoas, compartilhamento e direct com respostas roteirizadas. Anúncios abrem a loja dentro da simulação.
2. **Onda / loja:** busca, dois modelos de fone, preço anterior, histórico, contador reiniciável, disponibilidade, comparação e carrinho com confirmação.
3. **Loop / stories e criadora:** stories de Lia e dos amigos com progresso, pausa, navegação, reações, enquete, resposta por direct e link para a loja Passo, com galeria, tamanho e compra.
4. **Vitrine / avaliações:** filtro de compras verificadas, ordenação, comentários repetidos, critério do ranking, compra da bateria ou alternativa do cabo.
5. **Clube+ / assinatura:** extra pré-selecionado removível, renovação, plano gratuito, percurso de cancelamento e compromisso futuro separado do saldo; cancelar após assinar remove a recorrência.
6. **Mercado 21 / desafio final:** kit com múltiplos estímulos, comparação de itens, empréstimo da escola e decisão dependente do saldo restante. É possível reservar o suporte no direct da oficina.

Todas as fases têm uma rede social contextual e uma loja conectada, com abas e botões de voltar/avançar. Rotas, comentários, mensagens, salvos, votos e opções da loja permanecem ao recarregar a mesma aba. Perfis seguidos e conversas acompanham a jornada. Uma compra feita pelo anúncio é reconhecida na fase seguinte sem cobrar novamente.

O caderno registra as evidências abertas. O rascunho de reflexão é salvo a cada edição e permanece ao voltar para investigar ou recarregar a mesma aba. Após cada escolha, o jogador conecta técnicas às evidências e explica sua decisão. O resultado apresenta reconhecimento, revisão, escolhas, orçamento e conquistas; permite revisitar os debriefings e exportar JSON. O texto livre é armazenado **sem fingir avaliação semântica por IA**. Comprar ou não comprar não altera o indicador de reconhecimento.

## Validação

```sh
npm test             # domínio, persistência e contrato HTTP, sem navegador
npm run build        # TypeScript estrito + bundle
npx playwright install chromium
npm run test:e2e     # campanha completa, reload/isolamento, teclado, desktop e mobile
```

A CI executa testes, build e Playwright em Chromium com viewports desktop e iPhone 13, tanto para o novo feed quanto para o modo clássico. Veja o estado da execução no GitHub; testes escritos não equivalem a execução concluída. Evidências e limites de QA: [docs/QA.md](docs/QA.md).

## Estrutura

- `public/pressure.js`: motor de pressão (estratégias, parcelamento, checkout, cupons, cronômetros, vibe, fatura, perfil e quiz).
- `public/week.js`: roteiro da semana (dias, eventos, conversas, preços por dia).
- `public/pressure.css`: estilos da camada de pressão.
- `public/stream.js` e `public/recommendation.js`: algoritmo do feed (agora com temas liberados e foco por dia).
- `src/game/content.ts` (modo clássico): capítulos, evidências, estratégias e textos educativos.
- `src/game/engine.ts`: máquina de progressão, orçamento em centavos, decisões idempotentes e reconhecimento por evidência.
- `src/game/types.ts`: modelo versionado `c4-v1`.
- `src/components/Simulation.tsx`: navegação entre rede social e lojas.
- `src/components/Social.tsx`: feed, perfis, pesquisa, direct e stories.
- `src/game/socialContent.ts`: personagens e publicações contextualizadas.
- `src/game/simulation.ts`: estado validado de navegação e interações.
- `src/components/Scenes.tsx`: lojas, avaliações, assinatura e desafio final.
- `src/components/Reflection.tsx`: associação de evidências e justificativa.
- `src/components/Art.tsx`: ilustrações SVG originais.
- `src/services/persistence.ts`: sessão local validada e exportação JSON.
- `src/services/api.ts`: adaptador HTTP dos endpoints realmente existentes.
- `tools/mobile-preview.html`: harness de QA com iframe de 390 × 844; não entra no build de produção.

## Contas e publicação

No **jogo atual**, a autenticação C4 usa `public/c4-account.js`,
`public/c4-export.js`, `index.html` e os endpoints novos do
repositório MCP. As contas e os dados da campanha pertencem ao MCP; no jogo
só se guarda o token temporário da aba e o estado fictício por usuário.
O contrato `/api/game/choice` do modo antigo não é usado.

O **modo clássico** (`/classico.html`) preserva o adaptador de login
`VITE_BACKEND_ENABLED` e seu histórico, independente do fluxo novo.

## Publicação

O Vite gera `dist/` para o Worker estático do jogo. O endereço do MCP
precisa ser configurado no build com `VITE_C4_MCP_ORIGIN`; o MCP deve
permitir somente a origem do jogo em `C4_GAME_ORIGIN`. É preciso
reimplantar o backend separadamente e verificar o deploy em ambos os
endereços. [Publicação](docs/PUBLICACAO.md) e
[guia Cloudflare](docs/DEMO-CLOUDFLARE.md).

## Referência e limites

Base: _Relatório Final C3_, capítulos 2–5, especialmente a proposta para C4 nas páginas 15–17. Os exemplos são inventados; não reproduzem dados reais de vendedores. O jogo não diagnostica consumismo, não decide pelo participante e não confunde indício com comprovação de fraude. Os stories são fotografias ilustrativas estáticas, não vídeos humanos gravados. Loop é uma rede fictícia com padrões familiares do Instagram; não replica toda a plataforma. As conversas são locais e roteirizadas, sem envio a pessoas reais. O cartaz e a implementação do assistente ficam fora deste repositório.

Depois da importação das fotos, os arquivos principais ficam empacotados no próprio site. Se um JPEG faltar, o navegador tentará a foto de origem e depois um asset WebP local; nenhuma informação do jogador é enviada aos provedores de imagens. [Créditos e licenças](docs/ATIVOS.md).
