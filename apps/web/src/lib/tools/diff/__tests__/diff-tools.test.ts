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
    const input = `hello world
---
hello world`;
    const result = await textDiff.runBrowser!(mockContext, input, { ignoreWhitespace: false, ignoreCase: false });
    expect(result).toBe('  hello world');
  });

  it('shows + and - lines for different texts', async () => {
    const input = `line one
line two
---
line one
line three`;
    const result = await textDiff.runBrowser!(mockContext, input, { ignoreWhitespace: false, ignoreCase: false });
    expect(result).toContain('  line one');
    expect(result).toContain('- line two');
    expect(result).toContain('+ line three');
  });

  it('ignoreWhitespace option works', async () => {
    const input = `  hello  
---
hello`;
    const result = await textDiff.runBrowser!(mockContext, input, { ignoreWhitespace: true, ignoreCase: false });
    expect(result).toBe('  hello');
  });

  it('ignoreCase option works', async () => {
    const input = `HELLO
---
hello`;
    const result = await textDiff.runBrowser!(mockContext, input, { ignoreWhitespace: false, ignoreCase: true });
    expect(result).toBe('  hello');
  });

  it('throws error when separator is missing', async () => {
    const input = 'hello world';
    await expect(
      textDiff.runBrowser!(mockContext, input, { ignoreWhitespace: false, ignoreCase: false })
    ).rejects.toThrow('Please separate the two texts with "---" on its own line');
  });

  it('handles multiple lines added', async () => {
    const input = `line one
---
line one
line two
line three`;
    const result = await textDiff.runBrowser!(mockContext, input, { ignoreWhitespace: false, ignoreCase: false });
    expect(result).toContain('  line one');
    expect(result).toContain('+ line two');
    expect(result).toContain('+ line three');
  });

  it('handles multiple lines removed', async () => {
    const input = `line one
line two
line three
---
line one`;
    const result = await textDiff.runBrowser!(mockContext, input, { ignoreWhitespace: false, ignoreCase: false });
    expect(result).toContain('  line one');
    expect(result).toContain('- line two');
    expect(result).toContain('- line three');
  });
});

describe('jsonDiff', () => {
  it('returns no differences for identical JSON', async () => {
    const input = `{"name": "test", "value": 123}
---
{"name": "test", "value": 123}`;
    const result = await jsonDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toBe('✓ No differences found');
  });

  it('shows changed values', async () => {
    const input = `{"name": "old"}
---
{"name": "new"}`;
    const result = await jsonDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toContain('~ name:');
    expect(result).toContain('"old"');
    expect(result).toContain('"new"');
  });

  it('shows added keys', async () => {
    const input = `{"a": 1}
---
{"a": 1, "b": 2}`;
    const result = await jsonDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toContain('+ b: 2');
  });

  it('shows removed keys', async () => {
    const input = `{"a": 1, "b": 2}
---
{"a": 1}`;
    const result = await jsonDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toContain('- b: 2');
  });

  it('handles nested object differences', async () => {
    const input = `{"user": {"name": "alice", "age": 30}}
---
{"user": {"name": "bob", "age": 30}}`;
    const result = await jsonDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toContain('~ user.name:');
    expect(result).toContain('"alice"');
    expect(result).toContain('"bob"');
  });

  it('handles array differences', async () => {
    const input = `{"items": [1, 2, 3]}
---
{"items": [1, 2, 4]}`;
    const result = await jsonDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toContain('items[2]');
  });

  it('throws error for invalid first JSON', async () => {
    const input = `not valid json
---
{"valid": true}`;
    await expect(
      jsonDiff.runBrowser!(mockContext, input, { sortKeys: true })
    ).rejects.toThrow('First JSON is invalid');
  });

  it('throws error for invalid second JSON', async () => {
    const input = `{"valid": true}
---
not valid json`;
    await expect(
      jsonDiff.runBrowser!(mockContext, input, { sortKeys: true })
    ).rejects.toThrow('Second JSON is invalid');
  });

  it('throws error when separator is missing', async () => {
    const input = '{"name": "test"}';
    await expect(
      jsonDiff.runBrowser!(mockContext, input, { sortKeys: true })
    ).rejects.toThrow('Please separate the two JSON objects with "---" on its own line');
  });

  it('sortKeys option normalizes key order', async () => {
    const input = `{"b": 1, "a": 2}
---
{"a": 2, "b": 1}`;
    const result = await jsonDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toBe('✓ No differences found');
  });
});

