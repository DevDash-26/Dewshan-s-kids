import { GoogleGenAI } from '@google/genai';

export const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export const isGeminiConfigured = Boolean(geminiApiKey && geminiApiKey.trim().length > 0);

export async function askGemini(question: string) {
  if (!isGeminiConfigured) {
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey! });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: question,
  });

  const text = response.text ?? 'I am not able to answer this right now.';
  return text.trim();
}
