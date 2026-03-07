/* bootstrap.js — Plugin APA 7.ª edición – Adaptación UOC  v5
 *
 * Inyecta [NombreCompleto] tras las iniciales en bibliografías APA UOC.
 * Parchea Zotero.Cite.makeFormattedBibliography, que es la función
 * usada por "Crear bibliografía a partir del elemento".
 */

var APA7UOC = {
  STYLE_ID: "http://www.zotero.org/styles/apa-uoc-7th",
  _rootURI: null,
  _patched: false,
  _originalMakeFormatted: null,

  init: function (rootURI) {
    this._rootURI = rootURI;
    Zotero.APA7UOC = this;
    Zotero.debug("APA7-UOC: init() OK, rootURI=" + rootURI);
  },

  applyPatches: function () {
    if (this._patched) {
      Zotero.debug("APA7-UOC: Patches ya aplicados, saltando");
      return;
    }
    this._patched = true;
    var self = this;

    Zotero.debug("APA7-UOC: === Aplicando patches ===");

    // --- Patch: Zotero.Cite.makeFormattedBibliography ---
    // Esta función genera el HTML/texto de la bibliografía.
    // Es llamada por "Crear bibliografía a partir del elemento" y otros.
    try {
      if (Zotero.Cite && typeof Zotero.Cite.makeFormattedBibliography === "function") {
        this._originalMakeFormatted = Zotero.Cite.makeFormattedBibliography;
        var origFn = this._originalMakeFormatted;

        Zotero.Cite.makeFormattedBibliography = function (cslEngine, format) {
          var result;
          try {
            result = origFn.apply(this, arguments);
          } catch (e) {
            Zotero.debug("APA7-UOC: Error llamando original: " + e);
            throw e;
          }

          // Solo procesar strings (HTML o texto plano)
          if (typeof result !== "string") {
            Zotero.debug("APA7-UOC: Resultado no es string, tipo=" + typeof result);
            return result;
          }

          // Detectar si el estilo activo es UOC
          var isUOC = self._isUOCStyle(cslEngine);
          Zotero.debug("APA7-UOC: isUOC=" + isUOC);

          if (!isUOC) return result;

          // Obtener items del registro del motor CSL
          var items = self._getRegisteredItems(cslEngine);
          Zotero.debug("APA7-UOC: Procesando " + items.length + " items");

          if (items.length === 0) return result;

          return self._injectFullNames(result, items);
        };

        Zotero.debug("APA7-UOC: ✓ Patch makeFormattedBibliography OK");
      } else {
        Zotero.debug("APA7-UOC: ✗ Cite.makeFormattedBibliography NO disponible");
      }
    } catch (e) {
      Zotero.debug("APA7-UOC: ERROR Patch: " + e);
      if (e.stack) Zotero.debug("APA7-UOC: Stack: " + e.stack);
    }

    Zotero.debug("APA7-UOC: === Patches completados ===");
  },

  removePatches: function () {
    if (this._originalMakeFormatted) {
      Zotero.Cite.makeFormattedBibliography = this._originalMakeFormatted;
      this._originalMakeFormatted = null;
    }
    this._patched = false;
    Zotero.debug("APA7-UOC: Patches eliminados");
  },

  installCSL: function () {
    try {
      var cslURL = this._rootURI + "csl/apa-uoc-7th.csl";
      Zotero.debug("APA7-UOC: Leyendo CSL desde: " + cslURL);
      var cslContent = null;
      try { cslContent = Zotero.File.getContentsFromURL(cslURL); } catch (e) {}
      if (!cslContent) {
        try { cslContent = Zotero.File.getContentsFromURL(this._rootURI + "csl\\apa-uoc-7th.csl"); } catch (e) {}
      }
      if (cslContent) {
        Zotero.debug("APA7-UOC: CSL leído (" + cslContent.length + " bytes)");
        Zotero.Styles.install({ string: cslContent }, "apa-uoc-7th.csl", true);
        Zotero.debug("APA7-UOC: CSL instalado OK");
      } else {
        Zotero.debug("APA7-UOC: No se pudo leer CSL desde XPI");
        var exists = Zotero.Styles.get(this.STYLE_ID);
        Zotero.debug("APA7-UOC: Estilo ya en Zotero: " + (exists ? "SÍ" : "NO"));
      }
    } catch (e) {
      Zotero.debug("APA7-UOC: Error CSL: " + e);
    }
  },

  // =========================================================================
  // DETECCIÓN DE ESTILO
  // =========================================================================

  _isUOCStyle: function (cslEngine) {
    try {
      if (!cslEngine) return false;
      // Buscar en opt.styleID
      if (cslEngine.opt && cslEngine.opt.styleID) {
        if (String(cslEngine.opt.styleID).indexOf("apa-uoc") !== -1) return true;
      }
      // Buscar en sys.id (otra ubicación posible)
      if (cslEngine.sys && cslEngine.sys.id) {
        if (String(cslEngine.sys.id).indexOf("apa-uoc") !== -1) return true;
      }
      // Buscar en todas las keys de opt
      if (cslEngine.opt) {
        var keys = Object.keys(cslEngine.opt);
        for (var i = 0; i < keys.length; i++) {
          var v = cslEngine.opt[keys[i]];
          if (typeof v === "string" && v.indexOf("apa-uoc") !== -1) return true;
        }
      }
    } catch (e) {
      Zotero.debug("APA7-UOC: _isUOCStyle error: " + e);
    }
    return false;
  },

  _getRegisteredItems: function (cslEngine) {
    try {
      if (cslEngine && cslEngine.registry && cslEngine.registry.reflist) {
        return cslEngine.registry.reflist.map(function (ref) {
          try { return Zotero.Items.get(ref.id); } catch (e) { return null; }
        }).filter(function (item) { return item; });
      }
    } catch (e) {
      Zotero.debug("APA7-UOC: _getRegisteredItems error: " + e);
    }
    return [];
  },

  // =========================================================================
  // INYECCIÓN DE [Nombre]
  // =========================================================================

  _injectFullNames: function (bibOutput, items) {
    if (!bibOutput || !items || items.length === 0) return bibOutput;

    var result = bibOutput;

    for (var i = 0; i < items.length; i++) {
      try {
        var item = items[i];
        if (!item || typeof item.getCreators !== "function") continue;

        var creators = item.getCreators();
        if (!creators || creators.length === 0) continue;

        for (var j = 0; j < creators.length; j++) {
          var c = creators[j];
          // Saltar nombres institucionales o sin nombre de pila
          if (c.fieldMode === 1 || !c.firstName) continue;

          var fn = c.firstName.trim();
          var ln = c.lastName.trim();
          if (!fn || !ln) continue;

          // Saltar si el nombre es solo iniciales (no aporta info nueva)
          // "A." o "P. A." → saltar; "P. Antonio" o "María J." → añadir
          if (this._isOnlyInitials(fn)) continue;

          var initials = this._getInitials(fn);

          // Escapar para regex
          var eln = this._esc(ln);
          var ei = this._esc(initials);

          // Saltar si ya tiene [Nombre]
          if (new RegExp(eln + ",\\s*" + ei + "\\s*\\[").test(result)) continue;

          // Reemplazar: "Apellido, I." → "Apellido, I. [Nombre]"
          var re = new RegExp("(" + eln + ",\\s*" + ei + ")(?!\\s*\\[)", "g");
          result = result.replace(re, "$1 [" + fn + "]");
        }
      } catch (e) {
        Zotero.debug("APA7-UOC: Error en item " + i + ": " + e);
      }
    }

    // Añadir punto después del último corchete antes del año: "] (2009)" → "]. (2009)"
    result = result.replace(/\](\s+)\((\d{4})/g, "].$1($2");

    return result;
  },

  _getInitials: function (firstName) {
    if (!firstName) return "";
    // Si ya son iniciales (e.g., "J. M."), devolver tal cual
    if (/^[A-Z\u00C0-\u024F]\.(\s*-?\s*[A-Z\u00C0-\u024F]\.)*\s*$/i.test(firstName)) {
      return firstName.trim();
    }
    var parts = firstName.split(/\s+/);
    var inits = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!p) continue;
      if (p.indexOf("-") !== -1) {
        inits.push(p.split("-").filter(Boolean).map(function (s) {
          return s.charAt(0).toUpperCase() + ".";
        }).join("-"));
      } else {
        inits.push(p.charAt(0).toUpperCase() + ".");
      }
    }
    return inits.join(" ");
  },

  _isOnlyInitials: function (firstName) {
    // Devuelve true si TODOS los componentes del nombre son iniciales
    // "A." → true, "P. A." → true, "J.-P." → true
    // "Antonio" → false, "P. Antonio" → false, "María J." → false
    if (!firstName) return true;
    var parts = firstName.trim().split(/\s+/);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!p) continue;
      // Manejar iniciales compuestas con guión: "J.-P."
      var subparts = p.split("-");
      for (var j = 0; j < subparts.length; j++) {
        var sp = subparts[j];
        if (!sp) continue;
        // Una inicial es una sola letra, opcionalmente seguida de punto
        if (!/^[A-Z\u00C0-\u024F]\.?$/i.test(sp)) {
          return false; // Este componente NO es una inicial → tiene nombre real
        }
      }
    }
    return true;
  },

  _esc: function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
};


