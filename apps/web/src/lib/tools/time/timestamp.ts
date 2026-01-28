import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  timezone: z.string().describe('Timezone for display'),
});

export const timestampConverter = defineTool({
  id: 'time.timestamp',
  title: 'Timestamp Converter',
  category: 'time',
  description: 'Convert between Unix timestamps and human-readable dates',
  keywords: ['unix', 'epoch', 'date', 'time', 'convert'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    placeholder: 'Enter a timestamp (e.g., 1609459200) or date (e.g., 2021-01-01)',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    timezone: 'local',
  },
  
  async runBrowser(_ctx, input, options) {
    const text = (input as string).trim();
    
    if (!text) {
      const now = new Date();
      return formatOutput(now, options.timezone);
    }
    
    // Try to parse as number (Unix timestamp)
    const numValue = parseInt(text, 10);
    if (!isNaN(numValue) && text.match(/^\d+$/)) {
      // Check if seconds or milliseconds
      const ts = numValue > 9999999999 ? numValue : numValue * 1000;
      const date = new Date(ts);
      if (!isNaN(date.getTime())) {
        return formatOutput(date, options.timezone);
      }
    }
    
    // Try to parse as date string
    const date = new Date(text);
    if (!isNaN(date.getTime())) {
      return formatOutput(date, options.timezone);
    }
    
    throw new Error('Could not parse input as timestamp or date');
  },
});

function formatOutput(date: Date, timezone: string): string {
  const unixSeconds = Math.floor(date.getTime() / 1000);
  const unixMs = date.getTime();
  
  const lines = [
    `Unix (seconds): ${unixSeconds}`,
    `Unix (milliseconds): ${unixMs}`,
    '',
    `ISO 8601: ${date.toISOString()}`,
    `UTC: ${date.toUTCString()}`,
  ];
  
  if (timezone === 'local') {
    lines.push(`Local: ${date.toLocaleString()}`);
    lines.push(`Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  } else {
    try {
      const localized = date.toLocaleString('en-US', { timeZone: timezone });
      lines.push(`${timezone}: ${localized}`);
    } catch {
      lines.push(`(Invalid timezone: ${timezone})`);
    }
  }
  
  lines.push('');
  lines.push(`Relative: ${getRelativeTime(date)}`);
  
  return lines.join('\n');
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const absDiff = Math.abs(diff);
  
  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  const suffix = diff > 0 ? ' ago' : ' from now';
  
  if (years > 0) return `${years} year${years > 1 ? 's' : ''}${suffix}`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''}${suffix}`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''}${suffix}`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}${suffix}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}${suffix}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}${suffix}`;
  return `${seconds} second${seconds !== 1 ? 's' : ''}${suffix}`;
}
