# El Diario de Yrigoyen

Documento maestro editorial y técnico para producir un diario personal de fin de semana generado con asistencia de IA.

Este documento contiene las reglas. Los datos que cambian viven aparte:

| Qué | Dónde |
|---|---|
| Perfil del lector | [perfil/lector.md](perfil/lector.md) |
| Parámetros de edición (cierre, papel, páginas, prioridades, mapa de páginas, activos, coordenadas) | [config/edicion.json](config/edicion.json) |
| Fuentes de datos (APIs) y medios aceptados | [config/fuentes.json](config/fuentes.json) |
| Esquema formal del contenido estructurado | [esquema/contenido.schema.json](esquema/contenido.schema.json) |
| Historial de decisiones y fe de erratas | [historial/DECISIONES.md](historial/DECISIONES.md) |
| Registro por edición (anti-repetición) | `historial/ediciones/AAAA-MM-DD.json` |
| Pipeline de maquetación, preflight y PDF | [pipeline/](pipeline/README.md) |
| Ediciones producidas (JSON, HTML, PDF, PNG, acta de preflight) | `ediciones/AAAA-MM-DD/` |

## 1. Identidad

- Nombre: **El Diario de Yrigoyen**.
- Lector principal: ver [perfil/lector.md](perfil/lector.md). El perfil está separado de las reglas para que estas sean reutilizables como skill y el perfil se edite sin tocarlas.
- Periodicidad: fines de semana. Numeración correlativa desde la edición piloto (Nº 1, 19 de septiembre de 2026). Cada edición se identifica además por su fecha ISO.
- Objetivo: una edición cerrada, seleccionada y agradable de leer en papel. No replicar el flujo infinito de un portal.
- Formato: parametrizado en `config/edicion.json`. Hoy A4, blanco y negro, simple faz, en una HP Laser 107w (A4 mono). El salto a A3 o Legal implica otra impresora; la plantilla debe tomar el papel como variable y derivar columnas y cuerpo tipográfico de él.
- Extensión: entre el mínimo y el máximo de páginas de la configuración (hoy 6 a 8). La densidad manda: si el material bueno alcanza para seis, son seis.
- Uso: estrictamente personal. Se imprime, se lee y se descarta. No se distribuye ni se publica. Por eso el copyright no es una restricción editorial; ver 5.7 para la regla práctica.

## 2. Cierre y zona horaria

- Zona horaria de todo el diario: America/Argentina/Cordoba (UTC-3), sin horario de verano. Las horas se escriben como "hora argentina" la primera vez que aparecen en una sección.
- Cierre por defecto: sábado 08:00. Si la edición se arma otro día, el cierre es la hora de inicio del armado y se registra en el JSON de contenido (`edicion.cierre`).
- Todo lo retrospectivo (cotizaciones, gráficos, tablas, clima, próximo partido) se corta a la hora de cierre y lleva sello "al cierre, HH:MM".
- Una fuente consultada fuera de la ventana de frescura (ver `config/edicion.json`, `ventana_frescura_horas`) invalida el dato: el preflight falla.

## 3. Principios editoriales

1. Priorizar selección, jerarquía y contexto sobre cantidad.
2. No rellenar espacio con contenido débil, genérico, condescendiente o evidente.
3. No inventar datos, agenda, precios, horarios, resultados ni fuentes.
4. Distinguir hechos, análisis y opinión. Cada nota declara su tipo en el JSON.
5. Incluir fechas y horas concretas cuando correspondan.
6. Adaptar la profundidad al lector: las notas técnicas asumen experiencia profesional.
7. Evitar consejos triviales ("tomar mate", "salir a caminar") y listas domésticas sin valor informativo.
8. Si una sección no tiene material bueno esa semana, se reemplaza por otra mejor o se reducen páginas, siguiendo el orden de recorte de la sección 6.
9. Español rioplatense natural, claro y sobrio. Ver la guía de estilo (sección 12).
10. Cada afirmación temporalmente sensible se verifica durante el cierre.
11. Las notas informativas responden con precisión qué ocurrió, quién intervino, cuándo y qué dato o documento lo demuestra. Nada que pueda publicarse cualquier semana.
12. Toda nota basada en una novedad muestra la fecha del acontecimiento y, cuando difiera, la fecha de publicación de la fuente.
13. Si un dato no se consiguió al cierre, se publica el componente "dato no disponible" (7.3) con la hora del intento. Nunca se omite en silencio ni se completa por inferencia.
14. No se repiten temas, autores, discos ni términos de glosario de ediciones anteriores salvo decisión explícita. El registro por edición lo controla (sección 9).