// =========================================================================
// BOOTSTRAP LIFECYCLE
// =========================================================================

function install() {}

function startup({ id, version, rootURI }, reason) {
  try {
    Zotero.debug("APA7-UOC: === STARTUP v" + version + " ===");
    APA7UOC.init(rootURI);

    var doInit = function () {
      try {
        Zotero.debug("APA7-UOC: Zotero inicializado, aplicando...");
        APA7UOC.installCSL();
        APA7UOC.applyPatches();
      } catch (e) {
        Zotero.debug("APA7-UOC: ERROR en doInit: " + e);
        if (e.stack) Zotero.debug("APA7-UOC: Stack: " + e.stack);
      }
    };

    if (Zotero.initialized) {
      doInit();
    } else {
      Zotero.initializationPromise.then(doInit);
    }
  } catch (e) {
    Zotero.debug("APA7-UOC: ERROR FATAL en startup: " + e);
  }
}

function onMainWindowLoad({ window }) {
  Zotero.debug("APA7-UOC: === MAIN WINDOW LOAD ===");
  try {
    APA7UOC.applyPatches();
  } catch (e) {
    Zotero.debug("APA7-UOC: ERROR en onMainWindowLoad: " + e);
  }
}

function onMainWindowUnload({ window }) {}

function shutdown({ id, version, rootURI }, reason) {
  if (reason === APP_SHUTDOWN) return;
  try {
    Zotero.debug("APA7-UOC: === SHUTDOWN ===");
    APA7UOC.removePatches();
    delete Zotero.APA7UOC;
  } catch (e) {
    Zotero.debug("APA7-UOC: ERROR shutdown: " + e);
  }
}

function uninstall() {}
