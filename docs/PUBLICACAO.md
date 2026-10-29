# Publicação posterior — exige autorização de infraestrutura

Este trabalho não altera AWS, porta 3201, VPC, Cloudflare Tunnel, Worker ou o serviço MCP. Não foi feito deploy. O artefato é um frontend estático em `dist/`.

1. Conferir os checks do commit que será publicado e testar a campanha com participantes do grupo.
2. Produzir `npm ci && npm run build`. O padrão é demo; não habilitar login sem o backend na mesma origem.
3. Antes de mudar o Worker, fazer backup da versão atual e manter um caminho de rollback.
4. No roteamento autorizado, preservar **primeiro** `/mcp`, `/oauth/*`, `/.well-known/*`, `/api/*`, `/vincular`, `/vincular/*` e `/health`. Essas rotas continuam no backend existente.
5. Servir `/`, `/assets/*` e `/favicon.svg` a partir de `dist/`. Fallback de HTML somente para navegação do frontend; nunca responder HTML a rotas de API desconhecidas.
6. Definir cache longo e imutável apenas para arquivos com hash em `/assets`; HTML deve permitir atualização. Não cachear autenticação ou respostas por usuário.
7. Usar HTTPS e mesma origem. Validar cadastro convidado, cookie, logout, sessão expirada, isolamento de dois participantes, campanhas novas e preservação do endpoint MCP.
8. Somente habilitar sincronização C4 depois de implementar e testar o contrato adicional no backend. A flag atual habilita autenticação; não implementa sincronização.
9. Testar teclado, celular real, rede lenta, recarregamento e o encerramento em computador compartilhado antes da apresentação.

O diretório `tools/` contém somente o harness de QA e não é referenciado pelo `index.html` de distribuição. Nenhum segredo deve usar prefixo `VITE_`: essas variáveis são públicas no bundle.
