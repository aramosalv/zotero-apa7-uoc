# APA 7.ª edición – Adaptación UOC para Zotero 7 y posteriores

Plugin de [Zotero](https://www.zotero.org/) (versiones 7 a 10) que adapta el estilo APA 7.ª edición al formato requerido por la [Universitat Oberta de Catalunya (UOC)](https://www.uoc.edu/).

## Qué hace

La Biblioteca de la UOC requiere una variante de APA 7 que incluye:

- **Nombre completo entre corchetes** tras las iniciales del autor:
  `Apellido, I. [Nombre]` en lugar de `Apellido, I.`
- **Conjunción adaptada por idioma** antes del último autor:
  | Idioma | Conjunción |
  |--------|-----------|
  | Español | y |
  | Catalán | i |
  | Occitano | e |
  | English | & |
  | Deutsch | und |
- **Sin coma de Oxford** antes de la conjunción final, siguiendo la norma de la RAE:
  `García, A., López, B. y Martín, C.` (no `..., López, B., y Martín, C.`)
  > **Nota:** En inglés, APA 7 utiliza la serial comma (*Oxford comma*) antes de "&". Este estilo la omite en todos los idiomas por coherencia con la adaptación UOC. Si necesitas la serial comma en inglés, usa el estilo APA 7 estándar de Zotero.
- **Sin "Recuperado de" ni fecha de acceso**: la URL se muestra directamente, sin coletillas como "Recuperado 25 de febrero de 2026, de...", siguiendo las indicaciones específicas de la UOC en sus PEC
- **Punto tras el último corchete** antes de la fecha: `[Nombre]. (Año)`, `[Nombre]. (s. f.)`. Ante el rol de los editores no se pone: `[Nombre] (Ed.). (Año)`
- **Soporte multiidioma**: la conjunción y otros términos se adaptan automáticamente al idioma configurado en Zotero

### Ejemplo

**APA 7 estándar:**
```
Redolar Ripoll, D. E. (2023). Neurociencia cognitiva. Editorial Médica Panamericana.
```

**APA 7 – UOC (con este plugin):**
```
Redolar Ripoll, D. E. [Diego Emilia]. (2023). Neurociencia cognitiva. Editorial Médica Panamericana.
```

**Varios autores:**
```
Bados López, A. [Arturo] y García Grau, E. [Eugeni]. (2009). El Proceso de
evaluación y tratamiento. https://hdl.handle.net/2445/9893
```

## Instalación

1. Descarga el archivo `.xpi` de la [última release](https://github.com/aramosalv/zotero-apa7-uoc/releases/latest)
2. En Zotero, ve a **Herramientas → Complementos**
3. Haz clic en el icono de engranaje (⚙) → **Instalar complemento desde archivo...**
4. Selecciona el archivo `.xpi` descargado
5. Reinicia Zotero

## Uso

1. Selecciona uno o más elementos en tu biblioteca de Zotero
2. Haz clic derecho → **Crear bibliografía a partir del elemento...**
3. Selecciona el estilo **APA 7th edition – UOC**
4. Elige el idioma, modo de salida y método de copia
5. La bibliografía generada incluirá automáticamente los nombres completos entre corchetes

Desde la versión 1.4.0 el plugin funciona también en la **copia rápida** (Ctrl+Mayús+C), al **arrastrar** elementos a un documento y en los complementos de **Word y LibreOffice**: basta con elegir el estilo **APA 7th edition – UOC** en las preferencias del documento. Los corchetes se añaden solo en la bibliografía; las citas en el texto no los llevan.

> **Nota:** La calidad del nombre entre corchetes depende de los datos almacenados en tu biblioteca de Zotero. Si la persona autora tiene el nombre guardado como "I." en vez de "Inés", el corchete no se mostrará. Si tiene el nombre guardado como "J. Pedro", el corchete mostará "[J. Pedro]". Para obtener los mejores resultados, asegúrate de que los nombres completos estén registrados en Zotero.

## Cómo funciona

El plugin tiene dos componentes:

1. **CSL personalizado** (`apa-uoc-7th.csl`): basado en el estilo APA 7 oficial, con locales para es/ca/oc/en/de que adaptan conjunciones y otros términos por idioma
2. **Bootstrap plugin**: envuelve el método `makeBibliography` del motor de citas de Zotero (citeproc-js), por el que pasan «Crear bibliografía», la copia rápida y la integración con Word y LibreOffice. Cada entrada se procesa solo con los nombres de sus propios autores, de modo que dos personas con el mismo apellido no intercambian su nombre de pila

## Requisitos

- Zotero 7, 8, 9 o 10 (comprobado en Zotero 9.0.6 y 10.0.6)
- Windows, macOS o Linux

## Compilar desde el código fuente

```bash
# En Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File build.ps1

# En Linux/macOS
bash build.sh
```

Esto genera el archivo `zotero-apa7-uoc-<versión>.xpi` y comprueba su contenido.

Para pasar las pruebas (necesitan Node.js): `npm install` y `npm test`. El detalle está en `test/LEEME.md`.

## Estructura del proyecto

```
├── manifest.json        # Metadatos del plugin
├── bootstrap.js         # Arranque y parada del plugin
├── src/
│   └── apa7-uoc.js      # Lógica principal
├── csl/
│   └── apa-uoc-7th.csl  # Estilo CSL personalizado
├── test/                # Pruebas con citeproc-js
├── updates.json         # Manifiesto de actualizaciones automáticas
├── build.ps1            # Script de build (Windows)
└── build.sh             # Script de build (Linux/macOS)
```

## Novedades de la versión 1.4.0

- **Word y LibreOffice** ([issue #2](https://github.com/aramosalv/zotero-apa7-uoc/issues/2)), además de la copia rápida y el arrastre.
- **Homónimos:** el plugin podía poner el nombre de pila de un autor en la obra de otro con el mismo apellido, por ejemplo `García, M. [Marta]` en la obra de Manuel García, o `García Ruiz, M. [Mario]` en la de Mercedes García Ruiz. Ahora cada entrada usa solo los nombres de sus autores.
- **Tildes y eñes en Word:** los apellidos con tilde o eñe no recibían corchete en la salida RTF.
- **Punto tras el corchete** ante cualquier fecha, también `(s. f.)` y `(n.d.)`, y nunca dentro de un título.
- **Partículas e iniciales:** `de la Fuente, J. [Jesús]`; `G.L.` se reconoce como iniciales.
- **Paquete:** el `.xpi` lleva las rutas internas con `/`.

## Licencia

[AGPL-3.0](LICENSE) — Copyright (c) 2026 Antonio Ramos Alves

## Autor

**Antonio Ramos Alves** — [@aramosalv](https://github.com/aramosalv)  mailto:antonio@antonioramos.eu

## Créditos

- Estilo CSL base: [APA 7th edition](https://www.zotero.org/styles/apa) de la comunidad CSL
- Adaptación UOC según las [directrices de citación de la Biblioteca de la UOC](https://biblioteca.uoc.edu/)
- La idea de llevar el plugin a Word interviniendo el motor de citas, y de procesar la bibliografía entrada a entrada, viene del [PR #3](https://github.com/aramosalv/zotero-apa7-uoc/pull/3) de [@soliviantar](https://github.com/soliviantar). Gracias también a [@aalcaine](https://github.com/aalcaine) por la [issue #2](https://github.com/aramosalv/zotero-apa7-uoc/issues/2)
- Optimizado con asistencia de modelos de lenguaje

----------------------------------------------------------------------------

# APA 7th Edition – UOC Adaptation for Zotero 7 and later

A [Zotero](https://www.zotero.org/) plugin (versions 7 to 10) that adapts the APA 7th edition citation style to the format required by the [Universitat Oberta de Catalunya (UOC)](https://www.uoc.edu/).

## What it does

The UOC Library requires a variant of APA 7 that includes the following modifications:

- **Full first name in brackets** after the author's initials:  
  `Surname, I. [FirstName]` instead of `Surname, I.`
- **Language-aware conjunction** before the final author:
  | Language | Conjunction |
  |----------|-----------|
  | Español | y |
  | Català | i |
  | Occitan | e |
  | English | & |
  | Deutsch | und |
- **No Oxford comma** before the final conjunction, following RAE (Spanish Royal Academy) guidelines:
  `García, A., López, B. y Martín, C.` (not `..., López, B., y Martín, C.`)
  > **Note:** Standard APA 7 in English uses the serial comma (*Oxford comma*) before "&". This style omits it in all languages for consistency with the UOC adaptation. If you need the serial comma in English, use Zotero's standard APA 7 style instead.
- **No "Retrieved from" or access date**: URLs are shown directly, without phrases like "Retrieved February 25, 2026, from...", following specific UOC guidelines
- **A period after the closing bracket** before the date: `[FirstName]. (Year)`, `[FirstName]. (n.d.)`. It is not added before the editor role: `[FirstName] (Ed.). (Year)`
- **Multilanguage support**: conjunctions and other terms adapt automatically to Zotero's configured language

### Example

**Standard APA 7:**
```
Redolar Ripoll, D. E. (2023). Neurociencia cognitiva. Editorial Médica Panamericana.
```

**APA 7 – UOC (with this plugin):**
```
Redolar Ripoll, D. E. [Diego Emilia]. (2023). Neurociencia cognitiva. Editorial Médica Panamericana.
```

**Multiple authors:**
```
Bados López, A. [Arturo] y García Grau, E. [Eugeni]. (2009). El Proceso de
evaluación y tratamiento. https://hdl.handle.net/2445/9893
```

## Installation

1. Download the `.xpi` file from the [latest release](https://github.com/aramosalv/zotero-apa7-uoc/releases/latest)
2. In Zotero, go to **Tools → Add-ons**
3. Click the gear icon (⚙) → **Install Add-on From File...**
4. Select the downloaded `.xpi` file
5. Restart Zotero

## Usage

1. Select one or more items in your Zotero library
2. Right-click → **Create Bibliography from Item...**
3. Select the style **APA 7th edition – UOC**
4. Choose the language, output mode, and copy method
5. The generated bibliography will automatically include full first names in brackets

Since version 1.4.0 the plugin also works with **Quick Copy** (Ctrl+Shift+C), when **dragging** items into a document, and in the **Word and LibreOffice** plugins: just choose the **APA 7th edition – UOC** style in the document preferences. Brackets are only added to the reference list; in-text citations do not include them.

> **Note:** The quality of the bracketed name depends on the data stored in your Zotero library. If an author's name is saved as "I." instead of "Inés", the bracket will not be displayed. If the name is stored as "J. Pedro", the bracket will display "[J. Pedro]". For best results, ensure that full first names are properly stored in Zotero.

## How it works

The plugin has two components:

1. **Custom CSL file** (`apa-uoc-7th.csl`): based on the official APA 7 style, with locale blocks for es/ca/oc/en/de that adapt conjunctions and other terms per language
2. **Bootstrap plugin**: wraps the `makeBibliography` method of Zotero's citation engine (citeproc-js), which is used by "Create Bibliography", Quick Copy and the Word and LibreOffice integration. Each entry is processed only with the names of its own authors, so two people with the same surname never swap first names

## Requirements

- Zotero 7, 8, 9 or 10 (tested on Zotero 9.0.6 and 10.0.6)
- Windows, macOS, or Linux

## Build from source

```bash
# On Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File build.ps1

# On Linux/macOS
bash build.sh
```

This generates `zotero-apa7-uoc-<version>.xpi` and checks its contents.

To run the tests (Node.js required): `npm install` and `npm test`. Details in `test/LEEME.md` (in Spanish).

## Project structure

```
├── manifest.json        # Plugin metadata
├── bootstrap.js         # Plugin startup and shutdown
├── src/
│   └── apa7-uoc.js      # Main logic
├── csl/
│   └── apa-uoc-7th.csl  # Custom CSL style
├── test/                # Tests with citeproc-js
├── updates.json         # Auto-update manifest
├── build.ps1            # Build script (Windows)
└── build.sh             # Build script (Linux/macOS)
```

## What's new in version 1.4.0

- **Word and LibreOffice** ([issue #2](https://github.com/aramosalv/zotero-apa7-uoc/issues/2)), as well as Quick Copy and drag and drop.
- **Namesakes:** the plugin could put one author's first name on the work of another author with the same surname, e.g. `García, M. [Marta]` on a work by Manuel García, or `García Ruiz, M. [Mario]` on one by Mercedes García Ruiz. Each entry now uses only the names of its own authors.
- **Accented surnames in Word:** surnames with accents or ñ got no bracket in RTF output.
- **Period after the bracket** before any date, including `(s. f.)` and `(n.d.)`, and never inside a title.
- **Particles and initials:** `de la Fuente, J. [Jesús]`; `G.L.` is recognised as initials.
- **Package:** the `.xpi` uses `/` in its internal paths.

## Licence

[AGPL-3.0](LICENSE) — Copyright (c) 2026 Antonio Ramos Alves

## Author

**Antonio Ramos Alves** — [@aramosalv](https://github.com/aramosalv)  mailto:antonio@antonioramos.eu

## Credits

- Base CSL style: [APA 7th edition](https://www.zotero.org/styles/apa) from the CSL community
- Adapted by the UOC Library's [citation guidelines](https://biblioteca.uoc.edu/)
- The idea of bringing the plugin to Word by hooking the citation engine, and of processing the bibliography entry by entry, comes from [PR #3](https://github.com/aramosalv/zotero-apa7-uoc/pull/3) by [@soliviantar](https://github.com/soliviantar). Thanks also to [@aalcaine](https://github.com/aalcaine) for [issue #2](https://github.com/aramosalv/zotero-apa7-uoc/issues/2)
- Optimized with language model assistance


