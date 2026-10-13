#!/bin/bash
# build.sh — Empaqueta el plugin como .xpi para Zotero 7 y posteriores
#
# Uso: bash build.sh
# Resultado: zotero-apa7-uoc-VERSION.xpi en el directorio actual
#
# Las rutas internas del .xpi tienen que ir con "/": bootstrap.js carga
# src/apa7-uoc.js por su ruta, y con "\" Zotero no lo encuentra. Por eso el
# script comprueba el paquete al terminar.

set -e

PLUGIN_NAME="zotero-apa7-uoc"
VERSION=$(grep '"version"' manifest.json | head -1 | sed 's/.*: "\(.*\)".*/\1/')
OUTPUT_FILE="${PLUGIN_NAME}-${VERSION}.xpi"
FILES="manifest.json bootstrap.js src/apa7-uoc.js csl/apa-uoc-7th.csl"

echo "=== Empaquetando ${PLUGIN_NAME} v${VERSION} ==="
rm -f "${OUTPUT_FILE}"

if command -v zip >/dev/null 2>&1; then
  zip -X -q "${OUTPUT_FILE}" ${FILES}
else
  python3 - "${OUTPUT_FILE}" ${FILES} <<'PY'
import sys, zipfile
out, files = sys.argv[1], sys.argv[2:]
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for f in files:
        z.write(f, f.replace("\\", "/"))
PY
fi

# Comprobación del paquete: exactamente esos ficheros, con "/", idénticos al disco.
python3 - "${OUTPUT_FILE}" ${FILES} <<'PY'
import sys, zipfile, hashlib
out, files = sys.argv[1], sys.argv[2:]
z = zipfile.ZipFile(out)
names = z.namelist()
errores = []
if sorted(names) != sorted(files):
    errores.append("contenido inesperado: %s" % names)
for n in names:
    if "\\" in n:
        errores.append("ruta con barra invertida: %s" % n)
for f in files:
    if f in names and hashlib.md5(z.read(f)).hexdigest() != hashlib.md5(open(f, "rb").read()).hexdigest():
        errores.append("difiere del disco: %s" % f)
if errores:
    print("PAQUETE DEFECTUOSO:\n  " + "\n  ".join(errores))
    sys.exit(1)
print("Paquete comprobado: %d ficheros, rutas con /, idénticos al disco." % len(names))
PY

echo "Archivo: ${OUTPUT_FILE} ($(du -h "${OUTPUT_FILE}" | cut -f1))"
