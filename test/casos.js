"use strict";
/**
 * casos.js — Casos de prueba. Cada caso compone una bibliografía real con
 * citeproc-js y declara, por entrada, cómo debe empezar en texto plano
 * (`empieza`), qué debe contener (`contiene`) y qué no (`noContiene`).
 * La misma expectativa se comprueba en text, html y rtf, normalizando la salida.
 */

let n = 0;
const p = (family, given) => ({ family, given });
const art = (author, year, title, extra) =>
  Object.assign({ id: "it" + (++n), type: "article-journal", author, issued: { "date-parts": [[year]] }, title, "container-title": "Revista", volume: "1", page: "1-10" }, extra || {});

const casos = [];
const caso = (nombre, items, esperado, opciones) => casos.push(Object.assign({ nombre, items, esperado }, opciones || {}));

// --- Atribución cruzada entre entradas -------------------------------------
{
  const a = art([p("Lucas", "Robert J.")], 1988, "On the mechanics of economic development");
  const b = art([p("Lucas", "Raquel")], 2019, "Un trabajo de Raquel");
  caso("Lucas R. J. (Robert) y Lucas R. (Raquel)", [b, a], {
    [a.id]: { empieza: "Lucas, R. J. [Robert J.]. (1988)." },
    [b.id]: { empieza: "Lucas, R. [Raquel]. (2019)." },
  });
}
{
  const a = art([p("García", "Marta")], 2001, "Trabajo de Marta");
  const b = art([p("García", "Manuel")], 2015, "Trabajo de Manuel");
  caso("García M. (Marta) y García M. (Manuel), entradas distintas", [a, b], {
    [a.id]: { empieza: "García, M. [Marta]. (2001).", noContiene: ["Manuel]"] },
    [b.id]: { empieza: "García, M. [Manuel]. (2015).", noContiene: ["Marta]"] },
  });
}
{
  const a = art([p("García Ruiz", "Mercedes")], 2010, "Uno");
  const b = art([p("Ruiz", "Mario")], 2012, "Otro");
  caso("Ruiz M. (Mario) frente a García Ruiz M. (Mercedes)", [b, a], {
    [a.id]: { empieza: "García Ruiz, M. [Mercedes]. (2010).", noContiene: ["Mario"] },
    [b.id]: { empieza: "Ruiz, M. [Mario]. (2012)." },
  });
}
{
  const a = art([p("Rueda", "Juan")], 2005, "De Juan");
  const b = art([p("Rueda", "José-Ramón")], 2006, "De José Ramón");
  caso("Rueda J. (Juan) frente a Rueda J.-R. (José-Ramón)", [b, a], {
    [a.id]: { empieza: "Rueda, J. [Juan]. (2005)." },
    [b.id]: { empieza: "Rueda, J.-R. [José-Ramón]. (2006).", noContiene: ["Juan]"] },
  });
}

// --- Atribución dentro de una misma entrada --------------------------------
{
  const a = art([p("García", "Marta"), p("García", "Manuel")], 2001, "Hermanos");
  caso("Coautoría: García M. (Marta) y García M. (Manuel)", [a], {
    [a.id]: { empieza: "García, M. [Marta] y García, M. [Manuel]. (2001)." },
  });
}
{
  const a = art([p("García Ruiz", "Mercedes"), p("Ruiz", "Mario")], 2011, "Coautoría");
  const b = art([p("Ruiz", "Mario"), p("García Ruiz", "Mercedes")], 2013, "Coautoría inversa");
  caso("Coautoría: García Ruiz M. y Ruiz M., en los dos órdenes", [a, b], {
    [a.id]: { empieza: "García Ruiz, M. [Mercedes] y Ruiz, M. [Mario]. (2011)." },
    [b.id]: { empieza: "Ruiz, M. [Mario] y García Ruiz, M. [Mercedes]. (2013)." },
  });
}
{
  const a = art([p("García Ruiz", "Mercedes"), p("Ruiz", "Mario")], 2011, "Coautoría");
  caso("Coautoría en catalán (conjunción «i»)", [a], {
    [a.id]: { empieza: "García Ruiz, M. [Mercedes] i Ruiz, M. [Mario]. (2011)." },
  }, { lang: "ca-AD" });
}

