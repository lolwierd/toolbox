import { describe, it, expect, vi } from 'vitest';
import { textDiff } from '../text-diff';
import { jsonDiff } from '../json-diff';
import { yamlDiff } from '../yaml-diff';
import { csvDiff } from '../csv-diff';

const mockContext = {
  signal: new AbortController().signal,
  onProgress: vi.fn(),
};

describe('textDiff', () => {
  it('returns no differences for identical texts', async () => {
    const input = {
      original: 'hello world',
      modified: 'hello world'
    };
    const result = await textDiff.runBrowser!(mockContext, input, { ignoreWhitespace: false, ignoreCase: false });
    expect(result).toBe('  hello world');
  });

  it('shows + and - lines for different texts', async () => {
    const input = {
      original: 'line one\nline two',
      modified: 'line one\nline three'
    };
    const result = await textDiff.runBrowser!(mockContext, input, { ignoreWhitespace: false, ignoreCase: false });
    expect(result).toContain('  line one');
    expect(result).toContain('- line two');
    expect(result).toContain('+ line three');
  });

  it('ignoreWhitespace option works', async () => {
    const input = {
      original: '  hello  ',
      modified: 'hello'
    };
    const result = await textDiff.runBrowser!(mockContext, input, { ignoreWhitespace: true, ignoreCase: false });
    expect(result).toBe('  hello');
  });

  it('ignoreCase option works', async () => {
    const input = {
      original: 'HELLO',
      modified: 'hello'
    };
    const result = await textDiff.runBrowser!(mockContext, input, { ignoreWhitespace: false, ignoreCase: true });
    expect(result).toBe('  hello');
  });

  it('handles multiple lines added', async () => {
    const input = {
      original: 'line one',
      modified: 'line one\nline two\nline three'
    };
    const result = await textDiff.runBrowser!(mockContext, input, { ignoreWhitespace: false, ignoreCase: false });
    expect(result).toContain('  line one');
    expect(result).toContain('+ line two');
    expect(result).toContain('+ line three');
  });

  it('handles multiple lines removed', async () => {
    const input = {
      original: 'line one\nline two\nline three',
      modified: 'line one'
    };
    const result = await textDiff.runBrowser!(mockContext, input, { ignoreWhitespace: false, ignoreCase: false });
    expect(result).toContain('  line one');
    expect(result).toContain('- line two');
    expect(result).toContain('- line three');
  });
});

describe('jsonDiff', () => {
  it('returns no differences for identical JSON', async () => {
    const input = {
      original: '{\"name\": \"test\", \"value\": 123}',
      modified: '{\"name\": \"test\", \"value\": 123}'
    };
    const result = await jsonDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toBe('✓ No differences found');
  });

  it('shows changed values', async () => {
    const input = {
      original: '{\"name\": \"old\"}',
      modified: '{\"name\": \"new\"}'
    };
    const result = await jsonDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toContain('~ name:');
    expect(result).toContain('"old"');
    expect(result).toContain('"new"');
  });

  it('shows added keys', async () => {
    const input = {
      original: '{\"a\": 1}',
      modified: '{\"a\": 1, \"b\": 2}'
    };
    const result = await jsonDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toContain('+ b: 2');
  });

  it('shows removed keys', async () => {
    const input = {
      original: '{\"a\": 1, \"b\": 2}',
      modified: '{\"a\": 1}'
    };
    const result = await jsonDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toContain('- b: 2');
  });

  it('handles nested object differences', async () => {
    const input = {
      original: '{\"user\": {\"name\": \"alice\", \"age\": 30}}',
      modified: '{\"user\": {\"name\": \"bob\", \"age\": 30}}'
    };
    const result = await jsonDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toContain('~ user.name:');
    expect(result).toContain('"alice"');
    expect(result).toContain('"bob"');
  });

  it('handles array differences', async () => {
    const input = {
      original: '{\"items\": [1, 2, 3]}',
      modified: '{\"items\": [1, 2, 4]}'
    };
    const result = await jsonDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toContain('items[2]');
  });

  it('throws error for invalid first JSON', async () => {
    const input = {
      original: 'not valid json',
      modified: '{\"valid\": true}'
    };
    await expect(
      jsonDiff.runBrowser!(mockContext, input, { sortKeys: true })
    ).rejects.toThrow('Original JSON is invalid');
  });

  it('throws error for invalid second JSON', async () => {
    const input = {
      original: '{\"valid\": true}',
      modified: 'not valid json'
    };
    await expect(
      jsonDiff.runBrowser!(mockContext, input, { sortKeys: true })
    ).rejects.toThrow('Modified JSON is invalid');
  });

  it('sortKeys option normalizes key order', async () => {
    const input = {
      original: '{\"b\": 1, \"a\": 2}',
      modified: '{\"a\": 2, \"b\": 1}'
    };
    const result = await jsonDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toBe('✓ No differences found');
  });
});

