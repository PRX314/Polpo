# Gestionale e hub su Cloudflare Pages. Le notifiche hanno un Worker separato.
param([switch]$SoloBuild)
$ErrorActionPreference = "Stop"
$pubblica = Join-Path $PSScriptRoot "..\..\polpopoly-hub\pubblica.ps1"
if (-not (Test-Path -LiteralPath $pubblica)) { throw "Non trovo la pipeline dell'hub" }
& $pubblica -SoloGestionale -SoloBuild:$SoloBuild
exit $LASTEXITCODE
