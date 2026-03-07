# build.ps1 — Empaqueta el plugin como .xpi para Zotero 7 (Windows PowerShell)
#
# Uso: powershell -ExecutionPolicy Bypass -File build.ps1
# Resultado: zotero-apa7-uoc-VERSION.xpi en el directorio actual

$ErrorActionPreference = "Stop"

$manifest = Get-Content "manifest.json" | ConvertFrom-Json
$version = $manifest.version
$pluginName = "zotero-apa7-uoc"
$outputFile = "${pluginName}-${version}.xpi"

Write-Host "=== Empaquetando ${pluginName} v${version} ===" -ForegroundColor Cyan

# Eliminar XPI anterior si existe
if (Test-Path $outputFile) {
    Remove-Item $outputFile
}

# Crear directorio temporal para la estructura del XPI
$tempDir = New-Item -ItemType Directory -Path (Join-Path $env:TEMP "apa7-uoc-build-$(Get-Random)") -Force

try {
    # Copiar archivos necesarios al directorio temporal
    Copy-Item "manifest.json" $tempDir
    Copy-Item "bootstrap.js" $tempDir
    Copy-Item "src" "$tempDir\src" -Recurse
    Copy-Item "csl" "$tempDir\csl" -Recurse

    # Crear el XPI (ZIP con extensión .xpi)
    $xpiPath = Join-Path (Get-Location) $outputFile
    Compress-Archive -Path "$tempDir\*" -DestinationPath $xpiPath -Force

    # Renombrar de .zip a .xpi si es necesario
    if ($xpiPath.EndsWith(".xpi")) {
        # Compress-Archive crea .zip, necesitamos renombrar
        $zipPath = $xpiPath -replace '\.xpi$', '.zip'
        if (Test-Path $zipPath) {
            Move-Item $zipPath $xpiPath -Force
        }
    }

    $size = (Get-Item $xpiPath).Length / 1KB
    Write-Host ""
    Write-Host "=== Empaquetado completado ===" -ForegroundColor Green
    Write-Host "Archivo: $outputFile"
    Write-Host ("Tamano: {0:N1} KB" -f $size)
    Write-Host ""
    Write-Host "Para instalar:" -ForegroundColor Yellow
    Write-Host "  1. Abre Zotero 7"
    Write-Host "  2. Ve a Herramientas > Complementos"
    Write-Host "  3. Clic en el engranaje > Instalar complemento desde archivo"
    Write-Host "  4. Selecciona $outputFile"
}
finally {
    # Limpiar directorio temporal
    Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
