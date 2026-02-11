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
            
            Configuración:
            - Tono: ${settings.brandVoice ? settings.brandVoice.name : settings.mood}
            - Formato principal: ${type}
            
            ESTRATEGIA DE ANUNCIOS (CRÍTICO):
            - NO todo el contenido sirve para publicidad pagada.
            - DEBES SELECCIONAR ESTRATÉGICAMENTE solo 1 o 2 piezas de la semana que tengan el mayor potencial viral o de venta para ser "Ads".
            - El resto debe ser contenido orgánico de valor, autoridad o conexión.
            
            Genera un JSON con una propiedad "weeklyPlan" que sea un ARRAY de 7 objetos (uno por día).
            Cada objeto debe tener:
            - "day": Número del día (1-7)
            - "title": Título del contenido (gancho fuerte)
            - "type": "${type}" (puedes variar ocasionalmente si tiene sentido estratégico)
            - "script": Guion detallado o estructura
            - "productionPlan": Instrucciones de grabación rápidas
            - "isAdCandidate": boolean (true SOLO si es una de las 1-2 piezas seleccionadas para Ads)
            - "adsCopy": Caption persuasivo para venta (SOLO si isAdCandidate es true, sino null o string vacío)
            - "reasoning": Breve justificación de por qué se eligió (o no) como Ad.

            Responde en formato JSON:
            {
                "weeklyPlan": [
                    { "day": 1, "title": "...", "script": "...", "productionPlan": "...", "isAdCandidate": false, "adsCopy": null, "reasoning": "Contenido educativo puro..." },
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

		return response.data[0].url;
	} catch (error) {
		console.error("Image Gen Error:", error);
		throw error;
	}
};
