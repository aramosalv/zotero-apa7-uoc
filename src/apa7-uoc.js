"use strict";

/**
 * apa7-uoc.js — Lógica del plugin APA 7 UOC para Zotero 7 y posteriores.
 * Lo carga bootstrap.js; es la única implementación.
 *
 * 1. INSTALA el estilo CSL propio (apa-uoc-7th.csl), que pone la conjunción
 *    por idioma (y/i/e/&/und) en vez de "&".
 *
 * 2. ENVUELVE CSL.Engine.prototype.makeBibliography, el método del motor
 *    citeproc-js por el que pasan TODAS las bibliografías de Zotero: «Crear
 *    bibliografía», la copia rápida y la integración con Word, LibreOffice y
 *    Google Docs. Si el motor usa el estilo UOC, inyecta el nombre de pila
 *    entre corchetes tras las iniciales: "Perinat, A." → "Perinat, A. [Adolfo]".
 *
 * Cómo se evita atribuir un nombre a quien no firmó la obra:
 *  - Cada entrada se procesa SOLO con los nombres de sus propios ítems
 *    (bibliography[0].entry_ids), nunca sobre la bibliografía entera.
 *  - Dentro de la entrada, los nombres se asignan en el orden en que figuran,
 *    consumiendo cada coincidencia una sola vez: dos coautores homónimos
 *    reciben cada uno el suyo.
 *  - El apellido exige frontera por la izquierda ("Ruiz" no encaja dentro de
 *    "García Ruiz") y las iniciales se cotejan enteras ("R." no encaja dentro
 *    de "R. J." ni "J." dentro de "J.-R.").
 *  - Todo se busca y se inserta con el escape del formato de salida (en RTF,
 *    "ñ" es "\uc0\u241{}"), así que funciona igual en text, html y rtf.
 *
 * Las citas en el texto no se tocan: no pasan por makeBibliography.
 */

