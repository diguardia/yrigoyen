{COMUN}

Tu tema: BOCA JUNIORS. Fuentes preferidas: bocajuniors.com.ar, Liga Profesional / AFA, CONMEBOL, copaargentina.org, Promiedos, Olé, TyC Sports, ESPN Argentina, La Nación y Clarín deportes. Escribí el resultado en `ediciones/{FECHA}/investigacion/boca.json` con esta estructura exacta:

{"tema": "boca", "consultado_el": ISO,
 "ultimo_partido": {"fecha", "hora_ar", "competicion", "local", "visitante", "resultado", "goles": [{"minuto", "jugador", "equipo"}], "expulsados": [], "arbitro", "estadio", "cronica": "2 a 4 oraciones", "fuentes": [...]},
 "proximo_partido": {"fecha", "dia_semana", "hora_ar", "competicion", "rival", "condicion": "local|visitante", "estadio", "arbitro", "tv", "verificado_en_dos_fuentes": bool, "fuentes": [...]},
 "siguientes_partidos": [{"fecha", "hora_ar", "competicion", "rival", "condicion"}],
 "tabla_zona": {"actualizada": ISO, "fuente": {"url", "medio"}, "formato": "explicación breve", "filas": [{"pos", "equipo", "pj", "g", "e", "p", "gf", "gc", "dif", "pts"}]},
 "tabla_anual": {"disponible": bool, "posicion_boca", "puntos_boca", "detalle", "fuente": {"url", "medio"}},
 "copa_argentina": {"sigue": bool, "detalle", "instancia", "proximo_rival", "fecha", "sede", "llave": [{"cruce", "fecha", "resultado"}], "fuentes": [...]},
 "continental": {"competicion": "Libertadores|Sudamericana|ninguna", "sigue": bool, "detalle", "llave": [...], "fuentes": [...]},
 "plantel": {"entrenador", "formacion_confirmada": [], "formacion_probable": [], "esquema", "lesionados": [{"jugador", "lesion", "regreso_estimado"}], "suspendidos": [{"jugador", "motivo"}], "regresos": [], "actualizado": "YYYY-MM-DD", "fuentes": [...]},
 "mercado": {"oficiales": [{"detalle", "fecha", "fuente"}], "confirmadas": [...], "rumores": [...], "institucional": ""},
 "incertidumbres": ""}

Datos de la API de ESPN que debés CONFIRMAR o corregir en una segunda fuente: {ESPN}

Qué necesito: último resultado con goles y crónica; PRÓXIMO PARTIDO verificado en dos fuentes (si Boca juega hoy o mañana, decirlo con máxima claridad) y los siguientes tres; tabla completa de la zona del torneo local con el formato del torneo y qué puestos están en juego; tabla anual y cupos continentales; Copa Argentina (llave o constancia de eliminación); competición continental (estado, llave, fechas; si no disputa ninguna, decirlo); formación probable separando confirmados de probables, lesionados, suspendidos y regresos con fecha; mercado de pases en tres listas (oficiales, confirmadas, rumores). Nada de "a confirmar" para algo verificable.
