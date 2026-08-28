# Il gestionale NON si pubblica da solo.
# Vive a polpopoly.it/gestionale/, dentro lo stesso sito Netlify di hub + shop:
# pubblicare significa ricostruire e caricare tutte e tre le app insieme.
#
# Questo script e' solo una scorciatoia: lancia la pipeline completa dell'hub
# (../../polpopoly-hub/pubblica.ps1), che builda gestionale + shop + hub e fa
# un unico deploy.
#
# Se ti serve solo provare le modifiche in locale:  npm run dev

$ErrorActionPreference = "Stop"
$pubblica = Join-Path $PSScriptRoot "..\..\polpopoly-hub\pubblica.ps1"

if (-not (Test-Path $pubblica)) {
    Write-Host "Non trovo $pubblica" -ForegroundColor Red
    Write-Host "La cartella polpopoly-hub deve stare accanto a polpo/." -ForegroundColor Red
    exit 1
}

Write-Host "Il gestionale si pubblica con l'hub. Lancio pubblica.ps1..." -ForegroundColor Cyan
& $pubblica
