import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  runCount: z.number().min(1).max(50).describe('Number of next runs to show'),
  timezone: z.string().describe('Timezone for display'),
});

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const cronParser = defineTool({
  id: 'time.cron',
  title: 'Cron Expression Parser',
  category: 'time',
  description: 'Parse cron expressions and show next run times',
  keywords: ['cron', 'schedule', 'crontab', 'job', 'timer'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    placeholder: 'Enter a cron expression (e.g., */5 * * * * or 0 0 * * MON-FRI)',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    runCount: 5,
    timezone: 'local',
  },
  
  async runBrowser(_ctx, input, options) {
    const expression = (input as string).trim();
    
    if (!expression) {
      throw new Error('Please enter a cron expression');
    }
    
    const parsed = parseCronExpression(expression);
    const description = describeCronExpression(parsed);
    const nextRuns = getNextRuns(parsed, options.runCount, options.timezone);
    
    const lines = [
      `Expression: ${expression}`,
      `Format: ${parsed.hasSeconds ? '6-field (with seconds)' : '5-field (standard)'}`,
      '',
      '## Description',
      description,
      '',
      '## Field Values',
      ...formatFieldValues(parsed),
      '',
      `## Next ${options.runCount} Runs`,
      ...nextRuns.map((date, i) => `${i + 1}. ${formatDate(date, options.timezone)}`),
    ];
    
    return lines.join('\n');
  },
});

interface ParsedCron {
  hasSeconds: boolean;
  seconds: number[];
  minutes: number[];
  hours: number[];
  daysOfMonth: number[];
  months: number[];
  daysOfWeek: number[];
}

function parseCronExpression(expr: string): ParsedCron {
  const parts = expr.split(/\s+/);
  
  if (parts.length < 5 || parts.length > 6) {
    throw new Error('Invalid cron expression: expected 5 or 6 fields');
  }
  
  const hasSeconds = parts.length === 6;
  let idx = 0;
  
  const seconds = hasSeconds ? parseField(parts[idx++], 0, 59, 'seconds') : [0];
  const minutes = parseField(parts[idx++], 0, 59, 'minutes');
  const hours = parseField(parts[idx++], 0, 23, 'hours');
  const daysOfMonth = parseField(parts[idx++], 1, 31, 'day of month');
  const months = parseField(parts[idx++], 1, 12, 'month');
  const daysOfWeek = parseField(parts[idx++], 0, 6, 'day of week');
  
  return { hasSeconds, seconds, minutes, hours, daysOfMonth, months, daysOfWeek };
}

function parseField(field: string, min: number, max: number, name: string): number[] {
  const values = new Set<number>();
  
  // Handle named values for days and months
  field = field.toUpperCase()
    .replace(/SUN/g, '0').replace(/MON/g, '1').replace(/TUE/g, '2')
    .replace(/WED/g, '3').replace(/THU/g, '4').replace(/FRI/g, '5').replace(/SAT/g, '6')
    .replace(/JAN/g, '1').replace(/FEB/g, '2').replace(/MAR/g, '3')
    .replace(/APR/g, '4').replace(/MAY/g, '5').replace(/JUN/g, '6')
    .replace(/JUL/g, '7').replace(/AUG/g, '8').replace(/SEP/g, '9')
    .replace(/OCT/g, '10').replace(/NOV/g, '11').replace(/DEC/g, '12');
  
  for (const part of field.split(',')) {
    // Handle step values: */5 or 1-10/2
    const stepMatch = part.match(/^(.+)\/(\d+)$/);
    const step = stepMatch ? parseInt(stepMatch[2], 10) : 1;
    const range = stepMatch ? stepMatch[1] : part;
    
    if (range === '*') {
      for (let i = min; i <= max; i += step) {
        values.add(i);
      }
    } else if (range.includes('-')) {
      const [startStr, endStr] = range.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      
      if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) {
        throw new Error(`Invalid range in ${name}: ${range}`);
      }
      
      for (let i = start; i <= end; i += step) {
        values.add(i);
      }
    } else {
      const val = parseInt(range, 10);
      if (isNaN(val) || val < min || val > max) {
        throw new Error(`Invalid value in ${name}: ${range}`);
      }
      values.add(val);
    }
  }
  
  return Array.from(values).sort((a, b) => a - b);
}

