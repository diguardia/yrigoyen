# Historial de decisiones

Registro cronológico de decisiones editoriales y técnicas, comentarios del lector y fe de erratas. Cada entrada lleva fecha. Los errores de contenido se repiten en la sección "Fe de erratas" de la edición siguiente.

## Edición piloto (Nº 1) — 19 de septiembre de 2026

- El nombre inicial se reemplaza por **El Diario de Yrigoyen**.
- Se detectaron grandes huecos blancos: se exige control de densidad y reducción de páginas cuando corresponda.
- Se detectó superposición entre "Inflación: menos velocidad no significa precios bajos" y "Breves económicas". Se prohíbe depender de coordenadas manuales para textos variables y se incorpora preflight geométrico obligatorio.
- El disco recomendado pasa a la portada.
- Se elimina "Antes de empezar".
- Se eliminan "Cuatro planes sin manejar demasiado" y "Tres preguntas para conversar en casa".
- Se eleva el nivel técnico de tecnología y programación.
- Se agrega educación, educación superior y noticias específicas de la UPC.
- Se agregan gráficos de semana, mes y año para BTC, ETH, BNB y 0G.
- Se define 0G como proyecto a investigar específicamente en la intersección IA + blockchain.
- La sección Boca debe incluir tabla, llaves, fechas y horarios actuales.
- El humor se omite si no hay una obra adecuada de un humorista que pueda reproducirse.
- En la primera versión se incorporó un microrelato generado especialmente para la edición; esa decisión queda reemplazada por el ajuste posterior que exige autoría humana.
- El pronóstico incorpora iconos meteorológicos vectoriales.

## Ajustes posteriores a la edición piloto — 19 de septiembre de 2026

- Las notas tecnológicas deben abandonar la generalidad: incluir hecho, fecha, protagonistas, alcance, versiones y datos verificables.
- Se valora especialmente la información concreta de programas universitarios como PILA 2027.
- Los rendimientos financieros se identifican inequívocamente como históricos, no predictivos.
- Los gráficos cripto pasan a ser series de líneas con ejes, fechas, precios y tres horizontes: 7 días, 30 días y 12 meses.
- Cada edición incorpora tres o cuatro entradas de glosario técnico.
- El próximo partido de Boca se verifica nuevamente al cierre; si se juega al día siguiente, debe destacarse.
- La tabla local debe ser completa, tabular y legible. Se agregan posibles titulares, lesionados, regresos y mercado de pases, diferenciando hechos de rumores.
- El microrelato deja de ser generado: debe pertenecer a un autor humano y estar correctamente atribuido.
- Se incorpora una poesía breve de autor humano, con atribución.

## Revisión del documento maestro — 12 de octubre de 2026

Decisiones tomadas al aplicar la revisión general previa a la edición Nº 2:

- El documento maestro se divide: reglas en `EL_DIARIO_DE_YRIGOYEN.md`; perfil del lector en `perfil/lector.md`; parámetros en `config/edicion.json`; APIs y medios aceptados en `config/fuentes.json`; esquema del contenido en `esquema/contenido.schema.json`; historial aquí.
- Motor de render: Playwright con Chromium. WeasyPrint queda descartado por no exponer el DOM para el preflight ni soportar bien columnas CSS.
- Cierre por defecto: sábado 08:00 hora de Córdoba. Si la edición se arma otro día, el cierre es la hora de inicio del armado.
- Se fija un mapa de páginas por defecto (8 páginas) y un orden de recorte de secciones. Portada, Boca, clima, finanzas, disco, microrelato, poesía, glosario y fe de erratas nunca se recortan.
- El glosario pasa a ser sección propia (5.10) y se alimenta de todas las notas, no sólo de finanzas.
- El disco de la semana es una sola pieza: resumen en portada, desarrollo en Cultura.
- Si Boca no disputa competición continental, se dice en una línea; no se deja un componente vacío.
- Copyright: el lector aclaró que el diario es de uso estrictamente personal, se imprime, se lee y se descarta, y no se distribuye. Deja de ser una restricción editorial. Regla práctica: el generador reproduce textos completos cuando están en dominio público (Ley 11.723, 70 años) o en traducción propia de obra en dominio público; para obras con derechos vigentes reproduce un fragmento con cita completa. "El dinosaurio" de Monterroso queda como referencia de estilo, no como pieza reproducible completa.
- Humor: el generador no dispone de las imágenes de humoristas. Se incluye sólo si el lector guarda una viñeta en `assets/humor/`; si no, se omite.
- Fuentes de datos estructurados fijadas: Open-Meteo (clima, códigos WMO), CoinGecko (cripto; id de 0G verificado: `zero-gravity`), DolarApi (dólar), ArgentinaDatos (riesgo país e inflación), ESPN (tablas y fixture, contrastado con Promiedos o la Liga). Lista de medios aceptados por sección.
- Trazabilidad exigible: cada nota lleva fuentes con URL y hora de consulta; el preflight falla si una nota sensible al tiempo no tiene fuente dentro de la ventana de frescura (36 horas) o si el próximo partido de Boca no está verificado en dos fuentes.
- Memoria entre ediciones: registro JSON por edición con temas, autores, disco y términos; el preflight bloquea repeticiones.
- Componente estándar "dato no disponible" con fuente intentada y hora.
- Sección fija "Fe de erratas" en contratapa.
- Guía de estilo mínima (sección 12 del documento maestro).
- Criterio de edición terminada: `preflight.json` con `ok: true`.
- Densidad medida sobre el PNG (píxeles no blancos y mayor rectángulo vacío), no sobre el DOM.
- Revisión visual: la hace el modelo generador sobre los PNG con una rúbrica fija; los PNG quedan como evidencia.
- Papel parametrizado (A4 hoy; A3 y Legal definidos). La HP Laser 107w es A4 mono, así que el salto a A3 implica otra impresora.
- CSS: `hyphens: auto` con `lang="es"`, viudas y huérfanas en 2, gráficos SVG inline, iconos meteorológicos propios en `pipeline/assets/icons/`.
- Impresión integrada: `scripts/imprimir.ps1` ejecuta primero `ensure-hp107w-wifi.ps1`.

