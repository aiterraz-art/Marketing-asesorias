import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const REASONING_MODEL = import.meta.env.VITE_OPENAI_REASONING_MODEL || "gpt-5.2";

export const openai = new OpenAI({
	apiKey: apiKey,
	dangerouslyAllowBrowser: true
});

export const EQUIVALENCE_TABLES = `
### TABLA DE EQUIVALENCIAS (PORCIONES ISOCALÓRICAS)

#### 1 Porción de CARBOHIDRATO = 200 kcal
| Alimento | Cantidad (g exactos) | Medida Visual | P (g) | C (g) | G (g) | kcal |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Arroz cocido | 155 g | 3/4 taza aprox. | 4.2 | 43.4 | 0.5 | 200 |
| Fideos cocidos | 130 g | 3/4 taza aprox. | 4.7 | 40.2 | 0.8 | 200 |
| Papas cocidas | 260 g | 2 papas medianas | 5.2 | 52.0 | 0.3 | 200 |
| Avena | 55 g | 6 cucharadas soperas | 9.3 | 36.4 | 3.8 | 200 |
| Pan integral | 80 g | 3 rebanadas medianas | 9.6 | 33.6 | 3.2 | 200 |
| Plátano | 220 g | 2 unidades chicas | 2.4 | 50.6 | 0.7 | 200 |
| Manzana | 385 g | 2 unidades medianas | 1.0 | 53.9 | 0.8 | 200 |
| Naranja | 425 g | 3 unidades medianas | 3.8 | 51.0 | 0.4 | 200 |

#### 1 Porción de PROTEÍNA = 150 kcal
| Alimento | Cantidad (g exactos) | Medida Visual | P (g) | C (g) | G (g) | kcal |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Pollo (pechuga, cocido) | 90 g | 1 palma de la mano | 28.0 | 0.0 | 3.2 | 150 |
| Vacuno magro (cocido) | 75 g | 1 palma chica | 19.5 | 0.0 | 7.1 | 150 |
| Huevos enteros | 2 un | 2 unidades | 12.6 | 1.1 | 10.0 | 150 |
| Leche descremada | 440 ml | 2 tazas/vasos aprox. | 14.5 | 21.1 | 0.4 | 150 |
| Yogurt descremado | 375 g | 3 potes chicos (125g) | 15.0 | 22.5 | 0.8 | 150 |
| Queso fresco | 90 g | 1 trozo mediano | 10.8 | 2.7 | 7.2 | 150 |

#### 1 Porción de GRASA = 100 kcal
| Alimento | Cantidad (g exactos) | Medida Visual | P (g) | C (g) | G (g) | kcal |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Aceite de oliva | 11 g | 1 cucharada sopera | 0.0 | 0.0 | 11.0 | 100 |
| Palta | 65 g | 1/2 unidad chica | 1.3 | 5.9 | 9.8 | 100 |
#### VEGETALES LIBRES (Consumo ilimitado)
| Alimento | Detalle |
| :--- | :--- |
| Tomate, Pepino, Lechuga | Consumo libre |
| Repollo, Zapallo Italiano, Brocoli | Consumo libre |
`;