function describeCronExpression(parsed: ParsedCron): string {
  const parts: string[] = [];
  
  // Time description
  const timeDesc = describeTime(parsed);
  parts.push(timeDesc);
  
  // Day of month
  if (parsed.daysOfMonth.length < 31) {
    if (parsed.daysOfMonth.length === 1) {
      parts.push(`on day ${parsed.daysOfMonth[0]}`);
    } else {
      parts.push(`on days ${formatList(parsed.daysOfMonth)}`);
    }
  }
  
  // Month
  if (parsed.months.length < 12) {
    const monthNames = parsed.months.map(m => MONTHS[m - 1]);
    if (monthNames.length === 1) {
      parts.push(`in ${monthNames[0]}`);
    } else {
      parts.push(`in ${formatList(monthNames)}`);
    }
  }
  
  // Day of week
  if (parsed.daysOfWeek.length < 7) {
    const dayNames = parsed.daysOfWeek.map(d => WEEKDAYS[d]);
    if (dayNames.length === 1) {
      parts.push(`on ${dayNames[0]}`);
    } else if (isConsecutive(parsed.daysOfWeek) && parsed.daysOfWeek.length > 2) {
      parts.push(`${dayNames[0]} through ${dayNames[dayNames.length - 1]}`);
    } else {
      parts.push(`on ${formatList(dayNames)}`);
    }
  }
  
  return parts.join(' ');
}

function describeTime(parsed: ParsedCron): string {
  const { seconds, minutes, hours, hasSeconds } = parsed;
  
  // Every minute
  if (minutes.length === 60 && hours.length === 24) {
    if (hasSeconds && seconds.length < 60) {
      return `At second ${formatList(seconds)} of every minute`;
    }
    return 'Every minute';
  }
  
  // Every N minutes
  if (hours.length === 24 && minutes.length > 1) {
    const step = findStep(minutes, 0, 59);
    if (step) {
      return `Every ${step} minutes`;
    }
  }
  
  // Every hour
  if (hours.length === 24 && minutes.length === 1) {
    return `At minute ${minutes[0]} of every hour`;
  }
  
  // Every N hours
  if (hours.length > 1 && minutes.length === 1) {
    const step = findStep(hours, 0, 23);
    if (step) {
      return `Every ${step} hours at minute ${minutes[0]}`;
    }
  }
  
  // Specific times
  if (hours.length === 1 && minutes.length === 1) {
    const time = formatTime(hours[0], minutes[0]);
    return `At ${time}`;
  }
  
  // Multiple specific times
  if (hours.length <= 4 && minutes.length === 1) {
    const times = hours.map(h => formatTime(h, minutes[0]));
    return `At ${formatList(times)}`;
  }
  
  return `At minute ${formatList(minutes)} past hour ${formatList(hours)}`;
}

function findStep(values: number[], min: number, max: number): number | null {
  if (values.length < 2) return null;
  
  const step = values[1] - values[0];
  if (step <= 1) return null;
  
  // Verify all values follow the step pattern
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i + 1] - values[i] !== step) return null;
  }
  
  // Verify the pattern starts from min
  if (values[0] !== min) return null;
  
  return step;
}

function formatTime(hour: number, minute: number): string {
  const h = hour.toString().padStart(2, '0');
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatList(items: (string | number)[]): string {
  if (items.length === 1) return String(items[0]);
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
}

function isConsecutive(values: number[]): boolean {
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i - 1] + 1) return false;
  }
  return true;
}

function formatFieldValues(parsed: ParsedCron): string[] {
  const lines: string[] = [];
  
  if (parsed.hasSeconds) {
    lines.push(`- Seconds: ${formatFieldSummary(parsed.seconds, 0, 59)}`);
  }
  lines.push(`- Minutes: ${formatFieldSummary(parsed.minutes, 0, 59)}`);
  lines.push(`- Hours: ${formatFieldSummary(parsed.hours, 0, 23)}`);
  lines.push(`- Days of Month: ${formatFieldSummary(parsed.daysOfMonth, 1, 31)}`);
  lines.push(`- Months: ${parsed.months.length === 12 ? 'Every month' : parsed.months.map(m => MONTHS[m - 1]).join(', ')}`);
  lines.push(`- Days of Week: ${parsed.daysOfWeek.length === 7 ? 'Every day' : parsed.daysOfWeek.map(d => WEEKDAYS[d]).join(', ')}`);
  
  return lines;
}

