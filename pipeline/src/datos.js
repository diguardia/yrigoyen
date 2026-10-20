// Arma las secciones estructuradas (finanzas y clima) a partir de las respuestas crudas de las APIs
// guardadas en <edicion>/datos/. Uso: node src/datos.js <carpeta de edición>
// Los comentarios editoriales se leen de <edicion>/datos/comentarios.json si existe:
// { "cripto": { "BTC": "...", ... }, "finanzas": "...", "clima_alertas": "...", "clima_cambio_brusco": "..." }
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ, leerJson, escribirJson } from './util.js';

const carpeta = path.resolve(process.argv[2] || '.');
const dir = path.join(carpeta, 'datos');
const config = leerJson(path.join(RAIZ, 'config', 'edicion.json'));
const comentarios = fs.existsSync(path.join(dir, 'comentarios.json')) ? leerJson(path.join(dir, 'comentarios.json')) : {};
const leerSi = f => fs.existsSync(path.join(dir, f)) ? leerJson(path.join(dir, f)) : null;

// ---- Finanzas ----
const markets = [...(leerSi('cg_markets.json') || []), ...(leerSi('cg_markets_0g.json') || [])];
const noDisponible = [];
const ahora = new Date().toISOString();
const cripto = config.activos.map(a => {
  const m = markets.find(x => x.id === a.coingecko_id);
  const c365 = leerSi(`cg_chart_${a.coingecko_id}_365.json`);
  const c7 = leerSi(`cg_chart_${a.coingecko_id}_7.json`);
  const serie365 = c365?.prices || [];
  const serie7 = c7?.prices?.length ? c7.prices : null;
  const corte = m ? new Date(m.last_updated).getTime() : Date.now();
  const d30 = serie365.filter(p => p[0] >= corte - 30 * 86400000);
  const d7 = serie7 || serie365.filter(p => p[0] >= corte - 7 * 86400000);
  if (!m) noDisponible.push({ dato: `Precio de ${a.simbolo}`, fuente_intentada: 'CoinGecko /coins/markets', hora_intento: ahora, motivo: 'Sin respuesta de la API.' });
  if (!serie365.length) noDisponible.push({ dato: `Serie histórica de ${a.simbolo}`, fuente_intentada: 'CoinGecko /market_chart', hora_intento: ahora, motivo: 'Sin respuesta de la API.' });
  if (!serie7) noDisponible.push({ dato: `Serie horaria de 7 días de ${a.simbolo}`, fuente_intentada: 'CoinGecko /market_chart?days=7', hora_intento: ahora, motivo: 'Límite de la API; se usó la serie diaria.' });
  return {
    simbolo: a.simbolo, nombre: a.nombre,
    precio_usd: m?.current_price ?? null,
    var_24h: m?.price_change_percentage_24h_in_currency ?? null,
    var_7d: m?.price_change_percentage_7d_in_currency ?? null,
    var_30d: m?.price_change_percentage_30d_in_currency ?? null,
    var_1y: m?.price_change_percentage_1y_in_currency ?? null,
    market_cap_usd: m?.market_cap ?? null, fdv_usd: m?.fully_diluted_valuation ?? null,
    series: { d7, d30, d365: serie365 },
    comentario: comentarios.cripto?.[a.simbolo] || '',
  };
});
const corteFin = markets.map(m => m.last_updated).sort().at(-1) || ahora;
const dolares = leerSi('dolares.json') || [];
const nombresCasa = { oficial: 'Oficial', blue: 'Blue', bolsa: 'MEP (bolsa)', contadoconliqui: 'Contado con liqui', mayorista: 'Mayorista', cripto: 'Cripto', tarjeta: 'Tarjeta' };
const dolar = dolares.filter(d => d.casa in nombresCasa).map(d => ({ casa: nombresCasa[d.casa], clave: d.casa, compra: d.compra, venta: d.venta, actualizado: d.fechaActualizacion }));
// Para la portada se usan las claves originales.
for (const d of dolar) if (d.clave) { d.casa_clave = d.clave; }
const rp = leerSi('riesgo_pais.json');
const infl = leerSi('inflacion.json');
const mesNombre = f => new Intl.DateTimeFormat('es-AR', { month: 'long', timeZone: 'UTC' }).format(new Date(f + 'T12:00:00Z'));
const inflacion = infl?.length ? { mes: mesNombre(infl.at(-1).fecha), valor: infl.at(-1).valor, serie: infl.slice(-6).map(x => ({ mes: mesNombre(x.fecha).slice(0, 3), valor: x.valor })), serie12: infl.slice(-12).map(x => [new Date(x.fecha + 'T12:00:00Z').getTime(), x.valor]) } : null;

