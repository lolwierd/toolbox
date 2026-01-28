import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  indent: z.number().min(1).max(8).describe('Indentation spaces'),
  sortKeys: z.boolean().describe('Sort object keys alphabetically'),
});

export const jsonPrettify = defineTool({
  id: 'format.json-prettify',
  title: 'JSON Prettify',
  category: 'format',
  description: 'Format and beautify JSON with proper indentation',
  keywords: ['format', 'beautify', 'indent'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    placeholder: 'Paste JSON here...',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    indent: 2,
    sortKeys: false,
  },
  
  async runBrowser(_ctx, input, options) {
    const text = input as string;
    
    if (!text.trim()) {
      throw new Error('Please enter some JSON');
    }
    
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`);
    }
    
    if (options.sortKeys) {
      parsed = sortObjectKeys(parsed);
    }
    
    return JSON.stringify(parsed, null, options.indent);
  },
});

function sortObjectKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  
  return obj;
}