## 4. Portada

La portada debe estar prácticamente completa, sin grandes huecos blancos, y contener:

- Nombre del diario, número, fecha completa y lugar.
- Noticia principal con bajada.
- Entre cuatro y siete noticias secundarias concretas.
- Resumen visual del clima del fin de semana (hoy y mañana con icono, máxima y mínima).
- Cotizaciones principales: dólar oficial y MEP o CCL, riesgo país, BTC, con fecha y hora. Ver `config/fuentes.json`.
- **Disco de la semana**, visible en primera página: artista, título, año, género y justificación breve. Es la misma pieza que se desarrolla en Cultura (5.6); la portada lleva el resumen, el interior el comentario.
- Llamadas hacia educación/UPC, tecnología, Boca y literatura cuando esos contenidos estén presentes.

Eliminar de la portada:

- La sección "Antes de empezar".
- Textos metaperiodísticos que expliquen qué es el diario.
- Índices grandes que consuman espacio sin agregar valor. Alcanza con una línea de sumario al pie.

## 5. Secciones editoriales

### 5.1 Actualidad

- Noticias centrales de Argentina.
- Economía con contexto y consecuencias prácticas, sin simplificaciones engañosas. Dato económico destacado de la semana con fuente primaria (INDEC, BCRA, Ministerio de Economía).
- Mundo sólo cuando haya acontecimientos relevantes.
- Córdoba, Punilla y Los Cocos con fuentes verificables de la lista de medios aceptados. Si no hay nada verificable sobre Los Cocos esa semana, no se fuerza.
- Buena noticia cuando exista una realmente valiosa; no fabricar optimismo.

### 5.2 Tecnología, programación e IA

- Nivel técnico alto: arquitectura, modelos, benchmarks, seguridad, infraestructura, agentes, herramientas de desarrollo y consecuencias para equipos reales.
- Sin explicaciones introductorias para un lector experto.
- Cada nota abre con el hecho verificable, su fecha y sus protagonistas. Después, el análisis técnico.
- Al describir un incidente, benchmark o anuncio: versiones, entorno, alcance, magnitudes y limitaciones. Si esos datos no están publicados, decirlo expresamente.
- Relacionar, cuando sea pertinente, con SaaS, ERP, .NET, Azure, bases de datos, automatización, comercio electrónico o gestión de equipos.
- Separar anuncios comerciales de mejoras técnicas comprobables.

### 5.3 Educación y UPC

- Noticias relevantes sobre educación superior, universidades, docencia, currículum, IA educativa y formación en programación.
- Novedades oficiales de la Universidad Provincial de Córdoba, sólo con fuente oficial o institucional confiable (sitio UPC, Boletín Oficial de Córdoba, redes institucionales).
- Mirada del lector como profesor, coordinador de carrera y coordinador transversal.
- Evitar consejos pedagógicos genéricos; priorizar evidencia, experiencias comparables y decisiones aplicables. Se valora la información concreta de programas (ejemplo: PILA 2027).

### 5.4 Finanzas y criptomonedas

Activos seguidos (identificadores fijados en `config/edicion.json`; se verificaron una vez y no se reverifican cada semana):

