import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  find: z.string().describe('Text or regex pattern to find'),
  replace: z.string().describe('Replacement text'),
  useRegex: z.boolean().describe('Treat find as regular expression'),
  caseSensitive: z.boolean().describe('Case sensitive matching'),
  replaceAll: z.boolean().describe('Replace all occurrences'),
});

export const findReplace = defineTool({
  id: 'text.find-replace',
  title: 'Find & Replace',
  category: 'text',
  description: 'Find and replace text with regex support',
  keywords: ['find', 'replace', 'regex', 'search', 'substitute', 'sed'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    placeholder: 'Paste text to search...',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    find: '',
    replace: '',
    useRegex: false,
    caseSensitive: true,
    replaceAll: true,
  },
  
  async runBrowser(_ctx, input, options) {
    const text = input as string;
    
    if (!text) {
      throw new Error('Please enter some text');
    }
    
    if (!options.find) {
      throw new Error('Please enter a search pattern');
    }
    
    let pattern: RegExp | string;
    const flags = (options.replaceAll ? 'g' : '') + (options.caseSensitive ? '' : 'i');
    
    if (options.useRegex) {
      try {
        pattern = new RegExp(options.find, flags);
      } catch (e) {
        throw new Error(`Invalid regex: ${(e as Error).message}`);
      }
    } else {
      const escaped = options.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pattern = new RegExp(escaped, flags);
    }
    
    const matches = text.match(new RegExp(pattern.source, 'g' + (options.caseSensitive ? '' : 'i')));
    const matchCount = matches ? matches.length : 0;
    
    const result = text.replace(pattern, options.replace);
    
    if (matchCount === 0) {
      throw new Error('No matches found');
    }
    
    return result;
  },
});
