// BaaB SDK — the programmatic surface. The CLI is a thin layer over exactly this.

export { SPEC_VERSION } from './core/types.js';
export type {
  BaabConfig,
  BaabDb,
  Diagnostic,
  DocStatus,
  DocType,
  FolderConfig,
  IndexStats,
  InitResult,
  Kind,
  ParsedDoc,
  RawLink,
  RegistryResult,
  ResolvedLink,
  SearchHit,
  SearchOptions,
  SpawnResult,
  SqliteDriver,
  TemplateVars,
  Workspace,
  WorkspaceStatus,
} from './core/types.js';

export {
  BaabError,
  ConfigError,
  DuplicateIdError,
  InvalidSlugError,
  NotAWorkspaceError,
  SqliteUnavailableError,
  TemplateNotFoundError,
  UnknownKindError,
  WorkspaceExistsError,
} from './core/errors.js';

export {
  CONFIG_FILENAME,
  DEFAULT_FOLDERS,
  STATE_DIR,
  defaultConfig,
  readConfig,
  serializeConfig,
  validateConfig,
} from './core/config.js';

export { findWorkspaceRoot, loadWorkspace } from './core/workspace.js';
export { parseDoc, serializeDoc, hasFrontmatter } from './core/frontmatter.js';
export { isValidSlug, isValidFilename, slugify } from './core/naming.js';
export { extractLinks, resolveLink } from './core/links.js';
export { scanDocs, newestMtime, type ScannedDoc } from './core/scan.js';

export { createWorkspace, type InitOptions } from './core/scaffold.js';
export {
  spawnFromTemplate,
  folderForKind,
  knownKinds,
  type SpawnOptions,
} from './core/spawn.js';
export { buildIndex } from './core/indexer.js';
export { updateRegistries } from './core/registry.js';
export { search, toMatchExpr } from './core/search.js';
export { validate, type ValidateOptions } from './core/validate/index.js';
export { getStatus } from './core/status.js';
export { openDb, detectDriver } from './core/db.js';
export { baabVersion } from './core/version.js';