// --- Puntuación ------------------------------------------------------------
{
  const a = Object.assign(art([p("Ramos", "Antonio")], 2020, "Entrevista [Vídeo] (2019 versión)"), { type: "article-journal" });
  caso("Título con corchete seguido de paréntesis con año", [a], {
    [a.id]: { empieza: "Ramos, A. [Antonio]. (2020).", contiene: ["[Vídeo] (2019 versión)"], noContiene: ["[Vídeo]. (2019"] },
  });
}
{
  const a = { id: "ed1", type: "book", editor: [p("Fernández-Ballesteros", "Rocío")], issued: { "date-parts": [[2013]] }, title: "Evaluación psicológica", publisher: "Pirámide" };
  caso("Libro editado: corchete antes de (Ed.)", [a], {
    [a.id]: { empieza: "Fernández-Ballesteros, R. [Rocío] (Ed.). (2013)." },
  });
}

// --- Sin fecha: el punto tras el corchete va igual que ante un año -----------
{
  const sf = (id, author, title, extra) => Object.assign({ id, type: "article-journal", author, title, "container-title": "Revista", volume: "1", page: "1-10" }, extra || {});
  const a = sf("sf1", [p("Pérez", "Juan")], "Sin fecha");
  const b = sf("sf2", [p("Pérez", "Juan"), p("Gil", "Ana")], "Sin fecha, dos autores");
  caso("Sin fecha: punto tras el corchete ante (s. f.)", [a, b], {
    [a.id]: { empieza: "Pérez, J. [Juan]. (s. f.)." },
    [b.id]: { empieza: "Pérez, J. [Juan] y Gil, A. [Ana]. (s. f.)." },
  });
  const c = sf("sf3", [p("Smith", "John")], "No date", { language: "en" });
  caso("Sin fecha en inglés: punto tras el corchete ante (n.d.)", [c], {
    [c.id]: { empieza: "Smith, J. [John]. (n.d.)." },
  }, { lang: "en-US" });
  const d = sf("sf4", [p("Puig", "Jordi")], "Sense data");
  caso("Sin fecha en catalán: punto tras el corchete", [d], {
    [d.id]: { empieza: "Puig, J. [Jordi]. (s.d.)." },
  }, { lang: "ca-AD" });
}
{
  const a = { id: "ed2", type: "book", editor: [p("Bermejo", "Blas"), p("Reig", "Carlos")], issued: { "date-parts": [[2003]] }, title: "Las dificultades de aprendizaje", publisher: "UGT" };
  const b = { id: "ed3", type: "book", editor: [p("Bermejo", "Blas")], title: "Obra sin fecha", publisher: "UGT" };
  caso("Editores: corchete en el nombre de pila y ningún punto antes de (Eds.)", [a, b], {
    [a.id]: { empieza: "Bermejo, B. [Blas] y Reig, C. [Carlos] (Eds.). (2003)." },
    [b.id]: { empieza: "Bermejo, B. [Blas] (Ed.). (s. f.)." },
  });
}

{
  // Como en la biblioteca real del autor: tres capítulos sin fecha del mismo autor.
  const cap = (id, title) => ({ id, type: "chapter", author: [p("Pozo Municio", "Juan Ignacio")], title, "container-title": "Aprendices y maestros", publisher: "Alianza" });
  const a = cap("pz1", "Aprendizaje verbal y conceptual"), b = cap("pz2", "El aprendizaje de procedimientos");
  caso("Sin fecha con letra: (s. f.-a) y (s. f.-b)", [a, b], {
    [a.id]: { empieza: "Pozo Municio, J. I. [Juan Ignacio]. (s. f.-a)." },
    [b.id]: { empieza: "Pozo Municio, J. I. [Juan Ignacio]. (s. f.-b)." },
  });
}

// --- Caracteres que se escapan por formato ---------------------------------
{
  const a = art([p("Ballesteros Castañeda", "Blanca")], 2010, "Con eñe");
  const b = art([p("Óscar", "Ángel")], 2001, "Inicial con tilde");
  const c = art([p("O'Brien", "Ciara")], 2003, "Con apóstrofo");
  caso("Tildes, eñe y apóstrofo (relevante en RTF, que es lo que usa Word)", [a, b, c], {
    [a.id]: { empieza: "Ballesteros Castañeda, B. [Blanca]. (2010)." },
    [b.id]: { empieza: "Óscar, Á. [Ángel]. (2001)." },
    [c.id]: { empieza: "O’Brien, C. [Ciara]. (2003)." },
  });
}

