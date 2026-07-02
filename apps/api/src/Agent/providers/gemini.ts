import { GoogleGenAI } from '@google/genai';
import logger from '../../config/logger';
import { geminiApiKeys } from '../../secret';
import { handleError } from '../../utils';
import type { InstagramCommentSchema } from '../schema';
import type { AIProvider } from './types';

// Gemini provider: JSON-mode generation with API-key rotation on rate limits.
// triedKeys is per-call so concurrent requests don't interfere.
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';

  async generateJSON(schema: InstagramCommentSchema, prompt: string): Promise<unknown> {
    return runGemini(schema, prompt, 0, new Set());
  }
}

async function runGemini(
  schema: InstagramCommentSchema,
  prompt: string,
  apiKeyIndex: number = 0,
  triedKeys: Set<number> = new Set(),
): Promise<unknown> {
  const geminiApiKey = geminiApiKeys[apiKeyIndex];

  if (!geminiApiKey) {
    logger.error('No valid Gemini API key available.');
    return 'No API key available.';
  }

  const generationConfig = {
    responseMimeType: 'application/json',
    responseJsonSchema: schema,
  };

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: generationConfig,
    });

    if (!result || !result.text) {
      logger.info('No response received from the AI model. || Service Unavailable');
      return 'Service unavailable!';
    }

    try {
      return JSON.parse(result.text);
    } catch (parseError) {
      logger.error('Failed to parse AI response as JSON:', parseError);
      return 'Error: Invalid JSON response from AI model.';
    }
  } catch (error: any) {
    if (
      error instanceof Error &&
      (error.message.includes('429') ||
        error.message.toLowerCase().includes('resource_exhausted') ||
        error.message.toLowerCase().includes('rate limit'))
    ) {
      logger.error(
        `---GEMINI_API_KEY_${apiKeyIndex + 1} limit exhausted, switching to the next API key...`,
      );
      triedKeys.add(apiKeyIndex);
      if (triedKeys.size >= geminiApiKeys.length) {
        return 'Error: All API keys have reached their rate limits. Please try again later.';
      }
      const nextIndex = (apiKeyIndex + 1) % geminiApiKeys.length;
      return runGemini(schema, prompt, nextIndex, triedKeys);
    }
    return handleError(error, apiKeyIndex, schema, prompt, runGemini, 0, triedKeys);
  }
}
