import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({});

export const jsonMinify = defineTool({
  id: 'format.json-minify',
  title: 'JSON Minify',
  category: 'format',
  description: 'Compact JSON by removing whitespace',
  keywords: ['compact', 'compress', 'minimize'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    placeholder: 'Paste JSON here...',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {},
  
  async runBrowser(_ctx, input, _options) {
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
    
    return JSON.stringify(parsed);
  },
});
