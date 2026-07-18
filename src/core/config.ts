import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ConfigError } from './errors.js';
import type { BaabConfig } from './types.js';
import { SPEC_VERSION } from './types.js';

export const CONFIG_FILENAME = 'baab.config.json';
export const STATE_DIR = '.baab';

const DEFAULT_TYPES = [
  'entity',
  'client',
  'project',
  'app',
  'runbook',
  'concept',
  'index',
  'standard',
  'template',
];

const DEFAULT_STATUSES = ['active', 'staged', 'planned', 'deprecated', 'archived'];

/** The default governed-folder → kinds map for a fresh workspace. */
export const DEFAULT_FOLDERS: BaabConfig['folders'] = {
  registry: { kinds: ['entity'] },
  projects: { kinds: ['project'] },
  clients: { kinds: ['client'] },
  infrastructure: { kinds: ['app'] },
  operations: { kinds: [] },
  knowledge: { kinds: [] },
};

/** Build the default config object for a new workspace. */
export function defaultConfig(name: string, slug: string, createdWith: string): BaabConfig {
  return {
    $schema:
      'https://raw.githubusercontent.com/ohxhavel/baab-kit/main/schema/baab.config.schema.json',
    spec: SPEC_VERSION,
    name,
    slug,
    createdWith,
    folders: DEFAULT_FOLDERS,
    frontmatter: {
      types: DEFAULT_TYPES,
      statuses: DEFAULT_STATUSES,
    },
    validate: {
      ignore: ['inbox/**'],
    },
  };
}

/** Serialize a config to canonical JSON (2-space, trailing newline). */
export function serializeConfig(config: BaabConfig): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}

/** Validate a parsed config object, throwing ConfigError on any problem. */
export function validateConfig(raw: unknown): BaabConfig {
  if (typeof raw !== 'object' || raw === null) {
    throw new ConfigError('baab.config.json must be a JSON object.');
  }
  const c = raw as Record<string, unknown>;
  const required = ['spec', 'name', 'slug', 'folders', 'frontmatter'] as const;
  for (const key of required) {
    if (!(key in c)) throw new ConfigError(`baab.config.json is missing required key "${key}".`);
  }
  if (typeof c.spec !== 'number') {
    throw new ConfigError('baab.config.json "spec" must be a number.');
  }
  if (c.spec > SPEC_VERSION) {
    throw new ConfigError(
      `Workspace spec version ${c.spec} is newer than this baab (${SPEC_VERSION}). Upgrade the CLI.`,
    );
  }
  if (typeof c.name !== 'string' || typeof c.slug !== 'string') {
    throw new ConfigError('baab.config.json "name" and "slug" must be strings.');
  }
  const fm = c.frontmatter as Record<string, unknown> | undefined;
  if (!fm || !Array.isArray(fm.types) || !Array.isArray(fm.statuses)) {
    throw new ConfigError('baab.config.json "frontmatter.types" and ".statuses" must be arrays.');
  }
  // Fill defaults for optional fields.
  const config: BaabConfig = {
    $schema: typeof c.$schema === 'string' ? c.$schema : undefined,
    spec: c.spec,
    name: c.name,
    slug: c.slug,
    createdWith: typeof c.createdWith === 'string' ? c.createdWith : 'unknown',
    folders: (c.folders as BaabConfig['folders']) ?? DEFAULT_FOLDERS,
    frontmatter: {
      types: fm.types as string[],
      statuses: fm.statuses as string[],
    },
    validate: {
      ignore: (c.validate as { ignore?: string[] } | undefined)?.ignore ?? ['inbox/**'],
    },
  };
  return config;
}

/** Read and validate the config at a workspace root. */
export async function readConfig(root: string): Promise<BaabConfig> {
  const file = path.join(root, CONFIG_FILENAME);
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    throw new ConfigError(`Cannot read ${file}.`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new ConfigError(`baab.config.json is not valid JSON: ${(err as Error).message}`);
  }
  return validateConfig(parsed);
}
