"use strict";
/**
 * bootstrap_test.js — Ciclo de vida con un Zotero simulado: startup carga
 * src/apa7-uoc.js, instala el CSL y parchea el motor; shutdown lo restaura.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { CSL, bibliografia, RAIZ } = require("./harness");

const fallos = [];
const ok = (cond, msg) => { if (!cond) fallos.push(msg); };

const original = CSL.Engine.prototype.makeBibliography;
const instalados = [];
const ctx = vm.createContext({
  console,
  APP_SHUTDOWN: 2,
  Zotero: {
    debug: () => {},
    initializationPromise: Promise.resolve(),
    CiteProc: { CSL },
    File: { getContentsFromURL: (url) => fs.readFileSync(url.replace("file://", ""), "utf8") },
    Styles: { install: async (src, origin, silent) => { instalados.push({ origin, len: src.string.length, silent }); } },
  },
});
ctx.Services = {
  scriptloader: {
    loadSubScript: (url) => {
      const f = url.replace("file://", "");
      vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: f });
    },
  },
};
vm.runInContext(fs.readFileSync(path.join(RAIZ, "bootstrap.js"), "utf8"), ctx, { filename: "bootstrap.js" });

const rootURI = "file://" + RAIZ + "/";
const item = { id: "x1", type: "book", author: [{ family: "Perinat", given: "Adolfo" }], issued: { "date-parts": [[2003]] }, title: "Psicología del desarrollo", publisher: "UOC" };

(async () => {
  await ctx.startup({ id: "apa7-uoc@zotero-plugins.org", version: "test", rootURI }, 1);
  ok(instalados.length === 1 && instalados[0].origin === "apa-uoc-7th.csl" && instalados[0].len > 1000, "startup no instaló el CSL");
  ok(CSL.Engine.prototype.makeBibliography !== original, "startup no parcheó el motor");

  let t = bibliografia([item], "text").bib[1][0];
  ok(t.startsWith("Perinat, A. [Adolfo]. (2003)."), "con el plugin activo no sale el corchete: " + t);

  // Un segundo startup (p. ej. reactivar el plugin) no debe envolver dos veces.
  await ctx.startup({ id: "apa7-uoc@zotero-plugins.org", version: "test", rootURI }, 1);
  t = bibliografia([item], "text").bib[1][0];
  ok((t.match(/\[Adolfo\]/g) || []).length === 1, "un segundo startup duplica el corchete: " + t);

  ctx.shutdown({ id: "apa7-uoc@zotero-plugins.org", version: "test", rootURI }, 4);
  ok(CSL.Engine.prototype.makeBibliography === original, "shutdown no restauró el motor");
  t = bibliografia([item], "text").bib[1][0];
  ok(t.startsWith("Perinat, A. (2003)."), "tras shutdown sigue saliendo el corchete: " + t);

  console.log(fallos.length ? "FALLOS:\n  " + fallos.join("\n  ") : "Ciclo de vida: 7 de 7 comprobaciones en verde.");
  process.exit(fallos.length ? 1 : 0);
})();
