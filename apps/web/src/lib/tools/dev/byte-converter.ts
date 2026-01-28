import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  inputUnit: z.enum(['auto', 'B', 'KB', 'MB', 'GB', 'TB', 'PB']).describe('Input unit'),
  outputUnit: z.enum(['auto', 'B', 'KB', 'MB', 'GB', 'TB', 'PB', 'all']).describe('Output unit'),
  binary: z.boolean().describe('Use binary units (1024) instead of decimal (1000)'),
  precision: z.number().min(0).max(10).describe('Decimal precision'),
});

export const byteConverter = defineTool({
  id: 'dev.byte-converter',
  title: 'Byte Converter',
  category: 'dev',
  description: 'Convert between bytes, KB, MB, GB, TB',
  keywords: ['bytes', 'kilobytes', 'megabytes', 'gigabytes', 'terabytes', 'size', 'convert'],

  mode: 'browser',

  input: {
    kind: 'text',
    placeholder: 'Enter value (e.g., 1024, 1.5GB, 500MB)',
  },

  output: {
    kind: 'text',
  },

  optionsSchema,
  defaults: {
    inputUnit: 'auto',
    outputUnit: 'all',
    binary: true,
    precision: 2,
  },

  async runBrowser(_ctx, input, options) {
    const text = (input as string).trim();

    if (!text) {
      throw new Error('Please enter a value');
    }

    const { inputUnit, outputUnit, binary, precision } = options;
    const base = binary ? 1024 : 1000;

    const units: Record<string, number> = {
      B: 1,
      KB: base,
      MB: base ** 2,
      GB: base ** 3,
      TB: base ** 4,
      PB: base ** 5,
    };

    let bytes: number;

    if (inputUnit === 'auto') {
      const parsed = parseValueWithUnit(text, units);
      bytes = parsed.bytes;
    } else {
      const num = parseFloat(text);
      if (isNaN(num)) {
        throw new Error('Invalid number');
      }
      bytes = num * units[inputUnit];
    }

    if (bytes < 0) {
      throw new Error('Value cannot be negative');
    }

    if (outputUnit === 'all') {
      const results: string[] = [];
      for (const [unit, multiplier] of Object.entries(units)) {
        const value = bytes / multiplier;
        const formatted = formatNumber(value, precision);
        const suffix = binary && unit !== 'B' ? unit.replace('B', 'iB') : unit;
        results.push(`${formatted} ${suffix}`);
      }
      return results.join('\n');
    }

    if (outputUnit === 'auto') {
      const unit = findBestUnit(bytes, units);
      const value = bytes / units[unit];
      const formatted = formatNumber(value, precision);
      const suffix = binary && unit !== 'B' ? unit.replace('B', 'iB') : unit;
      return `${formatted} ${suffix}`;
    }

    const value = bytes / units[outputUnit];
    const formatted = formatNumber(value, precision);
    const suffix = binary && outputUnit !== 'B' ? outputUnit.replace('B', 'iB') : outputUnit;
    return `${formatted} ${suffix}`;
  },
});

interface ParsedValue {
  bytes: number;
}

function parseValueWithUnit(input: string, units: Record<string, number>): ParsedValue {
  const match = input.match(/^([\d.]+)\s*([a-zA-Z]*)/);

  if (!match) {
    throw new Error('Invalid format. Use a number optionally followed by a unit (e.g., 1024, 1.5GB)');
  }

  const num = parseFloat(match[1]);
  if (isNaN(num)) {
    throw new Error('Invalid number');
  }

  let unit = match[2].toUpperCase();

  if (!unit) {
    return { bytes: num };
  }

  unit = unit.replace('IB', 'B');

  if (!(unit in units)) {
    throw new Error(`Unknown unit: ${match[2]}. Valid units: B, KB, MB, GB, TB, PB`);
  }

  return { bytes: num * units[unit] };
}

function findBestUnit(bytes: number, units: Record<string, number>): string {
  const sortedUnits = Object.entries(units).sort((a, b) => b[1] - a[1]);

  for (const [unit, multiplier] of sortedUnits) {
    if (bytes >= multiplier) {
      return unit;
    }
  }

  return 'B';
}

function formatNumber(value: number, precision: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(precision).replace(/\.?0+$/, '');
}
