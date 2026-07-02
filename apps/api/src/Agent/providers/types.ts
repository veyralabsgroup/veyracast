import type { InstagramCommentSchema } from '../schema';

// A content-generation backend: takes a schema and prompt, returns the parsed
// JSON the model produced. Each implementation owns its auth, model, and retries.
export interface AIProvider {
  readonly name: string;
  generateJSON(schema: InstagramCommentSchema, prompt: string): Promise<unknown>;
}

export type ProviderName = 'anthropic' | 'gemini';
