import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const REASONING_MODEL = import.meta.env.VITE_OPENAI_REASONING_MODEL || "gpt-5.2-codex";

export const openai = new OpenAI({
	apiKey: apiKey,
	dangerouslyAllowBrowser: true
});

export const SYSTEM_PROMPT = `
🎯 Rol principal

Eres un Director Creativo, Personal Trainer y Estratega de Marketing de élite. Tu misión es transformar a un coach fitness en una autoridad masiva mediante su marca personal en Instagram y TikTok.

Si el usuario no te da un tema específico (ej: solo dice "crear reels" o "plan semanal"), TÚ DEBES PROPONER los temas basándote en un mix estratégico:
	1.	30% Autoridad Científica: Datos técnicos, biomecánica, nutrición basada en evidencia.
	2.	30% Valor Práctico: Rutinas, técnica de ejercicios, tips de cocina rápida.
	3.	20% Conexión Personal (Lifestyle): Detrás de cámara, tu rutina diaria, lo que comes, tus entrenamientos.
	4.	20% Mentalidad/Venta: Disciplina, resultados de alumnos, invitaciones a la asesoría.

NO debes asumir que existe una página web.
TODO el negocio ocurre por:
	•	Instagram
	•	TikTok
	•	WhatsApp / DMs

⸻

🧬 Identidad y Pilares de Marca Personal
	1.	Autoridad Técnica: Datos específicos de nutrición, biomecánica de entrenamiento, desmitificación de suplementos y tips basados en ciencia pero explicados simple. El objetivo es que el usuario diga "este tipo sabe de lo que habla".
	2.	Estilo de Vida (Lifestyle): Mostrar el detrás de cámara. Rutina diaria (qué haces al despertar), tus propios entrenamientos, tus comidas del día a día (lo que realmente comes, no solo lo perfecto).
	3.	Resultados Reales: Casos de éxito y filosofía de disciplina > motivación.

Tono:
	•	Directo y cercano
	•	Autoridad sin soberbia
	•	Transparente (mostrar lo bueno y lo difícil)
	•	Cero “vende humo”

⸻

📌 Objetivo del GPT

Ayudar a:
	1.	Crear contenido para Reels y TikTok que posicione al coach como un referente.
	2.	Generar guiones que mezclen VALOR técnico con CONEXIÓN personal.
	3.	Decidir qué contenido promocionar para atraer nuevos clientes.

⸻

🎥 Estructura de Contenidos (OBLIGATORIO)

Cada guion debe incluir:
	1.	REELS/TIKTOK:
		- Hook (0-3 seg): Gancho visual o auditivo potente.
		- Estructura: Secuencia de tomas (A-roll, B-roll).
		- Script: Texto exacto.
		- CTA: Orden clara.
	2.	STORIES (Historias):
		- Secuencia de 3 a 5 historias por día.
		- Elementos de Interacción: Encuestas, stickers de preguntas, barras de reacción.
		- Mix: 50% Lifestyle/Rutina, 30% Valor/Ciencia, 20% Interacción/Venta.

⸻

📅 Calendarios de Publicación

Debes ser capaz de:
	•	Crear calendarios semanales o mensuales
	•	Balancear:
	•	60% valor
	•	25% autoridad
	•	15% venta
	•	Indicar:
	•	Tipo de post
	•	Objetivo
	•	Si es orgánico o candidato a anuncio

⸻

📢 Meta Ads y Estrategia de Captación
	•	Filosofía de Anuncios: No vender directamente el servicio, sino vender la CONFIANZA.
	•	Candidatos Ideales para Ads:
		1. Autoridad Técnica: Reels que explican datos científicos de nutrición o entrenamiento de forma clara (demuestran que eres un profesional de élite).
		2. Resultados y Pruebas: Transformaciones o testimonios.
		3. Desmitificación: Romper un mito común con argumentos sólidos.
	•	Objetivo: Generar curiosidad y "ganar" el derecho a vender mediante el conocimiento.
	•	CTA en Ads: Siempre invitar al DM o WhatsApp para una "Evaluación Gratuita" o "Asesoría Personalizada".

NO proponer:
	•	Funnels complejos
	•	Landing pages
	•	Email marketing
	•	Webs

⸻

🧠 Decisiones Estratégicas

Debes ayudar a:
	•	Elegir qué vender primero
	•	Detectar contenido con potencial de anuncio
	•	Ajustar discurso según respuesta del público
	•	Evitar sobrepublicar venta
	•	Identificar señales de saturación

⸻

🚫 Restricciones

NO:
	•	Inventar datos científicos
	•	Prometer resultados irreales
	•	Recomendar dietas extremas
	•	Usar lenguaje clínico innecesario
	•	Sugerir web o ecommerce

⸻

📲 Conversión

Siempre que sea posible:
	•	Llevar la acción a:
	•	“Escríbeme por DM”
	•	“Hablemos por WhatsApp”
	•	Priorizar:
	•	Conversaciones reales
	•	Venta 1 a 1

⸻

🛠️ Modo de Trabajo

Antes de crear estrategias:
	•	Preguntar:
	•	Nivel del público (principiante / intermedio)
	•	Objetivo principal (bajar grasa, recomposición, músculo)
	•	Ajustar contenido según feedback previo
	•	Iterar constantemente

⸻

🔥 Estilo de Respuesta
	•	Claro
	•	Ordenado
	•	Accionable
	•	Sin relleno
	•	En español
	•	Con foco en ejecución

⸻

🧩 Mentalidad

Actúas como:

“Un socio estratégico que quiere que esta marca personal venda, no solo que tenga likes.”
`;

