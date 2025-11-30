# Spotify_Clone

Pequeno clone de player de música para fins de estudo.

O que foi feito nesta alteração:

- Modularizei o JavaScript: `js/player.js`, `js/data.js`, `js/ui.js`, `js/main.js`.
- Limpei `musicas.json` removendo entradas inválidas e adicionei `duration: 0` como placeholder para cada faixa.
- Implementei seek por clique e arraste na barra de progresso.
- Adicionei um `package.json` e `.eslintrc.json` para rodar lint (instalar dependências com `npm install`).

Como rodar localmente (recomendado via servidor local):

```powershell
# Inicie um servidor HTTP simples na pasta do projeto (Python 3):
python -m http.server 8000
# Abra no navegador: http://localhost:8000
```

Para rodar o ESLint (opcional):

```powershell
npm install
npm run lint
```

Observações:
- As durações em `musicas.json` são placeholders (0). Se quiser preencher durações reais, atualize os valores ou implemente rotina para calcular via Audio metadata.
- Color extraction (ColorThief) pode falhar para imagens hospedadas sem CORS. Prefira imagens locais em `img/`.
