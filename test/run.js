"use strict";
/**
 * run.js — Ejecuta los casos contra el plugin, en text, html y rtf.
 *
 *   node test/run.js            → código actual (src/apa7-uoc.js, parche sobre el motor)
 *   node test/run.js --v130     → algoritmo publicado en la v1.3.0 (fixtures/bootstrap_v1.3.0.js),
 *                                 aplicado como lo hacía: sobre la bibliografía ENTERA
 *
 * Sale con código 1 si falla algún caso. Con --v130 se espera que falle: es el
 * control de que las pruebas son capaces de decir NO.
 */

const path = require("path");
const { CSL, bibliografia, cargarPlugin, RAIZ, FIXTURES } = require("./harness");
const { casos, real } = require("./casos");

const V130 = process.argv.includes("--v130");
const FORMATOS = ["text", "html", "rtf"];

// --- Normalización a texto plano, para comparar los tres formatos ----------
function plano(s, format) {
  let t = s;
  if (format === "html") {
    t = t.replace(/<[^>]+>/g, "")
      .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(+d))
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
  } else if (format === "rtf") {
    t = t.replace(/\\super ([ao])\\nosupersub\{\}/g, (m, l) => (l === "a" ? "ª" : "º"))
      .replace(/\\uc0\\u(\d+)\{\}/g, (m, d) => String.fromCharCode(+d))
      .replace(/\\(?:i0|i|b0|b|scaps0|scaps|ul0|ul|super|nosupersub|tab)\{\}/g, "")
      .replace(/\\([\\{}])/g, "\u0001$1")
      .replace(/[{}]/g, "")
      .replace(/\u0001/g, "")
      .replace(/\\\n?$/, "");
  }
  return t.replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

// --- Las dos implementaciones bajo prueba ----------------------------------
function zoteroItem(cslItem) {
  const creators = [];
  for (const v of ["author", "editor"]) {
    for (const nm of cslItem[v] || []) {
      if (nm.literal) creators.push({ fieldMode: 1, lastName: nm.literal, firstName: "" });
      else creators.push({ fieldMode: 0, lastName: nm.family, firstName: nm.given });
    }
  }
  return { id: cslItem.id, getCreators: () => creators };
}

function componerV130(items, format, lang) {
  const { APA7UOC } = cargarPlugin(path.join(FIXTURES, "bootstrap_v1.3.0.js"));
  const { bib } = bibliografia(items, format, lang);
  const SEP = "\u0002";
  // La v1.3.0 procesaba la bibliografía unida, con todos los ítems registrados.
  const unida = bib[1].join(SEP);
  const out = APA7UOC._injectFullNames(unida, items.map(zoteroItem));
  return { ids: bib[0].entry_ids.map((x) => x[0]), entradas: out.split(SEP) };
}

function componerActual(items, format, lang) {
  const { APA7UOC } = cargarPlugin(path.join(RAIZ, "src", "apa7-uoc.js"));
  APA7UOC.applyPatches(CSL);
  try {
    const { bib } = bibliografia(items, format, lang);
    return { ids: bib[0].entry_ids.map((x) => x[0]), entradas: bib[1] };
  } finally {
    APA7UOC.removePatches();
  }
}

const componer = V130 ? componerV130 : componerActual;

// --- Ejecución ---------------------------------------------------------------
let fallos = 0, pruebas = 0;
console.log("Código bajo prueba: " + (V130 ? "v1.3.0 publicada (bootstrap.js)" : "rama actual (src/apa7-uoc.js)") + "\n");

for (const c of casos) {
  for (const format of FORMATOS) {
    const { ids, entradas } = componer(c.items, format, c.lang);
    for (const id of Object.keys(c.esperado)) {
      pruebas++;
      const e = c.esperado[id];
      const crudo = entradas[ids.indexOf(id)];
      const t = plano(crudo, format);
      const errores = [];
      if (e.empieza && !t.startsWith(e.empieza)) errores.push("debía empezar por «" + e.empieza + "»");
      for (const s of e.contiene || []) if (!t.includes(s)) errores.push("debía contener «" + s + "»");
      for (const s of e.noContiene || []) if (t.includes(s)) errores.push("no debía contener «" + s + "»");
      if (errores.length) {
        fallos++;
        console.log("FALLO  [" + format + "] " + c.nombre + "\n       salida: " + t + "\n       " + errores.join("; "));
      }
    }
  }
}

// Control negativo: sin homónimos conflictivos, la salida tiene que coincidir con
// la de la v1.3.0. En text y html, carácter a carácter. En rtf la v1.3.0 omitía los
// nombres con tilde y no escapaba lo que insertaba, así que ahí la referencia es su
// salida en TEXTO, comparada en plano.
if (!V130) {
  const refTexto = componerV130(real, "text").entradas.map((x) => plano(x, "text"));
  for (const format of FORMATOS) {
    pruebas++;
    const b = componerActual(real, format).entradas;
    const a = format === "rtf" ? refTexto : componerV130(real, format).entradas;
    const bb = format === "rtf" ? b.map((x) => plano(x, "rtf")) : b;
    const distintas = a.map((x, i) => (x === bb[i] ? null : i)).filter((i) => i !== null);
    if (distintas.length) {
      fallos++;
      console.log("FALLO  [" + format + "] control negativo: " + distintas.length + " entrada(s) distintas de la v1.3.0");
      for (const i of distintas) console.log("       v1.3.0: " + a[i] + "\n       actual: " + bb[i]);
    }
  }
}

console.log("\n" + (pruebas - fallos) + " de " + pruebas + " comprobaciones en verde, " + fallos + " fallo(s).");
process.exit(fallos ? 1 : 0);
