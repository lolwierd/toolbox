import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({});

export const urlEncode = defineTool({
  id: 'crypto.url-encode',
  title: 'URL Encode',
  category: 'crypto',
  description: 'Encode text for use in URLs',
  keywords: ['encode', 'url', 'percent', 'escape', 'uri'],

  mode: 'browser',

  input: {
    kind: 'text',
    placeholder: 'Enter text to URL encode...',
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

    return encodeURIComponent(text);
  },
});