- Bitcoin (BTC), Ethereum (ETH), BNB y 0G (proyecto de infraestructura descentralizada para IA: blockchain más disponibilidad y gestión de datos; id CoinGecko `zero-gravity`, símbolo 0G). No confundir con tokens de símbolo parecido (W0G, ST0G, A0G).

Para cada activo, cuando existan datos confiables:

- Precio al cierre en dólares.
- Variación de 24 horas, 7 días, 30 días y 12 meses.
- Tres gráficos de líneas: últimos 7 días, últimos 30 días, últimos 12 meses.
- Máximo y mínimo de cada período.
- Comentario factual sobre los movimientos principales, con hechos fechados que los expliquen cuando existan.

Todos los rendimientos y gráficos son **retrospectivos**. El título o la leyenda dice "últimos 7 días", "últimos 30 días" o "últimos 12 meses". Los gráficos son SVG inline generados desde los datos, con fechas en el eje horizontal, precio en el vertical, moneda explícita, misma convención visual, fuente y hora de corte. No se sustituyen por barras de porcentajes. No es recomendación de inversión y se dice en una línea al pie.

Además, dólar (oficial, MEP, CCL, blue), riesgo país e inflación mensual más reciente, con fecha de cada dato.

### 5.5 Boca Juniors

Datos actuales y concretos:

- Último resultado con goles, autores y una crónica de dos a cuatro oraciones.
- Próximo partido: día, fecha, hora argentina, rival, sede, competición, árbitro y TV si están designados. Es el dato prioritario: se verifica al cierre en más de una fuente. Si Boca juega hoy o mañana, va destacado en portada y en la sección.
- Tabla completa de posiciones de la zona del torneo local que corresponda. Tabla real y legible: posición, equipo, PJ, G, E, P, GF, GC, DIF, Pts. Nunca prosa ni recorte confuso. Una línea explica el formato del torneo y qué puestos están en juego para Boca.
- Tabla anual acumulada (posición de Boca y puestos de clasificación continental) cuando esté disponible.
- Llave actualizada de Copa Argentina, o la constancia de la eliminación (fecha, rival, resultado).
- Competición continental: llave y estado de la serie si Boca la disputa. Si no la disputa, una línea lo dice expresamente ("Boca no disputa competición continental en 2026"), nunca un componente vacío.
- Posible formación titular, diferenciando confirmados de probables. Entrenador.
- Lesionados, suspendidos, en recuperación y posibles regresos, con fecha de actualización.
- Mercado de pases en tres listas separadas: oficiales, negociaciones confirmadas, rumores. Fuera de ventana de transferencias: renovaciones, salidas previstas, situación contractual.
- Fuentes y hora de actualización al pie.

### 5.6 Ciencia y cultura

- Una o dos noticias científicas explicadas con método, evidencia, límites y relevancia, con revista o institución y enlace al trabajo.
- Disco de la semana (desarrollo del que figura en portada): por qué ese disco esa semana, qué escuchar, contexto.
- Recomendación cultural sólo con fundamento concreto.
- Historia o aniversario sólo si permite una nota interesante, no una lista de efemérides.

### 5.7 Microrelato y poesía

- Un microrelato de **autor humano**, con autor, obra, año y, si es traducción, traductor. No se genera con IA ni se presenta como "original para esta edición".
- Una poesía breve de autor humano, con la misma atribución. Preferir poemas completos; si es fragmento, decirlo.
- Alternar autores, países, épocas y tradiciones. El registro por edición impide repetir autores.
- Regla práctica de reproducción: el diario es de uso personal y no se distribuye, así que el copyright no restringe la selección. El generador, sin embargo, reproduce textos completos sólo cuando están en dominio público (en Argentina, Ley 11.723: 70 años desde el 1 de enero siguiente a la muerte del autor; para 2026, autores fallecidos hasta 1955) o cuando la traducción es propia de una obra en dominio público. Para obras con derechos vigentes reproduce un fragmento breve con cita bibliográfica completa, para que el lector pueda ir a la obra. "El dinosaurio" de Monterroso (fallecido en 2003) es la referencia de economía narrativa, no una pieza reproducible completa.
- La pieza debe funcionar como literatura, no como moraleja ni contenido motivacional.

