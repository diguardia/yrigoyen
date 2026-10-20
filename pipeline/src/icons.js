// Mapa de códigos WMO (Open-Meteo weather_code) a iconos monocromos propios en assets/icons.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'icons');
const cache = new Map();

export function iconoPorWmo(codigo) {
  const c = Number(codigo);
  if (c === 0) return { nombre: 'sol', texto: 'Despejado' };
  if (c === 1) return { nombre: 'sol', texto: 'Mayormente despejado' };
  if (c === 2) return { nombre: 'parcial', texto: 'Parcialmente nublado' };
  if (c === 3) return { nombre: 'nublado', texto: 'Nublado' };
  if (c === 45 || c === 48) return { nombre: 'niebla', texto: 'Niebla' };
  if (c >= 51 && c <= 57) return { nombre: 'llovizna', texto: 'Llovizna' };
  if ((c >= 61 && c <= 67) || (c >= 80 && c <= 82)) return { nombre: 'lluvia', texto: c >= 65 || c === 82 ? 'Lluvia fuerte' : 'Lluvia' };
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return { nombre: 'nieve', texto: 'Nieve' };
  if (c >= 95 && c <= 99) return { nombre: 'tormenta', texto: c >= 96 ? 'Tormenta con granizo' : 'Tormenta' };
  return { nombre: 'nublado', texto: 'Variable' };
}

export function svgIcono(nombre, clase = 'wicon') {
  if (!cache.has(nombre)) {
    const p = path.join(DIR, `${nombre}.svg`);
    cache.set(nombre, fs.readFileSync(p, 'utf8').replace('<svg ', `<svg class="${clase}" `));
  }
  return cache.get(nombre);
}
