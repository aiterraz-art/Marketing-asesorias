export const sendChatMessage = async (messages) => {
    const webhookUrl = import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL || import.meta.env.VITE_N8N_WEBHOOK_URL;

    if (!webhookUrl) {
        console.error("n8n Chat Webhook URL not configured");
        // Mock response
        return new Promise(resolve => setTimeout(() => resolve({
            response: "¡Hola! Soy tu asistente de marketing. Puedo ayudarte a planificar tu semana. ¿Qué objetivo tienes para estos días?",
            suggestedActions: ["Planificar Semana", "Analizar Métricas", "Ideas para Reels"]
        }), 1000));
    }

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages }),
        });

        if (!response.ok) throw new Error(`n8n webhook failed: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("Error sending chat message:", error);
        throw error;
    }
};
