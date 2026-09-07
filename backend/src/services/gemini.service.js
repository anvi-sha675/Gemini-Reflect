import { getGeminiClient, GEMINI_MODEL } from '../config/gemini.js';
import {
  JOURNAL_SYSTEM_INSTRUCTION,
  SUMMARY_INSTRUCTION,
  INSIGHTS_INSTRUCTION,
  GROWTH_TIMELINE_INSTRUCTION,
} from '../utils/promptTemplates.js';

function toGenaiHistory(messages) {
  // messages: [{role: 'user'|'model', content: string}, ...]
  return messages.map((m) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

async function withRetry(fn, attempts = 2) {
  let lastErr;
  for (let i = 0; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts) await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastErr;
}

export async function sendJournalMessage(priorMessages, newUserMessage) {
  const ai = await getGeminiClient();

  const chat = ai.chats.create({
    model: GEMINI_MODEL,
    config: { systemInstruction: JOURNAL_SYSTEM_INSTRUCTION },
    history: toGenaiHistory(priorMessages),
  });

  const response = await withRetry(() => chat.sendMessage({ message: newUserMessage }));
  return response.text;
}

function parseJsonResponse(text) {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned);
}

export async function generateJournalSummary(messages) {
  const ai = await getGeminiClient();

  const transcript = messages.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: transcript,
      config: {
        systemInstruction: SUMMARY_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    })
  );
  const raw = response.text;

  try {
    return parseJsonResponse(raw);
  } catch {
    return {
      title: 'Reflection Session',
      overview: raw.slice(0, 500),
      themes: [],
      mood: 'Reflective',
      takeaways: [],
      actionItems: [],
    };
  }
}

export async function generatePersonalInsights(pastSummaries) {
  const ai = await getGeminiClient();

  const payload = JSON.stringify(
    pastSummaries.map((s) => ({
      title: s.title,
      themes: s.themes,
      mood: s.mood,
      takeaways: s.takeaways,
      date: s.updatedAt,
    }))
  );

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: payload,
      config: {
        systemInstruction: INSIGHTS_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    })
  );
  const raw = response.text;

  try {
    return parseJsonResponse(raw);
  } catch {
    return {
      recurringThemes: [],
      recurringChallenges: [],
      growthSignals: [],
      suggestedFocus: 'Keep journaling regularly to unlock more personalized insights.',
    };
  }
}

export async function generateGrowthSignals(entries) {
  const ai = await getGeminiClient();

  const payload = JSON.stringify(
    entries.map((e, index) => ({
      index,
      title: e.title,
      summary: e.summary,
      themes: e.themes,
      mood: e.mood,
    }))
  );

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: payload,
      config: {
        systemInstruction: GROWTH_TIMELINE_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    })
  );
  const raw = response.text;

  try {
    const parsed = parseJsonResponse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