const finanzas = {
  corte: corteFin,
  fuente_cripto: 'CoinGecko',
  cripto,
  dolar: dolar.map(d => ({ casa: d.casa, compra: d.compra, venta: d.venta, actualizado: d.actualizado, clave: d.clave })),
  riesgo_pais: rp ? { valor: rp.valor, fecha: rp.fecha } : null,
  inflacion,
  comentario: comentarios.finanzas || '',
  filas_extra: comentarios.filas_extra || [],
  no_disponible: noDisponible.filter(x => !/horaria/.test(x.dato) || !comentarios.ocultar_aviso_horaria),
};

// ---- Clima ----
const meteo = leerSi('meteo_loscocos.json');
const consultado = fs.existsSync(path.join(dir, 'consultado_meteo_utc.txt')) ? fs.readFileSync(path.join(dir, 'consultado_meteo_utc.txt'), 'utf8').trim() : ahora;
const dd = meteo.daily;
const hoy = process.argv[3] || new Date().toISOString().slice(0, 10);
const todos = dd.time.map((t, i) => ({ fecha: t, codigo_wmo: dd.weather_code[i], max: dd.temperature_2m_max[i], min: dd.temperature_2m_min[i], precip_mm: dd.precipitation_sum[i], prob_precip: dd.precipitation_probability_max[i], viento_kmh: dd.wind_speed_10m_max[i], rafagas_kmh: dd.wind_gusts_10m_max[i] }));
const previos = todos.filter(x => x.fecha < hoy);
const dias = todos.filter(x => x.fecha >= hoy).slice(0, config.clima.dias_pronostico);
let cambio = comentarios.clima_cambio_brusco ?? null;
if (cambio === null && previos.length && dias.length) {
  const promPrev = previos.reduce((s, x) => s + x.max, 0) / previos.length;
  const maxProx = Math.max(...dias.map(x => x.max)), minProx = Math.min(...dias.map(x => x.max));
  if (maxProx - promPrev >= config.clima.cambio_brusco_grados) cambio = `la máxima sube hasta ${Math.round(maxProx)}° frente a un promedio de ${Math.round(promPrev)}° en los tres días previos.`;
  else if (promPrev - minProx >= config.clima.cambio_brusco_grados) cambio = `la máxima baja hasta ${Math.round(minProx)}° frente a un promedio de ${Math.round(promPrev)}° en los tres días previos.`;
}
const clima = { lugar: config.clima.lugar, corte: consultado, fuente: 'Open-Meteo (modelo best_match)', dias, previos, cambio_brusco: cambio, alertas: comentarios.clima_alertas || null };

escribirJson(path.join(dir, 'finanzas.json'), finanzas);
escribirJson(path.join(dir, 'clima.json'), clima);
console.log(JSON.stringify({ cripto: cripto.map(c => ({ s: c.simbolo, px: c.precio_usd, d7: c.series.d7.length, d30: c.series.d30.length, d365: c.series.d365.length })), dolar: dolar.length, riesgo: finanzas.riesgo_pais, inflacion, dias: dias.map(d => d.fecha), previos: previos.length, cambio, no_disponible: noDisponible.length }, null, 2));