describe('yamlDiff', () => {
  it('returns no differences for identical YAML', async () => {
    const input = {
      original: 'name: test\nvalue: 123',
      modified: 'name: test\nvalue: 123'
    };
    const result = await yamlDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toBe('✓ No differences found');
  });

  it('shows changed values', async () => {
    const input = {
      original: 'name: old',
      modified: 'name: new'
    };
    const result = await yamlDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toContain('~ name:');
    expect(result).toContain('"old"');
    expect(result).toContain('"new"');
  });

  it('shows added keys', async () => {
    const input = {
      original: 'a: 1',
      modified: 'a: 1\nb: 2'
    };
    const result = await yamlDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toContain('+ b: 2');
  });

  it('shows removed keys', async () => {
    const input = {
      original: 'a: 1\nb: 2',
      modified: 'a: 1'
    };
    const result = await yamlDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toContain('- b: 2');
  });

  it('throws error for invalid first YAML', async () => {
    const input = {
      original: 'invalid: yaml: here:',
      modified: 'valid: true'
    };
    await expect(
      yamlDiff.runBrowser!(mockContext, input, { sortKeys: true })
    ).rejects.toThrow('First YAML is invalid');
  });
});

describe('csvDiff', () => {
  it('returns no differences for identical CSV', async () => {
    const input = {
      original: 'name,age\nalice,30\nbob,25',
      modified: 'name,age\nalice,30\nbob,25'
    };
    const result = await csvDiff.runBrowser!(mockContext, input, { useHeader: true, delimiter: ',' });
    expect(result).toBe('✓ No differences found');
  });

  it('detects added rows', async () => {
    const input = {
      original: 'name,age\nalice,30',
      modified: 'name,age\nalice,30\nbob,25'
    };
    const result = await csvDiff.runBrowser!(mockContext, input, { useHeader: true, delimiter: ',' });
    expect(result).toContain('Added (1 rows)');
    expect(result).toContain('bob');
  });

  it('detects removed rows', async () => {
    const input = {
      original: 'name,age\nalice,30\nbob,25',
      modified: 'name,age\nalice,30'
    };
    const result = await csvDiff.runBrowser!(mockContext, input, { useHeader: true, delimiter: ',' });
    expect(result).toContain('Removed (1 rows)');
    expect(result).toContain('bob');
  });

  it('detects changed rows', async () => {
    const input = {
      original: 'name,age,city\nalice,30,NYC\nbob,25,LA',
      modified: 'name,age,city\nalice,30,NYC\nbob,28,LA'
    };
    const result = await csvDiff.runBrowser!(mockContext, input, { useHeader: true, delimiter: ',' });
    expect(result).toContain('Changed (1 rows)');
    expect(result).toContain('age: "25" → "28"');
  });

  it('detects header differences', async () => {
    const input = {
      original: 'name,age\nalice,30',
      modified: 'name,email\nalice,alice@test.com'
    };
    const result = await csvDiff.runBrowser!(mockContext, input, { useHeader: true, delimiter: ',' });
    expect(result).toContain('Headers differ');
  });

  it('throws error when both CSV inputs required', async () => {
    const input = {
      original: '',
      modified: 'name,age'
    };
    await expect(
      csvDiff.runBrowser!(mockContext, input, { useHeader: true, delimiter: ',' })
    ).rejects.toThrow('Both CSV inputs are required');
  });
});