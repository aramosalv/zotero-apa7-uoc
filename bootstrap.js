/* bootstrap.js — Plugin APA 7.ª edición – Adaptación UOC
 *
 * Solo ciclo de vida. Toda la lógica vive en src/apa7-uoc.js, que se carga
 * aquí: hasta la v1.3.0 este fichero llevaba su propia copia de la lógica y
 * src/apa7-uoc.js iba en el paquete sin que nadie lo cargara.
 */

/* global APA7UOC, Services, APP_SHUTDOWN */

function install() {}

async function startup({ id, version, rootURI }, reason) {
  try {
    await Zotero.initializationPromise;
    Services.scriptloader.loadSubScript(rootURI + "src/apa7-uoc.js");
    Zotero.debug("APA7-UOC: === STARTUP v" + version + " ===");
    APA7UOC.init(rootURI);
    await APA7UOC.installCSL();
    APA7UOC.applyPatches(Zotero.CiteProc && Zotero.CiteProc.CSL);
  } catch (e) {
    Zotero.debug("APA7-UOC: ERROR en startup: " + e);
    if (e.stack) Zotero.debug("APA7-UOC: Stack: " + e.stack);
  }
}

function onMainWindowLoad({ window }) {}

function onMainWindowUnload({ window }) {}

function shutdown({ id, version, rootURI }, reason) {
  if (reason === APP_SHUTDOWN) return;
  try {
    if (typeof APA7UOC !== "undefined") APA7UOC.removePatches();
    Zotero.debug("APA7-UOC: === SHUTDOWN ===");
  } catch (e) {
    Zotero.debug("APA7-UOC: ERROR en shutdown: " + e);
  }
}

function uninstall() {}
