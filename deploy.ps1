# Script de Deploy Rápido para PowerShell
# Uso: .\deploy.ps1

Write-Host "🚀 Iniciando deploy do Spotify Clone..." -ForegroundColor Cyan

# Verificar se o Vercel CLI está instalado
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI não encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g vercel
}

# Verificar se há mudanças não commitadas
$gitStatus = git status -s
if ($gitStatus) {
    Write-Host "⚠️  Há mudanças não commitadas. Deseja continuar mesmo assim? (S/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -notmatch '^[Ss]$') {
        Write-Host "❌ Deploy cancelado." -ForegroundColor Red
        exit 1
    }
}

# Deploy
Write-Host "📦 Fazendo deploy..." -ForegroundColor Green
vercel --prod

Write-Host "✅ Deploy concluído!" -ForegroundColor Green

