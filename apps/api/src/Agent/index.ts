import logger from '../config/logger';
import { InstagramCommentSchema } from './schema';
import { getProvider } from './providers';
import fs from 'fs';
import path from 'path';

// Delegates to the configured content provider (AI_PROVIDER; Claude by default).
export async function runAgent(schema: InstagramCommentSchema, prompt: string): Promise<any> {
  return getProvider().generateJSON(schema, prompt);
}

// Loads the first character profile from Agent/characters.
export function chooseCharacter(): any {
  const buildPath = path.join(__dirname, 'characters');
  const charactersDir = fs.existsSync(buildPath)
    ? buildPath
    : path.join(process.cwd(), 'src', 'Agent', 'characters');

  const jsonFiles = fs.readdirSync(charactersDir).filter((file) => file.endsWith('.json'));
  if (jsonFiles.length === 0) {
    throw new Error(`No character profiles found in ${charactersDir}`);
  }

  const chosenFile = jsonFiles[0];
  const character = JSON.parse(fs.readFileSync(path.join(charactersDir, chosenFile), 'utf8'));
  const name = character?.name ?? chosenFile;
  logger.info(`Character loaded: ${name} [${chosenFile}]`);
  return character;
}

export function initAgent(): any {
  try {
    return chooseCharacter();
  } catch (error) {
    logger.error('Error selecting character:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  initAgent();
}
