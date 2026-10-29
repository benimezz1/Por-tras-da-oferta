# Integração com o MCP

## Fonte inspecionada

Consulta inicial e reconferência somente de leitura em 28/10/2026. Repositório `benimezz1/Por-tras-da-oferta-MCP`, branch `feat/login-oauth-cloudflare-mcp`, commit `cc89c7f57edc79126afb015c57d5483e8f145e1e`. A `main` estava no protótipo anterior sem contas. O estado da produção não foi inferido a partir dessas branches, nem testado com participantes reais.

Arquivos: `src/server.mjs`, `src/auth.mjs`, `src/scenarios.mjs`. Nenhum arquivo desse repositório foi modificado.

Na reconferência, a `main` já estava no commit `7986f319853e5b16cd5c873eedc30f73c1f64594`, incorporando o vínculo por conversa (`/vincular` e `/vincular/entrar`). O servidor continua oferecendo os mesmos quatro cenários em `/api/game`: não há rotas de campanha C4 nesse código. A lista de ferramentas do plugin conectado confirma `iniciar_vinculo`, `confirmar_vinculo`, `get_profile`, `consultar_progresso`, `analisar_anuncio`, `avaliar_compra` e `explicar_estrategia`. São ferramentas de atendimento ao participante, não de publicação do frontend ou gravação da campanha nova. Nenhum perfil pessoal foi consultado durante o desenvolvimento.

## Contrato existente

| Método e rota                                                               | Entrada / resposta observada                                               | Uso neste frontend                                |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------- |
| POST `/api/register`                                                        | `{username,password,invite}` → `{usuario:{id,username}}`; cookie de sessão | Adaptador e formulário opcionais                  |
| POST `/api/login`                                                           | `{username,password}` → `{sucesso:true}`; cookie                           | Adaptador e formulário opcionais                  |
| GET `/api/me`                                                               | `{usuario:{id,username}}`                                                  | Verificar conta antes de restaurar sessão         |
| POST `/api/logout`                                                          | `{}` → `{sucesso:true}`                                                    | Encerrar login real quando habilitado             |
| GET `/api/game`                                                             | `{resumo,cenarios,estrategias}`                                            | Adaptador disponível; não convertido para C4      |
| POST `/api/game/choice`                                                     | `{scenarioId,buy,guess}` → `{resultado,resumo}`                            | Intencionalmente não chamado: incompatível com C4 |
| POST `/api/game/reset`                                                      | Remove escolhas antigas do participante                                    | Não chamado pelo botão de apagar a demo           |
| POST `/api/analisar`                                                        | `{texto}` → análise heurística de texto                                    | Adaptador disponível, fora da campanha            |
| `/mcp`, `/oauth/*`, `/.well-known/*`, `/vincular`, `/vincular/*`, `/health` | Transporte, autorização e metadados                                        | Preservar na publicação                           |

O cadastro exige apelido de 3–24 caracteres (`a-z`, números, `_`, `.`, `-`), senha de 10–128 caracteres e código de inscrição. O cookie observado usa `HttpOnly; SameSite=Lax; Path=/`, 8 horas e `Secure` em HTTPS. O backend rejeita `Origin` diferente. Portanto, o frontend usa URLs relativas e `credentials: 'same-origin'`; não transporta tokens no JavaScript, não usa proxy remoto improvisado e não depende de CORS.

A interface deixa explícito que login não significa sincronização da campanha. As respostas HTML de fallback são tratadas como erro, e não como sucesso.

## Modelo da campanha

`GameState` tem `version:1`, `campaignId:'c4-v1'`, `sessionId`, identidade do participante, saldo e recorrência em centavos, capítulo atual, registros por missão e eventos. Cada registro contém evidências vistas, interações, decisão, custo imediato, compromisso recorrente, associações de estratégias, critérios e justificativa. A data de conclusão marca a progressão. O texto livre não recebe nota automatizada.

O perfil de reconhecimento usa somente associações corretas em evidências efetivamente abertas. Não atribui pontos por compra ou recusa, nem infere características psicológicas. Estratégias corretas em contextos errados são destacadas para revisão. Uma mesma estratégia pode aparecer em várias evidências.

## API adicional proposta — ainda não implementada

Nomes abaixo são **proposta para a conversa responsável pelo backend**, não rotas disponíveis:

| Método e rota proposta              | Responsabilidade                                                                          |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| GET `/api/c4/campaign`              | Retornar estado C4 pertencente exclusivamente à sessão autenticada, versão e revisão      |
| POST `/api/c4/campaign/start`       | Criar campanha com identidade extraída da sessão no servidor                              |
| POST `/api/c4/campaign/events`      | Aceitar lote limitado de eventos com IDs únicos, revisão esperada e chave de idempotência |
| POST `/api/c4/campaign/decisions`   | Validar missão, preço pelo catálogo do servidor, saldo, recorrência e decisão única       |
| POST `/api/c4/campaign/reflections` | Validar evidências e estratégias; limitar texto e concluir capítulo                       |
| DELETE `/api/c4/campaign`           | Excluir percurso educativo com confirmação e política de retenção                         |

O servidor precisa validar a ordem dos capítulos, calcular valores e reconhecimento, rejeitar duplicatas, tratar concorrência e nunca confiar no `player.id`, preço ou saldo enviado pelo cliente. Estados de erro precisam distinguir autenticação (401), revisão concorrente (409), entrada inválida (422), limite (429) e indisponibilidade. O MCP poderá ler um resumo C4 normalizado após implementar esse contrato e sua autorização por participante.

O mecanismo de persistência pode continuar sendo JSON no servidor, conforme o capítulo 5 do relatório, desde que haja escrita atômica e isolamento. Definir com o grupo prazo de retenção, forma de exclusão e procedimento para encerrar o projeto; o frontend não promete exclusão remota que ainda não existe.

## Escopo de teste atual

Adaptador testado com transporte simulado para cookie, erro 401 e fallback HTML. Cadastro/login e leitura via MCP não foram verificados contra produção. Não há chamadas de IA, análise de imagens ou conectividade MCP disfarçadas de funcionalidade pronta. A campanha funciona independentemente desse trabalho.

## Vínculo por conversa

O fluxo novo autentica o participante no site e devolve um código de uso único para confirmar o vínculo no chat. Senha permanece somente no site; a credencial temporária retornada não deve aparecer no chat, na interface do jogo, em URLs ou no armazenamento do frontend. O jogo não tenta criar esse vínculo por conta própria. Ao incorporar os arquivos estáticos ao Worker, as páginas `/vincular` e `/vincular/*` precisam continuar no backend; um fallback genérico para `index.html` quebraria esse fluxo.