export const generateChatResponse = async (historyMessages) => {
	if (!apiKey) throw new Error("OpenAI API Key not configured");

	try {
		// Ensure the system prompt is always the first message
		const messages = [
			{ role: "system", content: SYSTEM_PROMPT },
			...historyMessages.map(m => ({ role: m.role, content: m.content }))
		];

		const completion = await openai.chat.completions.create({
			messages: messages,
			model: "gpt-5.2",
		});

		return completion.choices[0].message.content;
	} catch (error) {
		console.error("OpenAI Interaction Error:", error);
		throw error;
	}
};

export const extractCalendarEvents = async (historyMessages) => {
	if (!apiKey) throw new Error("OpenAI API Key not configured");

	try {
		const extractionPrompt = `
        ANALIZA EL HISTORIAL DE CHAT ANTERIOR Y EXTRAE LOS ITEMS DE CONTENIDO ACORDADOS O PROPUESTOS.
        Devuelve SOLO un array JSON válido (sin markdown, sin explicaciones) con los objetos de contenido encontrados.
        
        Formato requerido por objeto:
        {
            "title": "Título breve del contenido",
            "type": "reel" | "post" | "story",
            "status": "idea",
            "script_content": "Resumen de la idea o guion",
            "scheduled_date": "Fecha ISO aproximada (si se menciona 'mañana', 'lunes', etc. calcula la fecha basándote en que hoy es ${new Date().toISOString()}). Si no se menciona fecha, usa null."
        }

        Si no hay contenido claro para extraer, devuelve un array vacío [].
        `;

		const messages = [
			...historyMessages.map(m => ({ role: m.role, content: m.content })),
			{ role: "system", content: extractionPrompt }
		];

		const completion = await openai.chat.completions.create({
			messages: messages,
			model: "gpt-5.2",
			response_format: { type: "json_object" } // Force JSON mode if supported by model, otherwise prompt relies on text
		});

		const content = completion.choices[0].message.content;
		return JSON.parse(content);

	} catch (error) {
		console.error("Event Extraction Error:", error);
		// Fallback if JSON parsing fails or model refuses
		return { events: [] };
	}
};

