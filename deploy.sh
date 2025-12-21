#!/bin/bash

# Script de Deploy Rápido
# Uso: bash deploy.sh

echo "🚀 Iniciando deploy do Spotify Clone..."

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI não encontrado. Instalando..."
    npm install -g vercel
fi

# Verificar se há mudanças não commitadas
if [[ -n $(git status -s) ]]; then
    echo "⚠️  Há mudanças não commitadas. Deseja continuar mesmo assim? (s/N)"
    read -r response
    if [[ ! "$response" =~ ^[Ss]$ ]]; then
        echo "❌ Deploy cancelado."
        exit 1
    fi
fi

# Deploy
echo "📦 Fazendo deploy..."
vercel --prod

echo "✅ Deploy concluído!"