describe('yamlDiff', () => {
  it('returns no differences for identical YAML', async () => {
    const input = `name: test
value: 123
---
name: test
value: 123`;
    const result = await yamlDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toBe('✓ No differences found');
  });

  it('shows changed values', async () => {
    const input = `name: old
---
name: new`;
    const result = await yamlDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toContain('~ name:');
    expect(result).toContain('"old"');
    expect(result).toContain('"new"');
  });

  it('shows added keys', async () => {
    const input = `a: 1
---
a: 1
b: 2`;
    const result = await yamlDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toContain('+ b: 2');
  });

  it('shows removed keys', async () => {
    const input = `a: 1
b: 2
---
a: 1`;
    const result = await yamlDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toContain('- b: 2');
  });

  it('handles nested object differences', async () => {
    const input = `user:
  name: alice
  age: 30
---
user:
  name: bob
  age: 30`;
    const result = await yamlDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toContain('~ user.name:');
    expect(result).toContain('"alice"');
    expect(result).toContain('"bob"');
  });

  it('handles array differences', async () => {
    const input = `items:
  - 1
  - 2
  - 3
---
items:
  - 1
  - 2
  - 4`;
    const result = await yamlDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toContain('items[2]');
  });

  it('throws error for invalid first YAML', async () => {
    const input = `invalid: yaml: here:
---
valid: true`;
    await expect(
      yamlDiff.runBrowser!(mockContext, input, { sortKeys: true })
    ).rejects.toThrow('First YAML is invalid');
  });

  it('throws error for invalid second YAML', async () => {
    const input = `valid: true
---
invalid: yaml: here:`;
    await expect(
      yamlDiff.runBrowser!(mockContext, input, { sortKeys: true })
    ).rejects.toThrow('Second YAML is invalid');
  });

  it('throws error when separator is missing', async () => {
    const input = 'name: test';
    await expect(
      yamlDiff.runBrowser!(mockContext, input, { sortKeys: true })
    ).rejects.toThrow('Please separate the two YAML documents with "---" on its own line');
  });

  it('sortKeys option normalizes key order', async () => {
    const input = `b: 1
a: 2
---
a: 2
b: 1`;
    const result = await yamlDiff.runBrowser!(mockContext, input, { sortKeys: true });
    expect(result).toBe('✓ No differences found');
  });
});

describe('csvDiff', () => {
  it('returns no differences for identical CSV', async () => {
    const input = `name,age
alice,30
bob,25
---
name,age
alice,30
bob,25`;
    const result = await csvDiff.runBrowser!(mockContext, input, { useHeader: true, delimiter: ',' });
    expect(result).toBe('✓ No differences found');
  });

  it('detects added rows', async () => {
    const input = `name,age
alice,30
---
name,age
alice,30
bob,25`;
    const result = await csvDiff.runBrowser!(mockContext, input, { useHeader: true, delimiter: ',' });
    expect(result).toContain('Added (1 rows)');
    expect(result).toContain('bob');
  });

  it('detects removed rows', async () => {
    const input = `name,age
alice,30
bob,25
---
name,age
alice,30`;
    const result = await csvDiff.runBrowser!(mockContext, input, { useHeader: true, delimiter: ',' });
    expect(result).toContain('Removed (1 rows)');
    expect(result).toContain('bob');
  });

  it('detects changed rows', async () => {
    const input = `name,age,city
alice,30,NYC
bob,25,LA
---
name,age,city
alice,30,NYC
bob,28,LA`;
    const result = await csvDiff.runBrowser!(mockContext, input, { useHeader: true, delimiter: ',' });
    expect(result).toContain('Changed (1 rows)');
    expect(result).toContain('age: "25" → "28"');
  });

  it('useHeader option works - with headers', async () => {
    const input = `name,age
alice,30
---
name,age
alice,30`;
    const result = await csvDiff.runBrowser!(mockContext, input, { useHeader: true, delimiter: ',' });
    expect(result).toBe('✓ No differences found');
  });

  it('useHeader option works - without headers', async () => {
    const input = `alice,30
bob,25
---
alice,30
bob,25`;
    const result = await csvDiff.runBrowser!(mockContext, input, { useHeader: false, delimiter: ',' });
    expect(result).toBe('✓ No differences found');
  });

  it('detects header differences', async () => {
    const input = `name,age
alice,30
---
name,email
alice,alice@test.com`;
    const result = await csvDiff.runBrowser!(mockContext, input, { useHeader: true, delimiter: ',' });
    expect(result).toContain('Headers differ');
  });

  it('handles custom delimiter', async () => {
    const input = `name;age
alice;30
---
name;age
alice;30`;
    const result = await csvDiff.runBrowser!(mockContext, input, { useHeader: true, delimiter: ';' });
    expect(result).toBe('✓ No differences found');
  });

  it('throws error when separator is missing', async () => {
    const input = `name,age
alice,30`;
    await expect(
      csvDiff.runBrowser!(mockContext, input, { useHeader: true, delimiter: ',' })
    ).rejects.toThrow('Please separate the two CSV files with "---" on its own line');
  });

  it('throws error when both CSV inputs required', async () => {
    const input = `
---
name,age`;
    await expect(
      csvDiff.runBrowser!(mockContext, input, { useHeader: true, delimiter: ',' })
    ).rejects.toThrow('Both CSV inputs are required');
  });

  it('handles quoted fields with commas', async () => {
    const input = `name,address
alice,"123 Main St, Apt 4"
---
name,address
alice,"123 Main St, Apt 4"`;
    const result = await csvDiff.runBrowser!(mockContext, input, { useHeader: true, delimiter: ',' });
    expect(result).toBe('✓ No differences found');
  });

  it('handles quoted fields with embedded quotes', async () => {
    const input = `name,quote
alice,"She said ""hello"""
---
name,quote
alice,"She said ""hello"""`;
    const result = await csvDiff.runBrowser!(mockContext, input, { useHeader: true, delimiter: ',' });
    expect(result).toBe('✓ No differences found');
  });

  it('shows column names in changed output when using headers', async () => {
    const input = `name,age,city
alice,30,NYC
---
name,age,city
alice,30,LA`;
    const result = await csvDiff.runBrowser!(mockContext, input, { useHeader: true, delimiter: ',' });
    expect(result).toContain('city: "NYC" → "LA"');
  });
});
