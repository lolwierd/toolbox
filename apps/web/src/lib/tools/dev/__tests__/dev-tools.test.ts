import { describe, it, expect, vi } from 'vitest';
import { colorConvert } from '../color-convert';
import { regexTest } from '../regex-test';
import { queryString } from '../querystring';
import { byteConverter } from '../byte-converter';

const mockContext = {
  signal: new AbortController().signal,
  onProgress: vi.fn(),
};

describe('colorConvert', () => {
  describe('hex input', () => {
    it('converts hex to all formats', async () => {
      const result = await colorConvert.runBrowser!(mockContext, '#ff0000', { outputFormat: 'all' });
      expect(result).toContain('HEX: #ff0000');
      expect(result).toContain('RGB: rgb(255, 0, 0)');
      expect(result).toContain('HSL: hsl(0, 100%, 50%)');
    });

    it('converts hex without hash', async () => {
      const result = await colorConvert.runBrowser!(mockContext, 'ff0000', { outputFormat: 'rgb' });
      expect(result).toBe('rgb(255, 0, 0)');
    });

    it('converts 3-digit hex', async () => {
      const result = await colorConvert.runBrowser!(mockContext, '#f00', { outputFormat: 'rgb' });
      expect(result).toBe('rgb(255, 0, 0)');
    });

    it('outputs specific format - hex', async () => {
      const result = await colorConvert.runBrowser!(mockContext, 'rgb(255, 0, 0)', { outputFormat: 'hex' });
      expect(result).toBe('#ff0000');
    });

    it('outputs specific format - hsl', async () => {
      const result = await colorConvert.runBrowser!(mockContext, '#ff0000', { outputFormat: 'hsl' });
      expect(result).toBe('hsl(0, 100%, 50%)');
    });
  });

  describe('rgb input', () => {
    it('converts rgb to hex', async () => {
      const result = await colorConvert.runBrowser!(mockContext, 'rgb(255, 0, 0)', { outputFormat: 'hex' });
      expect(result).toBe('#ff0000');
    });

    it('converts rgba input', async () => {
      const result = await colorConvert.runBrowser!(mockContext, 'rgba(255, 128, 0, 0.5)', { outputFormat: 'hex' });
      expect(result).toBe('#ff8000');
    });

    it('handles rgb with spaces', async () => {
      const result = await colorConvert.runBrowser!(mockContext, 'rgb( 100 , 150 , 200 )', { outputFormat: 'hex' });
      expect(result).toBe('#6496c8');
    });

    it('clamps out-of-range values', async () => {
      const result = await colorConvert.runBrowser!(mockContext, 'rgb(300, 50, 128)', { outputFormat: 'rgb' });
      expect(result).toBe('rgb(255, 50, 128)');
    });
  });

  describe('hsl input', () => {
    it('converts hsl to rgb', async () => {
      const result = await colorConvert.runBrowser!(mockContext, 'hsl(0, 100%, 50%)', { outputFormat: 'rgb' });
      expect(result).toBe('rgb(255, 0, 0)');
    });

    it('converts hsl to hex', async () => {
      const result = await colorConvert.runBrowser!(mockContext, 'hsl(120, 100%, 50%)', { outputFormat: 'hex' });
      expect(result).toBe('#00ff00');
    });

    it('handles grayscale (0 saturation)', async () => {
      const result = await colorConvert.runBrowser!(mockContext, 'hsl(0, 0%, 50%)', { outputFormat: 'rgb' });
      expect(result).toBe('rgb(128, 128, 128)');
    });
  });

  describe('error handling', () => {
    it('throws on empty input', async () => {
      await expect(colorConvert.runBrowser!(mockContext, '', { outputFormat: 'all' }))
        .rejects.toThrow('Please enter a color value');
    });

    it('throws on whitespace-only input', async () => {
      await expect(colorConvert.runBrowser!(mockContext, '   ', { outputFormat: 'all' }))
        .rejects.toThrow('Please enter a color value');
    });

    it('throws on invalid color format', async () => {
      await expect(colorConvert.runBrowser!(mockContext, 'not-a-color', { outputFormat: 'all' }))
        .rejects.toThrow('Invalid color format');
    });

    it('throws on invalid hex', async () => {
      await expect(colorConvert.runBrowser!(mockContext, '#gggggg', { outputFormat: 'all' }))
        .rejects.toThrow('Invalid color format');
    });
  });
});