export const SYSTEM_PROMPT = `
Eres un experto en nutrición de élite que utiliza un sistema estricto de **PORCIONES ISOCALÓRICAS**.

### TABLAS DE REFERENCIA (CONOCIMIENTO BASE):
${EQUIVALENCE_TABLES}

### CÁLCULO DE PORCIONES DIARIAS (INTERNO):
Realiza estos cálculos de forma interna para determinar las porciones totales.
IMPORTANTE: El cálculo de Carbohidratos debe ser EXACTO usando las calorías de las grasas y proteínas indicadas, NO las porciones redondeadas.
1. **Proteína**: (Gramos de Prot * 4) / 150.
2. **Grasas**: (Gramos de Grasa * 9) / 100.
3. **Carbohidratos**: (Total Calorías - (Gramos de Prot * 4) - (Gramos de Grasa * 9)) / 200.

### REGLAS DE CÁLCULO Y VISIBILIDAD:
1. **SOLO NÚMEROS ENTEROS**: Está estrictamente prohibido usar decimales (ej: NO uses 3.5 o 2.8). Todas las porciones deben ser números enteros (1, 2, 3, etc.).
2. **REDONDEO ESTRATÉGICO**: Aproxima hacia arriba o hacia abajo para acercarte al macro objetivo, pero **PRIORIZA NO PASARTE** de las calorías totales.
3. **CÁLCULO INVISIBLE**: Está estrictamente prohibido mostrar operaciones matemáticas, fórmulas o pasos intermedios.
4. **CERO COMENTARIOS**: No agregues saludos, despedidas, comentarios sobre el entrenamiento o notas aclaratorias sobre lo que estás haciendo. Entrega **ÚNICAMENTE** el plan nutricional siguiendo la estructura.

### ESTRUCTURA OBLIGATORIA DEL PLAN:
1. **Encabezado**: Tabla de equivalencias completa (incluyendo Vegetales Libres).
2. **Totales Diarios**: Listar directamente cuántas porciones de Carb, Prot y Grasa corresponden al día (Solo números enteros).
3. **Distribución de Porciones (CON LÍMITES CALÓRICOS)**:
   - **MÁXIMO POR COMIDA**: Ninguna comida principal (Desayuno, Almuerzo, Cena) debe superar las **800 kcal**.
   - **MÁXIMO POR SNACK**: Ningún snack debe superar las **500 kcal**.
   - **DISTRIBUCIÓN DINÁMICA**: Si al distribuir las porciones una comida supera el límite, traspasa el excedente a los snacks. Si un snack supera las 500 kcal, **crea un segundo snack** (Snack 1 y Snack 2). Esto es vital para alumnos en fase de volumen.
   - **OMISIÓN DE VACÍOS**: Si un momento de comida (especialmente snacks) tiene 0 porciones en todos los macros, **NO lo menciones**. Está estrictamente prohibido mostrar secciones con 0 calorías o vacías.
   - **PRIORIDAD PROTEICA**: La proteína DEBE estar presente obligatoriamente en el **Desayuno, Almuerzo y Cena**.
   - **ALMUERZO Y CENA**: Deben incluir siempre la mención de "**Vegetales Libres (Ensaladas)**" como consumo libre.
   - En cada comida, indica el número de porciones por macro (ej: "2 porciones de proteína").
   - **CALORÍAS POR COMIDA**: Al final de cada comida, indica el total de calorías de esa comida basándote en las porciones (Carb=200, Prot=150, Grasa=100).
4. **EJEMPLO DE DIETA**:
   - Justo debajo de la distribución de porciones, crea una sección llamada "**EJEMPLO DE DIETA**".
   - Traduce las porciones de cada comida a un **ejemplo culinario lógico y apetecible** usando exclusivamente los alimentos de la tabla.
   - Especifica el nombre del alimento, la cantidad exacta y la medida visual.
5. **INDICACIONES GENERALES**:
   - Al final de todo el plan nutricional, agrega SIEMPRE estas instrucciones:
     "**Bebidas zero**: máximo 2 vasos al día.
     **Infusiones y jugos tipo Livean**: consumo libre.
     **Jugos light (con calorías residuales)**: prohibidos."
6. **REGLA CRÍTICA DE GRASAS SEGÚN MOMENTO DEL DÍA**:
   - **DESAYUNO y SNACKS**: La fuente de grasa DEBE ser siempre **Palta**. Está **estrictamente PROHIBIDO** incluir Aceite de Oliva en estas comidas.
   - **ALMUERZO y CENA**: La fuente de grasa preferida es **Aceite de Oliva** (para condimentar). Se puede combinar con Palta si las porciones lo permiten.
7. **REGLA CRÍTICA DE CARBOHIDRATOS EN ALMUERZO Y CENA**:
   - En **ALMUERZO y CENA**, está **estrictamente PROHIBIDO** combinar dos fuentes distintas de carbohidrato en una misma comida (ej: NO arroz + papas, NO fideos + pan).
   - Usa **UNA SOLA fuente de carbohidrato** por comida principal, ajustando la cantidad de porciones de ese único alimento.
8. **REGLA CRÍTICA DE AVENA (PROHIBICIÓN ESTRICTA)**:
   - Está **ESTRICTAMENTE PROHIBIDO** combinar Avena con Huevos, Pollo, Vacuno o Queso. La Avena NUNCA debe pautarse junto a esas proteínas en la misma comida.
   - La **Avena** ÚNICA Y EXCLUSIVAMENTE puede usarse si la proteína de esa comida es **Leche descremada** o **Yogurt descremado**.
   - Si pautas Huevos en el desayuno o snack, el carbohidrato DEBE ser **Pan integral**, **Plátano** u otra fruta de la tabla, pero **JAMÁS Avena**.
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
		const analysisPrompt = "";

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
		const systemPrompt = "";

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
			contentPrompt = "";
		} else {
			// Single content mode
			contentPrompt = "";
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
        Genera un PLAN NUTRICIONAL BASADO EN PORCIONES para el alumno ${studentData.full_name}.

        DATOS DEL ALUMNO:
        - Objetivo: ${studentData.goal}
        - Calorías Objetivo: ${macros.calories} kcal
        - Macros: P: ${macros.protein}g | G: ${macros.fat}g | C: ${macros.carbs}g
        - Datos Adicionales: ${JSON.stringify(studentData)}

        REQUISITOS DEL PLAN NUTRICIONAL:
        1. Comienza el bloque pegando la TABLA DE EQUIVALENCIAS completa.
        2. Calcula el total de PORCIONES ISOCALÓRICAS diarias (Redondeando a números enteros).
        3. Distribuye esas porciones en 4 comidas: Desayuno, Almuerzo, Cena y 1 Snack (Protein obligatoria en B/L/D).
        4. Distribución: En cada comida indica el conteo de porciones y las calorías de esa comida.
        5. Ejemplo Real: Agrega la sección "EJEMPLO DE DIETA" con alimentos lógicos según la tabla.
        6. CERO META-TALK: No incluyas explicaciones externas, saludos ni notas sobre el entrenamiento.
        7. ESTRICTAMENTE PROHIBIDO: NO generes, no menciones y no incluyas ningún plan ni rutina de entrenamiento. Tu única tarea es la nutrición.

        RESPONDE ÚNICAMENTE EN FORMATO JSON (No agregues otras claves):
        {
            "nutrition_plan": "Markdown detallado del plan nutricional clínico siguiendo la estructura."
        }
        `;

		try {
			const completion = await openai.chat.completions.create({
				messages: [
					{ role: "system", content: SYSTEM_PROMPT },
					{ role: "user", content: planPrompt }
				],
				model: REASONING_MODEL,
				response_format: { type: "json_object" }
			});

			const content = completion.choices[0].message.content;
			return JSON.parse(content);
		} catch (primaryError) {
			console.warn(`Primary model ${REASONING_MODEL} failed, switching to fallback(gpt-4o). Error: `, primaryError);

			// Fallback to GPT-4o
			const fallbackCompletion = await openai.chat.completions.create({
				messages: [
					{ role: "system", content: SYSTEM_PROMPT },
					{ role: "user", content: planPrompt }
				],
				model: "gpt-4o",
				response_format: { type: "json_object" }
			});

			const content = fallbackCompletion.choices[0].message.content;
			return JSON.parse(content);
		}

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
		const analysisPrompt = "";

		const completion = await openai.chat.completions.create({
			messages: [
				{ role: "system", content: "" },
				{ role: "user", content: analysisPrompt }
			],
			model: REASONING_MODEL
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
        ${SYSTEM_PROMPT}
        
        Estás en un CHAT DE ASISTENCIA NUTRICIONAL.
        Alumno: ${studentData.full_name}
        Meta: ${studentData.goal}
        Macros: ${macros.calories}kcal (P:${macros.protein}g, G:${macros.fat}g, C:${macros.carbs}g)
        Usa Whey Protein: ${macros.useWhey ? 'SÍ' : 'NO'}

        Responde dudas, ajusta platos o sugiere cambios SIEMPRE respetando las porciones isocalóricas.
        
        REGLA DE RESPUESTA:
        - Si el usuario pide un menú o ajuste de comida, responde indicando PRIMERO las porciones (ej: '1 porción de proteína').
        - El usuario tiene la tabla de equivalencias para saber qué comer, tú solo das la fórmula de porciones por comida.
        `;

		const messages = [
			{ role: "system", content: systemPrompt },
			...chatHistory.map(m => ({ role: m.role, content: m.content }))
		];

		try {
			const completion = await openai.chat.completions.create({
				messages: messages,
				model: REASONING_MODEL
			});

			return completion.choices[0].message.content;
		} catch (primaryError) {
			console.warn(`Diet Chat: Primary model ${REASONING_MODEL} failed, switching to fallback(gpt-4o). Error: `, primaryError);

			const fallbackCompletion = await openai.chat.completions.create({
				messages: messages,
				model: "gpt-4o"
			});

			return fallbackCompletion.choices[0].message.content;
		}
	} catch (error) {
		console.error("Diet Chat Error:", error);
		throw error;
	}
};

export const chatTrainingAssistant = async (chatHistory, studentData, trainingData) => {
	if (!apiKey) throw new Error("OpenAI API Key not configured");

	try {
		const systemPrompt = `
		Eres un Especialista de Élite en Entrenamiento de Fuerza e Hipertrofia.
		Alumno: ${studentData.full_name}
		Objetivo Físico: ${studentData.goal}
		Sexo: ${studentData.sex || 'No especificado'}
		Nivel de Experiencia: ${trainingData.experience || 'Intermedio'}
		Días de Entrenamiento: ${trainingData.daysPerWeek || 4} días a la semana
		Tipo de Rutina (Split): ${trainingData.split || 'PPL'}
		Volumen de Ejercicios: ${trainingData.volume || 'Medio (6-7)'} ejercicios por sesión de entrenamiento.

		INSTRUCCIONES CRÍTICAS:
		1. Diseña la rutina de entrenamiento cumpliendo EXACTAMENTE con los Días de Entrenamiento y el Tipo de Rutina solicitados.
		2. El número de ejercicios por día de entrenamiento DEBE coincidir con el Volumen de Ejercicios solicitado (${trainingData.volume}). Por ejemplo, si es "Bajo (4-5)", no pongas 6 ejercicios.
		3. Para cada ejercicio especifica: Nombre, Series (Sets), Repeticiones (Reps) y Descanso (Rest).
		4. Si el alumno tiene un enfoque extra deportivo (${trainingData.extraSport || 'ninguno'}), adapta la selección de ejercicios o agrega trabajo específico para mejorar en esa disciplina sin descuidar el objetivo principal de hipertrofia/fuerza.
		5. Formatea la respuesta estrictamente en Markdown, usando ## para cada Día de Entrenamiento, listas para los ejercicios, y tablas si lo consideras visualmente más claro.
		6. NO hables sobre nutrición ni dietas. Tu única y exclusiva labor es diseñar el protocolo de entrenamiento en el gimnasio.
		`;

		const messages = [
			{ role: "system", content: systemPrompt },
			...chatHistory.map(m => ({ role: m.role, content: m.content }))
		];

		try {
			const completion = await openai.chat.completions.create({
				messages: messages,
				model: REASONING_MODEL
			});

			return completion.choices[0].message.content;
		} catch (primaryError) {
			console.warn(`Training Chat fallback: `, primaryError);

			const fallbackCompletion = await openai.chat.completions.create({
				messages: messages,
				model: "gpt-4o"
			});

			return fallbackCompletion.choices[0].message.content;
		}
	} catch (error) {
		console.error("Training Chat Error:", error);
		throw error;
	}
};

/**
 * Chat interactivo para editar una Rutina de Entrenamiento existente
 */
export const chatEditTraining = async (chatHistory, currentRoutineText) => {
	if (!apiKey) throw new Error("OpenAI API Key not configured");

	try {
		const systemPrompt = `
		Eres un Especialista de Élite en Entrenamiento de Fuerza e Hipertrofia.
		El usuario te proporcionará un plan de entrenamiento previamente generado (Rutina Actual) y solicitará modificaciones (ej: "Sube el volumen", "Cambia estos ejercicios por otra variación", "Baja la intensidad", etc.).

		INSTRUCCIONES CRÍTICAS:
		1. Mantén intacta la estructura base de la rutina (títulos con ##, listas, fomato Markdown) a menos que se te pida explícitamente alterarla.
		2. Aplica exactamente los cambios que pida el usuario. Si pide más "volumen", agrega inteligentemente 1 o 2 ejercicios coherentes al día. Si pide "cambiar ejercicio", propón un ejercicio biomecánicamente similar.
		3. ENTREGA ÚNICAMENTE LA RUTINA COMPLETA MODIFICADA EN FORMATO MARKDOWN.
		4. NO TE COMUNIQUES CON EL USUARIO. Cero saludos, cero explicaciones, cero notas adicionales. Inicia directamente con el título de la rutina y devuélvela completa.
		`;

		const messages = [
			{ role: "system", content: systemPrompt },
			{ role: "assistant", content: "Entendido, devolveré únicamente la rutina completa en formato Markdown con las modificaciones aplicadas." },
			{ role: "user", content: `## RUTINA ACTUAL:\n\n${currentRoutineText}\n\n---\nPor favor, responde a mis últimos mensajes listados a continuación, y basándote en ellos DEBUELVE EL CÓDIGO MARKDOWN de la rutina actualizada.` },
			...chatHistory.map(m => ({ role: m.role, content: m.content }))
		];

		try {
			const completion = await openai.chat.completions.create({
				messages: messages,
				model: REASONING_MODEL
			});

			return completion.choices[0].message.content;
		} catch (primaryError) {
			console.warn(`Edit Training Chat fallback: `, primaryError);
			const fallbackCompletion = await openai.chat.completions.create({
				messages: messages,
				model: "gpt-4o"
			});
			return fallbackCompletion.choices[0].message.content;
		}
	} catch (error) {
		console.error("Edit Training Chat Error:", error);
		throw error;
	}
};


