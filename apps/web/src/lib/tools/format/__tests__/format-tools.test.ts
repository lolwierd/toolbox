import { describe, it, expect, vi } from 'vitest';
import { jsonPrettify } from '../json-prettify';
import { jsonMinify } from '../json-minify';
import { yamlPrettify } from '../yaml-prettify';
import { xmlPrettify } from '../xml-prettify';
import { sqlFormat } from '../sql-format';
import { markdownPreview } from '../markdown-preview';

const mockContext = {
  signal: new AbortController().signal,
  onProgress: vi.fn(),
};

describe('jsonPrettify', () => {
  describe('basic functionality', () => {
    it('formats compact JSON with default indent (2 spaces)', async () => {
      const result = await jsonPrettify.runBrowser!(mockContext, '{"a":1}', { indent: 2, sortKeys: false });
      expect(result).toBe('{\n  "a": 1\n}');
    });

    it('formats with custom indent (4 spaces)', async () => {
      const result = await jsonPrettify.runBrowser!(mockContext, '{"a":1}', { indent: 4, sortKeys: false });
      expect(result).toBe('{\n    "a": 1\n}');
    });

    it('formats nested objects', async () => {
      const input = '{"a":{"b":{"c":1}}}';
      const result = await jsonPrettify.runBrowser!(mockContext, input, { indent: 2, sortKeys: false });
      expect(result).toBe('{\n  "a": {\n    "b": {\n      "c": 1\n    }\n  }\n}');
    });

    it('formats arrays', async () => {
      const input = '[1,2,3]';
      const result = await jsonPrettify.runBrowser!(mockContext, input, { indent: 2, sortKeys: false });
      expect(result).toBe('[\n  1,\n  2,\n  3\n]');
    });
  });

  describe('sortKeys option', () => {
    it('sorts object keys alphabetically when enabled', async () => {
      const input = '{"z":1,"a":2,"m":3}';
      const result = await jsonPrettify.runBrowser!(mockContext, input, { indent: 2, sortKeys: true });
      expect(result).toBe('{\n  "a": 2,\n  "m": 3,\n  "z": 1\n}');
    });

    it('does not sort keys when disabled', async () => {
      const input = '{"z":1,"a":2}';
      const result = await jsonPrettify.runBrowser!(mockContext, input, { indent: 2, sortKeys: false });
      expect(result).toBe('{\n  "z": 1,\n  "a": 2\n}');
    });

    it('sorts nested object keys', async () => {
      const input = '{"b":{"z":1,"a":2},"a":1}';
      const result = await jsonPrettify.runBrowser!(mockContext, input, { indent: 2, sortKeys: true });
      expect(result).toContain('"a": 1');
      expect(result).toContain('"a": 2');
      const aPos = result.indexOf('"a": 1');
      const bPos = result.indexOf('"b":');
      expect(aPos).toBeLessThan(bPos);
    });
  });

  describe('error handling', () => {
    it('throws error for empty input', async () => {
      await expect(jsonPrettify.runBrowser!(mockContext, '', { indent: 2, sortKeys: false }))
        .rejects.toThrow('Please enter some JSON');
    });

    it('throws error for whitespace-only input', async () => {
      await expect(jsonPrettify.runBrowser!(mockContext, '   ', { indent: 2, sortKeys: false }))
        .rejects.toThrow('Please enter some JSON');
    });

    it('throws error for invalid JSON', async () => {
      await expect(jsonPrettify.runBrowser!(mockContext, '{invalid}', { indent: 2, sortKeys: false }))
        .rejects.toThrow('Invalid JSON:');
    });

    it('throws error for incomplete JSON', async () => {
      await expect(jsonPrettify.runBrowser!(mockContext, '{"a": 1', { indent: 2, sortKeys: false }))
        .rejects.toThrow('Invalid JSON:');
    });
  });
});

