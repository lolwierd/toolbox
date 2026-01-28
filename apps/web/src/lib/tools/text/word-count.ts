import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  countWhitespace: z.boolean().describe('Include whitespace in character count'),
});

export const wordCount = defineTool({
  id: 'text.word-count',
  title: 'Word Count',
  category: 'text',
  description: 'Count words, characters, lines, and paragraphs',
  keywords: ['count', 'words', 'characters', 'lines', 'paragraphs', 'statistics', 'stats'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    placeholder: 'Paste text to count...',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    countWhitespace: false,
  },
  
  async runBrowser(_ctx, input, options) {
    const text = input as string;
    
    if (!text) {
      throw new Error('Please enter some text');
    }
    
    const lines = text.split(/\r?\n/);
    const lineCount = lines.length;
    
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const paragraphCount = paragraphs.length;
    
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = text.trim() === '' ? 0 : words.length;
    
    const charCount = options.countWhitespace 
      ? text.length 
      : text.replace(/\s/g, '').length;
    
    const charCountWithSpaces = text.length;
    const charCountWithoutSpaces = text.replace(/\s/g, '').length;
    
    const avgWordLength = wordCount > 0 
      ? (charCountWithoutSpaces / wordCount).toFixed(1) 
      : '0';
    
    const avgWordsPerLine = lineCount > 0 
      ? (wordCount / lineCount).toFixed(1) 
      : '0';
    
    return `Statistics:
─────────────────────────
Words:                ${wordCount.toLocaleString()}
Characters (no spaces): ${charCountWithoutSpaces.toLocaleString()}
Characters (with spaces): ${charCountWithSpaces.toLocaleString()}
Lines:                ${lineCount.toLocaleString()}
Paragraphs:           ${paragraphCount.toLocaleString()}
─────────────────────────
Avg word length:      ${avgWordLength} chars
Avg words per line:   ${avgWordsPerLine}`;
  },
});
