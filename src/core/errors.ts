// Typed error hierarchy. Every thrown error a consumer can reasonably catch is a
// BaabError subclass with a stable `code`, so the CLI can format and the SDK can branch.

export class BaabError extends Error {
  /** Stable machine-readable code, e.g. "NOT_A_WORKSPACE". */
  readonly code: string;
  /** Optional remediation hint shown to users. */
  readonly hint?: string;

  constructor(message: string, code: string, hint?: string) {
    super(message);
    this.name = 'BaabError';
    this.code = code;
    this.hint = hint;
  }
}

export class NotAWorkspaceError extends BaabError {
  constructor(cwd: string) {
    super(
      `No baab.config.json found in ${cwd} or any parent directory.`,
      'NOT_A_WORKSPACE',
      'Run `baab init <name>` to create a workspace, or cd into an existing one.',
    );
    this.name = 'NotAWorkspaceError';
  }
}

export class WorkspaceExistsError extends BaabError {
  constructor(dir: string) {
    super(
      `Target directory is not empty: ${dir}`,
      'WORKSPACE_EXISTS',
      'Choose an empty directory or a new name, or pass --dir to a fresh path.',
    );
    this.name = 'WorkspaceExistsError';
  }
}

export class InvalidSlugError extends BaabError {
  constructor(slug: string) {
    super(
      `Invalid slug: "${slug}". Use lowercase letters, digits, and hyphens; no leading underscore or numeric-only prefix.`,
      'INVALID_SLUG',
      'Example: acme-corp, q3-launch, north-region.',
    );
    this.name = 'InvalidSlugError';
  }
}

export class DuplicateIdError extends BaabError {
  constructor(id: string, existingPath: string) {
    super(
      `An entry with id "${id}" already exists at ${existingPath}.`,
      'DUPLICATE_ID',
      'Ids must be unique across the workspace. Pick a different slug.',
    );
    this.name = 'DuplicateIdError';
  }
}

export class UnknownKindError extends BaabError {
  constructor(kind: string, known: string[]) {
    super(
      `Unknown kind "${kind}". Known kinds: ${known.join(', ')}.`,
      'UNKNOWN_KIND',
      'See `baab new --help` or the folder→kind map in baab.config.json.',
    );
    this.name = 'UnknownKindError';
  }
}

export class TemplateNotFoundError extends BaabError {
  constructor(what: string) {
    super(`Template not found: ${what}`, 'TEMPLATE_NOT_FOUND');
    this.name = 'TemplateNotFoundError';
  }
}

export class SqliteUnavailableError extends BaabError {
  constructor() {
    super(
      'No SQLite backend available.',
      'SQLITE_UNAVAILABLE',
      'Upgrade to Node 22.5+ (built-in node:sqlite), or install build tools so the optional better-sqlite3 dependency can compile.',
    );
    this.name = 'SqliteUnavailableError';
  }
}

export class ConfigError extends BaabError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigError';
  }
}
