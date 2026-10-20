$ErrorActionPreference = 'Stop'

$printerName = 'HP Laser wifi'
$printerMac = 'BC-E9-2F-A9-3E-7B'

$neighbor = Get-NetNeighbor -InterfaceAlias 'Wi-Fi' -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.LinkLayerAddress -eq $printerMac -and $_.State -ne 'Unreachable' } |
    Select-Object -First 1

if (-not $neighbor) {
    exit 0
}

$printerAddress = $neighbor.IPAddress
$tcp = [System.Net.Sockets.TcpClient]::new()
try {
    $connection = $tcp.ConnectAsync($printerAddress, 9100)
    if (-not $connection.Wait(1500) -or -not $tcp.Connected) {
        exit 0
    }
}
finally {
    $tcp.Dispose()
}

$printer = Get-Printer -Name $printerName -ErrorAction SilentlyContinue
if (-not $printer) {
    exit 0
}

if ($printer.PortName -ne $printerAddress) {
    if (-not (Get-PrinterPort -Name $printerAddress -ErrorAction SilentlyContinue)) {
        Add-PrinterPort -Name $printerAddress -PrinterHostAddress $printerAddress -PortNumber 9100
    }
    Set-Printer -Name $printerName -PortName $printerAddress

    $portScript = Join-Path $env:WINDIR 'System32\Printing_Admin_Scripts\es-ES\prnport.vbs'
    if (-not (Test-Path -LiteralPath $portScript)) {
        $portScript = Join-Path $env:WINDIR 'System32\Printing_Admin_Scripts\en-US\prnport.vbs'
    }
    & cscript.exe //NoLogo $portScript -t -r $printerAddress -o raw -n 9100 -md | Out-Null
}