describe('regexTest', () => {
  describe('basic matching', () => {
    it('finds digit matches', async () => {
      const result = await regexTest.runBrowser!(mockContext, 'abc123def', {
        pattern: '\\d+',
        flags: 'g',
        showGroups: true,
      });
      expect(result).toContain('Found 1 match');
      expect(result).toContain('"123"');
      expect(result).toContain('at index 3');
    });

    it('finds multiple matches with global flag', async () => {
      const result = await regexTest.runBrowser!(mockContext, 'cat bat rat', {
        pattern: '[cbr]at',
        flags: 'g',
        showGroups: false,
      });
      expect(result).toContain('Found 3 matches');
      expect(result).toContain('"cat"');
      expect(result).toContain('"bat"');
      expect(result).toContain('"rat"');
    });

    it('finds single match without global flag', async () => {
      const result = await regexTest.runBrowser!(mockContext, 'abc123def456', {
        pattern: '\\d+',
        flags: '',
        showGroups: false,
      });
      expect(result).toContain('Found 1 match');
      expect(result).toContain('"123"');
      expect(result).not.toContain('456');
    });

    it('reports no matches', async () => {
      const result = await regexTest.runBrowser!(mockContext, 'abcdef', {
        pattern: '\\d+',
        flags: 'g',
        showGroups: false,
      });
      expect(result).toBe('No matches found');
    });
  });

  describe('capture groups', () => {
    it('shows numbered capture groups', async () => {
      const result = await regexTest.runBrowser!(mockContext, 'hello world', {
        pattern: '(\\w+) (\\w+)',
        flags: '',
        showGroups: true,
      });
      expect(result).toContain('Group 1: "hello"');
      expect(result).toContain('Group 2: "world"');
    });

    it('shows named capture groups', async () => {
      const result = await regexTest.runBrowser!(mockContext, 'John Doe', {
        pattern: '(?<first>\\w+) (?<last>\\w+)',
        flags: '',
        showGroups: true,
      });
      expect(result).toContain('Group "first": "John"');
      expect(result).toContain('Group "last": "Doe"');
    });

    it('hides groups when showGroups is false', async () => {
      const result = await regexTest.runBrowser!(mockContext, 'hello world', {
        pattern: '(\\w+) (\\w+)',
        flags: '',
        showGroups: false,
      });
      expect(result).not.toContain('Group 1');
      expect(result).not.toContain('Group 2');
    });
  });

  describe('flags', () => {
    it('handles case-insensitive flag', async () => {
      const result = await regexTest.runBrowser!(mockContext, 'HELLO hello', {
        pattern: 'hello',
        flags: 'gi',
        showGroups: false,
      });
      expect(result).toContain('Found 2 matches');
    });

    it('handles multiline flag', async () => {
      const result = await regexTest.runBrowser!(mockContext, 'line1\nline2', {
        pattern: '^line',
        flags: 'gm',
        showGroups: false,
      });
      expect(result).toContain('Found 2 matches');
    });
  });

  describe('error handling', () => {
    it('throws on empty pattern', async () => {
      await expect(regexTest.runBrowser!(mockContext, 'test', {
        pattern: '',
        flags: 'g',
        showGroups: false,
      })).rejects.toThrow('Please enter a regex pattern');
    });

    it('throws on empty input', async () => {
      await expect(regexTest.runBrowser!(mockContext, '', {
        pattern: '\\d+',
        flags: 'g',
        showGroups: false,
      })).rejects.toThrow('Please enter some test text');
    });

    it('throws on invalid regex', async () => {
      await expect(regexTest.runBrowser!(mockContext, 'test', {
        pattern: '(unclosed',
        flags: 'g',
        showGroups: false,
      })).rejects.toThrow('Invalid regex');
    });

    it('throws on invalid flags', async () => {
      await expect(regexTest.runBrowser!(mockContext, 'test', {
        pattern: 'test',
        flags: 'xyz',
        showGroups: false,
      })).rejects.toThrow('Invalid regex');
    });
  });
});

