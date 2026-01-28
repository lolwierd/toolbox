import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  targetEnding: z.enum(['lf', 'crlf']).describe('Target line ending format'),
});

export const lineEndings = defineTool({
  id: 'text.line-endings',
  title: 'Convert Line Endings',
  category: 'text',
  description: 'Convert line endings between LF (Unix) and CRLF (Windows)',
  keywords: ['newline', 'unix', 'windows', 'dos', 'eol'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    placeholder: 'Paste text here...',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    targetEnding: 'lf',
  },
  
  async runBrowser(_ctx, input, options) {
    const text = input as string;
    
    if (!text) {
      throw new Error('Please enter some text');
    }
    
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    if (options.targetEnding === 'crlf') {
      return normalized.replace(/\n/g, '\r\n');
    }
    
    return normalized;
  },
});
