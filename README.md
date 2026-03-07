# APA 7.ª edición – Adaptación UOC para Zotero 7

Plugin de [Zotero 7](https://www.zotero.org/) que adapta el estilo APA 7.ª edición al formato requerido por la [Universitat Oberta de Catalunya (UOC)](https://www.uoc.edu/).

## Qué hace

La Biblioteca de la UOC requiere una variante de APA 7 que incluye:

- **Nombre completo entre corchetes** tras las iniciales del autor:
  `Apellido, I. [Nombre]` en lugar de `Apellido, I.`
- **Conjunción "y"** en lugar de "&" antes del último autor
- **Punto tras el último corchete** antes del año: `[Nombre]. (Año)`

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
Bados López, A. [Arturo], y García Grau, E. [Eugeni]. (2009). El Proceso de
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

> **Nota:** La calidad del nombre entre corchetes depende de los datos almacenados en tu biblioteca de Zotero. Si la persona autora tiene el nombre guardado como "I." en vez de "Inés", el corchete no se mostrará. Si tiene el nombre guardado como "J. Pedro", el corchete mostará "[J. Pedro]". Para obtener los mejores resultados, asegúrate de que los nombres completos estén registrados en Zotero.

## Cómo funciona

El plugin tiene dos componentes:

1. **CSL personalizado** (`apa-uoc-7th.csl`): basado en el estilo APA 7 oficial, modificado para usar "y" en lugar de "&"
2. **Bootstrap plugin**: intercepta la función `Zotero.Cite.makeFormattedBibliography` para inyectar `[NombreCompleto]` tras las iniciales de cada autor

## Requisitos

- Zotero 7 (versión 7.0 o superior)
- Windows, macOS o Linux

## Compilar desde el código fuente

```bash
# En Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File do-build.ps1

# En Linux/macOS
bash build.sh
```

Esto genera el archivo `zotero-apa7-uoc-1.0.0.xpi`.

## Estructura del proyecto

```
├── manifest.json        # Metadatos del plugin
├── bootstrap.js         # Lógica principal (monkey-patch)
├── csl/
│   └── apa-uoc-7th.csl  # Estilo CSL personalizado
├── updates.json         # Manifiesto de actualizaciones automáticas
├── do-build.ps1         # Script de build (Windows)
└── build.sh             # Script de build (Linux/macOS)
```

## Licencia

[AGPL-3.0](LICENSE) — Copyright (c) 2026 Antonio Ramos Alves

## Autor

**Antonio Ramos Alves** — [@aramosalv](https://github.com/aramosalv)  mailto:antonio@antonioramos.eu

## Créditos

- Estilo CSL base: [APA 7th edition](https://www.zotero.org/styles/apa) de la comunidad CSL
- Adaptación UOC según las [directrices de citación de la Biblioteca de la UOC](https://biblioteca.uoc.edu/)
- Optimizado con asistencia de modelos de lenguaje

----------------------------------------------------------------------------

# APA 7th Edition – UOC Adaptation for Zotero 7

A [Zotero 7](https://www.zotero.org/) plugin that adapts the APA 7th edition citation style to the format required by the [Universitat Oberta de Catalunya (UOC)](https://www.uoc.edu/).

## What it does

The UOC Library requires a variant of APA 7 that includes the following modifications:

- **Full first name in brackets** after the author's initials:  
  `Surname, I. [FirstName]` instead of `Surname, I.`
- **The conjunction "y"** instead of "&" before the final author
- **A period after the closing bracket** before the year: `[FirstName]. (Year)`

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
Bados López, A. [Arturo], y García Grau, E. [Eugeni]. (2009). El Proceso de
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

> **Note:** The quality of the bracketed name depends on the data stored in your Zotero library. If an author's name is saved as "I." instead of "Inés", the bracket will not be displayed. If the name is stored as "J. Pedro", the bracket will display "[J. Pedro]". For best results, ensure that full first names are properly stored in Zotero.

## How it works

The plugin has two components:

1. **Custom CSL file** (`apa-uoc-7th.csl`): based on the official APA 7 style, modified to use "y" instead of "&"
2. **Bootstrap plugin**: intercepts the `Zotero.Cite.makeFormattedBibliography` function to inject `[FullName]` after the initials of each author

## Requirements

- Zotero 7 (version 7.0 or later)
- Windows, macOS, or Linux

## Build from source

```
bash
# On Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File do-build.ps1

# On Linux/macOS
bash build.sh
```

This will generate the file zotero-apa7-uoc-1.0.0.xpi.

## Project structure

```
├── manifest.json        # Plugin metadata
├── bootstrap.js         # Main logic (monkey patch)
├── csl/
│   └── apa-uoc-7th.csl  # Custom CSL style
├── updates.json         # Auto-update manifest
├── do-build.ps1         # Build script (Windows)
└── build.sh             # Build script (Linux/macOS)
```

## Licence

[AGPL-3.0](LICENSE) — Copyright (c) 2026 Antonio Ramos Alves

## Author

**Antonio Ramos Alves** — [@aramosalv](https://github.com/aramosalv)  mailto:antonio@antonioramos.eu

## Credits

- Base CSL style: [APA 7th edition](https://www.zotero.org/styles/apa) from the CSL community
- Adapted by the UOC Library's [citation guidelines](https://biblioteca.uoc.edu/)
- Optimized with language model assistance


