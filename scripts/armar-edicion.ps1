# Arma la edición del día de forma desatendida con Claude Code y la imprime.
# Lo invoca la tarea programada "El Diario de Yrigoyen" (sábados 06:00) o se corre a mano:
#   powershell -ExecutionPolicy Bypass -File scripts\armar-edicion.ps1 [-SinImprimir]
# Requiere: node, el pipeline instalado (pipeline/node_modules), Acrobat y la CLI `claude` autenticada.
param(
    [switch]$SinImprimir,
    [int]$TimeoutMinutos = 150
)
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz
$fecha = Get-Date -Format 'yyyy-MM-dd'
$log = Join-Path $raiz "ediciones\$fecha\armado.log"
New-Item -ItemType Directory -Force (Split-Path $log) | Out-Null
"[$(Get-Date -Format 'HH:mm:ss')] inicio" | Out-File $log -Encoding utf8

$claude = Get-Command claude -ErrorAction SilentlyContinue
if (-not $claude) { $claude = Get-Command (Join-Path $env:APPDATA 'npm\claude.cmd') }

$procedimiento = Get-Content (Join-Path $raiz 'pipeline\PROCEDIMIENTO.md') -Raw -Encoding utf8
$prompt = @"
Armá la edición de El Diario de Yrigoyen de hoy ($fecha) de principio a fin, sin pedir confirmaciones, siguiendo exactamente este procedimiento. Al terminar, escribí un resumen de 15 líneas en ediciones/$fecha/RESUMEN.md con: qué se publicó, qué quedó sin verificar, resultado del preflight y si se imprimió.

$procedimiento
"@
$promptFile = Join-Path $raiz "ediciones\$fecha\prompt.txt"
$prompt | Out-File $promptFile -Encoding utf8

# Sesión desatendida: sin prompts de permisos (el repo es local y de uso personal).
$args = @('-p', '--dangerously-skip-permissions', '--output-format', 'text')
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = 'cmd.exe'
$psi.Arguments = "/c type `"$promptFile`" | `"$($claude.Source)`" $($args -join ' ') >> `"$log`" 2>&1"
$psi.WorkingDirectory = $raiz
$psi.UseShellExecute = $false
$proc = [System.Diagnostics.Process]::Start($psi)
if (-not $proc.WaitForExit($TimeoutMinutos * 60 * 1000)) {
    $proc.Kill()
    "[$(Get-Date -Format 'HH:mm:ss')] tiempo agotado ($TimeoutMinutos min)" | Out-File $log -Append -Encoding utf8
}

$pdf = Get-ChildItem (Join-Path $raiz "ediciones\$fecha") -Filter '*.pdf' -ErrorAction SilentlyContinue | Select-Object -First 1
$acta = Join-Path $raiz "ediciones\$fecha\preflight.json"
$ok = $false
if (Test-Path $acta) { $ok = (Get-Content $acta -Raw -Encoding utf8 | ConvertFrom-Json).ok }
"[$(Get-Date -Format 'HH:mm:ss')] preflight ok=$ok pdf=$($pdf.FullName)" | Out-File $log -Append -Encoding utf8

if ($ok -and $pdf -and -not $SinImprimir) {
    try {
        & (Join-Path $PSScriptRoot 'imprimir.ps1') -Pdf $pdf.FullName | Out-File $log -Append -Encoding utf8
    } catch {
        "[$(Get-Date -Format 'HH:mm:ss')] no se pudo imprimir: $($_.Exception.Message)" | Out-File $log -Append -Encoding utf8
    }
}
"[$(Get-Date -Format 'HH:mm:ss')] fin" | Out-File $log -Append -Encoding utf8
