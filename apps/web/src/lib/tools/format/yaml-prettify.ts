import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';
import yaml from 'js-yaml';

const optionsSchema = z.object({
  indent: z.number().min(1).max(8).describe('Indentation spaces'),
  sortKeys: z.boolean().describe('Sort object keys alphabetically'),
  lineWidth: z.number().min(40).max(200).describe('Line width before wrapping'),
});

export const yamlPrettify = defineTool({
  id: 'format.yaml-prettify',
  title: 'YAML Prettify',
  category: 'format',
  description: 'Format, validate and beautify YAML with proper indentation',
  keywords: ['yaml', 'format', 'beautify', 'indent', 'validate'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    placeholder: 'Paste YAML here...',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    indent: 2,
    sortKeys: false,
    lineWidth: 80,
  },
  
  async runBrowser(_ctx, input, options) {
    const text = input as string;
    
    if (!text.trim()) {
      throw new Error('Please enter some YAML');
    }
    
    let parsed: unknown;
    try {
      parsed = yaml.load(text);
    } catch (e) {
      throw new Error(`Invalid YAML: ${e instanceof Error ? e.message : 'Parse error'}`);
    }
    
    if (options.sortKeys) {
      parsed = sortObjectKeys(parsed);
    }
    
    return yaml.dump(parsed, {
      indent: options.indent,
      lineWidth: options.lineWidth,
      sortKeys: false,
    });
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
