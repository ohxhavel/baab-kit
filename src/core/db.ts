import { createRequire } from 'node:module';
import { SqliteUnavailableError } from './errors.js';
import type { BaabDb, SqliteDriver } from './types.js';

const require = createRequire(import.meta.url);

/** Wrap better-sqlite3 (preferred: fast, prebuilt binaries) as a BaabDb. */
function openBetterSqlite(path: string): BaabDb | null {
  let Database: unknown;
  try {
    Database = require('better-sqlite3');
  } catch {
    return null;
  }
  // biome-ignore lint/suspicious/noExplicitAny: native module has no shipped types here.
  const Ctor = Database as any;
  const db = new Ctor(path);
  return {
    driver: 'better-sqlite3',
    exec: (sql) => db.exec(sql),
    run: (sql, params = []) => {
      db.prepare(sql).run(...params);
    },
    all: <T>(sql: string, params: unknown[] = []) => db.prepare(sql).all(...params) as T[],
    get: <T>(sql: string, params: unknown[] = []) =>
      db.prepare(sql).get(...params) as T | undefined,
    close: () => db.close(),
  };
}

/** Wrap node:sqlite (built in on Node >= 22.5, ships FTS5) as a BaabDb. */
function openNodeSqlite(path: string): BaabDb | null {
  let mod: unknown;
  try {
    mod = require('node:sqlite');
  } catch {
    return null;
  }
  // biome-ignore lint/suspicious/noExplicitAny: experimental built-in, types vary by Node version.
  const { DatabaseSync } = mod as any;
  if (!DatabaseSync) return null;
  const db = new DatabaseSync(path);
  return {
    driver: 'node:sqlite',
    exec: (sql) => db.exec(sql),
    run: (sql, params = []) => {
      db.prepare(sql).run(...params);
    },
    all: <T>(sql: string, params: unknown[] = []) => db.prepare(sql).all(...params) as T[],
    get: <T>(sql: string, params: unknown[] = []) =>
      db.prepare(sql).get(...params) as T | undefined,
    close: () => db.close(),
  };
}

/**
 * Open a SQLite database at `path`, preferring better-sqlite3 and falling back
 * to Node's built-in driver. Throws SqliteUnavailableError only when neither
 * backend is usable (Node < 22.5 whose better-sqlite3 build also failed).
 *
 * `BAAB_SQLITE_DRIVER=node|better` forces one backend — useful for testing the
 * fallback, or for users who want to avoid the native dependency entirely.
 */
export function openDb(path: string): BaabDb {
  const forced = process.env.BAAB_SQLITE_DRIVER;
  let db: BaabDb | null;
  if (forced === 'node') db = openNodeSqlite(path);
  else if (forced === 'better') db = openBetterSqlite(path);
  else db = openBetterSqlite(path) ?? openNodeSqlite(path);
  if (!db) throw new SqliteUnavailableError();
  return db;
}

/** Report which driver would be used without opening a file. */
export function detectDriver(): SqliteDriver | null {
  const forced = process.env.BAAB_SQLITE_DRIVER;
  if (forced === 'node') return 'node:sqlite';
  if (forced !== 'better') {
    try {
      require.resolve('better-sqlite3');
      return 'better-sqlite3';
    } catch {
      // fall through
    }
  } else {
    return 'better-sqlite3';
  }
  try {
    require('node:sqlite');
    return 'node:sqlite';
  } catch {
    return null;
  }
}