/**
 * Generates persuasive copy for Ad Creatives (Before/After)
 */
export const generateAdCopy = async (context, settings = {}) => {
	try {
		const prompt = "";

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
		const prompt = "";

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
		const prompt = "";

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

/**
 * Analiza composición corporal a partir de una foto usando Vision AI
 */
export const analyzeBodyComposition = async (imageBase64, studentData, previousAnalyses = []) => {
	if (!apiKey) throw new Error("OpenAI API Key not configured");

	try {
		const previousContext = previousAnalyses.length > 0
			? `\nANÁLISIS ANTERIORES(del más reciente al más antiguo): \n${previousAnalyses.map((a, i) =>
				`- Foto ${i + 1} (${a.photo_date}): Grasa estimada: ${a.ai_analysis?.body_fat_estimated || 'N/A'}%, Nota: ${a.ai_analysis?.summary || 'Sin análisis'}`
			).join('\n')
			} `
			: '\nEsta es la PRIMERA foto del alumno. No hay análisis anteriores para comparar.';

		const systemPrompt = "";

		const messages = [
			{ role: "system", content: systemPrompt },
			{
				role: "user",
				content: [
					{ type: "text", text: "" },
					{
						type: "image_url",
						image_url: {
							url: imageBase64.startsWith('data:') ? imageBase64 : `data: image / jpeg; base64, ${imageBase64} `,
							detail: "high"
						}
					}
				]
			}
		];

		const completion = await openai.chat.completions.create({
			messages: messages,
			model: "gpt-4o",
			max_tokens: 1500
		});

		const content = completion.choices[0].message.content;
		// Intentar parsear JSON limpiando posibles markdown wrappers
		const cleanJson = content.replace(/```json\n ? /g, '').replace(/```\n?/g, '').trim();
		return JSON.parse(cleanJson);

	} catch (error) {
		console.error("Body Composition Analysis Error:", error);
		throw error;
	}
};
