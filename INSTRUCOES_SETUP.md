# 📋 Instruções de Setup - Spotify Clone com Supabase

## Pré-requisitos

1. Conta no Supabase (https://supabase.com)
2. Projeto Supabase criado
3. Credenciais do projeto (URL e Anon Key)

## Passo 1: Configurar o Supabase

### 1.1 Criar Buckets de Storage

1. Acesse o Supabase Dashboard
2. Vá para **Storage**
3. Crie dois buckets:
   - **Nome**: `tracks` (público)
   - **Nome**: `covers` (público)

### 1.2 Executar Script SQL

1. No Supabase Dashboard, vá para **SQL Editor**
2. Clique em **New Query**
3. Copie e cole o conteúdo do arquivo `supabase_setup.sql`
4. Clique em **Run** ou pressione `Ctrl+Enter`
5. Aguarde a confirmação de sucesso

### 1.3 Configurar Políticas de Storage

1. No Supabase Dashboard, vá para **Storage** > **Policies**
2. Para cada bucket (`tracks` e `covers`):
   - **Select (SELECT)**: Permitir para `public`
   - **Insert (INSERT)**: Permitir para `authenticated`
   - **Update (UPDATE)**: Permitir para `authenticated` (próprios arquivos)
   - **Delete (DELETE)**: Permitir para `authenticated` (próprios arquivos)

Ou execute o arquivo `setup_storage_buckets.sql` no SQL Editor.

## Passo 2: Configurar o Projeto Local

### 2.1 Verificar Configuração

O arquivo `js/config.js` já está configurado com:
- URL do Supabase
- Anon Key

**Se necessário, atualize as credenciais:**

```javascript
export const SUPABASE_CONFIG = {
    url: 'SUA_URL_DO_SUPABASE',
    anonKey: 'SUA_ANON_KEY'
};
```

### 2.2 Instalar Dependências (Opcional)

```bash
npm install
```

### 2.3 Rodar Localmente

```bash
npm run dev
# ou
npx serve .
```

Acesse: `http://localhost:3000`

## Passo 3: Testar Funcionalidades

### 3.1 Testar Autenticação

1. Clique no botão "Entrar" na sidebar
2. Crie uma conta (Registrar)
3. Faça login

### 3.2 Testar Upload de Música

1. Faça login
2. Clique em "Enviar Música"
3. Preencha os dados e faça upload
4. Verifique se a música aparece na lista

### 3.3 Testar Favoritos

1. Clique no coração em uma música
2. Vá em "Favoritos" na sidebar
3. Verifique se a música está lá

## Passo 4: Importar Músicas Existentes (Opcional)

Se você tem músicas no arquivo `musicas.json` e quer importá-las para o Supabase:

1. Crie um script de migração (exemplo no arquivo `migrar_musicas.sql`)
2. Execute no SQL Editor do Supabase
3. Ou faça upload manualmente pela interface

## Troubleshooting

### Erro: "Failed to resolve module specifier"

**Solução**: Certifique-se de que o `importmap` está no `index.html` antes dos scripts.

### Erro: "Email not confirmed"

**Solução**: 
1. Verifique sua caixa de entrada e spam
2. Ou desabilite confirmação de email temporariamente no Supabase Dashboard:
   - Authentication > Settings
   - Desmarque "Enable email confirmations"

### Erro: "Permission denied" ao fazer upload

**Solução**: Verifique se as políticas RLS estão corretas e se o bucket está público.

### Músicas não carregam

**Solução**: 
1. Verifique o console do navegador (F12)
2. Verifique se a tabela `songs` existe no Supabase
3. Verifique se há dados na tabela

## Próximos Passos

- ✅ Setup completo
- ✅ Testar todas as funcionalidades
- ✅ Configurar domínio customizado (opcional)
- ✅ Fazer deploy (ver `DEPLOY.md`)

## Suporte

Se encontrar problemas:
1. Verifique os logs do console do navegador
2. Verifique os logs do Supabase Dashboard
3. Verifique as políticas RLS
4. Verifique se os buckets de storage estão configurados corretamente

