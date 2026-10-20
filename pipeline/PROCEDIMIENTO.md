# Procedimiento de armado de una edición

Instrucciones para el modelo que arma la edición (se le pasan tal cual en modo desatendido con `scripts/armar-edicion.ps1`, o se siguen a mano en una sesión de Claude Code abierta en la raíz del repo).

## 0. Contexto obligatorio

Leer antes de empezar: `EL_DIARIO_DE_YRIGOYEN.md` (reglas), `perfil/lector.md`, `config/edicion.json`, `config/fuentes.json`, `historial/DECISIONES.md` (últimas entradas y fe de erratas pendiente) y el registro de la edición anterior en `historial/ediciones/`. Verificar con un calendario qué día de la semana es la fecha de la edición: no asumirlo.

## 1. Preparar la carpeta

```
FECHA=AAAA-MM-DD (hoy)
mkdir ediciones/$FECHA/{datos,investigacion}
```
Número de edición = número de la última entrada de `historial/ediciones/` + 1. Cierre = hora de inicio del armado, en hora de Córdoba.

## 2. Datos estructurados (sin modelo, sólo APIs)

Descargar a `ediciones/$FECHA/datos/` con curl, siguiendo las URL de `config/fuentes.json`:
- `cg_markets.json` (bitcoin,ethereum,binancecoin) y `cg_markets_0g.json` (zero-gravity).
- `cg_chart_<id>_365.json` (days=365) y `cg_chart_<id>_7.json` (days=7) para los cuatro ids, con 4 segundos entre llamadas; si CoinGecko devuelve 429, esperar un minuto y repetir sólo las que faltan.
- `meteo_loscocos.json` con `forecast_days=4&past_days=3` y guardar la hora UTC de consulta en `consultado_meteo_utc.txt`.
- `dolares.json`, `riesgo_pais.json`, `inflacion.json`.
- `espn_standings_arg1.json`, `espn_boca_schedule.json` (sólo para contrastar; la tabla publicada la verifica el investigador deportivo).

## 3. Investigación (cuatro agentes en paralelo)

Lanzar cuatro subagentes con los briefs de `pipeline/prompts/` reemplazando `{FECHA}`, `{DIA_SEMANA}`, `{VENTANA}` (siete días previos) y `{HORA_CIERRE}`. Cada uno escribe su JSON en `ediciones/$FECHA/investigacion/`. Al agente de Boca pasarle lo que diga ESPN sobre último partido y tabla para que lo confirme o corrija. No seguir hasta que los cuatro terminen.

## 4. Redacción

- Escribir `ediciones/$FECHA/datos/comentarios.json` con los comentarios de cada cripto (hechos y variaciones, sin causas no documentadas), el comentario general de finanzas, `clima_alertas` (del investigador de Córdoba) y `filas_extra` si hay tasas u otro dato útil.
- Correr `node pipeline/src/datos.js ediciones/$FECHA $FECHA`.
- Escribir `ediciones/$FECHA/contenido.json` según `esquema/contenido.schema.json`, con `finanzas` y `clima` como `"@datos/finanzas.json"` y `"@datos/clima.json"`. Presupuesto de palabras por página de flujo (3 columnas, A4, 8,5 a 9,25 pt): **1.250 palabras en total por página, incluidos títulos y bajadas**. Guía: nota de apertura 220 a 260 palabras, notas secundarias 120 a 180, breves 40 a 60, bajadas de una oración. Nunca más de siete notas por página. Lo que no entra se descarta siguiendo `orden_recorte`; no se escribe primero largo para recortar después.
- Portada: nota principal de 250 palabras en tres párrafos, seis o siete secundarias con resumen de una línea, cuatro llamadas.
- Boca: completar el objeto `boca` con lo que entregó el investigador; el próximo partido lleva al menos dos fuentes con hora de consulta.
- Disco, microrelato (dominio público o traducción propia), poesía y glosario (3 o 4 términos de las notas publicadas), comprobando contra `historial/ediciones/*.json` que no se repitan autores, discos ni términos.
- Fe de erratas: lo pendiente en `historial/DECISIONES.md`, o la línea estándar.

## 5. Maquetación y preflight

```
cd pipeline
node src/build.js ../ediciones/$FECHA --html   # iterar hasta que no haya desbordes
node src/build.js ../ediciones/$FECHA          # genera PDF, PNG, preflight.json y el registro de la edición
```
Si el acta muestra `desborde_columna` en una página, recortar en esa página (una columna A4 equivale a unas 420 palabras a 8,5 pt). Si muestra densidad baja, agregar una secundaria o un breve ya investigado, nunca relleno.

## 6. Revisión visual

Abrir los ocho PNG de `ediciones/$FECHA/paginas/` y aplicar la rúbrica de la sección 7.6 del documento maestro. Corregir, reconstruir y volver a mirar. Registrar el resultado en `preflight.json` (`pasos.revision_visual`) con estado `aprobada`, hallazgos corregidos y observaciones.

## 7. Impresión y cierre

```
powershell -ExecutionPolicy Bypass -File scripts/imprimir.ps1 -Pdf ediciones/$FECHA/El-Diario-de-Yrigoyen-N<numero>-$FECHA.pdf
```
Si la impresora no responde, dejar el PDF listo y anotarlo en el resumen final. Agregar en `historial/DECISIONES.md` una entrada con fecha: qué se publicó, qué quedó sin verificar y qué se cambió en el procedimiento.
