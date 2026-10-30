# Fotografias do feed e stories

A versão atual do jogo tem **12 publicações, 12 stories, 5 fotografias de anúncios/produtos e 7 retratos de personagens**, cada um com uma fonte fotográfica distinta (36 fontes). Fotos de um mesmo personagem podem aparecer novamente somente como retrato do próprio perfil.

O jogo usa `public/assets/social/unique/` como origem principal, servindo os JPEGs diretamente do projeto, sem depender de conexão com um banco de imagens durante a demonstração. Os 20 WebPs antigos permanecem como contingência.

As novas fotos foram selecionadas do [Pexels](https://www.pexels.com/), de acordo com sua [licença](https://www.pexels.com/license/). **Não são fotografias produzidas pelo grupo nem imagens geradas por IA.** Os identificadores originais constam em `index.html` e em `public/assets/social/unique/sources.json` após a importação. As fotos representam personagens, marcas, cenas e ofertas fictícios e não devem ser entendidas como registros de pessoas reais participantes do jogo.

Para atualizar as imagens sem instalar dependências além de Python e Pillow:

```bash
python -m pip install pillow
python tools/download_social_photos.py
```

A ação automatizada do GitHub importa as imagens e as otimiza antes de incluí-las no repositório. Caso alguma foto não carregue, o jogo usa uma segunda URL da fonte e, por último, um asset WebP antigo.