describe('jsonMinify', () => {
  describe('basic functionality', () => {
    it('minifies formatted JSON to single line', async () => {
      const input = '{\n  "a": 1,\n  "b": 2\n}';
      const result = await jsonMinify.runBrowser!(mockContext, input, {});
      expect(result).toBe('{"a":1,"b":2}');
    });

    it('handles already minified JSON', async () => {
      const input = '{"a":1}';
      const result = await jsonMinify.runBrowser!(mockContext, input, {});
      expect(result).toBe('{"a":1}');
    });

    it('minifies arrays', async () => {
      const input = '[\n  1,\n  2,\n  3\n]';
      const result = await jsonMinify.runBrowser!(mockContext, input, {});
      expect(result).toBe('[1,2,3]');
    });

    it('removes all whitespace from nested structures', async () => {
      const input = '{\n  "a": {\n    "b": 1\n  }\n}';
      const result = await jsonMinify.runBrowser!(mockContext, input, {});
      expect(result).toBe('{"a":{"b":1}}');
    });
  });

  describe('error handling', () => {
    it('throws error for empty input', async () => {
      await expect(jsonMinify.runBrowser!(mockContext, '', {}))
        .rejects.toThrow('Please enter some JSON');
    });

    it('throws error for invalid JSON', async () => {
      await expect(jsonMinify.runBrowser!(mockContext, 'not json', {}))
        .rejects.toThrow('Invalid JSON:');
    });

    it('throws error for trailing comma', async () => {
      await expect(jsonMinify.runBrowser!(mockContext, '{"a": 1,}', {}))
        .rejects.toThrow('Invalid JSON:');
    });
  });
});

describe('yamlPrettify', () => {
  describe('basic functionality', () => {
    it('formats valid YAML', async () => {
      const input = 'a: 1\nb: 2';
      const result = await yamlPrettify.runBrowser!(mockContext, input, { indent: 2, sortKeys: false, lineWidth: 80 });
      expect(result).toContain('a: 1');
      expect(result).toContain('b: 2');
    });

    it('formats nested YAML structures', async () => {
      const input = 'parent:\n  child: value';
      const result = await yamlPrettify.runBrowser!(mockContext, input, { indent: 2, sortKeys: false, lineWidth: 80 });
      expect(result).toContain('parent:');
      expect(result).toContain('child: value');
    });

    it('handles arrays in YAML', async () => {
      const input = 'items:\n- one\n- two';
      const result = await yamlPrettify.runBrowser!(mockContext, input, { indent: 2, sortKeys: false, lineWidth: 80 });
      expect(result).toContain('items:');
      expect(result).toContain('- one');
      expect(result).toContain('- two');
    });
  });

  describe('options', () => {
    it('applies custom indent', async () => {
      const input = 'parent:\n  child: value';
      const result = await yamlPrettify.runBrowser!(mockContext, input, { indent: 4, sortKeys: false, lineWidth: 80 });
      expect(result).toContain('    child: value');
    });

    it('sorts keys when enabled', async () => {
      const input = 'z: 1\na: 2\nm: 3';
      const result = await yamlPrettify.runBrowser!(mockContext, input, { indent: 2, sortKeys: true, lineWidth: 80 });
      const lines = result.trim().split('\n');
      expect(lines[0]).toContain('a:');
      expect(lines[1]).toContain('m:');
      expect(lines[2]).toContain('z:');
    });
  });

  describe('error handling', () => {
    it('throws error for empty input', async () => {
      await expect(yamlPrettify.runBrowser!(mockContext, '', { indent: 2, sortKeys: false, lineWidth: 80 }))
        .rejects.toThrow('Please enter some YAML');
    });

    it('throws error for invalid YAML', async () => {
      const invalidYaml = 'key: value\n  bad indent: here';
      await expect(yamlPrettify.runBrowser!(mockContext, invalidYaml, { indent: 2, sortKeys: false, lineWidth: 80 }))
        .rejects.toThrow('Invalid YAML:');
    });
  });
});

