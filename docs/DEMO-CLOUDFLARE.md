# Publicação de teste no Cloudflare Workers (sem cadastro)

**Objetivo:** publicar a nova experiência de rede social (quatro fases) e preservar o modo clássico de seis capítulos
em https://jogo.portrasdaoferta.workers.dev, sem afetar o serviço MCP.

Esta publicação **não é a integração C4 com o backend**: as escolhas do jogo
continuam na sessão do navegador, sem serem sincronizadas no servidor.
O MCP de atendimento permanece em
https://mcp.portrasdaoferta.workers.dev/mcp.

## Preparação

- Confirmar que a conta Cloudflare correta usa o subdomínio
  `portrasdaoferta.workers.dev`.
- Verificar que ainda não existe um Worker importante chamado `jogo`.
- Fazer merge da configuração `wrangler.jsonc` para a branch `main`.
- Não habilitar a variável `VITE_BACKEND_ENABLED`; o padrão é `false`.

## Publicar pelo painel (com GitHub conectado)

1. Na conta correta, acesse **Workers & Pages > Create > Connect GitHub**.
2. Selecione o repositório `benimezz1/Por-tras-da-oferta`, branch `main`.
3. Configure o nome do Worker como **`jogo`**.
4. Se a tela pedir os comandos, use:
   - **Build:** `npm run build`
   - **Deploy:** `npx wrangler deploy`
   - **Root directory:** raiz do repositório (`/`)
5. Deploy. O `wrangler.jsonc` manda servir `dist/` como assets estáticos,
   incluindo fallback de SPA para a navegação do jogo.
6. Abra `https://jogo.portrasdaoferta.workers.dev` e teste
   **Começar a história** em uma aba anônima. O modo clássico fica em `/classico.html`.
7. Confira que `https://mcp.portrasdaoferta.workers.dev/health`
   continua exibindo `{"status":"ok",...}` e que o login em
   `/vincular` não foi alterado.

Não modifique **mcp**, Cloudflare VPC, o túnel, a porta 3201, a AWS,
os serviços do YoLiga nem o Worker que faz proxy do MCP.

## Conferir e desfazer

- Se `jogo...` exibir "Hello World", abra o Worker **jogo** e confira
  seu último deploy, origem GitHub, build e configuração `assets.directory`.
- Se o build falhar, verifique logs do Workers Builds e os checks do GitHub.
- Para desfazer a publicação de demonstração, desative ou exclua
  **somente o Worker `jogo`** no Cloudflare. O MCP não depende dele.
- A publicação não cria credenciais no backend, não transfere progresso do
  navegador ao MCP e não altera a conta de nenhum participante.

## Etapa posterior

Quando o grupo aprovar o jogo, implementar e testar a API de campanha C4
descrita em `docs/INTEGRACAO-MCP.md`, juntamente com autenticação, gravação
isolada e uma nova ferramenta de progresso no MCP. Não reutilizar
`/api/game/choice`, pois pertence aos quatro cenários da versão anterior.