// --- Partículas e iniciales -------------------------------------------------
{
  const a = art([p("De Bruyn", "Eric E. J."), p("Ter Laak", "Jan"), p("van der Berg", "Pieter")], 2001, "Partículas");
  caso("Partículas en el apellido", [a], {
    [a.id]: { empieza: "De Bruyn, E. E. J. [Eric E. J.], Ter Laak, J. [Jan] y van der Berg, P. [Pieter]. (2001)." },
  });
}
{
  const a = art([p("Muñoz", "M.")], 2002, "Solo inicial");
  const b = art([p("Smith", "G.L.")], 2003, "Iniciales pegadas");
  const c = art([p("Carrobles Isabel", "José Antonio I.")], 1981, "Nombre con inicial");
  caso("Nombres que ya son iniciales no llevan corchete", [a, b, c], {
    [a.id]: { empieza: "Muñoz, M. (2002).", noContiene: ["["] },
    [b.id]: { empieza: "Smith, G. L. (2003).", noContiene: ["["] },
    [c.id]: { empieza: "Carrobles Isabel, J. A. I. [José Antonio I.]. (1981)." },
  });
}
{
  const a = { id: "inst1", type: "report", author: [{ literal: "Organización Mundial de la Salud" }], issued: { "date-parts": [[2020]] }, title: "Informe", publisher: "OMS" };
  caso("Autor institucional", [a], {
    [a.id]: { empieza: "Organización Mundial de la Salud. (2020).", noContiene: ["]"] },
  });
}

{
  const a = art([p("de la Fuente", "Jesús")], 2004, "Partícula separada por Zotero");
  const b = art([p("Beethoven", "Ludwig van")], 1810, "Partícula en el nombre de pila");
  caso("Partículas que Zotero separa del apellido", [a, b], {
    [a.id]: { empieza: "de la Fuente, J. [Jesús]. (2004)." },
    [b.id]: { empieza: "Beethoven, L. van [Ludwig]. (1810)." },
  });
}

// --- Control negativo: la bibliografía real del autor (13/10/2026) ---------
// Reconstruye las nueve entradas que dio Zotero 9.0.6 con la v1.3.0. Sin homónimos
// conflictivos: la salida corregida tiene que ser IDÉNTICA a la de la v1.3.0.
const real = [
  { id: "r1", type: "thesis", genre: "Trabajo final de grado", publisher: "Universitat Oberta de Catalunya", author: [p("Ballesteros Castañeda", "Blanca")], issued: { "date-parts": [[2010]] }, title: "Intervenció per a l’orientació vocacional a l’Educació Secundària Obligatòria", URL: "https://hdl.handle.net/10609/1112" },
  art([p("Ballesteros de Valderrama", "Blanca Patricia"), p("Berrío-Acosta", "Gloria María"), p("Sánchez-Ramírez", "Maritza")], 2021, "Evaluación de la formación ética en la psicología colombiana", { "container-title": "Avances en Psicología Latinoamericana", volume: "39", issue: "3", page: "1-20", DOI: "10.12804/revistas.urosario.edu.co/apl/a.11401" }),
  { id: "r3", type: "book", author: [p("Fernández Ballesteros", "Rocío"), p("Carrobles Isabel", "José Antonio I.")], issued: { "date-parts": [[1981]] }, title: "Evaluación conductual: Metodología y aplicaciones", publisher: "Pirámide" },
  { id: "r4", type: "book", editor: [p("Fernández-Ballesteros", "Rocío")], issued: { "date-parts": [[2013]] }, title: "Evaluación psicológica: Conceptos, métodos y estudio de casos", edition: "2", publisher: "Pirámide" },
  art(["Fernández-Ballesteros|Rocío", "De Bruyn|Eric E. J.", "Godoy|Antonio", "Hornke|Lutz F.", "Ter Laak|Jan", "Vizcarro|Carmen", "Westhoff|Karl", "Westmeyer|Hans", "Zaccagnini|José Luis"].map((s) => p(...s.split("|"))), 2001, "Guidelines for the Assessment Process (GAP): A proposal for discussion", { "container-title": "European Journal of Psychological Assessment", volume: "17", issue: "3", page: "187-200", DOI: "10.1027//1015-5759.17.3.187" }),
  art(["Fernández-Ballesteros|Rocío", "De Bruyn|Eric E. J.", "Godoy|Antonio", "Hornke|Lutz F.", "Ter Laak|Jan", "Vizcarro|Carmen", "Westhoff|Karl", "Westmeyer|Hans", "Zaccagnini|José Luis"].map((s) => p(...s.split("|"))), 2003, "Guías para el proceso de evaluación (GAP): Una propuesta a discusión", { "container-title": "Papeles del Psicólogo", volume: "23", issue: "84", page: "58-70", URL: "https://www.redalyc.org/pdf/778/77808407.pdf" }),
  { id: "r7", type: "book", author: [p("Fernández-Ballesteros", "Rocío"), p("Márquez Sánchez", "María Oliva"), p("Vizcarro Guarch", "Carmen"), p("Zamarrón", "María Dolores")], issued: { "date-parts": [[2011]] }, title: "Buenas prácticas y competencias en evaluación psicológica: El sistema interactivo multimedia de aprendizaje del proceso de evaluación (SIMAPE)", publisher: "Pirámide" },
  art([p("González-Fraile", "Eduardo"), p("Ballesteros", "Javier"), p("Rueda", "José-Ramón"), p("Santos-Zorrozúa", "Borja"), p("Solà", "Ivan"), p("McCleery", "Jenny")], 2021, "Remotely delivered information, training and support for informal caregivers of people with dementia", { "container-title": "Cochrane Database of Systematic Reviews", volume: "2021", issue: "1", DOI: "10.1002/14651858.CD006440.pub3" }),
  { id: "r9", type: "book", author: [p("Mas Delblanch", "María Dolores"), p("Nuño Bermúdez", "Neus"), p("Medina Alcaraz", "Juan Carlos"), p("Pérez González", "Alba"), p("Pubill González", "María José"), p("Susín Ballesteros", "Iolanda")], issued: { "date-parts": [[2024]] }, title: "Caso modelo terapias psicodinámicas, humanistas y sistémicas", publisher: "Fundació Universitat Oberta de Catalunya" },
];