function formatFieldSummary(values: number[], min: number, max: number): string {
  if (values.length === max - min + 1) return 'Every value';
  if (values.length === 1) return String(values[0]);
  if (values.length <= 5) return values.join(', ');
  
  const step = findStep(values, min, max);
  if (step) return `Every ${step} (${values[0]}, ${values[1]}, ${values[2]}, ...)`;
  
  return `${values.length} values: ${values.slice(0, 3).join(', ')}, ...`;
}

function getNextRuns(parsed: ParsedCron, count: number, timezone: string): Date[] {
  const runs: Date[] = [];
  const now = new Date();
  let current = new Date(now);
  
  // Start from next second/minute
  current.setMilliseconds(0);
  if (!parsed.hasSeconds) {
    current.setSeconds(0);
    current.setMinutes(current.getMinutes() + 1);
  } else {
    current.setSeconds(current.getSeconds() + 1);
  }
  
  const maxIterations = 10000;
  let iterations = 0;
  
  while (runs.length < count && iterations < maxIterations) {
    iterations++;
    
    if (matchesCron(current, parsed)) {
      runs.push(new Date(current));
      // Move to next second/minute
      if (parsed.hasSeconds) {
        current.setSeconds(current.getSeconds() + 1);
      } else {
        current.setMinutes(current.getMinutes() + 1);
      }
    } else {
      // Advance to next possible match
      advanceToNextPossible(current, parsed);
    }
  }
  
  return runs;
}

function matchesCron(date: Date, parsed: ParsedCron): boolean {
  return (
    parsed.seconds.includes(date.getSeconds()) &&
    parsed.minutes.includes(date.getMinutes()) &&
    parsed.hours.includes(date.getHours()) &&
    parsed.daysOfMonth.includes(date.getDate()) &&
    parsed.months.includes(date.getMonth() + 1) &&
    parsed.daysOfWeek.includes(date.getDay())
  );
}

function advanceToNextPossible(date: Date, parsed: ParsedCron): void {
  // Check month
  const month = date.getMonth() + 1;
  if (!parsed.months.includes(month)) {
    const nextMonth = findNext(parsed.months, month, 12, true);
    if (nextMonth <= month) {
      date.setFullYear(date.getFullYear() + 1);
    }
    date.setMonth(nextMonth - 1);
    date.setDate(1);
    date.setHours(parsed.hours[0]);
    date.setMinutes(parsed.minutes[0]);
    date.setSeconds(parsed.seconds[0]);
    return;
  }
  
  // Check day of month and day of week
  const dayOfMonth = date.getDate();
  const dayOfWeek = date.getDay();
  if (!parsed.daysOfMonth.includes(dayOfMonth) || !parsed.daysOfWeek.includes(dayOfWeek)) {
    date.setDate(date.getDate() + 1);
    date.setHours(parsed.hours[0]);
    date.setMinutes(parsed.minutes[0]);
    date.setSeconds(parsed.seconds[0]);
    return;
  }
  
  // Check hour
  const hour = date.getHours();
  if (!parsed.hours.includes(hour)) {
    const nextHour = findNext(parsed.hours, hour, 23, true);
    if (nextHour <= hour) {
      date.setDate(date.getDate() + 1);
    }
    date.setHours(nextHour);
    date.setMinutes(parsed.minutes[0]);
    date.setSeconds(parsed.seconds[0]);
    return;
  }
  
  // Check minute
  const minute = date.getMinutes();
  if (!parsed.minutes.includes(minute)) {
    const nextMinute = findNext(parsed.minutes, minute, 59, true);
    if (nextMinute <= minute) {
      date.setHours(date.getHours() + 1);
    }
    date.setMinutes(nextMinute);
    date.setSeconds(parsed.seconds[0]);
    return;
  }
  
  // Check second
  const second = date.getSeconds();
  if (!parsed.seconds.includes(second)) {
    const nextSecond = findNext(parsed.seconds, second, 59, true);
    if (nextSecond <= second) {
      date.setMinutes(date.getMinutes() + 1);
    }
    date.setSeconds(nextSecond);
  }
}

function findNext(values: number[], current: number, max: number, wrap: boolean): number {
  for (const v of values) {
    if (v > current) return v;
  }
  return wrap ? values[0] : max + 1;
}

function formatDate(date: Date, timezone: string): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  
  if (timezone === 'local') {
    return date.toLocaleString('en-US', options);
  }
  
  try {
    return date.toLocaleString('en-US', { ...options, timeZone: timezone });
  } catch {
    return date.toLocaleString('en-US', options) + ` (invalid timezone: ${timezone})`;
  }
}
