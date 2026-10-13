# build.ps1 — Empaqueta el plugin como .xpi para Zotero 7 y posteriores (Windows)
#
# Uso: powershell -ExecutionPolicy Bypass -File build.ps1
# Resultado: zotero-apa7-uoc-VERSION.xpi en el directorio actual
#
# NO usa Compress-Archive: en Windows PowerShell 5.1 escribe las rutas internas
# con "\" (así salió la v1.3.0), y bootstrap.js carga src/apa7-uoc.js por su
# ruta, que con "\" Zotero no encuentra. Se escribe cada entrada con "/".

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$manifest = Get-Content "manifest.json" -Raw | ConvertFrom-Json
$version = $manifest.version
$outputFile = "zotero-apa7-uoc-$version.xpi"
$files = @("manifest.json", "bootstrap.js", "src/apa7-uoc.js", "csl/apa-uoc-7th.csl")

Write-Host "=== Empaquetando zotero-apa7-uoc v$version ==="
$xpiPath = Join-Path (Get-Location) $outputFile
if (Test-Path $xpiPath) { Remove-Item $xpiPath }

$zip = [System.IO.Compression.ZipFile]::Open($xpiPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($f in $files) {
        $src = Join-Path (Get-Location) $f
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $src, $f.Replace("\", "/")) | Out-Null
    }
} finally {
    $zip.Dispose()
}

# Comprobación del paquete
$check = [System.IO.Compression.ZipFile]::OpenRead($xpiPath)
try {
    $names = @($check.Entries | ForEach-Object { $_.FullName })
    $bad = @($names | Where-Object { $_.Contains("\") })
    if ($bad.Count -gt 0 -or $names.Count -ne $files.Count) {
        throw "PAQUETE DEFECTUOSO: $($names -join ', ')"
    }
} finally {
    $check.Dispose()
}
Write-Host "Paquete comprobado: $($names.Count) ficheros, rutas con /."
Write-Host "Archivo: $outputFile"
