import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';
import yaml from 'js-yaml';

const optionsSchema = z.object({
  sortKeys: z.boolean().describe('Sort keys before comparing'),
});

export const yamlDiff = defineTool({
  id: 'diff.yaml',
  title: 'YAML Diff',
  category: 'diff',
  description: 'Compare two YAML documents and highlight differences',
  keywords: ['compare', 'difference', 'changes', 'yaml', 'config'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    elements: [
      { name: 'original', kind: 'text', label: 'Original YAML', placeholder: 'Paste original YAML here' },
      { name: 'modified', kind: 'text', label: 'Modified YAML', placeholder: 'Paste modified YAML here' },
    ],
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    sortKeys: true,
  },
  
  async runBrowser(_ctx, input, options) {
    const inputs = input as Record<string, string>;
    
    let obj1: unknown, obj2: unknown;
    
    try {
      obj1 = yaml.load((inputs.original || '').trim());
    } catch (e) {
      throw new Error(`First YAML is invalid: ${e instanceof Error ? e.message : 'Parse error'}`);
    }
    
    try {
      obj2 = yaml.load((inputs.modified || '').trim());
    } catch (e) {
      throw new Error(`Second YAML is invalid: ${e instanceof Error ? e.message : 'Parse error'}`);
    }
    
    if (options.sortKeys) {
      obj1 = sortObjectKeys(obj1);
      obj2 = sortObjectKeys(obj2);
    }
    
    const diff = compareObjects(obj1, obj2, '');
    
    if (diff.length === 0) {
      return '✓ No differences found';
    }
    
    return diff.map(d => {
      if (d.type === 'added') {
        return `+ ${d.path}: ${formatValue(d.value)}`;
      } else if (d.type === 'removed') {
        return `- ${d.path}: ${formatValue(d.value)}`;
      } else {
        return `~ ${d.path}:\n    - ${formatValue(d.oldValue)}\n    + ${formatValue(d.newValue)}`;
      }
    }).join('\n\n');
  },
});

function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  return yaml.dump(value, { flowLevel: 2 }).trim();
}

type DiffEntry = 
  | { type: 'added'; path: string; value: unknown }
  | { type: 'removed'; path: string; value: unknown }
  | { type: 'changed'; path: string; oldValue: unknown; newValue: unknown };

function compareObjects(obj1: unknown, obj2: unknown, path: string): DiffEntry[] {
  const diffs: DiffEntry[] = [];
  
  if (obj1 === obj2) return diffs;
  
  if (typeof obj1 !== typeof obj2) {
    diffs.push({ type: 'changed', path: path || '$', oldValue: obj1, newValue: obj2 });
    return diffs;
  }
  
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const maxLen = Math.max(obj1.length, obj2.length);
    for (let i = 0; i < maxLen; i++) {
      const itemPath = `${path}[${i}]`;
      if (i >= obj1.length) {
        diffs.push({ type: 'added', path: itemPath, value: obj2[i] });
      } else if (i >= obj2.length) {
        diffs.push({ type: 'removed', path: itemPath, value: obj1[i] });
      } else {
        diffs.push(...compareObjects(obj1[i], obj2[i], itemPath));
      }
    }
    return diffs;
  }
  
  if (obj1 !== null && typeof obj1 === 'object' && obj2 !== null && typeof obj2 === 'object') {
    const keys1 = Object.keys(obj1 as object);
    const keys2 = Object.keys(obj2 as object);
    const allKeys = new Set([...keys1, ...keys2]);
    
    for (const key of allKeys) {
      const keyPath = path ? `${path}.${key}` : key;
      const v1 = (obj1 as Record<string, unknown>)[key];
      const v2 = (obj2 as Record<string, unknown>)[key];
      
      if (!(key in (obj1 as object))) {
        diffs.push({ type: 'added', path: keyPath, value: v2 });
      } else if (!(key in (obj2 as object))) {
        diffs.push({ type: 'removed', path: keyPath, value: v1 });
      } else {
        diffs.push(...compareObjects(v1, v2, keyPath));
      }
    }
    return diffs;
  }
  
  if (obj1 !== obj2) {
    diffs.push({ type: 'changed', path: path || '$', oldValue: obj1, newValue: obj2 });
  }
  
  return diffs;
}

function sortObjectKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  
  return obj;
}
