#!/bin/bash
# Descarga la copia de citeproc-js que trae una versión de Zotero, para correr
# las pruebas contra el motor que corre de verdad dentro de Zotero.
# Uso: bash test/descarga_citeproc_zotero.sh 10.0.6 [9.0.6 ...]
set -e
cd "$(dirname "$0")/fixtures"
for v in "$@"; do
  curl -sfL -o "citeproc_zotero_${v}.js" \
    "https://raw.githubusercontent.com/zotero/zotero/${v}/chrome/content/zotero/xpcom/citeproc.js"
  echo "citeproc de Zotero ${v}: $(grep -o 'PROCESSOR_VERSION: "[^"]*"' "citeproc_zotero_${v}.js")"
done