export const analyzeAdsPerformance = async (campaignsData) => {
	if (!apiKey) throw new Error("OpenAI API Key not configured");

	try {
		const analysisPrompt = `
        ACTÚA COMO UN TRAFFICKER DIGITAL EXPERTO (Meta Ads).
        Analiza los siguientes datos de rendimiento de campañas de un Entrenador Fitness.
        
        Tus objetivos:
        1. Identificar qué campaña es la ganadora (Mejor Costo por Conversación/Mensaje).
        2. Identificar qué campaña está desperdiciando dinero (Alto gasto, pocos resultados).
        3. Dar 3 recomendaciones tácticas concretas (ej: "Apagar campaña X", "Duplicar campaña Y", "Cambiar creativo en Z").

        Datos (JSON):
        ${JSON.stringify(campaignsData)}

        Responde en formato JSON estrictamente:
        {
            "summary": "Resumen ejecutivo de 1 parrafo",
            "winner_campaign": "Nombre de la mejor",
            "loser_campaign": "Nombre de la peor",
            "actions": ["Acción 1", "Acción 2", "Acción 3"]
        }
        `;

		const completion = await openai.chat.completions.create({
			messages: [
				{ role: "system", content: "Eres un analista de marketing experto." },
				{ role: "user", content: analysisPrompt }
			],
			model: "gpt-5.2",
			response_format: { type: "json_object" }
		});

		const content = completion.choices[0].message.content;
		return JSON.parse(content);

	} catch (error) {
		console.error("Ads Analysis Error:", error);
		throw error;
	}
};

export const continueAdsAnalysisChat = async (historyMessages, campaignsData) => {
	if (!apiKey) throw new Error("OpenAI API Key not configured");

	try {
		const systemPrompt = `
        ACTÚA COMO UN TRAFFICKER DIGITAL EXPERTO Y ANALISTA DE DATOS SENIOR.
        Tienes acceso a los siguientes datos de rendimiento de campañas (JSON):
        ${JSON.stringify(campaignsData)}

        Tu misión es responder preguntas profundas y estratégicas del usuario sobre estos datos.
        - Sé específico y cita números cuando sea posible.
        - Si el usuario pregunta "por qué", busca correlaciones en el CTR, Costo, y Gasto.
        - Mantén un tono profesional pero directo ("al grano").
        - Si detectas una métrica preocupante, señálala aunque no te lo pregunten.
        `;

		const messages = [
			{ role: "system", content: systemPrompt },
			...historyMessages.map(m => ({ role: m.role, content: m.content }))
		];

		const completion = await openai.chat.completions.create({
			messages: messages,
			model: "gpt-5.2",
			// No response_format here, we want free text chat
		});

		return completion.choices[0].message.content;

	} catch (error) {
		console.error("Ads Chat Error:", error);
		throw error;
	}
};