describe('xmlPrettify', () => {
  describe('basic functionality', () => {
    it('formats compact XML with proper indentation', async () => {
      const input = '<root><parent><child/></parent></root>';
      const result = await xmlPrettify.runBrowser!(mockContext, input, { indent: 2 });
      expect(result).toContain('<root>');
      expect(result).toContain('  <parent>');
      expect(result).toContain('    <child/>');
      expect(result).toContain('</root>');
    });

    it('handles self-closing tags', async () => {
      const input = '<root><item/></root>';
      const result = await xmlPrettify.runBrowser!(mockContext, input, { indent: 2 });
      expect(result).toContain('<item/>');
    });

    it('preserves XML declarations', async () => {
      const input = '<?xml version="1.0"?><root></root>';
      const result = await xmlPrettify.runBrowser!(mockContext, input, { indent: 2 });
      expect(result).toContain('<?xml version="1.0"?>');
    });

    it('applies custom indent', async () => {
      const input = '<root><child/></root>';
      const result = await xmlPrettify.runBrowser!(mockContext, input, { indent: 4 });
      expect(result).toContain('    <child/>');
    });
  });

  describe('error handling', () => {
    it('throws error for empty input', async () => {
      await expect(xmlPrettify.runBrowser!(mockContext, '', { indent: 2 }))
        .rejects.toThrow('Please enter some XML');
    });

    it('throws error for invalid XML (unclosed tag)', async () => {
      await expect(xmlPrettify.runBrowser!(mockContext, '<root><child></root>', { indent: 2 }))
        .rejects.toThrow('Invalid XML:');
    });

    it('throws error for invalid XML (mismatched tags)', async () => {
      await expect(xmlPrettify.runBrowser!(mockContext, '<root></wrong>', { indent: 2 }))
        .rejects.toThrow('Invalid XML:');
    });
  });
});

describe('sqlFormat', () => {
  describe('basic functionality', () => {
    it('formats simple SELECT query', async () => {
      const input = 'SELECT * FROM users';
      const result = await sqlFormat.runBrowser!(mockContext, input, { indent: 2, uppercase: true });
      expect(result).toContain('SELECT');
      expect(result).toContain('FROM users');
    });

    it('formats query with WHERE clause', async () => {
      const input = 'SELECT id, name FROM users WHERE active = true';
      const result = await sqlFormat.runBrowser!(mockContext, input, { indent: 2, uppercase: true });
      expect(result).toContain('SELECT');
      expect(result).toContain('FROM users');
      expect(result).toContain('WHERE');
    });

    it('formats query with multiple conditions', async () => {
      const input = 'SELECT * FROM users WHERE active = true AND age > 18';
      const result = await sqlFormat.runBrowser!(mockContext, input, { indent: 2, uppercase: true });
      expect(result).toContain('AND');
    });

    it('formats query with JOIN', async () => {
      const input = 'SELECT * FROM users JOIN orders ON users.id = orders.user_id';
      const result = await sqlFormat.runBrowser!(mockContext, input, { indent: 2, uppercase: true });
      expect(result).toContain('JOIN');
      expect(result).toContain('ON');
    });
  });

  describe('options', () => {
    it('uppercases keywords when enabled', async () => {
      const input = 'select * from users';
      const result = await sqlFormat.runBrowser!(mockContext, input, { indent: 2, uppercase: true });
      expect(result).toContain('SELECT');
      expect(result).toContain('FROM');
    });

    it('lowercases keywords when disabled', async () => {
      const input = 'SELECT * FROM users';
      const result = await sqlFormat.runBrowser!(mockContext, input, { indent: 2, uppercase: false });
      expect(result).toContain('select');
      expect(result).toContain('from');
    });

    it('applies custom indent size', async () => {
      const input = 'SELECT * FROM users WHERE active = true AND id = 1';
      const result = await sqlFormat.runBrowser!(mockContext, input, { indent: 4, uppercase: true });
      const lines = result.split('\n');
      const andLine = lines.find(l => l.includes('AND'));
      expect(andLine).toMatch(/^\s{4,}/);
    });
  });

  describe('error handling', () => {
    it('throws error for empty input', async () => {
      await expect(sqlFormat.runBrowser!(mockContext, '', { indent: 2, uppercase: true }))
        .rejects.toThrow('Please enter a SQL query');
    });

    it('throws error for whitespace-only input', async () => {
      await expect(sqlFormat.runBrowser!(mockContext, '   ', { indent: 2, uppercase: true }))
        .rejects.toThrow('Please enter a SQL query');
    });
  });
});

