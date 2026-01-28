import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({});

export const base64Decode = defineTool({
  id: 'crypto.base64-decode',
  title: 'Base64 Decode',
  category: 'crypto',
  description: 'Decode Base64 to text',
  keywords: ['decode', 'binary', 'text'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    placeholder: 'Enter Base64 string...',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {},
  
  async runBrowser(_ctx, input, _options) {
    let text = (input as string).trim();
    
    if (!text) {
      throw new Error('Please enter a Base64 string');
    }
    
    // Handle URL-safe base64
    text = text.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    while (text.length % 4 !== 0) {
      text += '=';
    }
    
    try {
      const decoded = atob(text);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }
      const decoder = new TextDecoder();
      return decoder.decode(bytes);
    } catch {
      throw new Error('Invalid Base64 string');
    }
  },
});
