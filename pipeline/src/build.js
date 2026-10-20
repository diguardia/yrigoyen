// Orquestador: JSON → HTML → ajuste automático → preflight → PNG por página → PDF → acta.
// Uso: node src/build.js <carpeta de edición>   (ej. ../ediciones/2026-10-12)
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { RAIZ, leerJson, escribirJson } from './util.js';
import { render } from './render.js';
import { geometria, densidad } from './preflight.js';
import { validarEsquema, verificarContenido, registroEdicion } from './verificar.js';

const carpeta = path.resolve(process.argv[2] || '.');
const soloHtml = process.argv.includes('--html');
const config = leerJson(path.join(RAIZ, 'config', 'edicion.json'));
const contenido = leerJson(path.join(carpeta, 'contenido.json'));
// Las claves cuyo valor es "@ruta/relativa.json" se resuelven desde la carpeta de la edición (finanzas y clima salen de datos.js).
for (const [k, v] of Object.entries(contenido)) if (typeof v === 'string' && v.startsWith('@')) contenido[k] = leerJson(path.join(carpeta, v.slice(1)));
const acta = { generado: new Date().toISOString(), edicion: contenido.edicion, ok: false, pasos: {} };

function fallar(msg) { acta.ok = false; escribirJson(path.join(carpeta, 'preflight.json'), acta); console.error('PREFLIGHT FALLÓ:', msg); process.exit(1); }

// 1. Esquema y contenido.
const esq = validarEsquema(contenido);
acta.pasos.esquema = esq;
if (!esq.ok) { console.error(JSON.stringify(esq.errores, null, 2)); fallar('esquema inválido'); }
const ver = verificarContenido(contenido, config);
acta.pasos.contenido = ver;
if (!ver.ok) { console.error(JSON.stringify(ver.errores, null, 2)); fallar('verificación de contenido'); }

// 2. Navegador.
const papel = config.papel.formatos[contenido.edicion.papel || config.papel.actual];
const ESCALA = 2; // píxeles por px CSS en los PNG
const pxPorMm = 96 / 25.4;
const canal = fs.existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe') ? 'msedge' : undefined;
const browser = await chromium.launch({ channel: canal, headless: true });
const page = await browser.newPage({ viewport: { width: Math.ceil(papel.ancho_mm * pxPorMm) + 40, height: Math.ceil(papel.alto_mm * pxPorMm) + 40 }, deviceScaleFactor: ESCALA });

const cuerpos = config.mapa_paginas.map(() => config.tipografia.cuerpo_pt.por_defecto);
const { min, max, por_defecto } = config.tipografia.cuerpo_pt;
const paso = config.tipografia.paso_ajuste_pt;
let html, geo, dens;

async function cargar() {
  html = render(contenido, config, { cuerpos });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(50);
}

async function medirDensidad() {
  const paginas = page.locator('.page');
  const n = await paginas.count();
  const res = [];
  for (let i = 0; i < n; i++) {
    const buf = await paginas.nth(i).screenshot({ type: 'png' });
    res.push(densidad(buf, { margenPx: Math.round(papel.margen_mm * pxPorMm * ESCALA) }));
  }
  return res;
}

// 3. Ajuste automático de cuerpo por página: primero resolver desbordes, después aprovechar aire.
const historialAjuste = [];
for (let iter = 0; iter < 16; iter++) {
  await cargar();
  geo = await geometria(page);
  dens = await medirDensidad();
  const porPagina = config.mapa_paginas.map((_, i) => ({ pagina: i + 1, desborde: geo.errores.some(e => e.pagina === i + 1 && /overflow|desborde|fuera_de_area/.test(e.tipo)), ocupacion: dens[i].ocupacion, hueco: dens[i].mayor_rectangulo_vacio }));
  historialAjuste.push({ iter, cuerpos: [...cuerpos], porPagina });
  let cambio = false;
  porPagina.forEach((p, i) => {
    if (p.desborde && cuerpos[i] - paso >= min - 1e-9) { cuerpos[i] = +(cuerpos[i] - paso).toFixed(2); cambio = true; }
    else if (!p.desborde && (p.ocupacion < (config.densidad.ocupacion_min_por_pagina?.[config.mapa_paginas[i].nombre] ?? config.densidad.ocupacion_min) || p.hueco > config.densidad.mayor_rectangulo_vacio_max) && cuerpos[i] + paso <= max + 1e-9 && config.mapa_paginas[i].nombre !== 'portada') {
      // Subir el cuerpo sólo si la iteración anterior no desbordó con ese tamaño.
      const previo = historialAjuste.find(h => h.cuerpos[i] === +(cuerpos[i] + paso).toFixed(2) && h.porPagina[i].desborde);
      if (!previo) { cuerpos[i] = +(cuerpos[i] + paso).toFixed(2); cambio = true; }
    }
  });
  if (!cambio) break;
}
acta.pasos.ajuste = { cuerpos, iteraciones: historialAjuste.length };

