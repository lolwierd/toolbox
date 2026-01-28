import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  caseType: z.enum([
    'uppercase',
    'lowercase', 
    'titlecase',
    'sentencecase',
    'camelCase',
    'PascalCase',
    'snake_case',
    'SCREAMING_SNAKE_CASE',
    'kebab-case',
  ]).describe('Target case format'),
});

function toWords(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

function toTitleCase(text: string): string {
  return text.replace(/\w\S*/g, word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}

function toSentenceCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
}

function toCamelCase(text: string): string {
  const words = toWords(text);
  return words
    .map((word, i) => 
      i === 0 
        ? word.toLowerCase() 
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
}

function toPascalCase(text: string): string {
  const words = toWords(text);
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function toSnakeCase(text: string): string {
  return toWords(text).map(w => w.toLowerCase()).join('_');
}

function toScreamingSnakeCase(text: string): string {
  return toWords(text).map(w => w.toUpperCase()).join('_');
}

function toKebabCase(text: string): string {
  return toWords(text).map(w => w.toLowerCase()).join('-');
}

export const caseConvert = defineTool({
  id: 'text.case-convert',
  title: 'Case Converter',
  category: 'text',
  description: 'Convert text case (upper, lower, title, camel, snake, kebab)',
  keywords: ['case', 'uppercase', 'lowercase', 'title', 'camel', 'snake', 'kebab', 'pascal'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    placeholder: 'Paste text to convert...',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    caseType: 'lowercase',
  },
  
  async runBrowser(_ctx, input, options) {
    const text = input as string;
    
    if (!text) {
      throw new Error('Please enter some text');
    }
    
    switch (options.caseType) {
      case 'uppercase':
        return text.toUpperCase();
      case 'lowercase':
        return text.toLowerCase();
      case 'titlecase':
        return toTitleCase(text);
      case 'sentencecase':
        return toSentenceCase(text);
      case 'camelCase':
        return toCamelCase(text);
      case 'PascalCase':
        return toPascalCase(text);
      case 'snake_case':
        return toSnakeCase(text);
      case 'SCREAMING_SNAKE_CASE':
        return toScreamingSnakeCase(text);
      case 'kebab-case':
        return toKebabCase(text);
      default:
        return text;
    }
  },
});