// eslint-disable-next-line no-unused-vars
var APA7UOC = {
  STYLE_ID: "http://www.zotero.org/styles/apa-uoc-7th",

  _rootURI: null,
  _enginePrototype: null,
  _originalMakeBibliography: null,

  // Conjunciones que el CSL puede poner entre el penúltimo y el último autor
  // (and="text" según el idioma), más el ampersand en sus formas escapadas.
  CONJUNCIONES: ["y", "e", "i", "u", "and", "und", "et", "en", "og", "och", "ja", "&", "&#38;", "&amp;"],

  // Variables de nombre de CSL, en el orden en que suelen imprimirse.
  VARIABLES_NOMBRE: ["author", "editor", "translator", "composer", "director", "interviewer",
    "recipient", "editorial-director", "collection-editor", "container-author", "illustrator",
    "original-author", "reviewed-author"],

  _log(msg) {
    if (typeof Zotero !== "undefined" && Zotero.debug) Zotero.debug("APA7-UOC: " + msg);
  },

  // =========================================================================
  // CICLO DE VIDA
  // =========================================================================

  init(rootURI) {
    this._rootURI = rootURI;
  },

  async installCSL() {
    try {
      const cslContent = Zotero.File.getContentsFromURL(this._rootURI + "csl/apa-uoc-7th.csl");
      if (!cslContent) {
        this._log("No se pudo leer el CSL del paquete");
        return;
      }
      await Zotero.Styles.install({ string: cslContent }, "apa-uoc-7th.csl", true);
      this._log("Estilo CSL instalado");
    } catch (e) {
      this._log("Instalación del CSL: " + e);
    }
  },

  /**
   * Envuelve makeBibliography en el prototipo del motor. Al ser el prototipo,
   * alcanza también a los motores que Zotero ya tuviera creados o en caché.
   * @param {object} CSL — espacio de nombres de citeproc-js (Zotero.CiteProc.CSL)
   */
  applyPatches(CSL) {
    if (this._originalMakeBibliography) return;
    const proto = CSL && CSL.Engine && CSL.Engine.prototype;
    if (!proto || typeof proto.makeBibliography !== "function") {
      this._log("No se encuentra CSL.Engine.prototype.makeBibliography; no se aplica el parche");
      return;
    }
    const self = this;
    // Si ya hay un envoltorio nuestro (módulo cargado dos veces sin shutdown),
    // se parte del método original y no se apila un envoltorio sobre otro.
    const current = proto.makeBibliography;
    const original = current.__apa7uocOriginal || current;
    this._enginePrototype = proto;
    this._originalMakeBibliography = original;

    proto.makeBibliography = function () {
      const bib = original.apply(this, arguments);
      try {
        if (bib && self.isUOCEngine(this)) self.processBibliography(this, bib);
      } catch (e) {
        self._log("Error al post-procesar la bibliografía: " + e);
      }
      return bib;
    };
    proto.makeBibliography.__apa7uocOriginal = original;
    this._log("Parche aplicado a CSL.Engine.prototype.makeBibliography");
  },

  removePatches() {
    if (this._enginePrototype && this._originalMakeBibliography) {
      this._enginePrototype.makeBibliography = this._originalMakeBibliography;
    }
    this._enginePrototype = null;
    this._originalMakeBibliography = null;
  },

  isUOCEngine(engine) {
    try {
      const id = engine && engine.opt && engine.opt.styleID;
      return typeof id === "string" && id.indexOf("apa-uoc") !== -1;
    } catch (e) {
      return false;
    }
  },

  // =========================================================================
  // POST-PROCESO DE LA BIBLIOGRAFÍA
  // =========================================================================

  /**
   * Procesa en sitio el resultado de makeBibliography(): [params, entries].
   */
  processBibliography(engine, bib) {
    const params = bib[0];
    const entries = bib[1];
    if (!params || !Array.isArray(params.entry_ids) || !Array.isArray(entries)) return;

    const escape = this._escaper(engine);
    for (let i = 0; i < entries.length; i++) {
      const ids = params.entry_ids[i] || [];
      const names = [];
      for (const id of ids) {
        const item = this._retrieveItem(engine, id);
        if (item) names.push(...this._namesOf(item));
      }
      if (names.length && typeof entries[i] === "string") {
        entries[i] = this.processEntry(entries[i], names, escape);
      }
    }
  },

  _retrieveItem(engine, id) {
    try {
      // El registro del motor ya guarda el ítem con el que compuso la entrada:
      // se usa ese, sin volver a pedírselo a Zotero.
      const reg = engine.registry && engine.registry.registry && engine.registry.registry[id];
      if (reg && reg.ref) return reg.ref;
      if (typeof engine.retrieveItem === "function") return engine.retrieveItem(id);
      if (engine.sys && typeof engine.sys.retrieveItem === "function") return engine.sys.retrieveItem(id);
    } catch (e) {
      this._log("No se pudo recuperar el ítem " + id + ": " + e);
    }
    return null;
  },

  /** Nombres personales del ítem CSL-JSON, en orden: [{ family, given }]. */
  _namesOf(item) {
    const out = [];
    const vars = this.VARIABLES_NOMBRE.concat(Object.keys(item).filter((k) => this.VARIABLES_NOMBRE.indexOf(k) === -1));
    for (const v of vars) {
      const list = item[v];
      if (!Array.isArray(list)) continue;
      for (const nm of list) {
        if (!nm || typeof nm !== "object" || nm.literal) continue;
        // La partícula que no cae ("de la Fuente") va con el apellido; la que cae
        // ("Ludwig van Beethoven") sale detrás de las iniciales: "Beethoven, L. van".
        const family = [nm["non-dropping-particle"], nm.family]
          .filter((s) => typeof s === "string" && s.trim()).join(" ").trim();
        const given = typeof nm.given === "string" ? nm.given.trim() : "";
        const dropping = typeof nm["dropping-particle"] === "string" ? nm["dropping-particle"].trim() : "";
        if (family && given) out.push({ family, given, dropping });
      }
    }
    return out;
  },

  /** Función de escape del formato activo del motor (text, html o rtf). */
  _escaper(engine) {
    const fmt = engine && engine.fun && engine.fun.decorate;
    if (fmt && typeof fmt.text_escape === "function") return (s) => fmt.text_escape(s);
    return (s) => s;
  },

  /**
   * Inserta [Nombre] tras las iniciales de cada nombre dentro de una entrada.
   * @param {string} entry — la entrada formateada
   * @param {{family:string, given:string}[]} names — nombres de sus ítems, en orden
   * @param {function} escape — escape del formato de salida
   */
  processEntry(entry, names, escape) {
    const used = [];           // intervalos [inicio, fin) ya asignados
    const inserts = [];        // { pos, text }
    let cursor = 0;

    for (const nm of names) {
      if (this._isOnlyInitials(nm.given)) continue;
      const expected = this._initialLetters(nm.given);
      if (!expected.length) continue;

      const candidates = this._findCandidates(entry, nm.family, expected, escape, nm.dropping)
        .filter((c) => !used.some((u) => c.start < u[1] && c.end > u[0]));
      if (!candidates.length) continue;

      // El primero a partir del anterior; si no lo hay, el primero libre.
      const pick = candidates.find((c) => c.start >= cursor) || candidates[0];
      used.push([pick.start, pick.end]);
      cursor = pick.end;

      let text = " [" + escape(nm.given) + "]";
      // "Apellido, I. (2020)" → "Apellido, I. [Nombre]. (2020)": el punto de las
      // iniciales cerraba el bloque de autoría; tras el corchete hay que reponerlo.
      // Vale para cualquier fecha: año, "(s. f.)", "(n.d.)", "(s. f.-a)". No se
      // pone ante el rol de los editores, "(Ed.). (2013)": un paréntesis seguido de
      // otro paréntesis es el rol, y el segundo, la fecha.
      if (this._dateFollows(entry.slice(pick.end))) text += ".";
      inserts.push({ pos: pick.end, text });
    }

    inserts.sort((a, b) => b.pos - a.pos);
    let out = entry;
    for (const ins of inserts) out = out.slice(0, ins.pos) + ins.text + out.slice(ins.pos);
    return out;
  },

  /** ¿Empieza `rest` por la fecha del bloque de autoría, y no por el rol? */
  _dateFollows(rest) {
    const m = /^\s+\([^()]*\)/.exec(rest);
    if (!m) return false;
    return !/^\.?\s+\(/.test(rest.slice(m[0].length));
  },

  /**
   * Busca "Apellido, I. I." en la entrada, con fronteras por los dos lados y
   * con las iniciales cotejadas letra a letra contra el nombre de pila.
   */
  _findCandidates(entry, family, expected, escape, dropping) {
    const famRe = this._familyPattern(family, escape);
    const dropRe = dropping ? "(?:\\s+" + this._familyPattern(dropping, escape) + ")?" : "";
    // Una inicial: letra mayúscula (o su escape RTF) seguida de punto.
    const ini = "(?:\\p{Lu}|\\\\uc0\\\\u\\d+\\{\\})\\.";
    const re = new RegExp("(" + famRe + "),\\s*(" + ini + "(?:[\\s-]?" + ini + ")*)(?![\\s-]?(?:\\p{Lu}|\\\\uc0\\\\u\\d+\\{\\})\\.)" + dropRe + "(?!\\s*\\[)", "gu");
    const out = [];
    let m;
    while ((m = re.exec(entry))) {
      const start = m.index;
      const end = start + m[0].length;
      if (!this._leftBoundaryOk(entry, start)) continue;
      const letters = this._lettersOfRendered(m[2]);
      if (!this._sameLetters(letters, expected)) continue;
      out.push({ start, end });
    }
    return out;
  },

  /** Expresión del apellido tal como lo imprime el motor (escapado y con apóstrofo tipográfico). */
  _familyPattern(family, escape) {
    let out = "";
    for (const ch of family) {
      if (ch === "'" || ch === "’") {
        const alts = [escape("'"), escape("’"), "'", "’", "&#39;", "&#039;"]
          .filter((v, i, a) => a.indexOf(v) === i).map((s) => this._escapeRegex(s));
        out += "(?:" + alts.join("|") + ")";
      } else if (/\s/.test(ch)) {
        out += "\\s+";
      } else {
        out += this._escapeRegex(escape(ch));
      }
    }
    return out;
  },

  /**
   * Frontera izquierda: el apellido empieza la entrada o sigue a un separador
   * de autores. No vale si es la cola de otro apellido ("García Ruiz").
   */
  _leftBoundaryOk(entry, start) {
    if (start === 0) return true;
    const prev = entry[start - 1];
    if (!/\s/.test(prev)) {
      // Pegado a una letra, cifra, guion o apóstrofo: es parte de otra palabra.
      return !/[\p{L}\p{N}\-'’]/u.test(prev);
    }
    // Precedido de espacio: mirar la palabra anterior.
    const before = entry.slice(0, start).replace(/\s+$/, "");
    if (!before.length) return true;
    const last = before.slice(before.length - 1);
    if (/[,;\]>}…]/.test(last) || before.endsWith("...")) return true;
    const word = (before.match(/(\S+)$/) || ["", ""])[1];
    return this.CONJUNCIONES.indexOf(word.toLowerCase()) !== -1;
  },

  /** Letras de unas iniciales tal como salen del motor ("J.-P.", "\uc0\u193{}."). */
  _lettersOfRendered(s) {
    const out = [];
    const re = /\\uc0\\u(\d+)\{\}|(\p{Lu})/gu;
    let m;
    while ((m = re.exec(s))) out.push(m[1] ? String.fromCharCode(+m[1]) : m[2]);
    return out;
  },

  /** Primera letra de cada componente del nombre de pila, en mayúscula. */
  _initialLetters(given) {
    return given.split(/[\s\-.]+/).filter(Boolean).map((p) => p.charAt(0).toUpperCase());
  },

  _sameLetters(a, b) {
    if (a.length !== b.length) return false;
    const norm = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase();
    return a.every((x, i) => x === b[i] || norm(x) === norm(b[i]));
  },

  /**
   * true si el nombre de pila son solo iniciales y no aporta nada:
   * "A.", "P. A.", "J.-P.", "G.L." → true; "P. Antonio", "María J." → false.
   */
  _isOnlyInitials(given) {
    if (!given) return true;
    return given.split(/[\s\-.]+/).filter(Boolean).every((p) => /^\p{L}$/u.test(p));
  },

  _escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },
};
