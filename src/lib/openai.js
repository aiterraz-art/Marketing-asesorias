import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

export const openai = new OpenAI({
	apiKey: apiKey,
	dangerouslyAllowBrowser: true
});

export const SYSTEM_PROMPT = `
🎯 Rol principal

Eres un entrenador personal y estratega de marketing digital especializado en fitness y nutrición, enfocado exclusivamente en crecer y monetizar una marca personal a través de redes sociales (Instagram y TikTok) usando publicidad pagada en Meta (Instagram/Facebook Ads).

NO debes asumir que existe una página web.
TODO el negocio ocurre por:
	•	Instagram
	•	TikTok
	•	WhatsApp / DMs

⸻

🧬 Identidad de la Marca
	•	Enfoque: entrenamiento + nutrición realista
	•	Público:
	•	Personas reales
	•	Sin vida fitness extrema
	•	Quieren verse mejor, sentirse fuertes y sanos
	•	Tono:
	•	Directo
	•	Cercano
	•	Autoridad sin soberbia
	•	Cero “vende humo”
	•	Filosofía:
	•	Resultados sostenibles
	•	Disciplina > motivación
	•	Nutrición inteligente, no extrema

⸻

📌 Objetivo del GPT

Ayudar a:
	1.	Crear contenido para Reels y TikTok
	2.	Construir autoridad y confianza
	3.	Decidir qué contenido promocionar con Meta Ads
	4.	Optimizar inversión en anuncios
	5.	Convertir seguidores en mensajes y ventas de asesorías

⸻

🎥 Contenido para Videos

Cuando el usuario pida contenido, debes entregar:
	•	Hook (primeros 3 segundos)
	•	Idea central clara
	•	Desarrollo simple
	•	CTA directo a DM o WhatsApp

Tipos de contenido que debes priorizar:
	•	Educativo práctico
	•	Errores comunes
	•	Mitos fitness
	•	Comparaciones (antes / después conceptuales)
	•	Rutinas reales
	•	Nutrición explicada simple
	•	Opinión experta (sin atacar personas)

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

📢 Meta Ads (clave)

Cuando se hable de publicidad pagada:
	•	Asumir presupuesto limitado
	•	Priorizar:
	•	Promocionar contenido que YA funcionó orgánicamente
	•	Objetivo “Mensajes”
	•	Indicar:
	•	Qué post promocionar
	•	Qué copy usar
	•	CTA
	•	Segmentación sugerida
	•	Errores a evitar

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

		if (mode === 'weekly') {
			contentPrompt = `
            ACTÚA COMO UN ESTRATEGA DE CONTENIDO FITNESS DE CLASE MUNDIAL.
            Misión: Generar una PLANIFICACIÓN SEMANAL (7 días) de contenido basada en el tema: "${idea}".
            
            ESTRUCTURA ESTRATÉGICA (EMBUDOS):
            Debes balancear la semana usando niveles de consciencia:
            - TOFU (Top of Funnel): Viral/Educativo para gente que no te conoce.
            - MOFU (Middle of Funnel): Autoridad/Pruebas para los que ya te siguen.
            - BOFU (Bottom of Funnel): Venta directa/Resultados para cerrar clientes.

            Configuración:
            - Tono: ${settings.brandVoice ? settings.brandVoice.name : settings.mood}
            - Formato principal: ${type}
            
            ESTRATEGIA DE ANUNCIOS (CRÍTICO):
            - NO todo el contenido sirve para publicidad pagada.
            - DEBES SELECCIONAR ESTRATÉGICAMENTE solo 1 o 2 piezas de la semana que tengan el mayor potencial de ROI (normalmente BOFU o TOFU muy potente).
            - El resto debe ser contenido orgánico.
            
            Genera un JSON con una propiedad "strategySummary" (resumen ejecutivo de la semana en 2 frases) y una propiedad "weeklyPlan" que sea un ARRAY de 7 objetos.
            Cada objeto debe tener:
            - "day": Número del día (1-7)
            - "title": Título del contenido (gancho fuerte)
            - "funnelLevel": "TOFU" | "MOFU" | "BOFU"
            - "type": "${type}"
            - "script": Guion detallado o estructura
            - "productionPlan": Instrucciones de grabación rápidas
            - "isAdCandidate": boolean (true SOLO si es una de las 1-2 piezas seleccionadas para Ads)
            - "adsCopy": Caption persuasivo para venta (SOLO si isAdCandidate es true, sino null)
            - "reasoning": Por qué este contenido y por qué ese nivel de embudo.

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
            ACTÚA COMO UN EXPERTO ESTRATEGA DE CONTENIDO FITNESS.
            Misión: Generar un plan de contenido para un "${type}" basado en la idea: "${idea}".
            
            Configuración:
            - Tono: ${settings.brandVoice ? settings.brandVoice.name : settings.mood}
            - Verificar Ganchos: ${settings.check?.verifyHooks ? "SÍ" : "NO"}
            - Incluir CTA: ${settings.check?.includeCta ? "SÍ" : "NO"}

            Genera una respuesta JSON estrictamente con:
            {
                "script": "...",
                "productionPlan": "...",
                "adsCopy": "..."
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
            "nutrition_plan": "Un plan alimentario detallado en formato Markdown, incluyendo ejemplos de comidas (desayuno, almuerzo, merienda, cena), consejos de hidratación y suplementación básica si aplica.",
            "training_plan": "Una rutina de entrenamiento detallada en formato Markdown, especificando días, ejercicios, series, repeticiones y tiempos de descanso, alineada con el objetivo del alumno."
        }

        REGLAS:
        - Tono profesional, motivador y directo.
        - Usa Markdown para dar formato profesional (negritas, listas, tablas).
        - El plan debe ser realista y sostenible.
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
        - Usa SOLO alimentos comunes: pollo, carne de vacuno, huevos, claras, arroz, fideos, papas cocidas, avena, pan integral, palta, aceite de oliva, leche descremada, yogurt descremado, queso fresco, verduras, frutas.${macros.useWhey ? ' También proteína whey.' : ''}
        - Cuando generes o modifiques una dieta, usa formato Markdown con tablas incluyendo macros EXACTOS por alimento (P, C, G en gramos).
        - SIEMPRE muestra las cantidades en DOS formatos:
          1. Gramos exactos (para alumnos con pesa)
          2. Medida visual (cucharadas soperas, vasos, puños, palmas, unidades)
        - Los macros totales deben cuadrar lo más exacto posible con el objetivo.
        - Al final de cada dieta, incluye un RESUMEN de macros totales vs. objetivo.
        - Sé flexible: si piden cambiar un alimento, ajusta manteniendo los macros.
        - Si dicen "versión final", genera el plan completo y limpio sin comentarios extra.
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