describe('markdownPreview', () => {
  describe('basic functionality', () => {
    it('converts heading to HTML', async () => {
      const result = await markdownPreview.runBrowser!(mockContext, '# Hello', { gfm: true, breaks: false });
      expect(result).toContain('<h1>Hello</h1>');
    });

    it('converts paragraphs to HTML', async () => {
      const result = await markdownPreview.runBrowser!(mockContext, 'Hello world', { gfm: true, breaks: false });
      expect(result).toContain('<p>Hello world</p>');
    });

    it('converts bold text', async () => {
      const result = await markdownPreview.runBrowser!(mockContext, '**bold**', { gfm: true, breaks: false });
      expect(result).toContain('<strong>bold</strong>');
    });

    it('converts italic text', async () => {
      const result = await markdownPreview.runBrowser!(mockContext, '*italic*', { gfm: true, breaks: false });
      expect(result).toContain('<em>italic</em>');
    });

    it('converts links', async () => {
      const result = await markdownPreview.runBrowser!(mockContext, '[link](https://example.com)', { gfm: true, breaks: false });
      expect(result).toContain('<a href="https://example.com">link</a>');
    });

    it('converts code blocks', async () => {
      const result = await markdownPreview.runBrowser!(mockContext, '```\ncode\n```', { gfm: true, breaks: false });
      expect(result).toContain('<code>');
    });

    it('converts unordered lists', async () => {
      const result = await markdownPreview.runBrowser!(mockContext, '- item 1\n- item 2', { gfm: true, breaks: false });
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>item 1</li>');
      expect(result).toContain('<li>item 2</li>');
    });
  });

  describe('options', () => {
    it('converts line breaks to <br> when breaks enabled', async () => {
      const result = await markdownPreview.runBrowser!(mockContext, 'line1\nline2', { gfm: true, breaks: true });
      expect(result).toContain('<br>');
    });

    it('handles GFM tables when gfm enabled', async () => {
      const input = '| a | b |\n|---|---|\n| 1 | 2 |';
      const result = await markdownPreview.runBrowser!(mockContext, input, { gfm: true, breaks: false });
      expect(result).toContain('<table>');
      expect(result).toContain('<th>');
    });

    it('handles strikethrough with GFM', async () => {
      const result = await markdownPreview.runBrowser!(mockContext, '~~deleted~~', { gfm: true, breaks: false });
      expect(result).toContain('<del>deleted</del>');
    });
  });

  describe('output wrapping', () => {
    it('wraps output in HTML document', async () => {
      const result = await markdownPreview.runBrowser!(mockContext, '# Test', { gfm: true, breaks: false });
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html>');
      expect(result).toContain('</html>');
      expect(result).toContain('<head>');
      expect(result).toContain('<body>');
    });

    it('includes styling in output', async () => {
      const result = await markdownPreview.runBrowser!(mockContext, '# Test', { gfm: true, breaks: false });
      expect(result).toContain('<style>');
      expect(result).toContain('font-family');
    });
  });

  describe('error handling', () => {
    it('throws error for empty input', async () => {
      await expect(markdownPreview.runBrowser!(mockContext, '', { gfm: true, breaks: false }))
        .rejects.toThrow('Please enter some Markdown');
    });

    it('throws error for whitespace-only input', async () => {
      await expect(markdownPreview.runBrowser!(mockContext, '   ', { gfm: true, breaks: false }))
        .rejects.toThrow('Please enter some Markdown');
    });
  });
});
