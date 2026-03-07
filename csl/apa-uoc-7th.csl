"use strict";

/**
 * apa7-uoc.js — Lógica principal del plugin APA 7 UOC para Zotero 7
 *
 * Este módulo realiza dos funciones clave:
 *
 * 1. INSTALA un CSL personalizado (apa-uoc-7th.csl) que usa "y" en vez de "&"
 *    antes del último autor, siguiendo la adaptación de la Biblioteca UOC.
 *
 * 2. MONKEY-PATCHES la generación de bibliografías para inyectar el nombre
 *    completo del autor entre corchetes [Nombre] tras las iniciales.
 *    Ejemplo: "Perinat, A." → "Perinat, A. [Adolfo]"
 *
 * El post-procesamiento SOLO se aplica a bibliografías, nunca a citas
 * parentéticas en el texto.
 */

// eslint-disable-next-line no-unused-vars
var APA7UOC = {
  // ID del estilo CSL personalizado
  STYLE_ID: "http://www.zotero.org/styles/apa-uoc-7th",

  // Referencia al rootURI del plugin
  _rootURI: null,

  // Funciones originales guardadas para restaurar en shutdown
  _originalMakeFormatted: null,
  _originalMakeFormatted2: null,
  _originalQuickCopy: null,

  /**
   * Inicializa el plugin: instala el CSL y aplica los monkey-patches.
   */
  async init({ id, version, rootURI }) {
    this._rootURI = rootURI;

    Zotero.debug("APA7-UOC: ========================================");
    Zotero.debug("APA7-UOC: Inicializando plugin v" + version);

    // 1. Instalar el estilo CSL personalizado
    await this._installCSLStyle();

    // 2. Aplicar monkey-patches a la generación de bibliografías
    this._patchBibliography();

    Zotero.debug("APA7-UOC: Plugin inicializado correctamente");
    Zotero.debug("APA7-UOC: ========================================");
  },

  /**
   * Desactiva el plugin: restaura las funciones originales.
   */
  shutdown() {
    Zotero.debug("APA7-UOC: Desactivando plugin...");

    if (this._originalMakeFormatted) {
      Zotero.Cite.makeFormattedBibliographyOrCitationList =
        this._originalMakeFormatted;
      this._originalMakeFormatted = null;
    }

    if (this._originalMakeFormatted2) {
      Zotero.Cite.makeFormattedBibliography = this._originalMakeFormatted2;
      this._originalMakeFormatted2 = null;
    }

    if (this._originalQuickCopy) {
      Zotero.QuickCopy.getContentFromItems = this._originalQuickCopy;
      this._originalQuickCopy = null;
    }

    Zotero.debug("APA7-UOC: Plugin desactivado");
  },

  // =========================================================================
  // INSTALACIÓN DEL ESTILO CSL
  // =========================================================================

  async _installCSLStyle() {
    try {
      const cslURL = this._rootURI + "csl/apa-uoc-7th.csl";
      Zotero.debug("APA7-UOC: Leyendo CSL desde " + cslURL);
      const cslContent = Zotero.File.getContentsFromURL(cslURL);

      if (!cslContent) {
        Zotero.debug("APA7-UOC: ERROR — No se pudo leer el archivo CSL");
        return;
      }

      Zotero.debug("APA7-UOC: CSL leído, tamaño: " + cslContent.length);

      await Zotero.Styles.install(
        { string: cslContent },
        "apa-uoc-7th.csl",
        true
      );

      Zotero.debug("APA7-UOC: Estilo CSL instalado correctamente");
    } catch (e) {
      Zotero.debug("APA7-UOC: CSL install note: " + e.message);
    }
  },

  // =========================================================================
  // MONKEY-PATCHING DE BIBLIOGRAFÍAS
  // =========================================================================

  _patchBibliography() {
    const self = this;

    // --- Patch 1: makeFormattedBibliographyOrCitationList ---
    if (
      typeof Zotero.Cite !== "undefined" &&
      typeof Zotero.Cite.makeFormattedBibliographyOrCitationList === "function"
    ) {
      this._originalMakeFormatted =
        Zotero.Cite.makeFormattedBibliographyOrCitationList;

      Zotero.Cite.makeFormattedBibliographyOrCitationList = function (
        cslEngine,
        items,
        format,
        asCitationList
      ) {
        Zotero.debug("APA7-UOC: [Patch1] llamado. asCitationList=" + asCitationList + " format=" + format);

        let result = self._originalMakeFormatted.apply(this, arguments);

        if (!asCitationList) {
          const isUOC = self._isUOCStyle(cslEngine);
          Zotero.debug("APA7-UOC: [Patch1] isUOC=" + isUOC + " items=" + (items ? items.length : 0));

          if (isUOC && items && items.length > 0) {
            Zotero.debug("APA7-UOC: [Patch1] Aplicando post-procesamiento...");
            result = self._injectFullNames(result, items, format);
          }
        }

        return result;
      };

      Zotero.debug("APA7-UOC: Patch1 aplicado a Zotero.Cite.makeFormattedBibliographyOrCitationList");
    } else {
      Zotero.debug("APA7-UOC: WARN — Zotero.Cite.makeFormattedBibliographyOrCitationList no encontrada");
    }

    // --- Patch 2: makeFormattedBibliography ---
    if (
      typeof Zotero.Cite !== "undefined" &&
      typeof Zotero.Cite.makeFormattedBibliography === "function"
    ) {
      this._originalMakeFormatted2 = Zotero.Cite.makeFormattedBibliography;

      Zotero.Cite.makeFormattedBibliography = function (cslEngine, format) {
        Zotero.debug("APA7-UOC: [Patch2] llamado. format=" + format);

        let result = self._originalMakeFormatted2.apply(this, arguments);

        if (result) {
          const isUOC = self._isUOCStyle(cslEngine);
          Zotero.debug("APA7-UOC: [Patch2] isUOC=" + isUOC);

          if (isUOC) {
            const registeredItems = self._getRegisteredItems(cslEngine);
            Zotero.debug("APA7-UOC: [Patch2] registeredItems=" + registeredItems.length);
            if (registeredItems.length > 0) {
              result = self._injectFullNames(result, registeredItems, format);
            }
          }
        }

        return result;
      };

      Zotero.debug("APA7-UOC: Patch2 aplicado a Zotero.Cite.makeFormattedBibliography");
    } else {
      Zotero.debug("APA7-UOC: WARN — Zotero.Cite.makeFormattedBibliography no encontrada");
    }

    // --- Patch 3: QuickCopy.getContentFromItems ---
    // Esta es la función que se llama al hacer Ctrl+Shift+C o arrastrar items
    if (
      typeof Zotero.QuickCopy !== "undefined" &&
      typeof Zotero.QuickCopy.getContentFromItems === "function"
    ) {
      this._originalQuickCopy = Zotero.QuickCopy.getContentFromItems;

      Zotero.QuickCopy.getContentFromItems = function (items, format, callback, modified) {
        Zotero.debug("APA7-UOC: [Patch3-QuickCopy] llamado. format=" + JSON.stringify(format));

        let result = self._originalQuickCopy.apply(this, arguments);

        // QuickCopy devuelve { text: "...", html: "..." }
        if (result && self._isUOCFormatString(format)) {
          Zotero.debug("APA7-UOC: [Patch3-QuickCopy] Post-procesando resultado de QuickCopy...");
          if (result.html) {
            result.html = self._injectFullNames(result.html, items, "html");
          }
          if (result.text) {
            result.text = self._injectFullNames(result.text, items, "text");
          }
        }

        return result;
      };

      Zotero.debug("APA7-UOC: Patch3 aplicado a Zotero.QuickCopy.getContentFromItems");
    } else {
      Zotero.debug("APA7-UOC: WARN — Zotero.QuickCopy.getContentFromItems no encontrada");
    }
  },

  /**
   * Verifica si el motor CSL está usando nuestro estilo UOC.
   * Busca en múltiples ubicaciones del objeto cslEngine.
   */
  _isUOCStyle(cslEngine) {
    try {
      if (!cslEngine) {
        Zotero.debug("APA7-UOC: _isUOCStyle: cslEngine es null/undefined");
        return false;
      }

      // Intento 1: opt.styleID (ubicación más común en citeproc-js)
      if (cslEngine.opt && cslEngine.opt.styleID) {
        Zotero.debug("APA7-UOC: _isUOCStyle: opt.styleID = " + cslEngine.opt.styleID);
        if (cslEngine.opt.styleID.includes("apa-uoc")) return true;
      }

      // Intento 2: sys.style
      if (cslEngine.sys && cslEngine.sys.style) {
        const sysStyle = String(cslEngine.sys.style);
        Zotero.debug("APA7-UOC: _isUOCStyle: sys.style = " + sysStyle);
        if (sysStyle.includes("apa-uoc")) return true;
      }

      // Intento 3: opt["independent-parent"]
      if (cslEngine.opt && cslEngine.opt["independent-parent"]) {
        const parent = cslEngine.opt["independent-parent"];
        Zotero.debug("APA7-UOC: _isUOCStyle: independent-parent = " + parent);
        if (parent.includes("apa-uoc")) return true;
      }

      // Intento 4: cslXml (el XML fuente del estilo)
      if (cslEngine.cslXml) {
        try {
          let xmlStr = "";
          if (typeof cslEngine.cslXml.dataObj === "string") {
            xmlStr = cslEngine.cslXml.dataObj;
          } else if (cslEngine.cslXml.xml) {
            xmlStr = typeof cslEngine.cslXml.xml === "string"
              ? cslEngine.cslXml.xml
              : "";
          }
          if (xmlStr && xmlStr.includes("apa-uoc")) {
            Zotero.debug("APA7-UOC: _isUOCStyle: encontrado en cslXml");
            return true;
          }
        } catch (ex) {
          // Ignorar errores al inspeccionar cslXml
        }
      }

      // Intento 5: Buscar en opt.styleName o locale
      if (cslEngine.opt) {
        for (const key of ["styleName", "style_id", "style"]) {
          if (cslEngine.opt[key]) {
            const val = String(cslEngine.opt[key]);
            Zotero.debug("APA7-UOC: _isUOCStyle: opt." + key + " = " + val);
            if (val.includes("apa-uoc") || val.includes("UOC")) return true;
          }
        }
      }

      // Intento 6: Verificar el estilo activo de Quick Copy como fallback
      try {
        const activeStyleID = Zotero.Prefs.get("export.quickCopy.setting");
        if (activeStyleID) {
          Zotero.debug("APA7-UOC: _isUOCStyle: quickCopy.setting = " + activeStyleID);
          if (activeStyleID.includes("apa-uoc")) return true;
        }
      } catch (ex) {
        // Ignorar
      }

      Zotero.debug("APA7-UOC: _isUOCStyle: No se detectó estilo UOC");

      // Log de las propiedades disponibles del engine para diagnóstico
      if (cslEngine.opt) {
        const optKeys = Object.keys(cslEngine.opt).slice(0, 20);
        Zotero.debug("APA7-UOC: _isUOCStyle: opt keys = " + optKeys.join(", "));
      }

    } catch (e) {
      Zotero.debug("APA7-UOC: _isUOCStyle: ERROR: " + e.message);
    }
    return false;
  },

  /**
   * Verifica si el string de formato de QuickCopy contiene nuestro estilo UOC.
   * El formato suele ser algo como "bibliography=http://www.zotero.org/styles/apa-uoc-7th"
   */
  _isUOCFormatString(format) {
    try {
      if (!format) return false;
      const formatStr = typeof format === "string" ? format : JSON.stringify(format);
      Zotero.debug("APA7-UOC: _isUOCFormatString: " + formatStr);
      return formatStr.includes("apa-uoc");
    } catch (e) {
      return false;
    }
  },

  /**
   * Obtiene los items registrados en un motor CSL.
   */
  _getRegisteredItems(cslEngine) {
    try {
      if (cslEngine && cslEngine.registry && cslEngine.registry.reflist) {
        const itemIDs = cslEngine.registry.reflist.map((ref) => ref.id);
        Zotero.debug("APA7-UOC: _getRegisteredItems: IDs = " + itemIDs.join(", "));
        return itemIDs
          .map((id) => {
            try { return Zotero.Items.get(id); } catch (e) { return null; }
          })
          .filter((item) => item);
      }
    } catch (e) {
      Zotero.debug("APA7-UOC: _getRegisteredItems: ERROR: " + e.message);
    }
    return [];
  },

  // =========================================================================
  // INYECCIÓN DE NOMBRES COMPLETOS [Nombre]
  // =========================================================================

  /**
   * Post-procesa la bibliografía para añadir [NombreCompleto] después de
   * cada inicial de autor.
   *
   * @param {string} bibOutput — La bibliografía generada por CSL
   * @param {Zotero.Item[]} items — Los items de Zotero
   * @param {string} format — "html", "text" o "rtf"
   * @returns {string} — La bibliografía con nombres completos inyectados
   */
  _injectFullNames(bibOutput, items, format) {
    if (!bibOutput || !items || items.length === 0) {
      Zotero.debug("APA7-UOC: _injectFullNames: sin datos para procesar");
      return bibOutput;
    }

    Zotero.debug("APA7-UOC: _injectFullNames: procesando " + items.length + " items, formato=" + format);

    let result = bibOutput;

    for (const item of items) {
      try {
        if (!item || typeof item.getCreators !== "function") {
          Zotero.debug("APA7-UOC: item sin getCreators, saltando");
          continue;
        }

        const creators = item.getCreators();
        if (!creators || creators.length === 0) continue;

        Zotero.debug("APA7-UOC: Item " + item.id + " tiene " + creators.length + " creadores");

        for (const creator of creators) {
          if (creator.fieldMode === 1 || !creator.firstName) continue;

          const firstName = creator.firstName.trim();
          const lastName = creator.lastName.trim();

          if (!firstName || !lastName) continue;

          const initials = this._getInitials(firstName);

          Zotero.debug(
            "APA7-UOC: Procesando: " + lastName + ", " + initials +
            " → [" + firstName + "]"
          );

          // Verificar si ya está procesado
          const bracketCheck = new RegExp(
            this._escapeRegex(lastName) +
            ",\\s*" +
            this._escapeRegex(initials) +
            "\\s*\\["
          );
          if (bracketCheck.test(result)) {
            Zotero.debug("APA7-UOC: Ya procesado, saltando");
            continue;
          }

          // Buscar el patrón "Apellido, I. I." en el texto
          // Notas: en HTML el texto puede tener tags, así que buscamos
          // en texto plano y también con posibles spans
          const escapedLastName = this._escapeRegex(lastName);
          const escapedInitials = this._escapeRegex(initials);

          // Patrón que busca: Apellido, I. I. (seguido de algo que NO sea [)
          const searchPattern = new RegExp(
            "(" + escapedLastName + ",\\s*" + escapedInitials + ")(?!\\s*\\[)",
            "g"
          );

          const fullNameBracket = this._formatBracketName(firstName, format);

          const before = result;
          result = result.replace(searchPattern, "$1 " + fullNameBracket);

          if (result !== before) {
            Zotero.debug("APA7-UOC: ✓ Reemplazo exitoso para " + lastName + ", " + initials);
          } else {
            Zotero.debug(
              "APA7-UOC: ✗ No se encontró patrón para: '" + lastName + ", " + initials + "'"
            );
            // Diagnóstico: mostrar un fragmento del output para entender por qué no matchea
            const snippet = result.substring(0, 500);
            Zotero.debug("APA7-UOC: Fragmento de salida: " + snippet);
          }
        }
      } catch (e) {
        Zotero.debug(
          "APA7-UOC: Error procesando item " +
            (item && item.id ? item.id : "?") + ": " + e.message
        );
      }
    }

    return result;
  },

  /**
   * Genera las iniciales de un nombre.
   * "María José" → "M. J."
   * "Jean-Pierre" → "J.-P."
   * "María Ángeles" → "M. Á."
   * "A." → "A." (ya es inicial)
   */
  _getInitials(firstName) {
    if (!firstName) return "";

    // Si ya son iniciales (e.g., "A." o "M. J."), devolver tal cual
    if (/^[A-ZÁÉÍÓÚÜÑÀÈÌÒÙÂÊÎÔÛÄËÏÖÜ]\.(\s*-?\s*[A-ZÁÉÍÓÚÜÑÀÈÌÒÙÂÊÎÔÛÄËÏÖÜ]\.)*\s*$/i.test(firstName)) {
      return firstName.trim();
    }

    const parts = firstName.split(/[\s]+/);
    const initials = parts.map((part) => {
      if (!part) return "";
      // Manejar nombres con guión: "Jean-Pierre" → "J.-P."
      if (part.includes("-")) {
        return part
          .split("-")
          .filter((s) => s.length > 0)
          .map((sub) => sub.charAt(0).toUpperCase() + ".")
          .join("-");
      }
      return part.charAt(0).toUpperCase() + ".";
    }).filter((s) => s.length > 0);

    return initials.join(" ");
  },

  /**
   * Formatea el nombre completo entre corchetes según el formato de salida.
   */
  _formatBracketName(firstName, format) {
    switch (format) {
      case "html":
        return "[" + this._escapeHTML(firstName) + "]";
      case "rtf":
        return "[" + firstName + "]";
      default:
        return "[" + firstName + "]";
    }
  },

  // =========================================================================
  // UTILIDADES
  // =========================================================================

  _escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },

  _escapeHTML(str) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return str.replace(/[&<>"']/g, (m) => map[m]);
  },
};