### 5.8 Humor

- No generar una tira mediocre para ocupar espacio.
- El generador no puede reproducir imágenes de humoristas que no tenga a mano. Si el lector guarda una viñeta en `assets/humor/` con autor y referencia, se incluye con atribución. Si no, la sección se omite.
- No imitar personajes ni estilos identificables de Quino, Caloi u otros autores.

### 5.9 Clima

- Pronóstico específico para Los Cocos (coordenadas en `config/edicion.json`), fuente Open-Meteo con código WMO.
- Hoy y los tres días siguientes: fecha, máxima, mínima, precipitación acumulada y probabilidad, viento máximo y ráfagas cuando sean relevantes.
- Iconos meteorológicos monocromos vectoriales del set propio en `pipeline/assets/icons/` (sol, parcialmente nublado, nublado, niebla, lluvia, tormenta, viento, nieve), elegidos por código WMO. Nunca emojis.
- Señalar cambios bruscos de temperatura respecto de los tres días anteriores (umbral en configuración) y alertas oficiales del SMN cuando existan.

### 5.10 Glosario técnico

- Tres o cuatro entradas por edición, vinculadas a notas publicadas en cualquier sección (tecnología, finanzas, ciencia).
- Cada entrada: término, definición precisa en una o dos frases y, cuando ayude, un ejemplo concreto.
- Nada elemental para un lector experto. Ejemplos del nivel esperado: FDV, egress proxy, idempotencia, data availability, capability security, speculative decoding.
- El registro por edición impide repetir términos.

### 5.11 Fe de erratas

- Sección fija y breve en contratapa. Corrige errores de contenido de la edición anterior señalados por el lector o detectados al cierre.
- Si no hubo errores, una línea: "Sin correcciones a la edición anterior".
- Cada corrección va también al historial (sección 9).

## 6. Contenidos eliminados y orden de recorte

No incluir salvo decisión editorial explícita: "Antes de empezar"; "Cuatro planes sin manejar demasiado"; "Tres preguntas para conversar en casa"; humor original de baja calidad; foto de la semana; listas de efemérides; otros deportes salvo acontecimiento excepcional; consejos o frases de relleno; repeticiones de una misma idea con títulos diferentes.

Cuando falta espacio o falta material, se recorta en este orden (primero lo que se recorta antes). La lista vive en `config/edicion.json` (`orden_recorte`) para que el pipeline la use:

1. Humor.
2. Segunda noticia científica.
3. Mundo.
4. Recomendación cultural adicional.
5. Breves de menor importancia.
6. Educación general (no UPC).
7. Segunda y tercera nota de Córdoba.
8. Notas de tecnología de menor importancia (se conservan al menos dos).

Nunca se recortan: portada, noticia principal, Boca (próximo partido y tabla), clima, finanzas (precios y gráficos), disco, microrelato, poesía, glosario, fe de erratas.

## 7. Sistema de maquetación

### 7.1 Regla fundamental

**Es inadmisible entregar un PDF con texto superpuesto, cortado, fuera de página o ilegible. El control es automático y no depende de que el lector vuelva a señalarlo.**

### 7.2 Arquitectura

Decisión: **Playwright con Chromium**. El preflight geométrico necesita el DOM renderizado (rectángulos, intersecciones, overflow) y los gráficos se generan como SVG; WeasyPrint no da acceso al DOM y soporta mal las columnas CSS. Queda descartado.

