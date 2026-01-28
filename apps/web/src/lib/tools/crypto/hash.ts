import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  algorithm: z.enum(['SHA-256', 'SHA-384', 'SHA-512', 'SHA-1']).describe('Hash algorithm'),
  uppercase: z.boolean().describe('Uppercase output'),
});

export const hashGenerator = defineTool({
  id: 'crypto.hash',
  title: 'Hash Generator',
  category: 'crypto',
  description: 'Generate SHA-256, SHA-512, or SHA-1 hash of text',
  keywords: ['sha256', 'sha512', 'sha1', 'checksum', 'digest'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    placeholder: 'Enter text to hash...',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    algorithm: 'SHA-256',
    uppercase: false,
  },
  
  async runBrowser(_ctx, input, options) {
    const text = input as string;
    
    if (!text) {
      throw new Error('Please enter some text');
    }
    
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest(options.algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    let hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (options.uppercase) {
      hashHex = hashHex.toUpperCase();
    }
    
    return hashHex;
  },
});
