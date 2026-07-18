// Shared type surface for the BaaB SDK. Everything a consumer touches lives here.

/** The workspace-spec version this SDK writes and understands. */
export const SPEC_VERSION = 1;

/** Frontmatter document types shipped by default. Extensible via config. */
export type DocType =
  | 'entity'
  | 'client'
  | 'project'
  | 'app'
  | 'runbook'
  | 'concept'
  | 'index'
  | 'standard'
  | 'template';

/** Lifecycle status shipped by default. Extensible via config. */
export type DocStatus = 'active' | 'staged' | 'planned' | 'deprecated' | 'archived';

/** A kind that can be spawned with `baab new`. */
export type Kind = 'entity' | 'project' | 'client' | 'app';

/** Per-folder configuration in baab.config.json. */
export interface FolderConfig {
  /** Kinds that may be spawned into this folder (empty = free-form area). */
  kinds: Kind[];
}

/** The workspace manifest — baab.config.json at the workspace root. */
export interface BaabConfig {
  $schema?: string;
  /** Workspace-spec version. */
  spec: number;
  /** Display name. */
  name: string;
  /** URL/path-safe slug. */
  slug: string;
  /** The `baab` version that created the workspace. */
  createdWith: string;
  /** Governed folders → which kinds spawn there. */
  folders: Record<string, FolderConfig>;
  /** Enum configuration (extensible). */
  frontmatter: {
    types: string[];
    statuses: string[];
  };
  /** Validation configuration. */
  validate: {
    /** Glob patterns exempt from frontmatter/validation rules. */
    ignore: string[];
  };
}

/** A loaded, resolved workspace handle. */
export interface Workspace {
  /** Absolute path to the workspace root. */
  root: string;
  /** Parsed manifest. */
  config: BaabConfig;
  /** Absolute path to the SQLite index (may not exist yet). */
  dbPath: string;
  /** Absolute path to the derived-state dir (.baab). */
  stateDir: string;
}

/** Parsed markdown document. */
export interface ParsedDoc {
  /** Absolute path. */
  path: string;
  /** Workspace-relative posix path (set when parsed via the indexer). */
  relPath?: string;
  /** Raw frontmatter object. */
  frontmatter: Record<string, unknown>;
  /** Markdown body (frontmatter stripped). */
  body: string;
  /** Best-effort title: frontmatter title, first H1, or filename. */
  title: string;
}

/** A link extracted from a document body. */
export interface RawLink {
  /** Target as written: `foo`, `foo|alias`, or `./foo.md`. */
  target: string;
  kind: 'wikilink' | 'markdown';
}

/** A resolved link with its destination (or null if broken). */
export interface ResolvedLink extends RawLink {
  sourcePath: string;
  resolvedPath: string | null;
}

/** Template variables interpolated into rendered files and filenames. */
export interface TemplateVars {
  name: string;
  slug: string;
  id: string;
  date: string;
  year: string;
  kind: string;
  [key: string]: string;
}

/** Result of `createWorkspace`. */
export interface InitResult {
  root: string;
  filesCreated: string[];
  gitInitialized: boolean;
  indexStats: IndexStats;
}

/** Result of `spawnFromTemplate`. */
export interface SpawnResult {
  kind: Kind;
  slug: string;
  targetDir: string;
  filesCreated: string[];
}

/** Result of registry regeneration. */
export interface RegistryResult {
  /** Folders whose _registry.md was regenerated. */
  folders: string[];
  /** Total rows written across all registries. */
  rows: number;
}

/** Statistics from a full index build. */
export interface IndexStats {
  driver: SqliteDriver;
  documents: number;
  links: number;
  brokenLinks: number;
  registries: RegistryResult;
  builtAt: string;
}

/** A single full-text search result. */
export interface SearchHit {
  path: string;
  docId: string | null;
  title: string;
  type: string | null;
  snippet: string;
  rank: number;
}

/** Options for a search query. */
export interface SearchOptions {
  type?: string;
  tag?: string;
  status?: string;
  limit?: number;
}

/** A validation finding. */
export interface Diagnostic {
  /** Rule id, e.g. "BAAB001". */
  rule: string;
  severity: 'error' | 'warning';
  /** Workspace-relative posix path (or '.' for workspace-wide). */
  path: string;
  line?: number;
  message: string;
}

/** Workspace overview. */
export interface WorkspaceStatus {
  name: string;
  slug: string;
  root: string;
  counts: {
    documents: number;
    entities: number;
    projects: number;
    clients: number;
    apps: number;
  };
  index: {
    exists: boolean;
    builtAt: string | null;
    /** True when the newest markdown mtime is later than the index build time. */
    stale: boolean;
    driver: SqliteDriver | null;
  };
  validation: {
    errors: number;
    warnings: number;
  };
}

/** Which SQLite backend is in use. */
export type SqliteDriver = 'better-sqlite3' | 'node:sqlite';

/** Minimal database interface both drivers satisfy. */
export interface BaabDb {
  driver: SqliteDriver;
  exec(sql: string): void;
  /** Run a statement with positional params, returning no rows. */
  run(sql: string, params?: unknown[]): void;
  /** Return all rows for a query. */
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): T[];
  /** Return the first row for a query, or undefined. */
  get<T = Record<string, unknown>>(sql: string, params?: unknown[]): T | undefined;
  close(): void;
}
