// Preflight geométrico y de densidad sobre la página renderizada en Chromium.
import { PNG } from 'pngjs';

// Se ejecuta dentro del navegador. Devuelve errores de geometría por página.
export async function geometria(page) {
  return page.evaluate(() => {
    const errores = [];
    const avisos = [];
    const paginas = [...document.querySelectorAll('.page')];
    const TOL = 0.75; // px de tolerancia por redondeo
    const rectDe = el => el.getBoundingClientRect();
    const dentro = (r, R) => r.left >= R.left - TOL && r.right <= R.right + TOL && r.top >= R.top - TOL && r.bottom <= R.bottom + TOL;
    const interseca = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const textoDe = el => (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);

    paginas.forEach((pg, i) => {
      const n = i + 1;
      const R = rectDe(pg);
      const estilo = getComputedStyle(pg);
      const padL = parseFloat(estilo.paddingLeft), padT = parseFloat(estilo.paddingTop), padR = parseFloat(estilo.paddingRight), padB = parseFloat(estilo.paddingBottom);
      const util = { left: R.left + padL, top: R.top + padT, right: R.right - padR, bottom: R.bottom - padB };

      // 7. Encabezado, número y pie.
      const ph = pg.querySelector('.ph'), pf = pg.querySelector('.pf');
      if (!ph) errores.push({ pagina: n, tipo: 'sin_encabezado' });
      if (!pf) errores.push({ pagina: n, tipo: 'sin_pie' });
      const num = pg.querySelector('.pf-num');
      if (!num || num.textContent.trim() !== String(n)) errores.push({ pagina: n, tipo: 'numero_pagina', detalle: num ? num.textContent : 'ausente' });

      // 2, 3 y 6. Overflow horizontal, fuera de límites y texto oculto.
      const bloques = [...pg.querySelectorAll('p, h1, h2, h3, h4, li, td, th, dt, dd, svg.chart, svg.wicon, .nd, caption')]
        .filter(el => el.offsetParent !== null || el instanceof SVGElement);
      for (const el of bloques) {
        const frs = [...el.getClientRects()].filter(f => f.width > 0 && f.height > 0);
        for (const r of (frs.length ? frs : [rectDe(el)])) {
        if (!dentro(r, util)) {
          errores.push({ pagina: n, tipo: 'fuera_de_area_util', elemento: el.tagName.toLowerCase(), texto: textoDe(el), rect: { l: Math.round(r.left - R.left), t: Math.round(r.top - R.top), r: Math.round(r.right - R.left), b: Math.round(r.bottom - R.top) } });
          break;
        }
        }
      }
      for (const cont of pg.querySelectorAll('.flow, .cuerpo, .secundarias, .pb, .col, .fin, .boca, .contra')) {
        if (cont.scrollWidth > cont.clientWidth + 1) errores.push({ pagina: n, tipo: 'overflow_horizontal', elemento: cont.className, exceso: cont.scrollWidth - cont.clientWidth });
        if (cont.scrollHeight > cont.clientHeight + 1) errores.push({ pagina: n, tipo: 'overflow_vertical', elemento: cont.className, exceso: cont.scrollHeight - cont.clientHeight });
      }
      // Hijos que exceden el contenedor de flujo (columnas desbordadas).
      for (const cont of pg.querySelectorAll('.flow, .cuerpo')) {
        const C = rectDe(cont);
        for (const el of cont.querySelectorAll('p, h2, h3, li, .nd, svg')) {
          const r = rectDe(el);
          if (r.width && r.height && (r.right > C.right + TOL || r.bottom > C.bottom + TOL)) {
            errores.push({ pagina: n, tipo: 'desborde_columna', texto: textoDe(el), exceso_x: Math.round(r.right - C.right), exceso_y: Math.round(r.bottom - C.bottom) });
            break;
          }
        }
      }

      // 4 y 5. Intersecciones entre bloques de texto que no son ancestro/descendiente.
      // En multicolumna un bloque partido en dos columnas devuelve un rectángulo envolvente; se usan los fragmentos.
      const hojas = [...pg.querySelectorAll('p, h1, h2, h3, h4, li, dt, dd, td, th, caption, svg.chart')].filter(el => {
        const r = rectDe(el); return r.width > 0 && r.height > 0 && dentro(r, R);
      });
      const rects = [];
      for (const el of hojas) {
        const frs = [...el.getClientRects()].filter(f => f.width > 0 && f.height > 0);
        for (const f of (frs.length ? frs : [rectDe(el)])) rects.push({ el, r: f });
      }
      for (let a = 0; a < rects.length; a++) {
        for (let b = a + 1; b < rects.length; b++) {
          const A = rects[a], B = rects[b];
          if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
          const area = interseca(A.r, B.r);
          if (area > 4) {
            // Solapamiento mínimo en el eje vertical (línea de separación) se tolera hasta 1 px.
            const solapeY = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
            const solapeX = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left);
            if (solapeY > 1.5 && solapeX > 1.5) {
              errores.push({ pagina: n, tipo: 'interseccion', a: textoDe(A.el), b: textoDe(B.el), area: Math.round(area) });
            }
          }
        }
      }
    });
    return { paginas: paginas.length, errores, avisos };
  });
}

