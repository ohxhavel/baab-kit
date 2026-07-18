import { afterEach, describe, expect, it } from 'vitest';
import { detectDriver, openDb } from '../../src/core/db.js';

const original = process.env.BAAB_SQLITE_DRIVER;

afterEach(() => {
  // biome-ignore lint/performance/noDelete: unsetting an env var is the correct idiom here.
  if (original === undefined) delete process.env.BAAB_SQLITE_DRIVER;
  else process.env.BAAB_SQLITE_DRIVER = original;
});

/** Exercise the BaabDb wrapper (exec/run/all/get) incl. FTS5 through a driver. */
function roundTrip(): { title: string } | undefined {
  const db = openDb(':memory:');
  try {
    db.exec('CREATE VIRTUAL TABLE t USING fts5(title, body)');
    db.run('INSERT INTO t(rowid, title, body) VALUES (?,?,?)', [1, 'hello', 'world of baab']);
    return db.get<{ title: string }>("SELECT title FROM t WHERE t MATCH 'baab'");
  } finally {
    db.close();
  }
}

describe('db drivers', () => {
  it('detectDriver returns a usable driver', () => {
    expect(detectDriver()).not.toBeNull();
  });

  it('default openDb round-trips with FTS5', () => {
    expect(roundTrip()?.title).toBe('hello');
  });

  it('node:sqlite backend works when forced', () => {
    process.env.BAAB_SQLITE_DRIVER = 'node';
    const db = openDb(':memory:');
    expect(db.driver).toBe('node:sqlite');
    db.close();
    expect(roundTrip()?.title).toBe('hello');
  });

  it('better-sqlite3 backend works when forced (installed in dev/CI)', () => {
    process.env.BAAB_SQLITE_DRIVER = 'better';
    const db = openDb(':memory:');
    expect(db.driver).toBe('better-sqlite3');
    db.close();
  });
});