1. Contenido estructurado en JSON, validado contra `esquema/contenido.schema.json`.
2. Plantilla HTML/CSS con componentes periodísticos reutilizables (`pipeline/src/render.js`, `pipeline/templates/`).
3. Páginas de tamaño fijo (según `papel`) con retícula CSS Grid; dentro de cada región, flujo normal y columnas CSS. Separación silábica `hyphens: auto` con `lang="es"`, `orphans` y `widows` en 2, `break-inside: avoid` en títulos, tablas, gráficos y recuadros.
4. Mapa de páginas por defecto (`config/edicion.json`, `mapa_paginas`), que fija qué secciones van en cada página y hace determinista el reflujo. Una nota puede forzar su página con `pagina`; las que llevan `pagina: 8` se maquetan en la columna izquierda de la contratapa, debajo de la literatura, cuando sobra espacio ahí:
   1. Portada.
   2. Actualidad nacional y economía.
   3. Córdoba, Punilla, mundo y buena noticia.
   4. Tecnología, programación e IA.
   5. Educación y UPC. Ciencia.
   6. Finanzas y criptomonedas. Glosario.
   7. Boca Juniors.
   8. Contratapa: disco, microrelato, poesía, clima, fe de erratas, fuentes.
5. Ajuste automático: si una región desborda, el pipeline reduce el cuerpo en pasos de 0,25 pt hasta el mínimo configurado; si sigue desbordando, mueve el último elemento recortable al banco de sobrantes y repite. Si queda aire, incorpora un breve ya seleccionado o sube el cuerpo hasta el máximo.
6. PDF sólo después de superar el preflight. Chromium incrusta las fuentes usadas.

### 7.3 Componentes

Portada; artículo principal; artículo de una, dos o tres columnas; breve; tabla deportiva; llave de competición; gráfico financiero (SVG); pronóstico con icono; disco de la semana; microrelato; poesía; glosario; fe de erratas; **dato no disponible** (recuadro estándar: qué dato falta, qué fuente se intentó y a qué hora); fuente y sello de actualización.

Cada componente declara en la plantilla si admite división entre columnas o páginas (`data-divisible`) y su prioridad de recorte (`data-recorte`).

### 7.4 Preflight automático obligatorio

Antes de aceptar el PDF (`pipeline/src/preflight.js`):

1. Esperar carga completa de fuentes (`document.fonts.ready`), gráficos e iconos.
2. Detectar cualquier elemento que exceda horizontalmente su contenedor.
3. Detectar elementos fuera de los límites imprimibles de su página.
4. Comparar rectángulos de bloques de texto para detectar intersecciones no previstas.
5. Verificar que ningún título invada el artículo anterior o posterior.
6. Verificar que no haya texto oculto por `overflow` (`scrollHeight > clientHeight`).
7. Comprobar que todas las páginas tengan encabezado, número y pie correctos.
8. Renderizar cada página a PNG y medir densidad (7.5).
9. Verificar frescura y trazabilidad: toda nota con `sensible_al_tiempo: true` tiene al menos una fuente con `consultado` dentro de la ventana de frescura; toda nota tiene al menos una fuente con URL; el próximo partido de Boca tiene `verificado_en_dos_fuentes: true`.
10. Verificar anti-repetición contra `historial/ediciones/*.json` (autores, discos, términos).
11. Extraer texto del PDF como control adicional, nunca como sustituto de la revisión visual.
12. Revisión visual de los PNG por el modelo generador con la rúbrica de 7.6. Los PNG se guardan en la carpeta de la edición como evidencia.
13. Escribir `preflight.json` (acta de cierre) y fallar la generación si cualquier comprobación da error.

### 7.5 Control de densidad

