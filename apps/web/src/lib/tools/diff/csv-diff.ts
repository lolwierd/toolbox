import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  useHeader: z.boolean().describe('Use first row as header for column names'),
  delimiter: z.string().max(1).describe('Field delimiter'),
});

export const csvDiff = defineTool({
  id: 'diff.csv',
  title: 'CSV Diff',
  category: 'diff',
  description: 'Compare two CSV files and show added, removed, and changed rows',
  keywords: ['compare', 'difference', 'changes', 'csv', 'spreadsheet', 'table'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    placeholder: 'Paste first CSV, then "---" separator, then second CSV',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    useHeader: true,
    delimiter: ',',
  },
  
  async runBrowser(_ctx, input, options) {
    const text = input as string;
    
    const parts = text.split(/^---+$/m);
    if (parts.length < 2) {
      throw new Error('Please separate the two CSV files with "---" on its own line');
    }
    
    const csv1 = parts[0].trim();
    const csv2 = parts.slice(1).join('---').trim();
    
    if (!csv1 || !csv2) {
      throw new Error('Both CSV inputs are required');
    }
    
    const rows1 = parseCSV(csv1, options.delimiter);
    const rows2 = parseCSV(csv2, options.delimiter);
    
    let headers: string[] | null = null;
    let dataRows1 = rows1;
    let dataRows2 = rows2;
    
    if (options.useHeader) {
      if (rows1.length === 0 || rows2.length === 0) {
        throw new Error('CSV files must have at least one row when using headers');
      }
      headers = rows1[0];
      dataRows1 = rows1.slice(1);
      dataRows2 = rows2.slice(1);
      
      const headers2 = rows2[0];
      if (headers.length !== headers2.length || !headers.every((h, i) => h === headers2[i])) {
        return `⚠ Headers differ:\n  CSV 1: ${headers.join(', ')}\n  CSV 2: ${headers2.join(', ')}\n\nCannot compare rows with different headers.`;
      }
    }
    
    const key1 = new Map<string, { row: string[]; index: number }>();
    const key2 = new Map<string, { row: string[]; index: number }>();
    
    dataRows1.forEach((row, i) => key1.set(rowKey(row), { row, index: i + 1 }));
    dataRows2.forEach((row, i) => key2.set(rowKey(row), { row, index: i + 1 }));
    
    const added: { row: string[]; index: number }[] = [];
    const removed: { row: string[]; index: number }[] = [];
    const changed: { index1: number; index2: number; row1: string[]; row2: string[]; diffs: number[] }[] = [];
    
    for (const [key, { row, index }] of key1) {
      if (!key2.has(key)) {
        const similar = findSimilarRow(row, dataRows2, key2);
        if (similar) {
          const diffs = findCellDiffs(row, similar.row);
          changed.push({ index1: index, index2: similar.index, row1: row, row2: similar.row, diffs });
          key2.delete(rowKey(similar.row));
        } else {
          removed.push({ row, index });
        }
      }
    }
    
    for (const [key, { row, index }] of key2) {
      if (!key1.has(key)) {
        added.push({ row, index });
      }
    }
    
    if (added.length === 0 && removed.length === 0 && changed.length === 0) {
      return '✓ No differences found';
    }
    
    const output: string[] = [];
    
    if (removed.length > 0) {
      output.push(`Removed (${removed.length} rows):`);
      for (const { row, index } of removed) {
        output.push(`  - Row ${index}: ${formatRow(row, headers)}`);
      }
      output.push('');
    }
    
    if (added.length > 0) {
      output.push(`Added (${added.length} rows):`);
      for (const { row, index } of added) {
        output.push(`  + Row ${index}: ${formatRow(row, headers)}`);
      }
      output.push('');
    }
    
    if (changed.length > 0) {
      output.push(`Changed (${changed.length} rows):`);
      for (const { index1, index2, row1, row2, diffs } of changed) {
        output.push(`  ~ Row ${index1} → ${index2}:`);
        for (const col of diffs) {
          const colName = headers ? headers[col] : `Column ${col + 1}`;
          output.push(`      ${colName}: "${row1[col]}" → "${row2[col]}"`);
        }
      }
    }
    
    return output.join('\n').trim();
  },
});

function parseCSV(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    rows.push(parseCSVRow(line, delimiter));
  }
  
  return rows;
}

function parseCSVRow(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === delimiter) {
        fields.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
  }
  
  fields.push(current);
  return fields;
}

function rowKey(row: string[]): string {
  return JSON.stringify(row);
}

function formatRow(row: string[], headers: string[] | null): string {
  if (headers) {
    return row.map((v, i) => `${headers[i]}: "${v}"`).join(', ');
  }
  return row.map(v => `"${v}"`).join(', ');
}

function findSimilarRow(
  row: string[],
  rows: string[][],
  remaining: Map<string, { row: string[]; index: number }>
): { row: string[]; index: number } | null {
  let bestMatch: { row: string[]; index: number } | null = null;
  let bestScore = 0;
  
  for (const candidate of rows) {
    if (!remaining.has(rowKey(candidate))) continue;
    if (candidate.length !== row.length) continue;
    
    let matches = 0;
    for (let i = 0; i < row.length; i++) {
      if (row[i] === candidate[i]) matches++;
    }
    
    const score = matches / row.length;
    if (score > 0.5 && score > bestScore) {
      bestScore = score;
      bestMatch = remaining.get(rowKey(candidate))!;
    }
  }
  
  return bestMatch;
}

function findCellDiffs(row1: string[], row2: string[]): number[] {
  const diffs: number[] = [];
  for (let i = 0; i < row1.length; i++) {
    if (row1[i] !== row2[i]) {
      diffs.push(i);
    }
  }
  return diffs;
}
