import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  caseSensitive: z.boolean().describe('Case sensitive comparison'),
  trimLines: z.boolean().describe('Trim whitespace before comparing'),
  preserveOrder: z.boolean().describe('Keep first occurrence order'),
  ignoreEmpty: z.boolean().describe('Ignore empty lines when deduplicating'),
});

export const removeDuplicates = defineTool({
  id: 'text.remove-duplicates',
  title: 'Remove Duplicates',
  category: 'text',
  description: 'Remove duplicate lines from text',
  keywords: ['dedupe', 'unique', 'distinct', 'duplicates', 'remove'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    placeholder: 'Paste text with duplicate lines...',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    caseSensitive: true,
    trimLines: false,
    preserveOrder: true,
    ignoreEmpty: false,
  },
  
  async runBrowser(_ctx, input, options) {
    const text = input as string;
    
    if (!text) {
      throw new Error('Please enter some text');
    }
    
    let lines = text.split(/\r?\n/);
    const originalCount = lines.length;
    
    if (options.trimLines) {
      lines = lines.map(line => line.trim());
    }
    
    const seen = new Set<string>();
    const result: string[] = [];
    
    for (const line of lines) {
      if (options.ignoreEmpty && line.trim() === '') {
        result.push(line);
        continue;
      }
      
      const key = options.caseSensitive ? line : line.toLowerCase();
      
      if (!seen.has(key)) {
        seen.add(key);
        result.push(line);
      }
    }
    
    const removedCount = originalCount - result.length;
    
    if (removedCount === 0) {
      return text;
    }
    
    return result.join('\n');
  },
});
