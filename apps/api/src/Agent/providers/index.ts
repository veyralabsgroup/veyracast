import logger from '../../config/logger';
import type { AIProvider, ProviderName } from './types';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';

export type { AIProvider, ProviderName } from './types';

let cached: AIProvider | undefined;

// Resolves the provider from AI_PROVIDER (default anthropic). Cached after first call.
export function getProvider(): AIProvider {
  if (cached) return cached;

  const name = (process.env.AI_PROVIDER || 'anthropic').toLowerCase() as ProviderName;
  switch (name) {
    case 'gemini':
      cached = new GeminiProvider();
      break;
    case 'anthropic':
      cached = new AnthropicProvider();
      break;
    default:
      logger.warn(`Unknown AI_PROVIDER "${name}", falling back to anthropic.`);
      cached = new AnthropicProvider();
  }

  logger.info(`AI provider: ${cached.name}`);
  return cached;
}
