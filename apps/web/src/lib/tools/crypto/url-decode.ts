import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({});

export const urlDecode = defineTool({
  id: 'crypto.url-decode',
  title: 'URL Decode',
  category: 'crypto',
  description: 'Decode URL-encoded text',
  keywords: ['decode', 'url', 'percent', 'unescape', 'uri'],

  mode: 'browser',

  input: {
    kind: 'text',
    placeholder: 'Enter URL-encoded text to decode...',
  },

  output: {
    kind: 'text',
  },

  optionsSchema,
  defaults: {},

  async runBrowser(_ctx, input) {
    const text = input as string;

    if (!text) {
      throw new Error('Please enter some text');
    }

    try {
      return decodeURIComponent(text);
    } catch {
      throw new Error('Invalid URL-encoded text');
    }
  },
});