export const generateContentIdeas = async (params) => {
	if (!apiKey) throw new Error("OpenAI API Key not configured");

	const { idea, type, settings, mode = 'single' } = params;

	try {
		let systemPromptToUse = SYSTEM_PROMPT;

		// Inject Brand Voice if present
		if (settings.brandVoice) {
			systemPromptToUse += `\n\n⚠️ INSTRUCCIÓN CRÍTICA DE TONO (BRAND VOICE):\nDebes ignorar cualquier instrucción de tono genérica anterior y ceñirte estrictamente a esta personalidad:\n\nNOMBRE DE LA VOZ: ${settings.brandVoice.name}\nINSTRUCCIONES DE TONO:\n${settings.brandVoice.tone_instructions}\n`;
		}

		let contentPrompt = '';
		const userIdea = idea && idea.trim().length > 3 ? idea : "AUTÓNOMO: Genera la mejor estrategia basada en tus pilares de marca personal (Ciencia, Lifestyle, Técnica y Resultados).";

		if (mode === 'weekly') {
			contentPrompt = `
            ACTÚA COMO UN ESTRATEGA DE MARCA PERSONAL FITNESS.
            Misión: Generar una PLANIFICACIÓN SEMANAL (7 días) para crecer la marca personal basada en: "${userIdea}".
            
            SI EL TEMA ES "AUTÓNOMO": Crea un mix equilibrado de los 4 pilares (Ciencia, Técnica, Lifestyle, Resultados).
            
            PILARES A MEZCLAR:
            - Conocimiento (Datos Nutrición/Entreno, Suplementos, Tips).
            - Estilo de Vida (Rutina diaria, Qué comes, Cómo entrenas).
            - Autoridad (Opinión sobre mitos, Demostración de resultados).
            
            SI EL FORMATO ES "STORY": Genera una secuencia de 3 a 5 historias con stickers de interacción.

            Configuración:
            - Tono: ${settings.brandVoice ? settings.brandVoice.name : settings.mood}
            - Formato principal: ${type}
            
            Genera un JSON con una propiedad "strategySummary" y un array "weeklyPlan" de 7 objetos.
            Cada objeto debe incluir:
            - "day": 1-7
            - "title": Gancho fuerte
            - "funnelLevel": "TOFU" | "MOFU" | "BOFU"
            - "script": Guion completo con HOOK, ESTRUCTURA y TEXTO.
            - "productionPlan": Instrucciones de grabación.
            - "isAdCandidate": boolean (Marca como TRUE los contenidos con mayor carga de CONOCIMIENTO CIENTÍFICO o AUTORIDAD, ya que son los mejores para Ads).
            - "adsCopy": Caption de venta persuasivo (SOLO si isAdCandidate es true).
            - "reasoning": Por qué este contenido es clave para la marca personal o anuncios.

            Responde en formato JSON:
            {
                "strategySummary": "...",
                "weeklyPlan": [
                    { "day": 1, "title": "...", "funnelLevel": "...", "script": "...", "productionPlan": "...", "isAdCandidate": false, "adsCopy": null, "reasoning": "..." },
                    ...
                ]
            }
            `;
		} else {
			// Single content mode
			contentPrompt = `
            ACTÚA COMO UN EXPERTO EN CONTENIDO Y ADS PARA FITNESS.
            Misión: Generar un PLAN PROFESIONAL para "${type}" sobre: "${userIdea}".
            
            SI EL TEMA ES "AUTÓNOMO": Elige un tema de alta autoridad (Ciencia o Datos técnicos) que posicione al coach como experto.
            
            SI EL FORMATO ES "STORY": Diseña una secuencia de 3 a 5 historias detalladas, incluyendo stickers sugeridos (encuestas, preguntas) para maximizar interacción.
            
            ESTRATEGIA: Si el tema permite demostrar CONOCIMIENTO CIENTÍFICO o desmitificar suplementos/nutrición con datos, trátalo como un "Ad Candidate" de altísima autoridad.
            
            Debe incluir obligatoriamente:
            1. HOOK: Gancho inicial potente.
            2. ESTRUCTURA: Secuencia de tomas (A-roll, B-roll).
            3. SCRIPT: Texto a decir.
            4. CTA: Llamado a la acción.

            Respuesta JSON:
            {
                "script": "Texto completo formateado",
                "productionPlan": "Instrucciones de tomas y edición",
                "adsCopy": "Caption de instagram con hashtags"
            }
            `;
		}

		const completion = await openai.chat.completions.create({
			messages: [
				{ role: "system", content: systemPromptToUse },
				{ role: "user", content: contentPrompt }
			],
			model: "gpt-5.2",
			response_format: { type: "json_object" }
		});

		const content = completion.choices[0].message.content;
		return JSON.parse(content);

	} catch (error) {
		console.error("Content Gen Error:", error);
		throw error;
	}
};

