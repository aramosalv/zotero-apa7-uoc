# Pruebas

Las pruebas no forman parte del `.xpi`. Componen bibliografías reales con **citeproc-js** y el mismo `csl/apa-uoc-7th.csl` que instala el plugin, en los tres formatos que usa Zotero: `text`, `html` y `rtf`. El RTF es el formato con el que trabaja la integración con Word.

```
npm install
npm test               # casos + ciclo de vida, con el citeproc-js de npm
npm run test:zotero    # lo mismo con la copia de citeproc-js que traen Zotero 9.0.6 y 10.0.6
npm run test:v130      # los mismos casos contra la v1.3.0 publicada: TIENE que fallar
```

`test:v130` es el control de que las pruebas saben decir que no. Si dejara de fallar, las pruebas habrían dejado de medir.

## Qué se comprueba

- **`run.js` con `casos.js`.** Cada caso declara cómo debe empezar cada entrada, qué debe contener y qué no. La salida de los tres formatos se normaliza a texto plano y se coteja con la misma expectativa. Los nombres pasan antes por `CSL.parseParticles`, como hace `Zotero.Utilities.Item.itemToCSLJSON`.
  - Homónimos entre entradas: misma inicial, iniciales contenidas (`R.` / `R. J.`, `J.` / `J.-R.`) y apellido contenido en otro (`Ruiz` / `García Ruiz`).
  - Homónimos coautores de una misma entrada, en los dos órdenes y en catalán.
  - Puntuación: el punto tras el corchete antes del año, ninguno antes de `(Ed.)`, y ninguno añadido a corchetes del título.
  - Tildes, eñe y apóstrofo, que en RTF se escapan.
  - Partículas, iniciales sin nombre de pila y autor institucional.
- **Control negativo.** Dos bibliografías reales del autor, una de Zotero 9.0.6 y otra de Zotero 10.0.6, sin homónimos conflictivos. En `text` y `html` la salida tiene que coincidir carácter a carácter con la de la v1.3.0. En `rtf` se compara en texto plano, porque la v1.3.0 omitía allí los nombres con tilde y no escapaba lo que insertaba.
- **`bootstrap_test.js`.** El ciclo de vida, con un Zotero simulado: `startup` carga `src/apa7-uoc.js`, instala el CSL y parchea el motor; un segundo `startup` no apila dos envoltorios; `shutdown` deja el motor como estaba.

## Lo que estas pruebas NO cubren

La prueba que vale es la que se hace dentro de Zotero. Estas pruebas no pasan por la interfaz («Crear bibliografía», la copia rápida) ni por el complemento de Word. Comprueban, eso sí, el método `CSL.Engine.prototype.makeBibliography` del motor que trae Zotero, que es por donde pasan todas esas vías, según el código de Zotero 9.0.6 y 10.0.6 (`cite.js`, `quickCopy.js` e `integration.js`).
