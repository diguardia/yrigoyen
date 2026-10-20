// Gráficos de líneas SVG monocromos para impresión. Entrada: serie [[timestamp_ms, precio], ...].
import { esc, precioCorto, precio, fechaCorta } from './util.js';

// Devuelve un SVG inline. Unidades internas: viewBox 0 0 240 110; el tamaño físico lo fija el CSS.
export function graficoLinea({ serie, titulo, moneda = 'US$', ancho = 240, alto = 92, mostrarMaxMin = true }) {
  if (!serie || serie.length < 2) {
    return `<svg class="chart chart-vacio" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="${esc(titulo)}: sin datos">
      <rect x="0.5" y="0.5" width="${ancho - 1}" height="${alto - 1}" fill="none" stroke="#999" stroke-dasharray="3 2"/>
      <text x="${ancho / 2}" y="${alto / 2}" text-anchor="middle" font-size="9" fill="#555">${esc(titulo)}: dato no disponible</text>
    </svg>`;
  }
  const padL = 34, padR = 6, padT = 16, padB = 16;
  const w = ancho - padL - padR;
  const h = alto - padT - padB;
  const xs = serie.map(p => p[0]);
  const ys = serie.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  const iMax = ys.indexOf(y1), iMin = ys.indexOf(y0);
  if (y1 === y0) { y1 += 1; y0 -= 1; }
  const margen = (y1 - y0) * 0.08;
  const yLo = y0 - margen, yHi = y1 + margen;
  const X = t => padL + ((t - x0) / (x1 - x0 || 1)) * w;
  const Y = v => padT + h - ((v - yLo) / (yHi - yLo)) * h;

  const puntos = serie.map(p => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ');
  // Tres marcas en el eje vertical.
  const ticks = [yLo + (yHi - yLo) * 0.1, (yLo + yHi) / 2, yHi - (yHi - yLo) * 0.1];
  const gridY = ticks.map(v => `<line x1="${padL}" x2="${ancho - padR}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="#cfcfcf" stroke-width="0.5"/>
    <text x="${padL - 3}" y="${(Y(v) + 3).toFixed(1)}" text-anchor="end" font-size="7.5" fill="#333">${esc(precioCorto(v))}</text>`).join('');
  // Fechas en los extremos y en el medio.
  const tMid = (x0 + x1) / 2;
  const ejeX = `<text x="${padL}" y="${alto - 4}" font-size="7.5" fill="#333">${esc(fechaCorta(new Date(x0).toISOString()))}</text>
    <text x="${(padL + w / 2).toFixed(1)}" y="${alto - 4}" text-anchor="middle" font-size="7.5" fill="#333">${esc(fechaCorta(new Date(tMid).toISOString()))}</text>
    <text x="${ancho - padR}" y="${alto - 4}" text-anchor="end" font-size="7.5" fill="#333">${esc(fechaCorta(new Date(x1).toISOString()))}</text>`;
  const maxMin = mostrarMaxMin ? `
    <circle cx="${X(xs[iMax]).toFixed(1)}" cy="${Y(y1).toFixed(1)}" r="1.8" fill="#000"/>
    <circle cx="${X(xs[iMin]).toFixed(1)}" cy="${Y(y0).toFixed(1)}" r="1.8" fill="#fff" stroke="#000" stroke-width="0.9"/>` : '';
  const leyenda = `<text x="${ancho - padR}" y="10" text-anchor="end" font-size="7.5" fill="#333">máx ${esc(precioCorto(y1))} · mín ${esc(precioCorto(y0))}</text>`;

  return `<svg class="chart" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="${esc(titulo)}, ${esc(moneda)}">
    <text x="${padL}" y="10" font-size="8.5" font-weight="bold" fill="#000">${esc(titulo)}</text>
    ${leyenda}
    ${gridY}
    <line x1="${padL}" x2="${ancho - padR}" y1="${(padT + h).toFixed(1)}" y2="${(padT + h).toFixed(1)}" stroke="#000" stroke-width="0.6"/>
    <polyline points="${puntos}" fill="none" stroke="#000" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/>
    ${maxMin}
    ${ejeX}
  </svg>`;
}

// Resumen máximo/mínimo de una serie, para el texto de la ficha.
export function maxMin(serie) {
  if (!serie || !serie.length) return null;
  let max = serie[0], min = serie[0];
  for (const p of serie) { if (p[1] > max[1]) max = p; if (p[1] < min[1]) min = p; }
  return { max: { fecha: new Date(max[0]).toISOString(), valor: max[1], texto: precio(max[1]) }, min: { fecha: new Date(min[0]).toISOString(), valor: min[1], texto: precio(min[1]) } };
}
