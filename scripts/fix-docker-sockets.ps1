<#
.SYNOPSIS
  Arregla el error de Docker Desktop en Windows:
  "listening on unix://.../Docker/run/sailor-ingest.sock: The file cannot be accessed by the system".

.DESCRIPTION
  Al cerrarse Docker Desktop quedan archivos "socket" en %LOCALAPPDATA%\Docker\run (y a veces en
  %LOCALAPPDATA%\docker-secrets-engine) que Windows ya no puede abrir ni borrar. En el próximo inicio
  Docker intenta eliminarlos, falla y se cierra.

  Este script RENOMBRA esas carpetas (no borra nada, es reversible) para que Docker cree unas nuevas.
  Las carpetas renombradas se pueden eliminar a mano más adelante (o tras reiniciar Windows).

.PARAMETER Start
  Después de renombrar, inicia Docker Desktop y espera a que el motor responda.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\fix-docker-sockets.ps1 -Start
#>
[CmdletBinding()]
param([switch]$Start)

$ErrorActionPreference = 'Stop'

$dockerExe = Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe'
$dockerCli = Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\resources\bin\docker.exe'
$targets = @(
  (Join-Path $env:LOCALAPPDATA 'Docker\run'),
  (Join-Path $env:LOCALAPPDATA 'docker-secrets-engine')
)

# Con Docker corriendo no se tocan sus carpetas.
$running = Get-Process -ErrorAction SilentlyContinue |
  Where-Object { $_.ProcessName -in 'Docker Desktop', 'com.docker.backend', 'com.docker.build' }
if ($running) {
  Write-Warning 'Docker Desktop está abierto. Cerralo (Quit) y volvé a ejecutar este script.'
  exit 1
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
foreach ($dir in $targets) {
  if (-not (Test-Path -LiteralPath $dir)) { Write-Host "OK   no existe: $dir"; continue }
  $name = Split-Path $dir -Leaf
  Rename-Item -LiteralPath $dir -NewName "$name.roto-$stamp"
  Write-Host "OK   renombrada: $dir -> $name.roto-$stamp"
}

if ($Start) {
  if (-not (Test-Path -LiteralPath $dockerExe)) { throw "No se encontró Docker Desktop en $dockerExe" }
  Start-Process -FilePath $dockerExe
  Write-Host 'Iniciando Docker Desktop...'
  for ($i = 1; $i -le 24; $i++) {
    Start-Sleep -Seconds 5
    & $dockerCli info --format '{{.ServerVersion}}' 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { Write-Host "OK   motor de Docker listo (${i}x5 s)"; exit 0 }
  }
  Write-Warning 'El motor no respondió en 2 minutos. Revisá la ventana de Docker Desktop.'
  exit 1
}

Write-Host 'Listo. Ahora podés abrir Docker Desktop.'
