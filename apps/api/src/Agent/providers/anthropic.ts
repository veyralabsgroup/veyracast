import Anthropic from '@anthropic-ai/sdk';
import logger from '../../config/logger';
import type { InstagramCommentSchema } from '../schema';
import type { AIProvider } from './types';
import { wrapForResponseFormat } from './schema-adapt';

const DEFAULT_MODEL = 'claude-opus-4-8';

// Claude provider. Constrains output to the schema with structured outputs
// so we don't rely on prompt wording or fragile parsing.
export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  private client: Anthropic;
  private model: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    this.client = new Anthropic({ apiKey });
    this.model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  }

  async generateJSON(schema: InstagramCommentSchema, prompt: string): Promise<unknown> {
    const { schema: responseSchema, unwrap } = wrapForResponseFormat(schema);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 16000,
      output_config: { format: { type: 'json_schema', schema: responseSchema } },
      messages: [{ role: 'user', content: prompt }],
    });

    if (response.stop_reason === 'refusal') {
      logger.error(
        `Anthropic declined the request (${response.stop_details?.category ?? 'unknown'}).`,
      );
      return 'Service unavailable!';
    }

    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') {
      logger.info('No text content in Anthropic response.');
      return 'Service unavailable!';
    }

    try {
      return unwrap(JSON.parse(text.text));
    } catch (err) {
      logger.error('Failed to parse Anthropic response as JSON:', err);
      return 'Error: Invalid JSON response from AI model.';
    }
  }
}
