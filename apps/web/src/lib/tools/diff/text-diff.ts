import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  ignoreWhitespace: z.boolean().describe('Ignore whitespace differences'),
  ignoreCase: z.boolean().describe('Ignore case differences'),
});

export const textDiff = defineTool({
  id: 'diff.text',
  title: 'Text Diff',
  category: 'diff',
  description: 'Compare two texts side by side with highlighting',
  keywords: ['compare', 'difference', 'changes'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    elements: [
      { name: 'original', kind: 'text', label: 'Original Text', placeholder: 'Paste original text here' },
      { name: 'modified', kind: 'text', label: 'Modified Text', placeholder: 'Paste modified text here' },
    ],
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    ignoreWhitespace: false,
    ignoreCase: false,
  },
  
  async runBrowser(_ctx, input, options) {
    const inputs = input as Record<string, string>;
    let text1 = (inputs.original || '').trim();
    let text2 = (inputs.modified || '').trim();
    
    if (options.ignoreCase) {
      text1 = text1.toLowerCase();
      text2 = text2.toLowerCase();
    }
    
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    
    if (options.ignoreWhitespace) {
      lines1.forEach((l, i) => lines1[i] = l.trim());
      lines2.forEach((l, i) => lines2[i] = l.trim());
    }
    
    const diff = computeDiff(lines1, lines2);
    return formatDiff(diff);
  },
});

type DiffLine = {
  type: 'same' | 'add' | 'remove';
  line1?: string;
  line2?: string;
  lineNum1?: number;
  lineNum2?: number;
};

function computeDiff(lines1: string[], lines2: string[]): DiffLine[] {
  const result: DiffLine[] = [];
  const maxLen = Math.max(lines1.length, lines2.length);
  
  // Simple line-by-line comparison (not optimal LCS, but good enough)
  let i1 = 0, i2 = 0;
  
  while (i1 < lines1.length || i2 < lines2.length) {
    const l1 = lines1[i1];
    const l2 = lines2[i2];
    
    if (i1 >= lines1.length) {
      result.push({ type: 'add', line2: l2, lineNum2: i2 + 1 });
      i2++;
    } else if (i2 >= lines2.length) {
      result.push({ type: 'remove', line1: l1, lineNum1: i1 + 1 });
      i1++;
    } else if (l1 === l2) {
      result.push({ type: 'same', line1: l1, line2: l2, lineNum1: i1 + 1, lineNum2: i2 + 1 });
      i1++;
      i2++;
    } else {
      // Look ahead for matches
      const lookAhead = 3;
      let found1 = -1, found2 = -1;
      
      for (let j = 1; j <= lookAhead && i2 + j < lines2.length; j++) {
        if (lines2[i2 + j] === l1) {
          found2 = j;
          break;
        }
      }
      
      for (let j = 1; j <= lookAhead && i1 + j < lines1.length; j++) {
        if (lines1[i1 + j] === l2) {
          found1 = j;
          break;
        }
      }
      
      if (found2 > 0 && (found1 < 0 || found2 <= found1)) {
        for (let j = 0; j < found2; j++) {
          result.push({ type: 'add', line2: lines2[i2], lineNum2: i2 + 1 });
          i2++;
        }
      } else if (found1 > 0) {
        for (let j = 0; j < found1; j++) {
          result.push({ type: 'remove', line1: lines1[i1], lineNum1: i1 + 1 });
          i1++;
        }
      } else {
        result.push({ type: 'remove', line1: l1, lineNum1: i1 + 1 });
        result.push({ type: 'add', line2: l2, lineNum2: i2 + 1 });
        i1++;
        i2++;
      }
    }
  }
  
  return result;
}

function formatDiff(diff: DiffLine[]): string {
  const lines: string[] = [];
  
  for (const d of diff) {
    if (d.type === 'same') {
      lines.push(`  ${d.line1}`);
    } else if (d.type === 'remove') {
      lines.push(`- ${d.line1}`);
    } else if (d.type === 'add') {
      lines.push(`+ ${d.line2}`);
    }
  }
  
  return lines.join('\n');
}