// Segunda bibliografía real del autor, ya en Zotero 10.0.6 (13/10/2026). Incluye
// dos nombres tal como los registra Crossref: "Cruz, Ignacio Silva Santa" y
// "Abdullah, Alwahbi". El plugin reproduce el dato; no le toca corregirlo.
const N = (...xs) => xs.map((s) => p(...s.split("|")));
real.push(
  art(N("Abdi|Jordan", "Al-Hindawi|Ahmed", "Ng|Tiffany", "Vizcaychipi|Marcela P"), 2018, "Scoping review on the use of socially assistive robot technology in elderly care", { "container-title": "BMJ Open", volume: "8", issue: "2", page: "e018815", DOI: "10.1136/bmjopen-2017-018815" }),
  art(N("Abdullah|Alwahbi"), 2020, "The use of contingency contracting in educational settings: A review of the literature", { "container-title": "Educational Research and Reviews", volume: "15", issue: "6", page: "327-335", DOI: "10.5897/err2020.3949" }),
  { id: "r12", type: "paper-conference", author: N("Abella|María Paula", "Weingartt|Maricel"), issued: { "date-parts": [[2019]] }, title: "Intervención psicoeducativa en contexto de vulnerabilidad", "container-title": "Actas del VII Congreso Internacional de Investigación en Psicología", publisher: "Universidad Nacional de La Plata" },
  art(N("Acheson|Rachel", "Verdenhalven|Nia", "Avdi|Evrinomy", "Midgley|Nick"), 2020, "Exploring silence in short-term psychoanalytic psychotherapy with adolescents with depression", { "container-title": "Journal of Child Psychotherapy", volume: "46", issue: "2", page: "224-240", DOI: "10.1080/0075417X.2020.1830297" }),
  art(N("Adam|Kirstine", "Oswald|Ian"), 1977, "Sleep Is for Tissue Restoration", { "container-title": "Journal of the Royal College of Physicians of London", volume: "11", issue: "4", page: "376-388" }),
  art(N("Adams|Claire", "Gringart|Eyal", "Strobel|Natalie"), 2022, "Explaining adults’ mental health help-seeking through the lens of the theory of planned behavior: A scoping review", { "container-title": "Systematic Reviews", volume: "11", issue: "1" }),
  art(N("Afrouz|Rojan", "Vassos|Sevi"), 2024, "Adolescents’ Experiences of Cyber-Dating Abuse", { "container-title": "Trauma, Violence, & Abuse", volume: "25", issue: "4", page: "2814-2828" }),
  art(N("Agarwal|Pooja K.", "Nunes|Ludmila D.", "Blunt|Janell R."), 2021, "Retrieval Practice Consistently Benefits Student Learning", { "container-title": "Educational Psychology Review", volume: "33", issue: "4", page: "1409-1453" }),
  art(N("Aguirre Velasco|Antonia", "Cruz|Ignacio Silva Santa", "Billings|Jo", "Jimenez|Magdalena", "Rowe|Sarah"), 2020, "What are the barriers, facilitators and interventions targeting help-seeking behaviours", { "container-title": "BMC Psychiatry", volume: "20", issue: "1" })
);

module.exports = { casos, real };
