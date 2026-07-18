import { describe, expect, it } from 'vitest';
import { defaultConfig, validateConfig } from '../../src/core/config.js';
import { ConfigError } from '../../src/core/errors.js';
import { SPEC_VERSION } from '../../src/core/types.js';

describe('validateConfig', () => {
  const base = defaultConfig('Acme', 'acme', 'baab@test');

  it('accepts a default config', () => {
    expect(() => validateConfig(base)).not.toThrow();
  });

  it('defaults a missing validate block', () => {
    const { validate: _omit, ...withoutValidate } = base;
    const cfg = validateConfig(withoutValidate);
    expect(cfg.validate?.ignore).toEqual(['inbox/**']);
  });

  it('defaults a missing createdWith', () => {
    const { createdWith: _omit, ...withoutCreatedWith } = base;
    const cfg = validateConfig(withoutCreatedWith);
    expect(cfg.createdWith).toBe('unknown');
  });

  it('throws when a required key is missing', () => {
    const { folders: _omit, ...noFolders } = base;
    expect(() => validateConfig(noFolders)).toThrow(ConfigError);
  });

  it('throws when the spec is newer than this CLI', () => {
    expect(() => validateConfig({ ...base, spec: SPEC_VERSION + 1 })).toThrow(ConfigError);
  });

  it('rejects a non-object', () => {
    expect(() => validateConfig(null)).toThrow(ConfigError);
  });
});
