# Pipeline de El Diario de Yrigoyen

Node 24 + Playwright (Chromium de Microsoft Edge instalado) + Ajv + pngjs. Instalación: `npm install` en esta carpeta.

| Comando | Qué hace |
|---|---|
| `node src/datos.js ../ediciones/AAAA-MM-DD AAAA-MM-DD` | Arma `datos/finanzas.json` y `datos/clima.json` desde las respuestas crudas de las APIs y `datos/comentarios.json`. |
| `node src/build.js ../ediciones/AAAA-MM-DD --html` | Valida el esquema, verifica trazabilidad y anti-repetición, renderiza, ajusta cuerpos tipográficos por página, corre el preflight y escribe HTML, PNG y `preflight.json`. No genera PDF: sirve para iterar. |
| `node src/build.js ../ediciones/AAAA-MM-DD` | Lo mismo y, si todo está en verde, genera el PDF y el registro en `historial/ediciones/`. |

Archivos:

- `src/render.js`: JSON → HTML paginado (portada, páginas de flujo en tres columnas, finanzas, Boca, contratapa). Las notas con `pagina: 8` se renderizan en la columna izquierda de la contratapa.
- `src/charts.js`: gráficos de líneas SVG monocromos.
- `src/icons.js` y `assets/icons/`: iconos meteorológicos propios por código WMO.
- `src/preflight.js`: geometría (fragmentos de columna, intersecciones, desbordes, encabezados y pies) y densidad sobre PNG en celdas de 36 px (≈4,8 mm).
- `src/verificar.js`: esquema JSON (draft 2020), fuentes, ventana de frescura, próximo partido verificado, anti-repetición.
- `templates/diario.css`: hoja de estilos de impresión; el papel y los márgenes llegan como variables desde `config/edicion.json`.
- `PROCEDIMIENTO.md` y `prompts/`: instrucciones para armar una edición completa y los briefs de los cuatro investigadores.

Convenciones del contenido: ver `esquema/contenido.schema.json`. `finanzas` y `clima` pueden ser `"@datos/archivo.json"` y se resuelven desde la carpeta de la edición. Una nota de `seccion: "breve"` usa `seccion_destino` para elegir la página; `pagina` fuerza la página de cualquier nota.