// 4. Preflight final.
await cargar();
geo = await geometria(page);
dens = await medirDensidad();
acta.pasos.geometria = geo;
acta.pasos.densidad = dens.map((d, i) => ({ pagina: i + 1, ocupacion: +d.ocupacion.toFixed(3), mayor_rectangulo_vacio: +d.mayor_rectangulo_vacio.toFixed(3), hueco_mm: d.mayor_rectangulo_vacio_aprox_mm, ok: d.ocupacion >= (config.densidad.ocupacion_min_por_pagina?.[config.mapa_paginas[i].nombre] ?? config.densidad.ocupacion_min) && d.mayor_rectangulo_vacio <= config.densidad.mayor_rectangulo_vacio_max }));
const esperadas = config.mapa_paginas.length;
acta.pasos.paginas = { esperadas, renderizadas: geo.paginas, en_rango: geo.paginas >= config.paginas.min && geo.paginas <= config.paginas.max && geo.paginas === esperadas };

fs.writeFileSync(path.join(carpeta, 'diario.html'), html, 'utf8');

// 5. PNG de cada página (evidencia para la revisión visual).
const dirPng = path.join(carpeta, 'paginas');
fs.mkdirSync(dirPng, { recursive: true });
const locs = page.locator('.page');
for (let i = 0; i < geo.paginas; i++) await locs.nth(i).screenshot({ path: path.join(dirPng, `pagina-${String(i + 1).padStart(2, '0')}.png`), type: 'png' });

const densidadOk = acta.pasos.densidad.every(d => d.ok);
const geoOk = geo.errores.length === 0;
if (soloHtml) { acta.ok = false; acta.nota = 'Sólo HTML y PNG (--html)'; escribirJson(path.join(carpeta, 'preflight.json'), acta); await browser.close(); console.log(JSON.stringify({ geoOk, densidadOk, errores: geo.errores.slice(0, 20), densidad: acta.pasos.densidad, cuerpos }, null, 2)); process.exit(0); }

if (!geoOk || !densidadOk || !acta.pasos.paginas.en_rango) {
  escribirJson(path.join(carpeta, 'preflight.json'), acta);
  await browser.close();
  console.error(JSON.stringify({ geoOk, densidadOk, paginas: acta.pasos.paginas, errores: geo.errores.slice(0, 30), densidad: acta.pasos.densidad, cuerpos }, null, 2));
  fallar('geometría, densidad o cantidad de páginas');
}

// 6. PDF.
const pdf = path.join(carpeta, `El-Diario-de-Yrigoyen-N${contenido.edicion.numero}-${contenido.edicion.fecha}.pdf`);
await page.emulateMedia({ media: 'print' });
await page.pdf({ path: pdf, width: `${papel.ancho_mm}mm`, height: `${papel.alto_mm}mm`, printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await browser.close();
acta.pdf = pdf;
acta.pasos.revision_visual = { estado: 'pendiente', rubrica: 'EL_DIARIO_DE_YRIGOYEN.md §7.6', nota: 'La completa el modelo generador leyendo los PNG; se registra en este archivo.' };
acta.pasos.texto_pdf = { estado: 'no_implementado' };
acta.ok = true;
escribirJson(path.join(carpeta, 'preflight.json'), acta);
escribirJson(path.join(RAIZ, 'historial', 'ediciones', `${contenido.edicion.fecha}.json`), registroEdicion(contenido, acta));
console.log(JSON.stringify({ ok: true, pdf, cuerpos, densidad: acta.pasos.densidad }, null, 2));