- Objetivo de ocupación: 80% a 92% del área útil de cada página, salvo decisión visual explícita. La página de finanzas admite 74% porque los gráficos de líneas tienen aire por diseño (`densidad.ocupacion_min_por_pagina` en la configuración).
- Medición sobre el PNG renderizado, no sobre el DOM: el área útil se divide en celdas de unos 5 mm; una celda cuenta como ocupada si contiene tinta. La ocupación es la fracción de celdas ocupadas y el hueco es el mayor rectángulo de celdas vacías. Falla si la ocupación es menor que el mínimo o si el hueco supera el umbral configurado (hoy 18% del área útil).
- Presupuesto de redacción: una página de flujo en tres columnas admite unas 1.250 palabras en total, títulos y bajadas incluidos (una columna equivale a unas 420 palabras a 8,5 pt). Se escribe a ese presupuesto desde el principio; recortar después cuesta más que escribir corto.
- Correcciones en orden: refluir entre páginas, incorporar un breve ya seleccionado, subir cuerpo o interlineado dentro del rango, reducir páginas.
- Nunca rellenar con contenido irrelevante.

### 7.6 Tipografía, legibilidad y rúbrica visual

- Cuerpo impreso: 8,5 a 10 pt según cantidad de columnas (rango en configuración). Interlineado mínimo 120%.
- Columnas de 45 a 75 caracteres por línea.
- Contraste alto. Los grises deben seguir siendo legibles en láser monocromática (mínimo 25% de negro para texto; tramas más claras sólo como fondo).
- Fuentes: serif del sistema para cuerpo y títulos (Georgia, Cambria o Times New Roman) y sans para tablas y datos (Segoe UI o Calibri). Chromium las incrusta en el PDF.
- Rúbrica de revisión visual de cada PNG: sin superposiciones; sin texto cortado; títulos pegados a su texto; tablas con columnas alineadas; gráficos con ejes y fechas legibles; iconos visibles; sin huecos blancos no intencionales; pie y número de página presentes.

## 8. Datos y fuentes

- Cada pieza guarda: URL, medio, autor si existe, fecha de publicación, fecha del acontecimiento y hora de consulta.
- Fuentes primarias primero: organismos oficiales, clubes, competiciones, universidades, documentación técnica, publicaciones científicas.
- Datos estructurados siempre desde API o fuente estable definida en `config/fuentes.json` (clima, cripto, dólar, riesgo país, inflación, tablas y fixture). Nunca de memoria del modelo.
- Noticias sólo de los medios aceptados en `config/fuentes.json`, o de fuentes primarias. Se contrastan en dos fuentes las sensibles o confusas.
- No usar un resultado de búsqueda como única evidencia cuando puede abrirse la fuente.
- Cotizaciones, tablas y horarios se actualizan al cierre.
- Lo no disponible o incierto se señala con el componente "dato no disponible".

## 9. Memoria entre ediciones y feedback

- Al cerrar cada edición se escribe `historial/ediciones/AAAA-MM-DD.json` con: número, fecha, cierre, páginas, temas publicados (títulos y sección), autores de microrelato y poesía, disco, términos de glosario, fuentes de datos usadas y resultado del preflight.
- El preflight lee todos los registros anteriores y falla si se repite un autor, disco o término, salvo que la nota lleve `repeticion_autorizada: true`.
- Los comentarios del lector posteriores a la lectura se registran en `historial/DECISIONES.md` con fecha, y los errores de contenido alimentan la fe de erratas de la edición siguiente.

## 10. Flujo semanal

1. Fijar fecha y hora de cierre (por defecto, la de `config/edicion.json`).
2. Leer este documento, el perfil, la configuración y los registros de ediciones anteriores.
3. Obtener datos estructurados desde las APIs (clima, cripto, dólar, riesgo país, inflación, tablas y fixture).
4. Investigar noticias por sección, en paralelo, con fuentes abiertas y fechas.
5. Seleccionar material según importancia y afinidad; aplicar el orden de recorte si sobra.
6. Elegir disco, microrelato, poesía y glosario; comprobar anti-repetición.
7. Escribir el JSON de contenido y validarlo contra el esquema.
8. Verificación final específica de Boca: próximo partido en dos fuentes, formación, bajas, mercado.
9. Maquetar (`pipeline/src/build.js`).
10. Preflight completo; corregir y repetir hasta que el acta esté en verde.
11. Revisión visual de los PNG con la rúbrica.
12. Generar PDF final en `ediciones/AAAA-MM-DD/`.
13. Imprimir con `scripts/imprimir.ps1` (ejecuta antes `ensure-hp107w-wifi.ps1`) o dejar el PDF listo.
14. Escribir el registro de la edición y anotar comentarios posteriores en el historial.

