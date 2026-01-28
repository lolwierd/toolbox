import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  indent: z.number().min(1).max(8).describe('Indentation spaces'),
  uppercase: z.boolean().describe('Uppercase SQL keywords'),
});

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'EXISTS',
  'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'ON',
  'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
  'CREATE', 'TABLE', 'INDEX', 'VIEW', 'DROP', 'ALTER', 'ADD', 'COLUMN',
  'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'DEFAULT', 'NULL',
  'AS', 'DISTINCT', 'ALL', 'UNION', 'INTERSECT', 'EXCEPT',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'BETWEEN', 'LIKE', 'IS',
  'WITH', 'RECURSIVE', 'RETURNING', 'USING', 'NATURAL',
];

const NEWLINE_BEFORE = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 
  'INNER JOIN', 'OUTER JOIN', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
  'INSERT', 'UPDATE', 'DELETE', 'SET', 'VALUES', 'UNION', 'INTERSECT', 'EXCEPT'];

export const sqlFormat = defineTool({
  id: 'format.sql-format',
  title: 'SQL Format',
  category: 'format',
  description: 'Format SQL queries with proper indentation and keyword styling',
  keywords: ['sql', 'format', 'beautify', 'query', 'database'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    placeholder: 'Paste SQL query here...',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    indent: 2,
    uppercase: true,
  },
  
  async runBrowser(_ctx, input, options) {
    const text = input as string;
    
    if (!text.trim()) {
      throw new Error('Please enter a SQL query');
    }
    
    return formatSql(text, options.indent, options.uppercase);
  },
});

function formatSql(sql: string, indentSize: number, uppercase: boolean): string {
  const indent = ' '.repeat(indentSize);
  
  let formatted = sql.replace(/\s+/g, ' ').trim();
  
  if (uppercase) {
    for (const keyword of SQL_KEYWORDS) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formatted = formatted.replace(regex, keyword);
    }
  } else {
    for (const keyword of SQL_KEYWORDS) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formatted = formatted.replace(regex, keyword.toLowerCase());
    }
  }
  
  for (const keyword of NEWLINE_BEFORE) {
    const target = uppercase ? keyword : keyword.toLowerCase();
    const regex = new RegExp(`\\s+${escapeRegex(target)}\\b`, 'gi');
    formatted = formatted.replace(regex, `\n${target}`);
  }
  
  const lines = formatted.split('\n');
  const result: string[] = [];
  let depth = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const upperLine = trimmed.toUpperCase();
    
    if (upperLine.startsWith('SELECT') || upperLine.startsWith('INSERT') || 
        upperLine.startsWith('UPDATE') || upperLine.startsWith('DELETE') ||
        upperLine.startsWith('WITH')) {
      result.push(indent.repeat(depth) + trimmed);
    } else if (upperLine.startsWith('FROM') || upperLine.startsWith('WHERE') ||
               upperLine.startsWith('GROUP BY') || upperLine.startsWith('ORDER BY') ||
               upperLine.startsWith('HAVING') || upperLine.startsWith('LIMIT') ||
               upperLine.startsWith('SET') || upperLine.startsWith('VALUES')) {
      result.push(indent.repeat(depth) + trimmed);
    } else if (upperLine.startsWith('AND') || upperLine.startsWith('OR')) {
      result.push(indent.repeat(depth + 1) + trimmed);
    } else if (upperLine.includes('JOIN')) {
      result.push(indent.repeat(depth) + trimmed);
    } else {
      result.push(indent.repeat(depth + 1) + trimmed);
    }
  }
  
  return result.join('\n');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
