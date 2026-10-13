"use strict";
/**
 * harness.js — Arnés de pruebas con citeproc-js real, fuera de Zotero.
 *
 * Compone bibliografías con el mismo CSL que instala el plugin y en los tres
 * formatos que usa Zotero (text, html y rtf). Permite cargar el código del
 * plugin con un objeto Zotero mínimo, de modo que las pruebas ejercitan el
 * mismo parche sobre CSL.Engine.prototype.makeBibliography que corre en Zotero.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
// Por defecto, citeproc-js de npm. Con CITEPROC=zotero-9.0.6 (o cualquier otra
// versión descargada con test/descarga_citeproc_zotero.sh), la copia que trae esa
// versión de Zotero, que es la que corre de verdad dentro de Zotero.
function cargarCiteproc() {
  const v = process.env.CITEPROC;
  if (!v || v === "npm") return require("citeproc");
  const f = path.join(__dirname, "fixtures", "citeproc_" + v.replace("-", "_") + ".js");
  if (!fs.existsSync(f)) throw new Error("No existe " + f + ": descárgalo con test/descarga_citeproc_zotero.sh " + v.replace("zotero-", ""));
  const c = vm.createContext({ console });
  vm.runInContext(fs.readFileSync(f, "utf8") + "\nthis.CSL = CSL;", c, { filename: f });
  return c.CSL;
}
const CSL = cargarCiteproc();

const RAIZ = path.join(__dirname, "..");
const CSL_XML = fs.readFileSync(path.join(RAIZ, "csl", "apa-uoc-7th.csl"), "utf8");
const FIXTURES = path.join(__dirname, "fixtures");

function retrieveLocale(lang) {
  const map = { es: "es-ES", en: "en-US", ca: "ca-AD" };
  const code = map[lang] || lang;
  const f = path.join(FIXTURES, "locales-" + code + ".xml");
  return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : fs.readFileSync(path.join(FIXTURES, "locales-en-US.xml"), "utf8");
}

/**
 * Compone la bibliografía de `items` (CSL-JSON) en el formato pedido.
 * Devuelve el resultado crudo de makeBibliography(): [params, entries].
 */
function bibliografia(items, format, lang) {
  const porId = {};
  for (const it of items) porId[it.id] = comoZotero(it);
  const sys = {
    retrieveLocale,
    retrieveItem: (id) => porId[id],
  };
  const engine = new CSL.Engine(sys, CSL_XML, lang || "es-ES", true);
  engine.setOutputFormat(format);
  engine.updateItems(items.map((it) => it.id));
  return { engine, bib: engine.makeBibliography() };
}

/**
 * Prepara los nombres como Zotero.Utilities.Item.itemToCSLJSON: separa las
 * partículas ("de la", "van") con parseParticles, que es lo que recibe el motor.
 */
function comoZotero(item) {
  const it = JSON.parse(JSON.stringify(item));
  for (const k of Object.keys(it)) {
    if (!Array.isArray(it[k])) continue;
    for (const nm of it[k]) {
      if (nm && typeof nm === "object" && nm.family && nm.given) CSL.parseParticles(nm);
    }
  }
  return it;
}

/** Une las entradas como lo hace Zotero.Cite.makeFormattedBibliography para text. */
function unir(bib) {
  return bib[1].join("");
}

/**
 * Carga un fichero del plugin en un contexto aislado con un Zotero mínimo.
 * Devuelve el objeto APA7UOC de ese contexto.
 */
function cargarPlugin(fichero, zoteroExtra) {
  const zotero = Object.assign({ debug: () => {}, logError: () => {} }, zoteroExtra || {});
  const ctx = vm.createContext({ Zotero: zotero, console });
  vm.runInContext(fs.readFileSync(fichero, "utf8"), ctx, { filename: fichero });
  return { APA7UOC: ctx.APA7UOC, ctx };
}

module.exports = { CSL, bibliografia, unir, cargarPlugin, RAIZ, FIXTURES };