// Densidad sobre PNG: celdas de `celdaPx` dentro del área útil; una celda está ocupada si tiene al menos
// `minOscuros` píxeles con luminancia < 200. Devuelve ocupación y el mayor rectángulo vacío (fracción del área útil).
export function densidad(pngBuffer, { margenPx, celdaPx = 36, minOscuros = 6 }) {
  const png = PNG.sync.read(pngBuffer);
  const { width, height, data } = png;
  const x0 = margenPx, y0 = margenPx, x1 = width - margenPx, y1 = height - margenPx;
  const cols = Math.floor((x1 - x0) / celdaPx), filas = Math.floor((y1 - y0) / celdaPx);
  const grid = Array.from({ length: filas }, () => new Uint8Array(cols));
  let ocupadas = 0;
  for (let fy = 0; fy < filas; fy++) {
    for (let fx = 0; fx < cols; fx++) {
      let oscuros = 0;
      const px0 = x0 + fx * celdaPx, py0 = y0 + fy * celdaPx;
      for (let y = py0; y < py0 + celdaPx && oscuros < minOscuros; y++) {
        let idx = (y * width + px0) * 4;
        for (let x = 0; x < celdaPx; x++, idx += 4) {
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          if (lum < 200) { oscuros++; if (oscuros >= minOscuros) break; }
        }
      }
      if (oscuros >= minOscuros) { grid[fy][fx] = 1; ocupadas++; }
    }
  }
  // Mayor rectángulo vacío (histograma por filas).
  let mejor = 0, mejorRect = null;
  const alturas = new Int32Array(cols);
  for (let fy = 0; fy < filas; fy++) {
    for (let fx = 0; fx < cols; fx++) alturas[fx] = grid[fy][fx] ? 0 : alturas[fx] + 1;
    const pila = [];
    for (let fx = 0; fx <= cols; fx++) {
      const h = fx === cols ? 0 : alturas[fx];
      let inicio = fx;
      while (pila.length && pila[pila.length - 1].h >= h) {
        const top = pila.pop();
        const area = top.h * (fx - top.i);
        if (area > mejor) { mejor = area; mejorRect = { col: top.i, fila: fy - top.h + 1, ancho: fx - top.i, alto: top.h }; }
        inicio = top.i;
      }
      pila.push({ h, i: inicio });
    }
  }
  const total = filas * cols;
  const aMm = c => Math.round(c * celdaPx / (width / 210) ); // aproximado para A4 (sólo informativo)
  return {
    ocupacion: ocupadas / total,
    mayor_rectangulo_vacio: mejor / total,
    mayor_rectangulo_vacio_aprox_mm: mejorRect ? { x: aMm(mejorRect.col), y: aMm(mejorRect.fila), ancho: aMm(mejorRect.ancho), alto: aMm(mejorRect.alto) } : null,
    celdas: { filas, cols, ocupadas },
  };
}
