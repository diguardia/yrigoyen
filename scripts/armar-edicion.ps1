# Arma la edición del día de forma desatendida con Claude Code y la imprime.
# Lo invoca la tarea programada "El Diario de Yrigoyen" (sábados 06:00) o se corre a mano:
#   powershell -ExecutionPolicy Bypass -File scripts\armar-edicion.ps1 [-SinImprimir]
# Requiere: node, el pipeline instalado (pipeline/node_modules), Acrobat y la CLI `claude` autenticada.
# IMPORTANTE: este archivo debe guardarse en UTF-8 con BOM; PowerShell 5.1 lee los .ps1 sin BOM como ANSI
# y rompe las tildes del prompt.
param(
    [switch]$SinImprimir,
    [int]$TimeoutMinutos = 150
)
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz
$fecha = Get-Date -Format 'yyyy-MM-dd'
$dirEd = Join-Path $raiz "ediciones\$fecha"
$log = Join-Path $dirEd 'armado.log'
$traza = Join-Path $dirEd 'armado.jsonl'
New-Item -ItemType Directory -Force $dirEd | Out-Null
function Log($m) { "[$(Get-Date -Format 'HH:mm:ss')] $m" | Out-File $log -Append -Encoding utf8 }
Log 'inicio'

# Resolver el ejecutable de Claude Code. Nunca usar claude.ps1: invocado desde cmd.exe se abre en el editor
# en lugar de ejecutarse (causa de las corridas fallidas de octubre y noviembre de 2026).
$candidatos = @(
    (Join-Path $env:APPDATA 'npm\claude.cmd'),
    (Get-Command claude.cmd -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source),
    (Get-Command claude.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source)
) | Where-Object { $_ -and (Test-Path $_) }
$claude = $candidatos | Select-Object -First 1
if (-not $claude) { Log 'ERROR: no se encontró claude.cmd ni claude.exe'; exit 1 }
$version = & cmd.exe /c "`"$claude`" --version" 2>&1
Log "claude: $claude ($version)"

$procedimiento = Get-Content (Join-Path $raiz 'pipeline\PROCEDIMIENTO.md') -Raw -Encoding utf8
$prompt = @"
Armá la edición de El Diario de Yrigoyen de hoy ($fecha) de principio a fin, sin pedir confirmaciones, siguiendo exactamente este procedimiento. Al terminar, escribí un resumen de 15 líneas en ediciones/$fecha/RESUMEN.md con: qué se publicó, qué quedó sin verificar, resultado del preflight y si se imprimió.

$procedimiento
"@
$promptFile = Join-Path $dirEd 'prompt.txt'
[System.IO.File]::WriteAllText($promptFile, $prompt, (New-Object System.Text.UTF8Encoding($false)))

# Sesión desatendida: sin prompts de permisos (el repo es local y de uso personal).
# stream-json deja una traza por evento en armado.jsonl, útil para diagnosticar si la corrida se corta.
$claudeArgs = '-p --dangerously-skip-permissions --output-format stream-json --verbose'
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = 'cmd.exe'
$psi.Arguments = "/c type `"$promptFile`" | `"$claude`" $claudeArgs > `"$traza`" 2>> `"$log`""
$psi.WorkingDirectory = $raiz
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$proc = [System.Diagnostics.Process]::Start($psi)
if (-not $proc.WaitForExit($TimeoutMinutos * 60 * 1000)) {
    & taskkill.exe /PID $proc.Id /T /F | Out-Null
    Log "tiempo agotado ($TimeoutMinutos min)"
}
Log "claude terminó con código $($proc.ExitCode); eventos en traza: $((Get-Content $traza -ErrorAction SilentlyContinue | Measure-Object).Count)"

$pdf = Get-ChildItem $dirEd -Filter '*.pdf' -ErrorAction SilentlyContinue | Select-Object -First 1
$acta = Join-Path $dirEd 'preflight.json'
$ok = $false
if (Test-Path $acta) { $ok = (Get-Content $acta -Raw -Encoding utf8 | ConvertFrom-Json).ok }
Log "preflight ok=$ok pdf=$($pdf.FullName)"

if ($ok -and $pdf -and -not $SinImprimir) {
    try {
        & (Join-Path $PSScriptRoot 'imprimir.ps1') -Pdf $pdf.FullName | Out-File $log -Append -Encoding utf8
    } catch {
        Log "no se pudo imprimir: $($_.Exception.Message)"
    }
}
Log 'fin'
