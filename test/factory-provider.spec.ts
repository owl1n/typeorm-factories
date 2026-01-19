import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FactoryProvider } from '../src/factory.provider';
import * as path from 'path';

describe('FactoryProvider', () => {
  let provider: FactoryProvider;

  beforeEach(() => {
    provider = new FactoryProvider();
  });

  it('should load files matching pattern', () => {
    const files = provider.loadFiles(['test/**/*.spec.ts']);
    expect(files.length).toBeGreaterThan(0);
    expect(files.some((f) => f.includes('edge-cases.spec.ts'))).toBe(true);
  });

  it('should return empty array for non-matching pattern', () => {
    const files = provider.loadFiles(['non-existent-pattern/**/*.xyz']);
    expect(files).toEqual([]);
  });

  it('should handle multiple patterns', () => {
    const files = provider.loadFiles([
      'test/sequences.spec.ts',
      'test/states.spec.ts',
    ]);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should import files', () => {
    // importFiles uses require which has side effects
    // We just verify it returns and handles empty array
    const result = provider.importFiles([]);
    expect(result).toBeUndefined();
  });
});
