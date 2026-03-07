#!/bin/bash
# build.sh — Empaqueta el plugin como .xpi para Zotero 7
#
# Uso: bash build.sh
# Resultado: zotero-apa7-uoc.xpi en el directorio actual

set -e

PLUGIN_NAME="zotero-apa7-uoc"
VERSION=$(grep '"version"' manifest.json | head -1 | sed 's/.*: "\(.*\)".*/\1/')
OUTPUT_FILE="${PLUGIN_NAME}-${VERSION}.xpi"

echo "=== Empaquetando ${PLUGIN_NAME} v${VERSION} ==="

# Eliminar XPI anterior si existe
rm -f "${OUTPUT_FILE}"

# Crear el XPI (ZIP con extensión .xpi)
# manifest.json y bootstrap.js deben estar en la raíz del ZIP
zip -r "${OUTPUT_FILE}" \
  manifest.json \
  bootstrap.js \
  src/ \
  csl/ \
  -x "*.DS_Store" \
  -x "__MACOSX/*" \
  -x "*.sh" \
  -x "build.*" \
  -x "updates.json" \
  -x ".git/*"

echo ""
echo "=== Empaquetado completado ==="
echo "Archivo: ${OUTPUT_FILE}"
echo "Tamaño: $(du -h "${OUTPUT_FILE}" | cut -f1)"
echo ""
echo "Para instalar:"
echo "  1. Abre Zotero 7"
echo "  2. Ve a Herramientas > Complementos"
echo "  3. Clic en el engranaje > Instalar complemento desde archivo"
echo "  4. Selecciona ${OUTPUT_FILE}"
