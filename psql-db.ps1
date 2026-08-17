#!/usr/bin/env pwsh
# psql-db.ps1 - Consulta o PostgreSQL do container Docker do Stream Music.
# Uso: .\psql-db.ps1 "SELECT * FROM users;"
#      .\psql-db.ps1                       # abre o psql interativo

param (
    [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
    [string] $Query
)

# --- Configuracoes ---
$ServiceName = "db"
$DbUser = "postgres"
$DbName = "stream_music"

# --- Verifica se o container esta rodando ---
Write-Host "Verificando o servico '$ServiceName' ..." -ForegroundColor Cyan
try {
    $running = docker ps -q --filter "label=com.docker.compose.service=$ServiceName" 2>$null
}
catch {
    Write-Error "Nao foi possivel executar 'docker'. Ele esta instalado e no PATH?"
    exit 1
}

if (-not $running) {
    Write-Error "O servico '$ServiceName' nao esta rodando. Execute 'docker compose up -d' primeiro."
    exit 1
}
Write-Host "Servico '$ServiceName' esta em execucao." -ForegroundColor Green

# --- Monta os argumentos do psql ---
$psqlArgs = @("-U", $DbUser, "-d", $DbName)
if ($Query) {
    $psqlArgs += @("-c", $Query)
    Write-Host "Executando query..." -ForegroundColor Yellow
}
else {
    Write-Host "Abrindo psql interativo (digite q para sair)..." -ForegroundColor Yellow
}

Write-Host "docker compose exec $ServiceName psql ..." -ForegroundColor Cyan

# --- Executa (usando splatting para receber os argumentos) ---
try {
    docker compose exec $ServiceName psql @psqlArgs
}
catch {
    Write-Error "Erro ao executar o psql no container"
    exit 1
}