export const generateImage = async (prompt) => {
	if (!apiKey) throw new Error("OpenAI API Key not configured");

	try {
		const response = await openai.images.generate({
			model: "dall-e-3",
			prompt: "Professional fitness photography, high quality, 4k, realistic: " + prompt,
			n: 1,
			size: "1024x1024",
		});

		return {
			url: response.data[0].url,
			prompt: response.data[0].revised_prompt || prompt // DALL-E 3 often rewrites prompts
		};
	} catch (error) {
		console.error("Image Gen Error:", error);
		throw error;
	}
};
export const generateFitnessPlan = async (studentData, macros, previousPlan = null) => {
	if (!apiKey) throw new Error("OpenAI API Key not configured");

	try {
		const planPrompt = `
        ACTÚA COMO UN PREPARADOR FÍSICO Y NUTRICIONISTA DE ÉLITE CON EXPERIENCIA EN CHILE.
        Tu misión es generar un PLAN INTEGRAL DE FITNESS (Nutrición + Entrenamiento) basado en un SISTEMA DE PORCIONES.

        DATOS DEL ALUMNO:
        - Nombre: ${studentData.full_name}
        - Edad: ${studentData.age}
        - Peso: ${studentData.weight}kg
        - Altura: ${studentData.height}cm
        - Objetivo: ${studentData.goal}
        
        ${previousPlan ? `
        CONTEXTO HISTÓRICO (PLAN ANTERIOR):
        Nutrición Previa: ${previousPlan.nutrition_plan_text?.substring(0, 300)}...
        Entrenamiento Previo: ${previousPlan.training_plan_text?.substring(0, 300)}...
        ` : 'Este es el PRIMER plan para este alumno.'}

        MACRONUTRIENTES OBJETIVO:
        - Calorías: ${macros.calories} kcal
        - Proteína: ${macros.protein}g
        - Grasas: ${macros.fat}g
        - Carbohidratos: ${macros.carbs}g

        ESTRUCTURA DE RESPUESTA (JSON):
        {
            "nutrition_plan": "Markdown",
            "training_plan": "Markdown"
        }

        REGLAS PARA NUTRITION_PLAN (FORMATO MARKDOWN DE ÉLITE):
        
        REGLAS PARA NUTRITION_PLAN (FORMATO MARKDOWN DE ÉLITE):
        
        1. PÁGINA 1: TABLA DE PORCIONES ISOCALÓRICAS (ESTÁNDAR FIJO)
           - Define "1 PORCIÓN" basándote ESTRICTAMENTE en estas calorías objetivo por grupo:
             * **1 Porción de CARBOHIDRATO (CHO) = 200 KCAL (aprox)**.
             * **1 Porción de PROTEÍNA (PRO) = 150 KCAL (aprox)**.
             * **1 Porción de GRASA (FAT) = 100 KCAL (aprox)**.
           - TU TAREA MATEMÁTICA: Calcula los gramos de cada alimento para que CUMPLAN esas calorías.
             * Ejemplo: Si 100g de Arroz = 130 kcal, entonces 1 Porción de Arroz (~200kcal) son ~150-160g.
             * Ejemplo: Si 100g de Papa = 80 kcal, le corresponde MÁS cantidad (~250g) para llegar a las 200 kcal.
           - OBLIGATORIO: Todas las tablas deben tener exactamente 7 columnas: | Alimento | Cantidad | Medida Visual | P | C | G | kcal |
           - GRUPO CARBOHIDRATOS (CHO): Marraqueta, Arroz cocido, Fideos cocidos, Papa cocida, Avena, Pan Integral.
           - GRUPO PROTEÍNAS (PRO): Huevos enteros, Pollo, Vacuno/Cerdo, Atún.
           - GRUPO GRASAS (FAT): Aceite de Oliva, Palta, Frutos Secos.

        2. PÁGINA 2: DISTRIBUCIÓN DIARIA (ABSTRACTA Y FLEXIBLE)
           - En esta sección, **NO** menciones alimentos específicos (ej: No digas "Pollo con Arroz").
           - Usa EXCLUSIVAMENTE el lenguaje de PORCIONES para que el alumno elija de la Tabla de Equivalencias.
           - Estructura OBLIGATORIA:
             * "Desayuno: **2 Porciones de PROTEÍNA** + **1 Porción de CARBOHIDRATO** + **1 Porción de GRASA**".
             * "Almuerzo: **2 Porciones de PROTEÍNA** + **2 Porciones de CARBOHIDRATO** + Ensalada Libre".
           - Inmediatamente debajo de cada comida, inserta una TABLA RESUMEN DE MACROS DE ESA COMIDA (Sin alimentos, solo conteo de macros y calorías).
           - **VALIDACIÓN FINAL**: La suma de todas las porciones abstraídas debe coincidir con el objetivo: ${macros.calories} kcal.

        3. REGLAS DE ESTÉTICA Y VOCABULARIO:
           - Usa negritas para resaltar las PORCIONES (ej: **1 Porción de CHO**).
           - Vocabulario Chileno: Palta, Marraqueta, Descremado (en la tabla de equivalencias).
           - Al final del plan, incluye el Resumen de Macros Totales del día vs Objetivo.
           - Incluye "Tips de Oro" (Hidratación, Sueño) para profesionalismo.

        REGLAS PARA TRAINING_PLAN:
        - Rutina detallada con: Ejercicio, Series, Repeticiones, RPE/RIR y Descanso.
        - Si hay plan previo, asegúrate de aplicar sobrecarga progresiva (más peso, más reps o variaciones).
        - Divide por días (Split sugerido).
        `;

		const completion = await openai.chat.completions.create({
			messages: [
				{ role: "system", content: "Eres un experto en transformación física y periodización del entrenamiento que entrega protocolos de clase mundial." },
				{ role: "user", content: planPrompt }
			],
			model: REASONING_MODEL,
			response_format: { type: "json_object" }
		});

		const content = completion.choices[0].message.content;
		return JSON.parse(content);

	} catch (error) {
		console.error("Fitness Plan Gen Error:", error);
		throw error;
	}
};

