import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getAIResponse = async (message: string, context: string = ''): Promise<string> => {
  if (!apiKey) {
    return "I'm sorry, I can't connect to my brain right now. Please check the API key configuration.";
  }

  try {
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are "Horizon AI", a helpful and encouraging Learning & Development assistant for an employee portal.
    Your goal is to help employees find trainings, summarize learning topics, and suggest skills to improve.
    Keep answers concise, professional, and friendly.
    
    Context about the current user and platform:
    ${context}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: message,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "I'm having trouble processing that request.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error while thinking about your request.";
  }
};