describe('queryString', () => {
  describe('query string to JSON', () => {
    it('converts simple query string', async () => {
      const result = await queryString.runBrowser!(mockContext, 'a=1&b=2', {
        mode: 'auto',
        sortKeys: false,
        encodeValues: true,
      });
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ a: '1', b: '2' });
    });

    it('handles query string with leading ?', async () => {
      const result = await queryString.runBrowser!(mockContext, '?foo=bar&baz=qux', {
        mode: 'toJson',
        sortKeys: false,
        encodeValues: true,
      });
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ foo: 'bar', baz: 'qux' });
    });

    it('handles URL-encoded values', async () => {
      const result = await queryString.runBrowser!(mockContext, 'name=John%20Doe&city=New%20York', {
        mode: 'toJson',
        sortKeys: false,
        encodeValues: true,
      });
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ name: 'John Doe', city: 'New York' });
    });

    it('handles duplicate keys as array', async () => {
      const result = await queryString.runBrowser!(mockContext, 'tag=a&tag=b&tag=c', {
        mode: 'toJson',
        sortKeys: false,
        encodeValues: true,
      });
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ tag: ['a', 'b', 'c'] });
    });

    it('sorts keys when sortKeys is true', async () => {
      const result = await queryString.runBrowser!(mockContext, 'z=3&a=1&m=2', {
        mode: 'toJson',
        sortKeys: true,
        encodeValues: true,
      });
      const keys = Object.keys(JSON.parse(result));
      expect(keys).toEqual(['a', 'm', 'z']);
    });

    it('extracts query string from full URL', async () => {
      const result = await queryString.runBrowser!(mockContext, 'https://example.com/path?key=value', {
        mode: 'toJson',
        sortKeys: false,
        encodeValues: true,
      });
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ key: 'value' });
    });
  });

  describe('JSON to query string', () => {
    it('converts simple JSON object', async () => {
      const result = await queryString.runBrowser!(mockContext, '{"a": 1}', {
        mode: 'auto',
        sortKeys: false,
        encodeValues: true,
      });
      expect(result).toBe('a=1');
    });

    it('converts JSON with multiple keys', async () => {
      const result = await queryString.runBrowser!(mockContext, '{"name": "test", "value": 123}', {
        mode: 'toQueryString',
        sortKeys: false,
        encodeValues: true,
      });
      expect(result).toContain('name=test');
      expect(result).toContain('value=123');
    });

    it('handles array values', async () => {
      const result = await queryString.runBrowser!(mockContext, '{"tags": ["a", "b", "c"]}', {
        mode: 'toQueryString',
        sortKeys: false,
        encodeValues: true,
      });
      expect(result).toBe('tags=a&tags=b&tags=c');
    });

    it('URL encodes special characters', async () => {
      const result = await queryString.runBrowser!(mockContext, '{"name": "John Doe", "query": "a=b&c=d"}', {
        mode: 'toQueryString',
        sortKeys: false,
        encodeValues: true,
      });
      expect(result).toContain('name=John%20Doe');
      expect(result).toContain('query=a%3Db%26c%3Dd');
    });

    it('skips encoding when encodeValues is false', async () => {
      const result = await queryString.runBrowser!(mockContext, '{"name": "John Doe"}', {
        mode: 'toQueryString',
        sortKeys: false,
        encodeValues: false,
      });
      expect(result).toBe('name=John Doe');
    });

    it('sorts keys when sortKeys is true', async () => {
      const result = await queryString.runBrowser!(mockContext, '{"z": 3, "a": 1, "m": 2}', {
        mode: 'toQueryString',
        sortKeys: true,
        encodeValues: true,
      });
      expect(result).toBe('a=1&m=2&z=3');
    });

    it('skips null and undefined values', async () => {
      const result = await queryString.runBrowser!(mockContext, '{"a": 1, "b": null}', {
        mode: 'toQueryString',
        sortKeys: false,
        encodeValues: true,
      });
      expect(result).toBe('a=1');
    });
  });

  describe('error handling', () => {
    it('throws on empty input', async () => {
      await expect(queryString.runBrowser!(mockContext, '', {
        mode: 'auto',
        sortKeys: false,
        encodeValues: true,
      })).rejects.toThrow('Please enter a query string or JSON object');
    });

    it('throws on invalid JSON', async () => {
      await expect(queryString.runBrowser!(mockContext, '{invalid}', {
        mode: 'toQueryString',
        sortKeys: false,
        encodeValues: true,
      })).rejects.toThrow('Invalid JSON');
    });

    it('throws on non-object JSON', async () => {
      await expect(queryString.runBrowser!(mockContext, '[1, 2, 3]', {
        mode: 'toQueryString',
        sortKeys: false,
        encodeValues: true,
      })).rejects.toThrow('Input must be a JSON object');
    });
  });
});

