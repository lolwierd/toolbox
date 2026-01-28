import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  outputFormat: z.enum(['hex', 'rgb', 'hsl', 'all']).describe('Output color format'),
});

export const colorConvert = defineTool({
  id: 'dev.color-convert',
  title: 'Color Converter',
  category: 'dev',
  description: 'Convert between hex, RGB, and HSL color formats',
  keywords: ['color', 'hex', 'rgb', 'hsl', 'convert', 'css'],

  mode: 'browser',

  input: {
    kind: 'text',
    placeholder: 'Enter color: #ff5733, rgb(255, 87, 51), or hsl(14, 100%, 60%)',
  },

  output: {
    kind: 'text',
  },

  optionsSchema,
  defaults: {
    outputFormat: 'all',
  },

  async runBrowser(_ctx, input, options) {
    const text = (input as string).trim();

    if (!text) {
      throw new Error('Please enter a color value');
    }

    const rgb = parseColor(text);
    const hex = rgbToHex(rgb);
    const hsl = rgbToHsl(rgb);

    if (options.outputFormat === 'hex') {
      return hex;
    }
    if (options.outputFormat === 'rgb') {
      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }
    if (options.outputFormat === 'hsl') {
      return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    }

    return [
      `HEX: ${hex}`,
      `RGB: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      `HSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    ].join('\n');
  },
});

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

function parseColor(input: string): RGB {
  const hexMatch = input.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
    };
  }

  const hex3Match = input.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
  if (hex3Match) {
    return {
      r: parseInt(hex3Match[1] + hex3Match[1], 16),
      g: parseInt(hex3Match[2] + hex3Match[2], 16),
      b: parseInt(hex3Match[3] + hex3Match[3], 16),
    };
  }

  const rgbMatch = input.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return {
      r: clamp(parseInt(rgbMatch[1], 10), 0, 255),
      g: clamp(parseInt(rgbMatch[2], 10), 0, 255),
      b: clamp(parseInt(rgbMatch[3], 10), 0, 255),
    };
  }

  const hslMatch = input.match(/hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/i);
  if (hslMatch) {
    return hslToRgb({
      h: parseInt(hslMatch[1], 10) % 360,
      s: clamp(parseInt(hslMatch[2], 10), 0, 100),
      l: clamp(parseInt(hslMatch[3], 10), 0, 100),
    });
  }

  throw new Error('Invalid color format. Use hex (#ff5733), RGB (rgb(255, 87, 51)), or HSL (hsl(14, 100%, 60%))');
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}
