import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  indent: z.number().min(1).max(8).describe('Indentation spaces'),
});

export const xmlPrettify = defineTool({
  id: 'format.xml-prettify',
  title: 'XML Prettify',
  category: 'format',
  description: 'Format and beautify XML with proper indentation',
  keywords: ['xml', 'format', 'beautify', 'indent', 'html'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    placeholder: 'Paste XML here...',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    indent: 2,
  },
  
  async runBrowser(_ctx, input, options) {
    const text = input as string;
    
    if (!text.trim()) {
      throw new Error('Please enter some XML');
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'application/xml');
    
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) {
      throw new Error(`Invalid XML: ${errorNode.textContent?.split('\n')[0] || 'Parse error'}`);
    }
    
    return formatXml(text, options.indent);
  },
});

function formatXml(xml: string, indentSize: number): string {
  const indent = ' '.repeat(indentSize);
  let formatted = '';
  let depth = 0;
  
  const normalized = xml
    .replace(/>\s*</g, '><')
    .replace(/\s+/g, ' ')
    .trim();
  
  const tokens = normalized.match(/<[^>]+>|[^<]+/g) || [];
  
  for (const token of tokens) {
    if (token.startsWith('</')) {
      depth--;
      formatted += indent.repeat(depth) + token + '\n';
    } else if (token.startsWith('<') && token.endsWith('/>')) {
      formatted += indent.repeat(depth) + token + '\n';
    } else if (token.startsWith('<?') || token.startsWith('<!')) {
      formatted += indent.repeat(depth) + token + '\n';
    } else if (token.startsWith('<')) {
      formatted += indent.repeat(depth) + token + '\n';
      depth++;
    } else {
      const trimmed = token.trim();
      if (trimmed) {
        formatted = formatted.trimEnd() + trimmed + '\n';
        depth--;
      }
    }
  }
  
  return formatted.trim();
}
