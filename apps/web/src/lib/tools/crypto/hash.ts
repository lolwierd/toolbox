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
    elements: [
      { name: 'text', kind: 'text', label: 'Text Input', placeholder: 'Enter text to hash...', optional: true },
      { name: 'file', kind: 'file', label: 'File Input', optional: true },
    ],
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
    const inputs = input as Record<string, any>;
    const text = inputs.text as string;
    const files = inputs.file as File[];
    
    if (!text && (!files || files.length === 0)) {
      throw new Error('Please provide text or a file');
    }
    
    let data: Uint8Array;
    
    if (files && files.length > 0) {
      const arrayBuffer = await files[0].arrayBuffer();
      data = new Uint8Array(arrayBuffer);
    } else {
      const encoder = new TextEncoder();
      data = encoder.encode(text);
    }

    const hashBuffer = await crypto.subtle.digest(options.algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    let hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (options.uppercase) {
      hashHex = hashHex.toUpperCase();
    }
    
    return hashHex;
  },
});
