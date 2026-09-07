import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from './secretManager.js';

let cachedClient = null;

export async function getGeminiClient() {
  if (cachedClient) return cachedClient;
  const apiKey = await getGeminiApiKey();
  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
