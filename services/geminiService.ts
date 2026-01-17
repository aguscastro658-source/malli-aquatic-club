
import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateAIResponse = async (prompt: string, history: any[] = []): Promise<{text: string, sources?: any[]}> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: "Eres el Asistente de MALLI AQUATIC CLUB. Ayuda con información de las 'piletas' (usa solo esa palabra). Si te preguntan por el clima o eventos actuales, usa la búsqueda de Google. Reglas del sorteo: 15 participantes o 22:00hs. Sé amable.",
        temperature: 0.7,
        tools: [{ googleSearch: {} }]
      },
    });
    
    const text = response.text || "Lo siento, no puedo responder eso ahora.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { text, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Error de conexión con el centro de mando de las piletas." };
  }
};