describe('byteConverter', () => {
  describe('bytes to other units (binary)', () => {
    it('converts bytes to all units', async () => {
      const result = await byteConverter.runBrowser!(mockContext, '1024', {
        inputUnit: 'auto',
        outputUnit: 'all',
        binary: true,
        precision: 2,
      });
      expect(result).toContain('1024 B');
      expect(result).toContain('1 KiB');
    });

    it('converts bytes to KB', async () => {
      const result = await byteConverter.runBrowser!(mockContext, '1024', {
        inputUnit: 'B',
        outputUnit: 'KB',
        binary: true,
        precision: 2,
      });
      expect(result).toBe('1 KiB');
    });

    it('converts MB to bytes', async () => {
      const result = await byteConverter.runBrowser!(mockContext, '1', {
        inputUnit: 'MB',
        outputUnit: 'B',
        binary: true,
        precision: 2,
      });
      expect(result).toBe('1048576 B');
    });

    it('handles auto input unit detection', async () => {
      const result = await byteConverter.runBrowser!(mockContext, '1 MB', {
        inputUnit: 'auto',
        outputUnit: 'B',
        binary: true,
        precision: 2,
      });
      expect(result).toBe('1048576 B');
    });

    it('handles input with space between number and unit', async () => {
      const result = await byteConverter.runBrowser!(mockContext, '1.5 GB', {
        inputUnit: 'auto',
        outputUnit: 'MB',
        binary: true,
        precision: 2,
      });
      expect(result).toBe('1536 MiB');
    });
  });

  describe('decimal mode', () => {
    it('uses 1000 as base in decimal mode', async () => {
      const result = await byteConverter.runBrowser!(mockContext, '1', {
        inputUnit: 'MB',
        outputUnit: 'B',
        binary: false,
        precision: 2,
      });
      expect(result).toBe('1000000 B');
    });

    it('converts KB to bytes in decimal mode', async () => {
      const result = await byteConverter.runBrowser!(mockContext, '1 KB', {
        inputUnit: 'auto',
        outputUnit: 'B',
        binary: false,
        precision: 2,
      });
      expect(result).toBe('1000 B');
    });

    it('displays units without i suffix in decimal mode', async () => {
      const result = await byteConverter.runBrowser!(mockContext, '1000', {
        inputUnit: 'B',
        outputUnit: 'KB',
        binary: false,
        precision: 2,
      });
      expect(result).toBe('1 KB');
    });
  });

  describe('auto output unit', () => {
    it('selects appropriate unit for small values', async () => {
      const result = await byteConverter.runBrowser!(mockContext, '500', {
        inputUnit: 'auto',
        outputUnit: 'auto',
        binary: true,
        precision: 2,
      });
      expect(result).toBe('500 B');
    });

    it('selects appropriate unit for large values', async () => {
      const result = await byteConverter.runBrowser!(mockContext, '1073741824', {
        inputUnit: 'auto',
        outputUnit: 'auto',
        binary: true,
        precision: 2,
      });
      expect(result).toBe('1 GiB');
    });
  });

  describe('precision', () => {
    it('respects precision setting', async () => {
      const result = await byteConverter.runBrowser!(mockContext, '1500', {
        inputUnit: 'B',
        outputUnit: 'KB',
        binary: true,
        precision: 4,
      });
      expect(result).toBe('1.4648 KiB');
    });

    it('removes trailing zeros', async () => {
      const result = await byteConverter.runBrowser!(mockContext, '2048', {
        inputUnit: 'B',
        outputUnit: 'KB',
        binary: true,
        precision: 4,
      });
      expect(result).toBe('2 KiB');
    });
  });

  describe('unit parsing', () => {
    it('handles MiB input notation', async () => {
      const result = await byteConverter.runBrowser!(mockContext, '1 MiB', {
        inputUnit: 'auto',
        outputUnit: 'B',
        binary: true,
        precision: 2,
      });
      expect(result).toBe('1048576 B');
    });

    it('handles lowercase units', async () => {
      const result = await byteConverter.runBrowser!(mockContext, '1 mb', {
        inputUnit: 'auto',
        outputUnit: 'B',
        binary: true,
        precision: 2,
      });
      expect(result).toBe('1048576 B');
    });

    it('handles GiB notation', async () => {
      const result = await byteConverter.runBrowser!(mockContext, '1 GiB', {
        inputUnit: 'auto',
        outputUnit: 'MB',
        binary: true,
        precision: 2,
      });
      expect(result).toBe('1024 MiB');
    });
  });

  describe('error handling', () => {
    it('throws on empty input', async () => {
      await expect(byteConverter.runBrowser!(mockContext, '', {
        inputUnit: 'auto',
        outputUnit: 'all',
        binary: true,
        precision: 2,
      })).rejects.toThrow('Please enter a value');
    });

    it('throws on invalid number', async () => {
      await expect(byteConverter.runBrowser!(mockContext, 'abc', {
        inputUnit: 'B',
        outputUnit: 'KB',
        binary: true,
        precision: 2,
      })).rejects.toThrow('Invalid number');
    });

    it('throws on unknown unit', async () => {
      await expect(byteConverter.runBrowser!(mockContext, '100 XB', {
        inputUnit: 'auto',
        outputUnit: 'KB',
        binary: true,
        precision: 2,
      })).rejects.toThrow('Unknown unit');
    });

    it('throws on negative value', async () => {
      await expect(byteConverter.runBrowser!(mockContext, '-100', {
        inputUnit: 'B',
        outputUnit: 'KB',
        binary: true,
        precision: 2,
      })).rejects.toThrow('Value cannot be negative');
    });
  });
});