export const analyzeStudentProgress = async (studentData, history) => {
	if (!apiKey) throw new Error("OpenAI API Key not configured");

	if (!history || history.length < 2) {
		return "No hay suficientes datos históricos para realizar un análisis de tendencias.";
	}

	try {
		const analysisPrompt = `
        Analiza el progreso del siguiente alumno basándote en su historial de peso:
        
        ALUMNO: ${studentData.full_name} (${studentData.age} años, Meta: ${studentData.goal})
        
        HISTORIAL DE PESO (Del más antiguo al más reciente):
        ${history.map(h => `- ${h.date}: ${h.weight}kg (${h.fat ? h.fat + '% grasa' : 'sin dato de grasa'})`).join('\n')}
        
        TUS INSTRUCCIONES:
        1. Analiza la tendencia: ¿Está perdiendo, ganando o manteniendo peso? ¿Es coherente con su meta de '${studentData.goal}'?
        2. Detecta estancamientos o cambios bruscos peligrosos.
        3. Da 3 recomendaciones prácticas y breves para la siguiente etapa.
        
        FORMATO DE RESPUESTA:
        Texto plano, conciso (máximo 150 palabras), tono de entrenador profesional hablando directamente al coach (tú).
    `;

		const completion = await openai.chat.completions.create({
			messages: [
				{ role: "system", content: "Eres un analista de datos deportivos experto." },
				{ role: "user", content: analysisPrompt }
			],
			model: "gpt-5.2"
		});

		return completion.choices[0].message.content;
	} catch (error) {
		console.error("Progress Analysis Error:", error);
		throw error;
	}
};

export const chatDietAssistant = async (chatHistory, studentData, macros) => {
	if (!apiKey) throw new Error("OpenAI API Key not configured");

	try {
		const systemPrompt = `
        Eres un nutricionista deportivo de élite con experiencia en Chile. Estás creando o modificando una dieta que va DIRECTAMENTE al alumno.

        DATOS DEL ALUMNO:
        - Nombre: ${studentData.full_name}
        - Edad: ${studentData.age} años
        - Peso: ${studentData.weight}kg
        - Altura: ${studentData.height}cm
        - Objetivo: ${studentData.goal === 'cut' ? 'Definición' : studentData.goal === 'bulk' ? 'Volumen' : 'Mantenimiento'}

        MACROS CALCULADOS:
        - Calorías: ${macros.calories} kcal
        - Proteína: ${macros.protein}g
        - Grasas: ${macros.fat}g
        - Carbohidratos: ${macros.carbs}g
        - Proteína Whey: ${macros.useWhey ? 'SÍ' : 'NO'}

        SISTEMA DE PORCIONES ISOCALÓRICAS (OBLIGATORIO):
        1. TABLA DE PORCIONES ESTÁNDAR:
           - **1 Porción de CARBOHIDRATO = 200 KCAL**.
           - **1 Porción de PROTEÍNA = 150 KCAL**.
           - **1 Porción de GRASA = 100 KCAL**.
           - TU TAREA: Calcula los gramos de cada alimento para cumplir estas calorías (ej: Arroz vs Papa deben pesar distinto pero tener las mismas kcal).
           - OBLIGATORIO: Usa siempre 7 columnas: | Alimento | Cantidad | Medida Visual | P | C | G | kcal |

        REGLAS DE PRECISIÓN Y FORMATO DE MENÚ ABSTRACTO:
        - El error calórico total final no debe superar el 3% del objetivo (${macros.calories} kcal).
        - **EN EL MENÚ DIARIO**: NO nombres alimentos específicos (ej: No digas "Pollo").
        - **USA LENGUAJE DE PORCIONES**: "Almuerzo: 2 Porciones de PROTEÍNA + 1 Porción de GRASA".
        - El alumno buscará qué comer en la Tabla de Equivalencias.
        - Indica el **Total de Calorías** por comida en negrita.
        - Usa vocabulario CHILENO en las explicaciones.
        - Incluye resumen final comparativo: Plan vs Objetivo.

        RESTRICCIONES:
        - PROHIBIDO: Intros, saludos, despedidas o frases como "aquí tienes tu plan". 
        - SÓLO EL PLAN O LA RESPUESTA TÉCNICA.
        - No uses claras de huevo solas (siempre huevos enteros).
        `;

		const messages = [
			{ role: "system", content: systemPrompt },
			...chatHistory.map(m => ({ role: m.role, content: m.content }))
		];

		const completion = await openai.chat.completions.create({
			messages: messages,
			model: REASONING_MODEL
		});

		return completion.choices[0].message.content;
	} catch (error) {
		console.error("Diet Chat Error:", error);
		throw error;
	}
};

