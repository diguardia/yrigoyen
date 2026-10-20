// Transforma el JSON de contenido en el HTML paginado del diario.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, parrafo, precio, porcentaje, numero, fechaLarga, fechaCorta, fechaNumerica, horaMin, fechaHora, diaSemana, capitalizar } from './util.js';
import { graficoLinea } from './charts.js';
import { iconoPorWmo, svgIcono } from './icons.js';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CSS = fs.readFileSync(path.join(AQUI, '..', 'templates', 'diario.css'), 'utf8');

const NOMBRE_SECCION = {
  portada: 'Portada', actualidad: 'Actualidad', cordoba_mundo: 'Córdoba y mundo', tecnologia: 'Tecnología, programación e IA',
  educacion_ciencia: 'Educación y ciencia', finanzas: 'Finanzas y criptomonedas', boca: 'Boca Juniors', contratapa: 'Cultura y clima',
};
const KICKER = {
  principal: 'Nota principal', nacional: 'Argentina', economia: 'Economía', mundo: 'Mundo', cordoba: 'Córdoba', punilla: 'Punilla',
  los_cocos: 'Los Cocos', buena_noticia: 'Buena noticia', tecnologia: 'Tecnología', upc: 'UPC', educacion: 'Educación', ciencia: 'Ciencia',
  cultura: 'Cultura', breve: 'Breve',
};

/**
 * @param {object} contenido JSON validado
 * @param {object} config config/edicion.json
 * @param {object} [opciones] { cuerpos: number[] (pt por página), columnas: number }
 */
