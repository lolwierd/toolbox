import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  sortType: z.enum(['alphabetical', 'natural', 'numeric', 'length']).describe('Sort method'),
  order: z.enum(['asc', 'desc']).describe('Sort order'),
  caseSensitive: z.boolean().describe('Case sensitive comparison'),
  unique: z.boolean().describe('Remove duplicate lines'),
  trimLines: z.boolean().describe('Trim whitespace from lines'),
});

export const sortLines = defineTool({
  id: 'text.sort-lines',
  title: 'Sort Lines',
  category: 'text',
  description: 'Sort lines alphabetically, numerically, or by length',
  keywords: ['order', 'alphabetize', 'unique', 'dedupe', 'natural'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    placeholder: 'Paste text with multiple lines...',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    sortType: 'alphabetical',
    order: 'asc',
    caseSensitive: false,
    unique: false,
    trimLines: false,
  },
  
  async runBrowser(_ctx, input, options) {
    const text = input as string;
    
    if (!text) {
      throw new Error('Please enter some text');
    }
    
    let lines = text.split(/\r?\n/);
    
    if (options.trimLines) {
      lines = lines.map(line => line.trim());
    }
    
    if (options.unique) {
      const seen = new Set<string>();
      lines = lines.filter(line => {
        const key = options.caseSensitive ? line : line.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    
    const collator = new Intl.Collator(undefined, {
      numeric: options.sortType === 'natural',
      sensitivity: options.caseSensitive ? 'case' : 'base',
    });
    
    lines.sort((a, b) => {
      let result: number;
      
      switch (options.sortType) {
        case 'numeric': {
          const numA = parseFloat(a) || 0;
          const numB = parseFloat(b) || 0;
          result = numA - numB;
          break;
        }
        case 'length':
          result = a.length - b.length;
          break;
        case 'natural':
        case 'alphabetical':
        default:
          result = collator.compare(a, b);
      }
      
      return options.order === 'desc' ? -result : result;
    });
    
    return lines.join('\n');
  },
});