## 10 bis. Automatización semanal

- `pipeline/PROCEDIMIENTO.md` describe el armado completo paso a paso y `pipeline/prompts/` contiene los briefs de los cuatro investigadores (actualidad, Córdoba y educación, tecnología y ciencia, Boca).
- `scripts/armar-edicion.ps1` ejecuta ese procedimiento con Claude Code en modo desatendido (`claude -p --dangerously-skip-permissions`, limitado a este repositorio) y luego imprime con `scripts/imprimir.ps1`.
- La tarea programada de Windows "El Diario de Yrigoyen" lo lanza los sábados a las 06:00 (despierta la máquina si está suspendida; requiere sesión iniciada y red) para que el diario esté impreso a las 08:00. El registro de cada corrida queda en `ediciones/AAAA-MM-DD/armado.log` y el resumen en `RESUMEN.md`.
- Si la impresora no responde, el PDF queda listo en la carpeta de la edición y se imprime a mano con `scripts/imprimir.ps1`.

## 11. Criterio de edición terminada

Una edición está terminada sólo si `ediciones/AAAA-MM-DD/preflight.json` dice `ok: true`, lo que implica:

- JSON válido contra el esquema.
- Páginas dentro del rango configurado.
- Cero errores de geometría (overflow, intersecciones, fuera de página).
- Densidad dentro del rango en todas las páginas, o excepción declarada.
- Encabezado, número y pie en todas las páginas.
- Todas las notas con fuente; las sensibles al tiempo dentro de la ventana de frescura.
- Próximo partido de Boca verificado en dos fuentes.
- Sin repeticiones respecto del historial.
- Revisión visual registrada con resultado "aprobada".
- PDF generado y PNG de cada página guardados.

## 12. Guía de estilo

- Fechas: "domingo 12 de octubre de 2026"; en tablas, "12/10/2026" o "12 oct".
- Horas: formato 24 horas, "19:30"; "hora argentina" la primera vez por sección.
- Números: coma decimal y punto de miles ("82.725", "7,8%"). Porcentajes sin espacio.
- Monedas: "US$ 82.725" para dólares; "$ 1.535" para pesos, aclarando ARS en encabezados de tabla. Cripto siempre en dólares.
- Variaciones con signo explícito: "+7,8%", "−3,2%" (signo menos tipográfico).
- Titulares en minúscula inicial (sólo la primera palabra y nombres propios), sin punto final. Bajadas de una oración.
- Comillas dobles rectas para citas. Cursiva para títulos de obras, discos y publicaciones.
- Siglas: se desarrollan la primera vez por sección, salvo las de uso universal (IA, PDF, API, BTC).
- Fuente al pie de cada nota en cuerpo menor: "Fuente: Medio, fecha de publicación".
- Voz: español rioplatense, tratamiento de vos sólo si el texto se dirige al lector; sobrio, sin exclamaciones.
- No usar emojis en ningún lugar del diario.

## 13. Pendientes para convertirlo en skill

- Estabilizar la estructura después de al menos dos ediciones adicionales.
- Mover la selección de fuentes y la investigación por sección a prompts reutilizables dentro de la skill.
- Pruebas visuales de regresión sobre los PNG (comparación con la edición anterior por componente).
- Empaquetar instrucciones, referencias y scripts como skill `el-diario-de-yrigoyen`, con el perfil del lector como archivo externo.