## Edición Nº 2 — lunes 12 de octubre de 2026 (feriado)

- Primera edición producida con el pipeline: 8 páginas A4, preflight en verde, revisión visual aprobada. Cierre 10:30; PDF `ediciones/2026-10-12/El-Diario-de-Yrigoyen-N2-2026-10-12.pdf`.
- Portada: la Corte Suprema y la Ley de Tierras. Boca-Vasco (semifinal de Sudamericana) destacado como partido de mañana.
- Disco: Bill Evans Trio, *Sunday at the Village Vanguard*. Microrelato: Kafka, *Los árboles* (traducción propia). Poesía: Storni, *Cuadrados y ángulos*. Glosario: fail-closed, enclave con atestación, FDV, parámetros activos en MoE.
- Quedó sin verificar en dos fuentes: el ataque en Riad (se descartó por falta de espacio y fuente única); el reparto exacto de cupos continentales 2027 (tomado de medios); las convocatorias y agenda de la UPC (sólo fuente institucional).
- La impresora HP Laser 107w no apareció en la red Wi-Fi ni por USB al cierre (su MAC no respondió en ninguna IP de la subred); el PDF quedó listo para `scripts/imprimir.ps1`.
- Se registró la tarea programada de Windows para los sábados a las 06:00 y se documentó el procedimiento en `pipeline/PROCEDIMIENTO.md`.

### Retrospectiva de la edición Nº 2

Qué costó más y qué se cambia para la próxima:

1. **Se escribió el doble de lo que entra.** Las páginas 2 a 5 salieron con una o dos columnas de más y hubo que recortar en cuatro rondas. Cambio: presupuesto de 1.250 palabras por página fijado en el documento maestro y en los briefs; los investigadores ya entregan cuerpos de 3 a 6 oraciones.
2. **Los investigadores sobreproducen.** Entregaron 19, 19, 11 y 1 archivo con 210 KB en total; se usó menos de la mitad. Cambio: tope de 12 notas por brief y pedido explícito de concisión.
3. **El día de la semana se asumió mal.** Se arrancó creyendo que era domingo; los agentes lo corrigieron. Cambio: el procedimiento exige verificar el calendario antes de empezar.
4. **El metro de densidad y el preflight de columnas tuvieron falsos positivos** (rectángulos envolventes en multicolumna; celdas demasiado finas). Ya corregidos: fragmentos de columna y celdas de 5 mm. No deberían volver a aparecer.
5. **Las tres rondas de ajuste manual de layout** (portada, finanzas, contratapa) se resolvieron con decisiones estables: Física u otra nota corta puede ir a la contratapa con `pagina: 8`; la poesía vive en la columna derecha de la contratapa; finanzas admite 74% de ocupación.
6. **CoinGecko limita las llamadas**: las series de 7 días fallaron la primera vez. Cambio: 4 segundos entre llamadas y reintento documentado.
7. **La impresora no estaba en la red.** Cambio: `imprimir.ps1` verifica el puerto 9100 antes de mandar y la tarea programada deja el PDF listo si no responde. Conviene fijar la IP de la impresora en el router o revisar a qué red se conecta.
8. **Tiempo total:** unas dos horas y media, de las cuales la investigación en paralelo tomó 17 minutos y el resto fue pipeline (único) y redacción más recortes. Con el pipeline ya construido y el presupuesto de palabras, la próxima debería tomar entre 40 y 60 minutos.

## Fe de erratas

### Pendientes para la edición Nº 3

- Sin correcciones de contenido registradas sobre la edición Nº 2 al cierre. Anotar aquí lo que el lector señale.