export function render(contenido, config, opciones = {}) {
  const papel = config.papel.formatos[contenido.edicion.papel || config.papel.actual];
  const mapa = config.mapa_paginas;
  const total = mapa.length;
  const cuerpos = opciones.cuerpos || mapa.map(() => config.tipografia.cuerpo_pt.por_defecto);
  const ctx = { contenido, config, total, papel, fechaLarga: fechaLarga(contenido.edicion.fecha) };

  const paginas = mapa.map((m, i) => {
    const n = i + 1;
    const estilo = `--cuerpo:${cuerpos[i]}pt; --columnas:${opciones.columnas || papel.columnas_max}`;
    let cuerpo;
    switch (m.nombre) {
      case 'portada': cuerpo = portada(ctx); break;
      case 'finanzas': cuerpo = finanzas(ctx); break;
      case 'boca': cuerpo = boca(ctx); break;
      case 'contratapa': cuerpo = contratapa(ctx); break;
      default: cuerpo = flujo(ctx, m.secciones, n);
    }
    const header = m.nombre === 'portada' ? masthead(ctx) :
      `<header class="ph"><span><span class="ph-seccion">${esc(config.nombre)}</span> · ${esc(NOMBRE_SECCION[m.nombre] || m.nombre)}</span><span>${esc(ctx.fechaLarga)} · <b class="ph-num">${n}</b></span></header>`;
    return `<section class="page" data-pagina="${n}" data-nombre="${esc(m.nombre)}" style="${estilo}">
      ${header}
      <div class="pb">${cuerpo}</div>
      <footer class="pf"><span>Nº ${contenido.edicion.numero} · ${esc(contenido.edicion.lugar)}</span><span>Página <b class="pf-num">${n}</b> de ${total}</span></footer>
    </section>`;
  });

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>${esc(config.nombre)} Nº ${contenido.edicion.numero}</title>
<style>:root{--papel-ancho:${papel.ancho_mm}mm;--papel-alto:${papel.alto_mm}mm;--margen:${papel.margen_mm}mm;}
${CSS}</style></head><body>${paginas.join('\n')}</body></html>`;
}

/* ---------- Portada ---------- */
function masthead(ctx) {
  const { contenido, config } = ctx;
  return `<header class="ph masthead"><h1>${esc(config.nombre)}</h1>
    <div class="sub"><span>Nº ${contenido.edicion.numero}</span><span>${esc(capitalizar(ctx.fechaLarga))}</span><span>${esc(contenido.edicion.lugar)}</span></div></header>`;
}

function portada(ctx) {
  const { contenido: c } = ctx;
  const p = c.portada;
  const clima = c.clima.dias.slice(0, 2).map(d => {
    const ic = iconoPorWmo(d.codigo_wmo);
    return `<div class="dia">${svgIcono(ic.nombre)}<div class="t"><div><b>${numero(d.max, 0)}°</b> / ${numero(d.min, 0)}°</div><div>${esc(capitalizar(diaSemana(d.fecha)))} · ${esc(ic.texto)}</div></div></div>`;
  }).join('');
  const dol = Object.fromEntries(c.finanzas.dolar.map(d => [d.clave || d.casa, d]));
  const btc = c.finanzas.cripto.find(x => x.simbolo === 'BTC');
  const filasCot = [
    dol.oficial && `<tr><td>Dólar oficial</td><td class="v">$ ${numero(dol.oficial.venta, 0)}</td></tr>`,
    dol.bolsa && `<tr><td>Dólar MEP</td><td class="v">$ ${numero(dol.bolsa.venta, 0)}</td></tr>`,
    dol.blue && `<tr><td>Dólar blue</td><td class="v">$ ${numero(dol.blue.venta, 0)}</td></tr>`,
    c.finanzas.riesgo_pais && `<tr><td>Riesgo país</td><td class="v">${numero(c.finanzas.riesgo_pais.valor, 0)} pb</td></tr>`,
    btc && `<tr><td>Bitcoin</td><td class="v">US$ ${precio(btc.precio_usd)}</td></tr>`,
  ].filter(Boolean).join('');
  const secundarias = p.secundarias.map(s => `<div class="sec"><h4>${esc(s.titulo)}</h4><p>${parrafo(s.resumen)}${s.pagina ? ` <span class="pg">Pág. ${s.pagina}</span>` : ''}</p></div>`).join('');
  const llamadas = (p.llamadas || []).map(l => `<div class="llamada"><span class="et">${esc(l.etiqueta)}</span>${parrafo(l.texto)}${l.pagina ? ` <span class="pg">Pág. ${l.pagina}</span>` : ''}</div>`).join('');
  const pr = p.principal;
  return `
  <div class="strip">
    <div><h4>Clima en ${esc(c.clima.lugar)}</h4><div class="strip-clima">${clima}</div></div>
    <div class="strip-cot"><h4>Cotizaciones al cierre</h4><table>${filasCot}</table></div>
    <div class="strip-disco"><h4>Disco de la semana</h4><b>${esc(c.disco.artista)}</b>, <i>${esc(c.disco.titulo)}</i> (${c.disco.anio}, ${esc(c.disco.genero)}). <span class="just">${parrafo(c.disco.justificacion)}</span></div>
  </div>
  <div class="portada-main">
    <article class="principal art tipo-${esc(pr.tipo)}">
      <div class="kicker">${esc(KICKER[pr.seccion] || pr.seccion)} · ${esc(fechaCorta(pr.fecha_acontecimiento))}</div>
      <h2 class="tit">${parrafo(pr.titulo)}</h2>
      ${pr.bajada ? `<p class="bajada">${parrafo(pr.bajada)}</p>` : ''}
      <div class="cuerpo">${pr.cuerpo.map(x => `<p>${parrafo(x)}</p>`).join('')}${fuentes(pr)}</div>
    </article>
    <aside class="secundarias"><h3>En esta edición</h3>${secundarias}</aside>
  </div>
  ${llamadas ? `<div class="llamadas" style="--n-llamadas:${p.llamadas.length}">${llamadas}</div>` : ''}`;
}

/* ---------- Páginas de flujo ---------- */
function flujo(ctx, secciones, pagina) {
  const { contenido: c } = ctx;
  const notas = c.notas
    .filter(n => (n.pagina ? n.pagina === pagina : secciones.includes(n.seccion)) && n.seccion !== 'breve')
    .sort((a, b) => (b.importancia || 0) - (a.importancia || 0));
  const breves = c.notas.filter(n => n.seccion === 'breve' && (n.pagina ? n.pagina === pagina : secciones.includes(n.seccion_destino || 'nacional')));
  const nd = (c.no_disponible || []).filter(x => x.pagina === pagina).map(noDisponible).join('');
  const html = notas.map((n, i) => articulo(n, i === 0)).join('');
  const brevesHtml = breves.length ? `<div class="breves"><h3>Breves</h3>${breves.map(b => `<p class="breve"><b>${esc(b.titulo)}.</b> ${parrafo(b.cuerpo.join(' '))} <span class="f">${esc(b.fuentes[0]?.medio || '')}, ${esc(fechaCorta(b.fecha_acontecimiento))}</span></p>`).join('')}</div>` : '';
  return `<div class="flow">${html}${nd}${brevesHtml}</div>`;
}

function articulo(n, lead) {
  const fecha = n.fecha_acontecimiento ? fechaCorta(n.fecha_acontecimiento) : '';
  return `<article class="art ${lead ? 'lead' : ''} tipo-${esc(n.tipo)}" data-id="${esc(n.id)}" data-recorte="${esc(n.recorte || '')}">
    <div class="kicker">${esc(KICKER[n.seccion] || n.seccion)}${fecha ? ` · ${esc(fecha)}` : ''}</div>
    <h2 class="tit">${parrafo(n.titulo)}</h2>
    ${n.bajada ? `<p class="bajada">${parrafo(n.bajada)}</p>` : ''}
    <div class="cuerpo">${n.cuerpo.map(x => `<p>${parrafo(x)}</p>`).join('')}</div>
    ${fuentes(n)}
  </article>`;
}

function fuentes(n) {
  if (!n.fuentes || !n.fuentes.length) return '';
  const vistos = new Set();
  const partes = [];
  for (const f of n.fuentes) {
    const k = `${f.medio}|${f.fecha_publicacion || ''}`;
    if (vistos.has(k)) continue;
    vistos.add(k);
    partes.push(`${esc(f.medio)}${f.fecha_publicacion ? `, ${esc(fechaCorta(f.fecha_publicacion))}` : ''}`);
  }
  return `<p class="fuente">${partes.join(' · ')}</p>`;
}

function noDisponible(x) {
  return `<div class="nd"><b>Dato no disponible al cierre:</b> ${esc(x.dato)}. Fuente intentada: ${esc(x.fuente_intentada)}, ${esc(fechaHora(x.hora_intento))}.${x.motivo ? ` ${esc(x.motivo)}` : ''}</div>`;
}

/* ---------- Finanzas ---------- */
function finanzas(ctx) {
  const { contenido: c } = ctx;
  const f = c.finanzas;
  const corte = `${fechaNumerica(f.corte)} ${horaMin(f.corte)}`;
  const coins = f.cripto.map(k => {
    const v = (lbl, val) => `<span class="${val < 0 ? 'neg' : ''}">${lbl} ${porcentaje(val)}</span>`;
    return `<div class="coin">
      <div class="coin-head"><span class="sym">${esc(k.simbolo)}</span><span class="nom">${esc(k.nombre)}</span>
        <span class="vars">${v('24 h', k.var_24h)}${v('7 d', k.var_7d)}${v('30 d', k.var_30d)}${v('12 m', k.var_1y)}</span>
        <span class="px">US$ ${precio(k.precio_usd)}</span></div>
      <div class="charts">
        ${graficoLinea({ serie: k.series.d7, titulo: 'Últimos 7 días' })}
        ${graficoLinea({ serie: k.series.d30, titulo: 'Últimos 30 días' })}
        ${graficoLinea({ serie: k.series.d365, titulo: 'Últimos 12 meses' })}
      </div>
      ${k.comentario ? `<p class="com">${parrafo(k.comentario)}</p>` : ''}
    </div>`;
  }).join('');
  const dolar = f.dolar.map(d => `<tr><td class="l">${esc(d.casa)}</td><td>${numero(d.compra, 0)}</td><td>${numero(d.venta, 0)}</td><td>${esc(fechaCorta(d.actualizado))}</td></tr>`).join('');
  const infl = f.inflacion ? `<tr><td class="l">Inflación mensual (${esc(f.inflacion.mes)})</td><td colspan="3">${numero(f.inflacion.valor, 1)}%</td></tr>` : '';
  const rp = f.riesgo_pais ? `<tr><td class="l">Riesgo país (JP Morgan)</td><td colspan="3">${numero(f.riesgo_pais.valor, 0)} pb · ${esc(fechaCorta(f.riesgo_pais.fecha))}</td></tr>` : '';
  const serieInfl = f.inflacion?.serie?.length ? `<p class="aviso">Últimos meses: ${f.inflacion.serie.map(s => `${esc(s.mes)} ${numero(s.valor, 1)}%`).join(' · ')}.</p>` : '';
  const glos = c.glosario.map(g => `<dt>${esc(g.termino)}</dt><dd>${parrafo(g.definicion)}${g.ejemplo ? ` <span class="ej">${parrafo(g.ejemplo)}</span>` : ''}${g.nota_relacionada ? ` <span class="rel">Ver: ${esc(g.nota_relacionada)}</span>` : ''}</dd>`).join('');
  const nd = (f.no_disponible || []).map(noDisponible).join('');
  return `<div class="fin">
    ${coins}
    ${nd}
    <div class="fin-bottom">
      <div>
        <table class="tabla"><caption>Dólar en pesos (ARS) · compra / venta</caption>
          <thead><tr><th class="l">Casa</th><th>Compra</th><th>Venta</th><th>Fecha</th></tr></thead>
          <tbody>${dolar}${rp}${infl}${(f.filas_extra || []).map(x => `<tr><td class="l">${esc(x.casa)}</td><td colspan="3">${esc(x.texto)}</td></tr>`).join('')}</tbody></table>
        ${f.inflacion?.serie12?.length > 2 ? `<div class="chart-infl">${graficoLinea({ serie: f.inflacion.serie12, titulo: 'Inflación mensual (%), 12 meses', mostrarMaxMin: true })}</div>` : serieInfl}
        ${f.comentario ? `<p class="aviso">${parrafo(f.comentario)}</p>` : ''}
        <p class="aviso">Series y variaciones retrospectivas al cierre (${esc(corte)} hora argentina). Fuente cripto: ${esc(f.fuente_cripto || 'CoinGecko')}; dólar: DolarApi; riesgo país e inflación: ArgentinaDatos sobre datos de JP Morgan e INDEC. Máximo y mínimo marcados con puntos. No es recomendación de inversión.</p>
      </div>
      <div><h3 class="h3">Glosario técnico</h3><dl class="glos">${glos}</dl></div>
    </div>
  </div>`;
}

/* ---------- Boca ---------- */
function boca(ctx) {
  const { contenido: c } = ctx;
  const b = c.boca;
  const u = b.ultimo_partido;
  const p = b.proximo_partido;
  const hoy = c.edicion.fecha;
  const manana = new Date(new Date(hoy + 'T12:00:00-03:00').getTime() + 86400000).toISOString().slice(0, 10);
  const esHoy = p.fecha === hoy, esManana = p.fecha === manana;
  const cuando = `${esHoy ? 'HOY, ' : esManana ? 'MAÑANA, ' : ''}${capitalizar(diaSemana(p.fecha))} ${fechaNumerica(p.fecha)} · ${esc(p.hora_ar)} hora argentina`;
  const goles = (u.goles || []).map(g => `${esc(g.minuto)}' ${esc(g.jugador)} (${esc(g.equipo)})`).join(' · ');
  const filas = b.tabla.filas.map(r => `<tr class="${/boca/i.test(r.equipo) ? 'destacado' : ''}"><td>${r.pos}</td><td class="l">${esc(r.equipo)}</td><td>${r.pj}</td><td>${r.g}</td><td>${r.e}</td><td>${r.p}</td><td>${r.gf}</td><td>${r.gc}</td><td>${r.dif > 0 ? '+' : ''}${r.dif}</td><td><b>${r.pts}</b></td></tr>`).join('');
  const sig = (b.siguientes_partidos || []).map(s => `<li>${esc(capitalizar(diaSemana(s.fecha)))} ${esc(fechaNumerica(s.fecha))}${s.hora_ar ? `, ${esc(s.hora_ar)}` : ''} · ${esc(s.rival)} (${esc(s.condicion)}) · ${esc(s.competicion)}</li>`).join('');
  const llave = (l) => (l && l.length) ? `<ul class="lista sans">${l.map(x => `<li>${esc(x.cruce)}${x.fecha ? ` · ${esc(x.fecha)}` : ''}${x.resultado ? ` · ${esc(x.resultado)}` : ''}</li>`).join('')}</ul>` : '';
  const pl = b.plantel || {};
  const lista = (arr, fmt) => arr && arr.length ? `<ul class="lista sans">${arr.map(fmt).join('')}</ul>` : '<p class="datos">Sin novedades registradas.</p>';
  const m = b.mercado;
  const nd = (b.no_disponible || []).map(noDisponible).join('');
  return `<div class="boca">
    <div class="col">
      <div class="bloque">
        <div class="kicker">Último partido · ${esc(u.competicion)} · ${esc(fechaCorta(u.fecha))}${u.hora_ar ? `, ${esc(u.hora_ar)}` : ''}</div>
        <p class="resultado">${esc(u.local)} ${esc(u.resultado)} ${esc(u.visitante)}</p>
        ${goles ? `<p class="goles">Goles: ${goles}.${u.arbitro ? ` Árbitro: ${esc(u.arbitro)}.` : ''}${u.estadio ? ` ${esc(u.estadio)}.` : ''}</p>` : ''}
        ${(u.cronica || []).map ? u.cronica.map(x => `<p>${parrafo(x)}</p>`).join('') : `<p>${parrafo(u.cronica || '')}</p>`}
      </div>
      <div class="proximo ${esHoy || esManana ? 'hoy' : ''}">
        <div class="et">Próximo partido · ${esc(p.competicion)}</div>
        <div class="rival">${p.condicion === 'local' ? 'Boca' : esc(p.rival)} vs. ${p.condicion === 'local' ? esc(p.rival) : 'Boca'}</div>
        <div class="cuando">${cuando}</div>
        <p class="det">${esc(p.estadio || '')}${p.arbitro ? ` · Árbitro: ${esc(p.arbitro)}` : ''}${p.tv ? ` · TV: ${esc(p.tv)}` : ''} · Verificado en ${p.fuentes?.length || 2} fuentes al cierre.</p>
      </div>
      ${sig ? `<div class="bloque"><h3 class="h3">Siguientes partidos</h3><ul class="lista sans">${sig}</ul></div>` : ''}
      <div class="bloque">
        <table class="tabla"><caption>${esc(b.tabla.titulo)}</caption>
          <thead><tr><th>#</th><th class="l">Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>Dif</th><th>Pts</th></tr></thead>
          <tbody>${filas}</tbody></table>
        <p class="aviso">${esc(b.tabla.formato || '')} Fuente: ${esc(b.tabla.fuente)}, actualizada ${esc(fechaHora(b.tabla.actualizada))}.</p>
      </div>
      ${b.tabla_anual && b.tabla_anual.disponible ? `<div class="bloque"><h3 class="h3">Tabla anual</h3><p>${parrafo(b.tabla_anual.detalle)}</p></div>` : ''}
    </div>
    <div class="col">
      <div class="bloque"><h3 class="h3">Copa Argentina</h3><p>${parrafo(b.copa_argentina.detalle)}</p>${llave(b.copa_argentina.llave)}</div>
      <div class="bloque"><h3 class="h3">${esc(b.continental.competicion === 'ninguna' ? 'Competición continental' : b.continental.competicion)}</h3><p>${parrafo(b.continental.detalle)}</p>${llave(b.continental.llave)}</div>
      <div class="bloque"><h3 class="h3">Plantel${pl.entrenador ? ` · DT ${esc(pl.entrenador)}` : ''}</h3>
        ${pl.formacion_confirmada?.length ? `<p class="formacion"><b>Confirmados${pl.esquema ? ` (${esc(pl.esquema)})` : ''}:</b> ${pl.formacion_confirmada.map(esc).join(', ')}.</p>` : ''}
        ${pl.formacion_probable?.length ? `<p class="formacion"><b>Probables${!pl.formacion_confirmada?.length && pl.esquema ? ` (${esc(pl.esquema)})` : ''}:</b> ${pl.formacion_probable.map(esc).join(', ')}.</p>` : ''}
        <p class="formacion"><b>Lesionados y en recuperación:</b> ${pl.lesionados?.length ? pl.lesionados.map(l => `${esc(l.jugador)} (${esc(l.lesion)}${l.regreso_estimado ? `; regreso ${esc(l.regreso_estimado)}` : ''})`).join(', ') : 'sin bajas informadas'}.</p>
        <p class="formacion"><b>Suspendidos:</b> ${pl.suspendidos?.length ? pl.suspendidos.map(s => `${esc(s.jugador)} (${esc(s.motivo)})`).join(', ') : 'ninguno'}.</p>
        ${pl.regresos?.length ? `<p class="formacion"><b>Regresos:</b> ${pl.regresos.map(esc).join(', ')}.</p>` : ''}
        ${pl.actualizado ? `<p class="datos">Actualizado ${esc(fechaCorta(pl.actualizado))}.</p>` : ''}
      </div>
      <div class="bloque"><h3 class="h3">Mercado de pases</h3>
        <p class="formacion"><b>Oficial</b></p>${lista(m.oficiales, x => `<li>${parrafo(x.detalle)}${x.fecha ? ` (${esc(fechaCorta(x.fecha))})` : ''}</li>`)}
        <p class="formacion"><b>Negociaciones confirmadas</b></p>${lista(m.confirmadas, x => `<li>${parrafo(x.detalle)}${x.fecha ? ` (${esc(fechaCorta(x.fecha))})` : ''}</li>`)}
        <p class="formacion"><b>Rumores</b></p>${lista(m.rumores, x => `<li>${parrafo(x.detalle)}${x.fuente ? ` <i>(${esc(x.fuente)})</i>` : ''}</li>`)}
        ${m.institucional ? `<p>${parrafo(m.institucional)}</p>` : ''}
      </div>
      ${nd}
      <p class="sello">Fuentes: ${[...new Set(b.fuentes.map(f => f.medio))].map(esc).join(', ')}. Última verificación ${esc(fechaHora(b.fuentes.map(f => f.consultado).sort().at(-1)))} hora argentina.</p>
    </div>
  </div>`;
}

