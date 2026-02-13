import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

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
        ACTÚA COMO UN PREPARADOR FÍSICO Y NUTRICIONISTA DE ÉLITE.
        Tu misión es generar un PLAN INTEGRAL DE FITNESS (Nutrición + Entrenamiento) para el siguiente alumno:

        DATOS DEL ALUMNO:
        - Nombre: ${studentData.full_name}
        - Edad: ${studentData.age}
        - Peso: ${studentData.weight}kg
        - Altura: ${studentData.height}cm
        - Nivel de actividad: ${studentData.activity_level}
        - Objetivo: ${studentData.goal}
        
        ${previousPlan ? `
        CONTEXTO HISTÓRICO (PLAN ANTERIOR):
        El alumno ya ha seguido este plan previamente:
        Nutrición Previa: ${previousPlan.nutrition_plan_text?.substring(0, 300)}...
        Entrenamiento Previo: ${previousPlan.training_plan_text?.substring(0, 300)}...
        
        INSTRUCCIÓN DE EVOLUCIÓN:
        Basándote en el plan anterior, genera una **evolución** o variación del mismo para evitar estancamientos. Aumenta la intensidad o ajusta los alimentos ligeramente para mantener la adherencia.
        ` : 'Este es el PRIMER plan para este alumno. Diseña una base sólida.'}

        MACRONUTRIENTES CALCULADOS:
        - Calorías objetivo: ${macros.calories} kcal
        - Proteína: ${macros.protein}g
        - Grasas: ${macros.fat}g
        - Carbohidratos: ${macros.carbs}g

        TU RESPUESTA DEBE ESTAR EN FORMATO JSON ESTRUCTURADO:
        {
            "nutrition_plan": "Un plan alimentario detallado en formato Markdown. REGLAS: Incluye ejemplos de comidas (desayuno, almuerzo, merienda, cena). Cada comida DEBE estar en una tabla con columnas: Alimento, Cantidad, P, C, G, kcal. Al final de cada tabla de comida, indica el Total de Calorías de esa comida. Usa vocabulario chileno (palta, descremado).",
            "training_plan": "Una rutina de entrenamiento detallada en formato Markdown, especificando días, ejercicios, series, repeticiones y tiempos de descanso, alineada con el objetivo del alumno."
        }

        REGLAS ADICIONALES:
        - Tono profesional, motivador y directo.
        - Usa Markdown para dar formato profesional (negritas, listas, tablas).
        - El plan debe ser realista y sostenible.
        - **IMPORTANTE**: No uses claras de huevo solas. Usa siempre **huevos enteros** para mayor facilidad del alumno.
        `;

		const completion = await openai.chat.completions.create({
			messages: [
				{ role: "system", content: "Eres un experto en transformación física y periodización del entrenamiento." },
				{ role: "user", content: planPrompt }
			],
			model: "gpt-5.2",
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
        Eres un nutricionista deportivo de élite. Estás creando una dieta que va DIRECTAMENTE al alumno, NO al coach.

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
        - Proteína Whey: ${macros.useWhey ? 'SÍ, incluir en la dieta' : 'NO, no usar suplementos'}

        REGLAS OBLIGATORIAS:
        - Habla directamente al alumno en segunda persona (tú). NUNCA mensajes al coach.
        - Responde en español CHILENO: usa "descremado" (no desnatado), "palta" (no aguacate), "porotos" (no judías), "choclo" (no elote), "zapallo italiano" (no calabacín).
        - Usa SOLO alimentos comunes: pollo, carne de vacuno, huevos enteros (NUNCA claras solas, por facilidad), arroz, fideos, papas cocidas, avena, pan integral, palta, aceite de oliva, leche descremada, yogurt descremado, queso fresco, verduras, frutas.${macros.useWhey ? ' También proteína whey.' : ''}
        - Cuando generes o modifiques una dieta, usa formato Markdown con tablas incluyendo macros EXACTOS por alimento (P, C, G en gramos) Y LAS CALORÍAS (kcal).
        - Cada tabla de comida DEBE tener una columna llamada "kcal" con las calorías de ese alimento.
        - Al final de cada comida (Desayuno, Almuerzo, etc.), indica el **Total de Calorías de esa comida**.
        - SIEMPRE muestra las cantidades en DOS formatos:
          1. Gramos exactos (para alumnos con pesa)
          2. Medida visual (cucharadas soperas, vasos, puños, palmas, unidades)
        - Los macros totales deben cuadrar lo más exacto posible con el objetivo.
        - Al final de cada dieta, incluye un RESUMEN de macros totales vs. objetivo.
        - **PROHIBIDO**: No incluyas intros ("Aquí tienes tu plan"), ni cierres ("Espero que te guste"), ni preguntas ("¿Quieres cambiar algo?"), ni comentarios técnicos.
        - **SÓLO EL PLAN**: La respuesta debe ser el plan de alimentación y nada más. No opines, no preguntes, no sugieras.
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
