import { describe, it, expect, vi } from 'vitest';
import { lineEndings } from '../line-endings';
import { sortLines } from '../sort-lines';
import { wordCount } from '../word-count';
import { findReplace } from '../find-replace';
import { caseConvert } from '../case-convert';
import { removeDuplicates } from '../remove-duplicates';

const mockContext = {
  signal: new AbortController().signal,
  onProgress: vi.fn(),
};

describe('lineEndings', () => {
  it('converts to LF (already LF)', async () => {
    const result = await lineEndings.runBrowser!(mockContext, 'a\nb\nc', { targetEnding: 'lf' });
    expect(result).toBe('a\nb\nc');
  });

  it('converts CRLF to LF', async () => {
    const result = await lineEndings.runBrowser!(mockContext, 'a\r\nb\r\nc', { targetEnding: 'lf' });
    expect(result).toBe('a\nb\nc');
  });

  it('converts LF to CRLF', async () => {
    const result = await lineEndings.runBrowser!(mockContext, 'a\nb\nc', { targetEnding: 'crlf' });
    expect(result).toBe('a\r\nb\r\nc');
  });

  it('converts CRLF to CRLF (no change)', async () => {
    const result = await lineEndings.runBrowser!(mockContext, 'a\r\nb\r\nc', { targetEnding: 'crlf' });
    expect(result).toBe('a\r\nb\r\nc');
  });

  it('converts mixed line endings to LF', async () => {
    const result = await lineEndings.runBrowser!(mockContext, 'a\r\nb\nc\rd', { targetEnding: 'lf' });
    expect(result).toBe('a\nb\nc\nd');
  });

  it('converts mixed line endings to CRLF', async () => {
    const result = await lineEndings.runBrowser!(mockContext, 'a\r\nb\nc\rd', { targetEnding: 'crlf' });
    expect(result).toBe('a\r\nb\r\nc\r\nd');
  });

  it('throws error for empty input', async () => {
    await expect(
      lineEndings.runBrowser!(mockContext, '', { targetEnding: 'lf' })
    ).rejects.toThrow('Please enter some text');
  });
});

describe('sortLines', () => {
  it('sorts lines alphabetically ascending', async () => {
    const result = await sortLines.runBrowser!(mockContext, 'c\na\nb', {
      sortType: 'alphabetical',
      order: 'asc',
      caseSensitive: false,
      unique: false,
      trimLines: false,
    });
    expect(result).toBe('a\nb\nc');
  });

  it('sorts lines alphabetically descending', async () => {
    const result = await sortLines.runBrowser!(mockContext, 'c\na\nb', {
      sortType: 'alphabetical',
      order: 'desc',
      caseSensitive: false,
      unique: false,
      trimLines: false,
    });
    expect(result).toBe('c\nb\na');
  });

  it('sorts lines numerically', async () => {
    const result = await sortLines.runBrowser!(mockContext, '10\n2\n1', {
      sortType: 'numeric',
      order: 'asc',
      caseSensitive: false,
      unique: false,
      trimLines: false,
    });
    expect(result).toBe('1\n2\n10');
  });

  it('sorts lines by length', async () => {
    const result = await sortLines.runBrowser!(mockContext, 'aaa\na\naa', {
      sortType: 'length',
      order: 'asc',
      caseSensitive: false,
      unique: false,
      trimLines: false,
    });
    expect(result).toBe('a\naa\naaa');
  });

  it('sorts with natural sort (handles numbers in strings)', async () => {
    const result = await sortLines.runBrowser!(mockContext, 'file10\nfile2\nfile1', {
      sortType: 'natural',
      order: 'asc',
      caseSensitive: false,
      unique: false,
      trimLines: false,
    });
    expect(result).toBe('file1\nfile2\nfile10');
  });

  it('removes duplicates with unique option', async () => {
    const result = await sortLines.runBrowser!(mockContext, 'a\nb\na\nc\nb', {
      sortType: 'alphabetical',
      order: 'asc',
      caseSensitive: false,
      unique: true,
      trimLines: false,
    });
    expect(result).toBe('a\nb\nc');
  });

  it('trims lines with trimLines option', async () => {
    const result = await sortLines.runBrowser!(mockContext, '  c\n  a\n  b', {
      sortType: 'alphabetical',
      order: 'asc',
      caseSensitive: false,
      unique: false,
      trimLines: true,
    });
    expect(result).toBe('a\nb\nc');
  });

  it('respects case sensitivity', async () => {
    const result = await sortLines.runBrowser!(mockContext, 'B\na\nA\nb', {
      sortType: 'alphabetical',
      order: 'asc',
      caseSensitive: true,
      unique: false,
      trimLines: false,
    });
    expect(result).toBe('a\nA\nb\nB');
  });

  it('throws error for empty input', async () => {
    await expect(
      sortLines.runBrowser!(mockContext, '', {
        sortType: 'alphabetical',
        order: 'asc',
        caseSensitive: false,
        unique: false,
        trimLines: false,
      })
    ).rejects.toThrow('Please enter some text');
  });
});

