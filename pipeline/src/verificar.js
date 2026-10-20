// Verificaciones de contenido: esquema, trazabilidad, frescura y anti-repetición contra el historial.
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { RAIZ, leerJson } from './util.js';

export function validarEsquema(contenido) {
  const esquema = leerJson(path.join(RAIZ, 'esquema', 'contenido.schema.json'));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const ok = ajv.validate(esquema, contenido);
  return { ok, errores: ok ? [] : ajv.errors.map(e => ({ ruta: e.instancePath, mensaje: e.message, params: e.params })) };
}

export function verificarContenido(contenido, config) {
  const errores = [];
  const avisos = [];
  const cierre = new Date(contenido.edicion.cierre).getTime();
  const ventanaMs = config.ventana_frescura_horas * 3600 * 1000;
  const notas = [contenido.portada.principal, ...contenido.notas];

  for (const n of notas) {
    if (!n.fuentes || !n.fuentes.some(f => f.url && /^https?:\/\//.test(f.url))) errores.push({ tipo: 'sin_fuente_url', nota: n.id });
    if (n.sensible_al_tiempo) {
      const fresca = (n.fuentes || []).some(f => f.consultado && cierre - new Date(f.consultado).getTime() <= ventanaMs && cierre - new Date(f.consultado).getTime() >= -3600 * 1000);
      if (!fresca) errores.push({ tipo: 'fuente_fuera_de_ventana', nota: n.id });
    }
    if (!n.fecha_acontecimiento) errores.push({ tipo: 'sin_fecha_acontecimiento', nota: n.id });
  }
  const p = contenido.boca.proximo_partido;
  if (!p.verificado_en_dos_fuentes || !p.fuentes || p.fuentes.length < 2) errores.push({ tipo: 'proximo_partido_no_verificado' });
  for (const f of (p.fuentes || [])) {
    if (f.consultado && cierre - new Date(f.consultado).getTime() > ventanaMs) errores.push({ tipo: 'proximo_partido_fuente_vieja', fuente: f.medio });
  }
  const corteFin = new Date(contenido.finanzas.corte).getTime();
  if (cierre - corteFin > 6 * 3600 * 1000) errores.push({ tipo: 'finanzas_corte_viejo', horas: Math.round((cierre - corteFin) / 3600000) });
  const corteClima = new Date(contenido.clima.corte).getTime();
  if (cierre - corteClima > 12 * 3600 * 1000) errores.push({ tipo: 'clima_corte_viejo' });
  if (contenido.glosario.length < config.glosario.min || contenido.glosario.length > config.glosario.max) errores.push({ tipo: 'glosario_fuera_de_rango', cantidad: contenido.glosario.length });

  // Anti-repetición.
  const dir = path.join(RAIZ, 'historial', 'ediciones');
  const previos = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith(contenido.edicion.fecha)).map(f => leerJson(path.join(dir, f))) : [];
  const norm = s => (s || '').toString().trim().toLowerCase();
  for (const e of previos) {
    if (e.microrelato?.autor && norm(e.microrelato.autor) === norm(contenido.microrelato.autor) && !contenido.microrelato.repeticion_autorizada) errores.push({ tipo: 'autor_microrelato_repetido', edicion: e.fecha });
    if (e.poesia?.autor && norm(e.poesia.autor) === norm(contenido.poesia.autor) && !contenido.poesia.repeticion_autorizada) errores.push({ tipo: 'autor_poesia_repetido', edicion: e.fecha });
    if (e.disco?.titulo && norm(e.disco.titulo) === norm(contenido.disco.titulo)) errores.push({ tipo: 'disco_repetido', edicion: e.fecha });
    for (const g of e.glosario || []) if (contenido.glosario.some(x => norm(x.termino) === norm(g))) errores.push({ tipo: 'termino_glosario_repetido', termino: g, edicion: e.fecha });
    for (const t of e.temas || []) if (notas.some(n => norm(n.titulo) === norm(t.titulo))) avisos.push({ tipo: 'titulo_repetido', titulo: t.titulo, edicion: e.fecha });
  }
  return { ok: errores.length === 0, errores, avisos };
}

export function registroEdicion(contenido, preflight) {
  return {
    numero: contenido.edicion.numero,
    fecha: contenido.edicion.fecha,
    cierre: contenido.edicion.cierre,
    paginas: preflight.paginas,
    temas: [contenido.portada.principal, ...contenido.notas].map(n => ({ seccion: n.seccion, titulo: n.titulo })),
    microrelato: { autor: contenido.microrelato.autor, obra: contenido.microrelato.obra, titulo: contenido.microrelato.titulo },
    poesia: { autor: contenido.poesia.autor, obra: contenido.poesia.obra, titulo: contenido.poesia.titulo },
    disco: { artista: contenido.disco.artista, titulo: contenido.disco.titulo },
    glosario: contenido.glosario.map(g => g.termino),
    fuentes_datos: ['Open-Meteo', contenido.finanzas.fuente_cripto || 'CoinGecko', 'DolarApi', 'ArgentinaDatos', 'ESPN'],
    preflight: { ok: preflight.ok, generado: preflight.generado },
  };
}