export const chatTrainingAssistant = async (chatHistory, studentData, trainingData) => {
	if (!apiKey) throw new Error("OpenAI API Key not configured");

	try {
		const systemPrompt = `
        Eres un entrenador personal de élite calificado en periodización y nutrición deportiva. Estás creando una rutina de entrenamiento que va DIRECTAMENTE al alumno.

        DATOS DEL ALUMNO:
        - Nombre: ${studentData.full_name}
        - Edad: ${studentData.age} años
        - Peso: ${studentData.weight}kg
        - Altura: ${studentData.height}cm
        - Objetivo: ${studentData.goal === 'cut' ? 'Definición' : studentData.goal === 'bulk' ? 'Volumen' : 'Mantenimiento'}
        - Nivel de Experiencia: ${trainingData.experience}
        - Deporte Adicional: ${trainingData.extraSport || 'Ninguno'}

        CONFIGURACIÓN DE ENTRENAMIENTO:
        - Tipo de Split: ${trainingData.split}
        - Días a la semana: ${trainingData.daysPerWeek}

        REGLAS OBLIGATORIAS:
        - Habla directamente al alumno en segunda persona (tú). NUNCA mensajes al coach.
        - Usa un lenguaje motivador pero técnico y preciso.
        - Estructura la rutina con tablas Markdown claras que incluyan: Ejercicio, Series, Repeticiones, RIR/RPE y Descanso.
        - Divide la rutina por días (ej: Día 1: Empuje, Día 2: Tracción, etc.).
        - Si el alumno hace un deporte extra (ej: Tenis), adapta la rutina para mejorar su rendimiento en ese deporte y evitar fatiga excesiva.
        - Adapta el volumen y la intensidad al nivel de experiencia del alumno (${trainingData.experience}).
        - **NOMENCLATURA DE EJERCICIOS**: Usa preferiblemente estos nombres estándar para que el sistema asigne imágenes correctamente: 
          Press de Banca, Press Inclinado, Aperturas, Sentadillas, Prensa, Peso Muerto, Remo con Barra, Jalón al Pecho, Dominadas, Press Militar, Elevaciones Laterales, Curl de Bíceps, Press Francés, Extensiones de Tríceps, Zancadas, Elevación de Talones, Plancha, Crunch.
        - **PROHIBIDO**: No incluyas intros, saludos, despedidas ni preguntas. SÓLO ENTREGA LA RUTINA.
        - **SÓLO LA RUTINA**: La respuesta debe empezar directamente con el título de la rutina y terminar con el resumen o consejos de ejecución.
        `;

		const messages = [
			{ role: "system", content: systemPrompt },
			...chatHistory.map(m => ({ role: m.role, content: m.content }))
		];

		const completion = await openai.chat.completions.create({
			messages: messages,
			model: "gpt-5.2"
		});

		return completion.choices[0].message.content;
	} catch (error) {
		console.error("Training Chat Error:", error);
		throw error;
	}
};

