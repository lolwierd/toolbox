import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  pattern: z.string().describe('Regular expression pattern'),
  flags: z.string().describe('Regex flags (g, i, m, s, u)'),
  showGroups: z.boolean().describe('Show capture groups'),
});

export const regexTest = defineTool({
  id: 'dev.regex-test',
  title: 'Regex Tester',
  category: 'dev',
  description: 'Test regular expressions against sample input',
  keywords: ['regex', 'regexp', 'pattern', 'match', 'test', 'groups'],

  mode: 'browser',

  input: {
    kind: 'text',
    placeholder: 'Enter test string...',
  },

  output: {
    kind: 'text',
  },

  optionsSchema,
  defaults: {
    pattern: '',
    flags: 'g',
    showGroups: true,
  },

  async runBrowser(_ctx, input, options) {
    const text = input as string;
    const { pattern, flags, showGroups } = options;

    if (!pattern) {
      throw new Error('Please enter a regex pattern in the options');
    }

    if (!text) {
      throw new Error('Please enter some test text');
    }

    let regex: RegExp;
    try {
      regex = new RegExp(pattern, flags);
    } catch (e) {
      throw new Error(`Invalid regex: ${e instanceof Error ? e.message : 'Parse error'}`);
    }

    const results: string[] = [];
    const matches: RegExpExecArray[] = [];

    if (flags.includes('g')) {
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        matches.push(match);
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }
    } else {
      const match = regex.exec(text);
      if (match) {
        matches.push(match);
      }
    }

    if (matches.length === 0) {
      return 'No matches found';
    }

    results.push(`Found ${matches.length} match${matches.length > 1 ? 'es' : ''}:\n`);

    matches.forEach((match, i) => {
      results.push(`Match ${i + 1}: "${match[0]}" at index ${match.index}`);

      if (showGroups && match.length > 1) {
        for (let g = 1; g < match.length; g++) {
          results.push(`  Group ${g}: "${match[g] ?? '(undefined)'}"`);
        }
      }

      if (match.groups && showGroups) {
        for (const [name, value] of Object.entries(match.groups)) {
          results.push(`  Group "${name}": "${value ?? '(undefined)'}"`);
        }
      }
    });

    return results.join('\n');
  },
});