describe('wordCount', () => {
  it('counts words correctly', async () => {
    const result = await wordCount.runBrowser!(mockContext, 'hello world', { countWhitespace: false });
    expect(result).toContain('Words:                2');
  });

  it('counts characters without spaces', async () => {
    const result = await wordCount.runBrowser!(mockContext, 'hello world', { countWhitespace: false });
    expect(result).toContain('Characters (no spaces): 10');
  });

  it('counts characters with spaces', async () => {
    const result = await wordCount.runBrowser!(mockContext, 'hello world', { countWhitespace: false });
    expect(result).toContain('Characters (with spaces): 11');
  });

  it('counts lines correctly', async () => {
    const result = await wordCount.runBrowser!(mockContext, 'line1\nline2\nline3', { countWhitespace: false });
    expect(result).toContain('Lines:                3');
  });

  it('counts paragraphs correctly', async () => {
    const result = await wordCount.runBrowser!(mockContext, 'para1\n\npara2\n\npara3', { countWhitespace: false });
    expect(result).toContain('Paragraphs:           3');
  });

  it('handles single word', async () => {
    const result = await wordCount.runBrowser!(mockContext, 'hello', { countWhitespace: false });
    expect(result).toContain('Words:                1');
  });

  it('handles empty content after trim', async () => {
    const result = await wordCount.runBrowser!(mockContext, '   ', { countWhitespace: false });
    expect(result).toContain('Words:                0');
  });

  it('throws error for empty input', async () => {
    await expect(
      wordCount.runBrowser!(mockContext, '', { countWhitespace: false })
    ).rejects.toThrow('Please enter some text');
  });
});

describe('findReplace', () => {
  it('replaces text occurrence', async () => {
    const result = await findReplace.runBrowser!(mockContext, 'foo bar foo', {
      find: 'foo',
      replace: 'bar',
      useRegex: false,
      caseSensitive: true,
      replaceAll: true,
    });
    expect(result).toBe('bar bar bar');
  });

  it('replaces first occurrence only when replaceAll is false', async () => {
    const result = await findReplace.runBrowser!(mockContext, 'foo bar foo', {
      find: 'foo',
      replace: 'baz',
      useRegex: false,
      caseSensitive: true,
      replaceAll: false,
    });
    expect(result).toBe('baz bar foo');
  });

  it('performs case-insensitive replacement', async () => {
    const result = await findReplace.runBrowser!(mockContext, 'Foo foo FOO', {
      find: 'foo',
      replace: 'bar',
      useRegex: false,
      caseSensitive: false,
      replaceAll: true,
    });
    expect(result).toBe('bar bar bar');
  });

  it('uses regex pattern', async () => {
    const result = await findReplace.runBrowser!(mockContext, 'cat bat rat', {
      find: '[cbr]at',
      replace: 'hat',
      useRegex: true,
      caseSensitive: true,
      replaceAll: true,
    });
    expect(result).toBe('hat hat hat');
  });

  it('handles special regex characters in literal mode', async () => {
    const result = await findReplace.runBrowser!(mockContext, 'price is $10.00', {
      find: '$10.00',
      replace: '$20.00',
      useRegex: false,
      caseSensitive: true,
      replaceAll: true,
    });
    expect(result).toBe('price is $20.00');
  });

  it('throws error when no matches found', async () => {
    await expect(
      findReplace.runBrowser!(mockContext, 'hello world', {
        find: 'xyz',
        replace: 'abc',
        useRegex: false,
        caseSensitive: true,
        replaceAll: true,
      })
    ).rejects.toThrow('No matches found');
  });

  it('throws error for empty search pattern', async () => {
    await expect(
      findReplace.runBrowser!(mockContext, 'hello world', {
        find: '',
        replace: 'abc',
        useRegex: false,
        caseSensitive: true,
        replaceAll: true,
      })
    ).rejects.toThrow('Please enter a search pattern');
  });

  it('throws error for empty input', async () => {
    await expect(
      findReplace.runBrowser!(mockContext, '', {
        find: 'foo',
        replace: 'bar',
        useRegex: false,
        caseSensitive: true,
        replaceAll: true,
      })
    ).rejects.toThrow('Please enter some text');
  });

  it('throws error for invalid regex', async () => {
    await expect(
      findReplace.runBrowser!(mockContext, 'hello world', {
        find: '[invalid',
        replace: 'bar',
        useRegex: true,
        caseSensitive: true,
        replaceAll: true,
      })
    ).rejects.toThrow('Invalid regex');
  });
});

