// Utilidades compartidas: formato es-AR, fechas en hora de Córdoba, escape HTML, carga de archivos.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const TZ = 'America/Argentina/Cordoba';

export function leerJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function escribirJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
}

export function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Permite cursivas con *texto* dentro de párrafos, sin dejar pasar HTML.
export function parrafo(s) {
  return esc(s).replace(/\*([^*]+)\*/g, '<i>$1</i>');
}

const nfCache = new Map();
function nf(min, max) {
  const k = `${min}-${max}`;
  if (!nfCache.has(k)) nfCache.set(k, new Intl.NumberFormat('es-AR', { minimumFractionDigits: min, maximumFractionDigits: max }));
  return nfCache.get(k);
}

export function numero(v, decimales = 0) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return nf(decimales, decimales).format(v);
}

// Precio con decimales según magnitud: 82.725 / 2.530,35 / 0,2716
export function precio(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1000) return nf(0, 0).format(v);
  if (a >= 100) return nf(1, 1).format(v);
  if (a >= 1) return nf(2, 2).format(v);
  if (a >= 0.1) return nf(3, 3).format(v);
  return nf(4, 4).format(v);
}

// Etiqueta corta para ejes: 82,7k / 2.530 / 0,27
export function precioCorto(v) {
  const a = Math.abs(v);
  if (a >= 100000) return nf(0, 0).format(Math.round(v / 1000)) + 'k';
  if (a >= 10000) return nf(1, 1).format(v / 1000) + 'k';
  if (a >= 1000) return nf(0, 0).format(v);
  if (a >= 100) return nf(0, 0).format(v);
  if (a >= 1) return nf(1, 1).format(v);
  return nf(3, 3).format(v);
}

export function porcentaje(v, decimales = 1) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  const s = nf(decimales, decimales).format(Math.abs(v));
  return (v > 0 ? '+' : v < 0 ? '−' : '') + s + '%';
}

export function fechaLarga(iso) {
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00-03:00' : iso);
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }).format(d);
}

export function fechaCorta(iso) {
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00-03:00' : iso);
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: TZ }).format(d).replace('.', '');
}

export function diaSemana(iso) {
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00-03:00' : iso);
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long', timeZone: TZ }).format(d);
}

export function fechaNumerica(iso) {
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00-03:00' : iso);
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ }).format(d);
}

export function horaMin(iso) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ }).format(d);
}

export function fechaHora(iso) {
  return `${fechaNumerica(iso)} ${horaMin(iso)}`;
}

export function capitalizar(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
