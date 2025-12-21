# 🚀 Guia de Deploy - Spotify Clone

## Opções de Deploy

### 1. Vercel (Recomendado) ⚡

#### Via GitHub:

1. **Criar repositório no GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/spotify-clone.git
   git push -u origin main
   ```

2. **Conectar ao Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Faça login com GitHub
   - Clique em "Add New Project"
   - Importe o repositório
   - Deploy automático! 🎉

#### Via CLI:

```bash
npm i -g vercel
vercel
```

### 2. Netlify 🌐

#### Via GitHub:

1. Crie repositório no GitHub (mesmo processo acima)

2. **Conectar ao Netlify**
   - Acesse [netlify.com](https://netlify.com)
   - Faça login com GitHub
   - Clique em "Add new site" > "Import an existing project"
   - Selecione seu repositório
   - Configurações:
     - **Build command**: (deixe vazio)
     - **Publish directory**: `.` (raiz do projeto)
   - Clique em "Deploy site"

#### Via CLI:

```bash
npm i -g netlify-cli
netlify deploy
netlify deploy --prod
```

### 3. GitHub Pages 📄

1. **Criar repositório no GitHub**

2. **Fazer push do código**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/spotify-clone.git
   git push -u origin main
   ```

3. **Habilitar GitHub Pages**
   - Vá em Settings > Pages
   - Source: `main` branch
   - Folder: `/ (root)`
   - Salve

4. **Seu site estará em**: `https://SEU_USUARIO.github.io/spotify-clone/`

### 4. Deploy Local (Desenvolvimento) 💻

```bash
# Instalar serve
npm install -g serve

# Ou usar npx
npx serve .

# Acesse: http://localhost:3000
```

## 📝 Checklist Antes do Deploy

- [ ] Testar localmente (`npx serve .`)
- [ ] Verificar se todas as imagens/assets estão na pasta correta
- [ ] Verificar se os arquivos JavaScript estão carregando
- [ ] Testar funcionalidades principais (play, pause, favoritar, etc.)
- [ ] Verificar se não há erros no console do navegador

## 🔧 Configurações Importantes

### Vercel
- O arquivo `vercel.json` já está configurado
- Headers CORS já estão definidos
- Rewrites configurados para SPA

### Netlify
- Criar `netlify.toml` se precisar de configurações específicas:
```toml
[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### GitHub Pages
- Se usar rotas dinâmicas, pode precisar configurar um 404.html personalizado

## 🐛 Troubleshooting

### Erro 404 em rotas
- Verifique se o `vercel.json` ou `netlify.toml` tem redirects configurados

### Assets não carregam
- Verifique os caminhos (use caminhos relativos, não absolutos)
- Certifique-se de que todas as pastas (`assets/`, `css/`, `img/`, `js/`) estão no repositório

### CORS errors
- Headers CORS já estão configurados no `vercel.json`
- Para outros serviços, configure headers apropriados

## 📦 Estrutura de Arquivos Necessários

```
spotify/
├── index.html          ✅
├── vercel.json         ✅ (para Vercel)
├── package.json        ✅
├── css/
│   └── stylesheet.css  ✅
├── js/
│   └── (todos os .js)  ✅
├── img/                ✅
├── assets/             ✅
└── musicas.json        ✅
```

## 🎯 Deploy Rápido (Vercel)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. No diretório do projeto
vercel

# 3. Seguir instruções no terminal
# 4. Para produção:
vercel --prod
```

**Pronto! Seu Spotify Clone estará no ar! 🎵**

