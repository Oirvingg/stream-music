#!/usr/bin/env pwsh

# Instala a função `psql` no perfil do PowerShell (persistente).
#
# Uso:
#   .\install-psql-alias.ps1
#
# Depois de rodar uma vez, abra um NOVO terminal ou execute:
#   . $PROFILE
# para carregar a função `psql` na sessão atual.

$scriptDir = $PSScriptRoot
if (-not $scriptDir) {
    $scriptDir = (Get-Location).Path
}

$scriptPath = Join-Path $scriptDir "psql-db.ps1"
$profilePath = $PROFILE

# Bloco que será anexado ao perfil
$block = @"

# --- Stream Music: atalho 'psql' para consultar o banco do Docker ---
function psql {
    & "$scriptPath" @args
}

"@

if (-not (Test-Path $profilePath)) {
    New-Item -ItemType Directory -Force -Path (Split-Path $profilePath) | Out-Null
    New-Item -ItemType File -Path $profilePath | Out-Null
    Write-Host "✅ Perfil criado em: $profilePath" -ForegroundColor Green
}

# Evita duplicar o bloco se o install rodar mais de uma vez
$content = Get-Content -Raw $profilePath
if ($content -match "# --- Stream Music: atalho 'psql' para consultar o banco do Docker ---") {
    Write-Host "⚠️  O atalho 'psql' já está configurado no perfil." -ForegroundColor Yellow
}
else {
    Add-Content -Path $profilePath -Value $block
    Write-Host "✅ Função 'psql' adicionada ao perfil: $profilePath" -ForegroundColor Green
}

# Carrega na sessão atual para uso imediato
if (-not (Test-Path Function:\psql)) {
    Set-Content -Path Function:\psql -Value { & $scriptPath @args }
}

Write-Host ""
Write-Host "🎉 Pronto! Use agora:" -ForegroundColor Cyan
Write-Host "   psql 'SELECT * FROM users;'" -ForegroundColor Yellow
Write-Host "   psql  # abre o psql interativo" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Se abrir um novo terminal e 'psql' não funcionar, execute uma vez:  . $PROFILE" -ForegroundColor DarkGray
