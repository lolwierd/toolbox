import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  urlSafe: z.boolean().describe('Use URL-safe encoding'),
});

export const base64Encode = defineTool({
  id: 'crypto.base64-encode',
  title: 'Base64 Encode',
  category: 'crypto',
  description: 'Encode text or files to Base64',
  keywords: ['encode', 'binary', 'text'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    placeholder: 'Enter text to encode...',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    urlSafe: false,
  },
  
  async runBrowser(_ctx, input, options) {
    const text = input as string;
    
    if (!text) {
      throw new Error('Please enter some text');
    }
    
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    
    let result = btoa(String.fromCharCode(...bytes));
    
    if (options.urlSafe) {
      result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    
    return result;
  },
});
