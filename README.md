# Por Trás da Oferta

Jogo educativo do Ciclo 4, Colégio Rio Branco. A **experiência principal** agora é uma simulação imersiva de rede social, com feed, stories, posts de amigos e anúncios adaptados às escolhas do jogador. O jogador começa com R$ 620 fictícios e tenta preservar R$ 400 para uma viagem escolar.

- **Fotografias da experiência:** 10 cenas originais criadas por IA, com 10 enquadramentos adicionais, em 20 arquivos WebP locais otimizados. Imagens de amigos, páginas, anúncios e lojas estão em `public/assets/social/`; veja `docs/IMAGENS-JOGO.md`.
- **Jogo atual:** abra a raiz do site (`/`). São quatro fases conectadas: fone de ouvido, tênis, assinatura musical e mochila. Cada fase apresenta uma situação, uma rede social, um anúncio e uma decisão (comprar, salvar no carrinho ou não comprar).
- **Versão anterior:** abra `/classico.html` para acessar a campanha React original de seis capítulos. O código e seus testes foram preservados.
- **Privacidade:** marcas, pessoas, preços e compras são fictícios. Nenhum pagamento é realizado. Na nova versão, as escolhas ficam no armazenamento local deste navegador; a demonstração não as envia ao MCP.

O novo protótipo está em `index.html`; o modo clássico segue em `src/` e `classico.html`. O Vite gera as duas entradas no mesmo build. O backend/MCP é mantido no projeto separado [Por-tras-da-oferta-MCP](https://github.com/benimezz1/Por-tras-da-oferta-MCP).

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

- `src/game/content.ts`: capítulos, evidências, estratégias e textos educativos.
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

## Contas e MCP

O padrão é `VITE_BACKEND_ENABLED=false`. Para usar cadastro/login reais, compile com essa variável `true` **somente ao servir a aplicação na mesma origem do backend revisado**. Usa cookie HttpOnly; senhas e tokens não são gravados pelo frontend. Ao restaurar um percurso de conta, `/api/me` deve confirmar a mesma identidade antes de exibir os dados.

A autenticação é compatível com o contrato inspecionado. A nova campanha **ainda não pode ser salva no servidor nem consultada pelo MCP**. Seus cenários não são enviados a `/api/game/choice`, cujo modelo suporta somente quatro escolhas simples. [Contrato observado e API C4 proposta](docs/INTEGRACAO-MCP.md).

## Publicação

O build gera `dist/`. Uma configuração isolada do Cloudflare Workers publica apenas a **demonstração sem cadastro** em `jogo.portrasdaoferta.workers.dev`; não altera o Worker `mcp`, AWS ou Tunnel. [Guia da demonstração](docs/DEMO-CLOUDFLARE.md) e [integração posterior](docs/PUBLICACAO.md).

## Referência e limites

Base: _Relatório Final C3_, capítulos 2–5, especialmente a proposta para C4 nas páginas 15–17. Os exemplos são inventados; não reproduzem dados reais de vendedores. O jogo não diagnostica consumismo, não decide pelo participante e não confunde indício com comprovação de fraude. Os stories são cenas gráficas ilustradas, não vídeos humanos gravados. Loop é uma rede fictícia com padrões familiares do Instagram; não replica toda a plataforma. As conversas são locais e roteirizadas, sem envio a pessoas reais. O cartaz e a implementação do assistente ficam fora deste repositório.

As fontes são empacotadas localmente; não há chamadas a Google Fonts, imagens externas, analytics ou IA durante a demonstração. [Créditos e licenças](docs/ATIVOS.md).