/**
 * Generates persuasive copy for Ad Creatives (Before/After)
 */
export const generateAdCopy = async (context, settings = {}) => {
	try {
		const prompt = `
            ACTÚA COMO UN COPYWRITER EXPERTO EN META ADS PARA FITNESS.
            Misión: Generar elementos de texto para un CREATIVO PUBLICITARIO (imagen/story) basado en: "${context}".
            
            ESTRUCTURA REQUERIDA (JSON):
            {
                "headline": "Título corto y disruptivo (Ej: -10kg en 90 días)",
                "subheadline": "Frase de apoyo que genere curiosidad o autoridad",
                "benefits": ["Beneficio 1", "Beneficio 2", "Beneficio 3"],
                "cta": "Llamada a la acción corta (Ej: Dale clic / DM 'QUIERO')",
                "canva_image_prompt": "Prompt optimizado para generar el fondo o imagen en la IA de Canva (Magic Media)"
            }

            REGLAS:
            - Sé agresivo pero profesional.
            - Usa "tú" (Chilean Spanish persona: directo, motivador).
            - Máximo 5 palabras por headline.
            - Máximo 10 palabras por beneficio.

            Tono de voz: ${settings.brandVoice ? settings.brandVoice.name : 'Profesional y motivador'}
        `;

		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{ role: "system", content: SYSTEM_PROMPT },
				{ role: "user", content: prompt }
			],
			response_format: { type: "json_object" }
		});

		return JSON.parse(response.choices[0].message.content);
	} catch (error) {
		console.error("Error generating Ad Copy:", error);
		throw error;
	}
};

/**
 * Calcula equivalencias de alimentos (Motor de Sustitución)
 */
export const calculateFoodSubstitution = async (originalFood, targetFood, macros = {}) => {
	try {
		const prompt = `
            ACTÚA COMO UN NUTRICIONISTA CLÍNICO Y DEPORTIVO.
            Tarea: Calcular la equivalencia exacta entre dos alimentos manteniendo los macros lo más similares posible.
            
            Original: ${originalFood}
            Sustituto deseado: ${targetFood}
            
            RETORNA UN JSON CON ESTA ESTRUCTURA:
            {
                "original_qty": "Cantidad original (ej: 100g)",
                "substituted_qty": "Cantidad del nuevo alimento requerida",
                "explanation": "Breve explicación técnica de por qué este cambio (máximo 15 palabras)",
                "macros_difference": "Diferencia calórica estimada"
            }
        `;

		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [{ role: "user", content: prompt }],
			response_format: { type: "json_object" }
		});

		return JSON.parse(response.choices[0].message.content);
	} catch (error) {
		console.error("Error calculating substitution:", error);
		throw error;
	}
};

/**
 * Genera un protocolo de suplementación profesional
 */
export const generateSupplementsProtocol = async (student, goal) => {
	try {
		const prompt = `
            ACTÚA COMO UN EXPERTO EN FARMACOLOGÍA Y SUPLEMENTACIÓN DEPORTIVA (BASADO EN EVIDENCIA).
            Genera un protocolo de suplementación para:
            Nombre: ${student.full_name}
            Objetivo: ${goal}
            Peso: ${student.weight}kg
            
            REGLAS:
            - Solo suplementos con grado de evidencia A o B (Creatina, Cafeína, Proteína, etc).
            - Indica dosis exactas basadas en su peso.
            - Indica timing (cuándo tomarlo).
            - Menciona el beneficio científico brevemente.

            RETORNA UN JSON:
            {
                "protocol": "Texto formateado en Markdown con el protocolo completo",
                "total_cost_estimate": "Estimado de costo mensual (clp)",
                "key_benefit": "El beneficio principal de este stack"
            }
        `;

		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [{ role: "user", content: prompt }],
			response_format: { type: "json_object" }
		});

		return JSON.parse(response.choices[0].message.content);
	} catch (error) {
		console.error("Error generating supplements:", error);
		throw error;
	}
};
