# Imprime el PDF de una edición en la HP Laser wifi (A4, monocromo).
# Uso: powershell -ExecutionPolicy Bypass -File scripts\imprimir.ps1 -Pdf "ediciones\2026-10-12\El-Diario-de-Yrigoyen-N2-2026-10-12.pdf"
# Pasos: 1) reasigna el puerto de la impresora si cambió de IP (ensure-hp107w-wifi.ps1);
#        2) verifica que responda en el puerto 9100; 3) imprime con Acrobat (/t) y cierra Acrobat.
param(
    [Parameter(Mandatory = $true)][string]$Pdf,
    [string]$Impresora = 'HP Laser wifi',
    [int]$EsperaSegundos = 90
)
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$pdfPath = (Resolve-Path $Pdf).Path

& (Join-Path $PSScriptRoot 'ensure-hp107w-wifi.ps1')

$printer = Get-Printer -Name $Impresora
$host_ = $printer.PortName
$tcp = [System.Net.Sockets.TcpClient]::new()
try {
    $conn = $tcp.ConnectAsync($host_, 9100)
    if (-not $conn.Wait(3000) -or -not $tcp.Connected) { throw "La impresora '$Impresora' no responde en $host_:9100. ¿Está encendida y en la misma red?" }
} finally { $tcp.Dispose() }

$acrobat = @('C:\Program Files\Adobe\Acrobat DC\Acrobat\Acrobat.exe', 'C:\Program Files (x86)\Adobe\Acrobat Reader DC\Reader\AcroRd32.exe') | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $acrobat) { throw 'No se encontró Acrobat ni Acrobat Reader para imprimir el PDF.' }

$antes = (Get-PrintJob -PrinterName $Impresora -ErrorAction SilentlyContinue | Measure-Object).Count
$proc = Start-Process -FilePath $acrobat -ArgumentList @('/t', "`"$pdfPath`"", "`"$Impresora`"") -PassThru
$fin = (Get-Date).AddSeconds($EsperaSegundos)
$enviado = $false
while ((Get-Date) -lt $fin) {
    Start-Sleep -Seconds 3
    $jobs = Get-PrintJob -PrinterName $Impresora -ErrorAction SilentlyContinue
    if (($jobs | Measure-Object).Count -gt $antes -or ($jobs | Where-Object { $_.DocumentName -like '*Yrigoyen*' })) { $enviado = $true }
    if ($proc.HasExited) { break }
    if ($enviado -and -not ($jobs | Where-Object { $_.DocumentName -like '*Yrigoyen*' })) { break }
}
if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
if ($enviado) { Write-Output "Enviado a '$Impresora': $pdfPath" } else { Write-Output "Acrobat terminó sin que se detectara un trabajo en la cola de '$Impresora'; revisar la cola manualmente." }
