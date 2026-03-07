$ErrorActionPreference = "Stop"
$outputFile = "zotero-apa7-uoc-1.0.0.xpi"
$zipFile = "zotero-apa7-uoc-1.0.0.zip"

if (Test-Path $outputFile) { Remove-Item $outputFile }
if (Test-Path $zipFile) { Remove-Item $zipFile }

$tempDir = Join-Path $env:TEMP "apa7-uoc-build-temp"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Copy-Item "manifest.json" $tempDir
Copy-Item "bootstrap.js" $tempDir
Copy-Item "src" (Join-Path $tempDir "src") -Recurse
Copy-Item "csl" (Join-Path $tempDir "csl") -Recurse

Compress-Archive -Path (Join-Path $tempDir "*") -DestinationPath $zipFile -Force
Move-Item $zipFile $outputFile -Force

Remove-Item $tempDir -Recurse -Force

$item = Get-Item $outputFile
Write-Host "BUILD OK: $($item.Name) ($([math]::Round($item.Length / 1KB, 1)) KB)"