describe('caseConvert', () => {
  it('converts to uppercase', async () => {
    const result = await caseConvert.runBrowser!(mockContext, 'hello world', { caseType: 'uppercase' });
    expect(result).toBe('HELLO WORLD');
  });

  it('converts to lowercase', async () => {
    const result = await caseConvert.runBrowser!(mockContext, 'HELLO WORLD', { caseType: 'lowercase' });
    expect(result).toBe('hello world');
  });

  it('converts to title case', async () => {
    const result = await caseConvert.runBrowser!(mockContext, 'hello world', { caseType: 'titlecase' });
    expect(result).toBe('Hello World');
  });

  it('converts to sentence case', async () => {
    const result = await caseConvert.runBrowser!(mockContext, 'hello world. goodbye world', { caseType: 'sentencecase' });
    expect(result).toBe('Hello world. Goodbye world');
  });

  it('converts to camelCase', async () => {
    const result = await caseConvert.runBrowser!(mockContext, 'hello world', { caseType: 'camelCase' });
    expect(result).toBe('helloWorld');
  });

  it('converts to PascalCase', async () => {
    const result = await caseConvert.runBrowser!(mockContext, 'hello world', { caseType: 'PascalCase' });
    expect(result).toBe('HelloWorld');
  });

  it('converts to snake_case', async () => {
    const result = await caseConvert.runBrowser!(mockContext, 'hello world', { caseType: 'snake_case' });
    expect(result).toBe('hello_world');
  });

  it('converts to SCREAMING_SNAKE_CASE', async () => {
    const result = await caseConvert.runBrowser!(mockContext, 'hello world', { caseType: 'SCREAMING_SNAKE_CASE' });
    expect(result).toBe('HELLO_WORLD');
  });

  it('converts to kebab-case', async () => {
    const result = await caseConvert.runBrowser!(mockContext, 'hello world', { caseType: 'kebab-case' });
    expect(result).toBe('hello-world');
  });

  it('handles camelCase input for conversion', async () => {
    const result = await caseConvert.runBrowser!(mockContext, 'helloWorld', { caseType: 'snake_case' });
    expect(result).toBe('hello_world');
  });

  it('handles snake_case input for conversion', async () => {
    const result = await caseConvert.runBrowser!(mockContext, 'hello_world', { caseType: 'camelCase' });
    expect(result).toBe('helloWorld');
  });

  it('handles kebab-case input for conversion', async () => {
    const result = await caseConvert.runBrowser!(mockContext, 'hello-world', { caseType: 'PascalCase' });
    expect(result).toBe('HelloWorld');
  });

  it('throws error for empty input', async () => {
    await expect(
      caseConvert.runBrowser!(mockContext, '', { caseType: 'uppercase' })
    ).rejects.toThrow('Please enter some text');
  });
});

describe('removeDuplicates', () => {
  it('removes duplicate lines', async () => {
    const result = await removeDuplicates.runBrowser!(mockContext, 'a\na\nb', {
      caseSensitive: true,
      trimLines: false,
      preserveOrder: true,
      ignoreEmpty: false,
    });
    expect(result).toBe('a\nb');
  });

  it('preserves order of first occurrences', async () => {
    const result = await removeDuplicates.runBrowser!(mockContext, 'c\na\nb\na\nc', {
      caseSensitive: true,
      trimLines: false,
      preserveOrder: true,
      ignoreEmpty: false,
    });
    expect(result).toBe('c\na\nb');
  });

  it('handles case-insensitive deduplication', async () => {
    const result = await removeDuplicates.runBrowser!(mockContext, 'Hello\nhello\nHELLO', {
      caseSensitive: false,
      trimLines: false,
      preserveOrder: true,
      ignoreEmpty: false,
    });
    expect(result).toBe('Hello');
  });

  it('trims lines before comparing when trimLines is true', async () => {
    const result = await removeDuplicates.runBrowser!(mockContext, '  a\na\n  a  ', {
      caseSensitive: true,
      trimLines: true,
      preserveOrder: true,
      ignoreEmpty: false,
    });
    expect(result).toBe('a');
  });

  it('ignores empty lines in deduplication when ignoreEmpty is true', async () => {
    const result = await removeDuplicates.runBrowser!(mockContext, 'a\n\nb\n\na', {
      caseSensitive: true,
      trimLines: false,
      preserveOrder: true,
      ignoreEmpty: true,
    });
    expect(result).toBe('a\n\nb\n');
  });

  it('deduplicates empty lines when ignoreEmpty is false', async () => {
    const result = await removeDuplicates.runBrowser!(mockContext, 'a\n\nb\n\na', {
      caseSensitive: true,
      trimLines: false,
      preserveOrder: true,
      ignoreEmpty: false,
    });
    expect(result).toBe('a\n\nb');
  });

  it('returns original text when no duplicates found', async () => {
    const result = await removeDuplicates.runBrowser!(mockContext, 'a\nb\nc', {
      caseSensitive: true,
      trimLines: false,
      preserveOrder: true,
      ignoreEmpty: false,
    });
    expect(result).toBe('a\nb\nc');
  });

  it('throws error for empty input', async () => {
    await expect(
      removeDuplicates.runBrowser!(mockContext, '', {
        caseSensitive: true,
        trimLines: false,
        preserveOrder: true,
        ignoreEmpty: false,
      })
    ).rejects.toThrow('Please enter some text');
  });
});