/* ---------- Contratapa ---------- */
function contratapa(ctx) {
  const { contenido: c } = ctx;
  const d = c.disco, mr = c.microrelato, po = c.poesia, cl = c.clima;
  const dias = cl.dias.map(x => {
    const ic = iconoPorWmo(x.codigo_wmo);
    return `<div class="dia"><div class="d">${esc(diaSemana(x.fecha).slice(0, 3))} ${esc(fechaCorta(x.fecha))}</div>${svgIcono(ic.nombre)}<div class="tt"><b>${numero(x.max, 0)}°</b> / ${numero(x.min, 0)}°</div><div>${esc(ic.texto)}</div></div>`;
  }).join('');
  const filas = [...(cl.previos || []).map(x => ({ ...x, obs: true })), ...cl.dias].map(x => `<tr class="${x.obs ? 'obs' : ''}"><td class="l">${esc(capitalizar(diaSemana(x.fecha)))} ${esc(fechaCorta(x.fecha))}${x.obs ? ' (previo)' : ''}</td><td>${numero(x.max, 0)}°</td><td>${numero(x.min, 0)}°</td><td>${x.precip_mm !== undefined ? numero(x.precip_mm, 1) + ' mm' : '—'}</td><td>${x.prob_precip !== undefined ? numero(x.prob_precip, 0) + '%' : '—'}</td><td>${x.viento_kmh !== undefined ? numero(x.viento_kmh, 0) : '—'}${x.rafagas_kmh !== undefined ? ` (${numero(x.rafagas_kmh, 0)})` : ''}</td></tr>`).join('');
  const versos = po.versos.map(v => v === '' ? '<p class="verso blanco"></p>' : `<p class="verso">${parrafo(v)}</p>`).join('');
  const erratas = c.fe_de_erratas.length ? c.fe_de_erratas.map(e => `<p>${parrafo(e)}</p>`).join('') : '<p>Sin correcciones a la edición anterior.</p>';
  const medios = {};
  for (const n of [c.portada.principal, ...c.notas]) for (const f of n.fuentes || []) medios[f.medio] = (medios[f.medio] || 0) + 1;
  const listaMedios = Object.entries(medios).sort((a, b) => b[1] - a[1]).map(([m, k]) => `${esc(m)}${k > 1 ? ` (${k})` : ''}`).join(', ');
  return `<div class="contra">
    <div class="col">
      <div class="disco">
        <div class="kicker">Disco de la semana</div>
        <h2 class="tit">${esc(d.artista)}: <i>${esc(d.titulo)}</i></h2>
        <p class="ficha">${d.anio} · ${esc(d.genero)}</p>
        ${(d.comentario || [d.justificacion]).map(x => `<p>${parrafo(x)}</p>`).join('')}
      </div>
      <div class="lit">
        <div class="kicker">Microrelato</div>
        <h2 class="tit">${esc(mr.titulo)}</h2>
        <p class="autor">${esc(mr.autor)}${mr.autor_fallecido ? ` (†${mr.autor_fallecido})` : ''} · <i>${esc(mr.obra)}</i>, ${esc(mr.anio)}${mr.traductor ? ` · Traducción: ${esc(mr.traductor)}` : ''}</p>
        ${mr.texto.map(x => `<p>${parrafo(x)}</p>`).join('')}
        ${mr.nota ? `<p class="nota">${parrafo(mr.nota)}</p>` : ''}
      </div>
      ${c.notas.filter(n => n.pagina === 8).map(n => `<div class="art lit">${articulo(n, false)}</div>`).join('')}
    </div>
    <div class="col">
      <div class="clima">
        <h3 class="h3">Clima en ${esc(cl.lugar)}</h3>
        <div class="dias">${dias}</div>
        <table class="tabla"><thead><tr><th class="l">Día</th><th>Máx</th><th>Mín</th><th>Lluvia</th><th>Prob.</th><th>Viento km/h (ráfagas)</th></tr></thead><tbody>${filas}</tbody></table>
        ${cl.cambio_brusco ? `<p class="obs"><b>Cambio de temperatura:</b> ${parrafo(cl.cambio_brusco)}</p>` : ''}
        ${cl.alertas ? `<p class="obs"><b>Alertas:</b> ${parrafo(cl.alertas)}</p>` : '<p class="obs">Sin alertas del Servicio Meteorológico Nacional consultadas para Punilla al cierre.</p>'}
        <p class="aviso">Fuente: ${esc(cl.fuente)}, pronóstico consultado ${esc(fechaHora(cl.corte))} hora argentina. Iconos según código WMO.</p>
      </div>
      <div class="lit">
        <div class="kicker">Poesía${po.fragmento ? ' · fragmento' : ''}</div>
        <h2 class="tit">${esc(po.titulo)}</h2>
        <p class="autor">${esc(po.autor)}${po.autor_fallecido ? ` (†${po.autor_fallecido})` : ''} · <i>${esc(po.obra)}</i>, ${esc(po.anio)}</p>
        ${versos}
        ${po.nota ? `<p class="nota">${parrafo(po.nota)}</p>` : ''}
      </div>
      <div class="erratas"><h3 class="h3">Fe de erratas</h3>${erratas}</div>
      <div><h3 class="h3">Fuentes de esta edición</h3><p class="fuentes-ed"><b>Medios consultados:</b> ${listaMedios}. <b>Datos:</b> Open-Meteo, CoinGecko, DolarApi, ArgentinaDatos, ESPN y fuentes deportivas citadas en página 7. Cada nota indica su fuente y fecha al pie.</p></div>
      <p class="pie-legal">${esc(ctx.config.nombre)} es una publicación de uso estrictamente personal, generada con asistencia de IA y verificada al cierre (${esc(fechaHora(c.edicion.cierre))} hora argentina). No se distribuye.</p>
    </div>
  </div>`;
}
