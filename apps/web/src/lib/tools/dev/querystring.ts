import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  mode: z.enum(['auto', 'toJson', 'toQueryString']).describe('Conversion mode'),
  sortKeys: z.boolean().describe('Sort keys alphabetically'),
  encodeValues: z.boolean().describe('URL encode values when converting to query string'),
});

export const queryString = defineTool({
  id: 'dev.querystring',
  title: 'Query String ↔ JSON',
  category: 'dev',
  description: 'Convert between query string and JSON object',
  keywords: ['query', 'querystring', 'url', 'params', 'json', 'convert'],

  mode: 'browser',

  input: {
    kind: 'text',
    placeholder: 'Enter query string (key=value&...) or JSON object...',
  },

  output: {
    kind: 'text',
  },

  optionsSchema,
  defaults: {
    mode: 'auto',
    sortKeys: false,
    encodeValues: true,
  },

  async runBrowser(_ctx, input, options) {
    const text = (input as string).trim();

    if (!text) {
      throw new Error('Please enter a query string or JSON object');
    }

    const { mode, sortKeys, encodeValues } = options;

    let actualMode = mode;
    if (mode === 'auto') {
      actualMode = text.startsWith('{') ? 'toQueryString' : 'toJson';
    }

    if (actualMode === 'toJson') {
      return queryStringToJson(text, sortKeys);
    } else {
      return jsonToQueryString(text, sortKeys, encodeValues);
    }
  },
});

function queryStringToJson(input: string, sortKeys: boolean): string {
  let qs = input;
  if (qs.startsWith('?')) {
    qs = qs.slice(1);
  }

  const url = qs.includes('://') ? qs : undefined;
  if (url) {
    try {
      const parsed = new URL(url);
      qs = parsed.search.slice(1);
    } catch {
      // Not a valid URL, treat as query string
    }
  }

  const params = new URLSearchParams(qs);
  const obj: Record<string, string | string[]> = {};

  for (const [key, value] of params.entries()) {
    if (key in obj) {
      const existing = obj[key];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        obj[key] = [existing, value];
      }
    } else {
      obj[key] = value;
    }
  }

  let result = obj;
  if (sortKeys) {
    const sorted: Record<string, string | string[]> = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = obj[key];
    }
    result = sorted;
  }

  return JSON.stringify(result, null, 2);
}

function jsonToQueryString(input: string, sortKeys: boolean, encodeValues: boolean): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Input must be a JSON object');
  }

  const obj = parsed as Record<string, unknown>;
  let keys = Object.keys(obj);

  if (sortKeys) {
    keys = keys.sort();
  }

  const pairs: string[] = [];

  for (const key of keys) {
    const value = obj[key];
    const encodedKey = encodeValues ? encodeURIComponent(key) : key;

    if (Array.isArray(value)) {
      for (const v of value) {
        const encodedValue = encodeValues ? encodeURIComponent(String(v)) : String(v);
        pairs.push(`${encodedKey}=${encodedValue}`);
      }
    } else if (value !== null && value !== undefined) {
      const encodedValue = encodeValues ? encodeURIComponent(String(value)) : String(value);
      pairs.push(`${encodedKey}=${encodedValue}`);
    }
  }

  return pairs.join('&');
}
