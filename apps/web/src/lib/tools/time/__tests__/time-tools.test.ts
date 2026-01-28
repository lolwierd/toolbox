import { describe, it, expect, vi, beforeEach } from 'vitest';
import { timestampConverter } from '../timestamp';
import { cronParser } from '../cron';

const mockContext = {
  signal: new AbortController().signal,
  onProgress: vi.fn(),
};

describe('timestampConverter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('unix timestamp to date', () => {
    it('converts unix seconds timestamp to date', async () => {
      const result = await timestampConverter.runBrowser!(mockContext, '1609459200', { timezone: 'UTC' });
      
      expect(result).toContain('Unix (seconds): 1609459200');
      expect(result).toContain('Unix (milliseconds): 1609459200000');
      expect(result).toContain('ISO 8601: 2021-01-01T00:00:00.000Z');
    });

    it('converts unix milliseconds timestamp to date', async () => {
      const result = await timestampConverter.runBrowser!(mockContext, '1609459200000', { timezone: 'UTC' });
      
      expect(result).toContain('Unix (seconds): 1609459200');
      expect(result).toContain('ISO 8601: 2021-01-01T00:00:00.000Z');
    });

    it('handles large timestamps correctly', async () => {
      const result = await timestampConverter.runBrowser!(mockContext, '2000000000', { timezone: 'UTC' });
      
      expect(result).toContain('Unix (seconds): 2000000000');
      expect(result).toContain('2033');
    });
  });

  describe('date string to timestamp', () => {
    it('converts ISO date string to timestamp', async () => {
      const result = await timestampConverter.runBrowser!(mockContext, '2021-01-01', { timezone: 'UTC' });
      
      expect(result).toContain('Unix (seconds):');
      expect(result).toContain('ISO 8601:');
      expect(result).toContain('2021');
    });

    it('converts full ISO datetime string to timestamp', async () => {
      const result = await timestampConverter.runBrowser!(mockContext, '2021-01-01T12:30:00Z', { timezone: 'UTC' });
      
      expect(result).toContain('Unix (seconds): 1609504200');
      expect(result).toContain('ISO 8601: 2021-01-01T12:30:00.000Z');
    });

    it('converts date with time to timestamp', async () => {
      const result = await timestampConverter.runBrowser!(mockContext, '2021-06-15T09:30:00Z', { timezone: 'UTC' });
      
      expect(result).toContain('2021');
      expect(result).toContain('Unix (seconds):');
    });
  });

  describe('empty input', () => {
    it('shows current time when input is empty', async () => {
      const result = await timestampConverter.runBrowser!(mockContext, '', { timezone: 'local' });
      
      expect(result).toContain('Unix (seconds):');
      expect(result).toContain('Unix (milliseconds):');
      expect(result).toContain('ISO 8601:');
      expect(result).toContain('Relative:');
    });

    it('shows current time when input is whitespace', async () => {
      const result = await timestampConverter.runBrowser!(mockContext, '   ', { timezone: 'local' });
      
      expect(result).toContain('Unix (seconds):');
      expect(result).toContain('ISO 8601:');
    });
  });

  describe('invalid input', () => {
    it('throws error for invalid input', async () => {
      await expect(
        timestampConverter.runBrowser!(mockContext, 'not-a-date', { timezone: 'UTC' })
      ).rejects.toThrow('Could not parse input as timestamp or date');
    });

    it('throws error for random text', async () => {
      await expect(
        timestampConverter.runBrowser!(mockContext, 'hello world', { timezone: 'UTC' })
      ).rejects.toThrow('Could not parse input as timestamp or date');
    });
  });

  describe('timezone handling', () => {
    it('displays time in specified timezone', async () => {
      const result = await timestampConverter.runBrowser!(mockContext, '1609459200', { timezone: 'America/New_York' });
      
      expect(result).toContain('America/New_York:');
    });

    it('handles local timezone', async () => {
      const result = await timestampConverter.runBrowser!(mockContext, '1609459200', { timezone: 'local' });
      
      expect(result).toContain('Local:');
      expect(result).toContain('Timezone:');
    });

    it('handles invalid timezone gracefully', async () => {
      const result = await timestampConverter.runBrowser!(mockContext, '1609459200', { timezone: 'Invalid/Timezone' });
      
      expect(result).toContain('Invalid timezone: Invalid/Timezone');
    });
  });

  describe('relative time', () => {
    it('includes relative time in output', async () => {
      const result = await timestampConverter.runBrowser!(mockContext, '1609459200', { timezone: 'UTC' });
      
      expect(result).toContain('Relative:');
      expect(result).toMatch(/ago|from now/);
    });
  });
});

describe('cronParser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic cron expressions', () => {
    it('parses every minute expression', async () => {
      const result = await cronParser.runBrowser!(mockContext, '* * * * *', { runCount: 5, timezone: 'UTC' });
      
      expect(result).toContain('Expression: * * * * *');
      expect(result).toContain('Every minute');
      expect(result).toContain('5-field (standard)');
    });

    it('parses every 5 minutes expression', async () => {
      const result = await cronParser.runBrowser!(mockContext, '*/5 * * * *', { runCount: 5, timezone: 'UTC' });
      
      expect(result).toContain('Expression: */5 * * * *');
      expect(result).toContain('Every 5 minutes');
    });

    it('parses every hour at minute 0', async () => {
      const result = await cronParser.runBrowser!(mockContext, '0 * * * *', { runCount: 5, timezone: 'UTC' });
      
      expect(result).toContain('At minute 0 of every hour');
    });
  });

  describe('weekday schedules', () => {
    it('parses weekday 9am cron expression', async () => {
      const result = await cronParser.runBrowser!(mockContext, '0 9 * * 1-5', { runCount: 5, timezone: 'UTC' });
      
      expect(result).toContain('Expression: 0 9 * * 1-5');
      expect(result).toContain('At 09:00');
      expect(result).toContain('Monday through Friday');
    });

    it('parses specific weekdays', async () => {
      const result = await cronParser.runBrowser!(mockContext, '0 10 * * MON,WED,FRI', { runCount: 5, timezone: 'UTC' });
      
      expect(result).toContain('Monday');
      expect(result).toContain('Wednesday');
      expect(result).toContain('Friday');
    });

    it('parses weekend only', async () => {
      const result = await cronParser.runBrowser!(mockContext, '0 8 * * 0,6', { runCount: 5, timezone: 'UTC' });
      
      expect(result).toContain('Sunday');
      expect(result).toContain('Saturday');
    });
  });

  describe('specific times', () => {
    it('parses midnight daily', async () => {
      const result = await cronParser.runBrowser!(mockContext, '0 0 * * *', { runCount: 5, timezone: 'UTC' });
      
      expect(result).toContain('At 00:00');
    });

    it('parses noon daily', async () => {
      const result = await cronParser.runBrowser!(mockContext, '0 12 * * *', { runCount: 5, timezone: 'UTC' });
      
      expect(result).toContain('At 12:00');
    });

    it('parses multiple times per day', async () => {
      const result = await cronParser.runBrowser!(mockContext, '0 9,12,18 * * *', { runCount: 5, timezone: 'UTC' });
      
      expect(result).toContain('09:00');
      expect(result).toContain('12:00');
      expect(result).toContain('18:00');
    });
  });

  describe('monthly schedules', () => {
    it('parses first of month', async () => {
      const result = await cronParser.runBrowser!(mockContext, '0 0 1 * *', { runCount: 5, timezone: 'UTC' });
      
      expect(result).toContain('on day 1');
    });

    it('parses specific month', async () => {
      const result = await cronParser.runBrowser!(mockContext, '0 0 1 1 *', { runCount: 5, timezone: 'UTC' });
      
      expect(result).toContain('in January');
    });

    it('parses multiple months', async () => {
      const result = await cronParser.runBrowser!(mockContext, '0 0 1 1,6,12 *', { runCount: 5, timezone: 'UTC' });
      
      expect(result).toContain('January');
      expect(result).toContain('June');
      expect(result).toContain('December');
    });
  });

  describe('next run times', () => {
    it('shows correct number of next runs', async () => {
      const result = await cronParser.runBrowser!(mockContext, '* * * * *', { runCount: 3, timezone: 'UTC' });
      
      expect(result).toContain('Next 3 Runs');
      expect(result).toMatch(/1\./);
      expect(result).toMatch(/2\./);
      expect(result).toMatch(/3\./);
    });

    it('respects runCount option', async () => {
      const result = await cronParser.runBrowser!(mockContext, '0 0 * * *', { runCount: 10, timezone: 'UTC' });
      
      expect(result).toContain('Next 10 Runs');
    });

    it('shows next runs for hourly schedule', async () => {
      const result = await cronParser.runBrowser!(mockContext, '0 * * * *', { runCount: 5, timezone: 'UTC' });
      
      const runs = result.split('\n').filter(line => /^\d+\./.test(line));
      expect(runs.length).toBe(5);
    });
  });

  describe('6-field cron with seconds', () => {
    it('parses 6-field cron expression', async () => {
      const result = await cronParser.runBrowser!(mockContext, '0 0 * * * *', { runCount: 5, timezone: 'UTC' });
      
      expect(result).toContain('6-field (with seconds)');
    });

    it('parses every 30 seconds', async () => {
      const result = await cronParser.runBrowser!(mockContext, '*/30 * * * * *', { runCount: 5, timezone: 'UTC' });
      
      expect(result).toContain('6-field (with seconds)');
    });
  });

  describe('field values display', () => {
    it('shows field values section', async () => {
      const result = await cronParser.runBrowser!(mockContext, '0 9 * * 1-5', { runCount: 5, timezone: 'UTC' });
      
      expect(result).toContain('Field Values');
      expect(result).toContain('Minutes:');
      expect(result).toContain('Hours:');
      expect(result).toContain('Days of Month:');
      expect(result).toContain('Months:');
      expect(result).toContain('Days of Week:');
    });
  });

  describe('invalid cron expressions', () => {
    it('throws error for empty input', async () => {
      await expect(
        cronParser.runBrowser!(mockContext, '', { runCount: 5, timezone: 'UTC' })
      ).rejects.toThrow('Please enter a cron expression');
    });

    it('throws error for too few fields', async () => {
      await expect(
        cronParser.runBrowser!(mockContext, '* * *', { runCount: 5, timezone: 'UTC' })
      ).rejects.toThrow('Invalid cron expression: expected 5 or 6 fields');
    });

    it('throws error for too many fields', async () => {
      await expect(
        cronParser.runBrowser!(mockContext, '* * * * * * *', { runCount: 5, timezone: 'UTC' })
      ).rejects.toThrow('Invalid cron expression: expected 5 or 6 fields');
    });

    it('throws error for invalid minute value', async () => {
      await expect(
        cronParser.runBrowser!(mockContext, '60 * * * *', { runCount: 5, timezone: 'UTC' })
      ).rejects.toThrow('Invalid value in minutes');
    });

    it('throws error for invalid hour value', async () => {
      await expect(
        cronParser.runBrowser!(mockContext, '0 25 * * *', { runCount: 5, timezone: 'UTC' })
      ).rejects.toThrow('Invalid value in hours');
    });

    it('throws error for invalid range', async () => {
      await expect(
        cronParser.runBrowser!(mockContext, '0 0 32-35 * *', { runCount: 5, timezone: 'UTC' })
      ).rejects.toThrow('Invalid range in day of month');
    });

    it('throws error for inverted range', async () => {
      await expect(
        cronParser.runBrowser!(mockContext, '0 0 15-5 * *', { runCount: 5, timezone: 'UTC' })
      ).rejects.toThrow('Invalid range in day of month');
    });
  });

  describe('timezone handling', () => {
    it('handles local timezone', async () => {
      const result = await cronParser.runBrowser!(mockContext, '0 9 * * *', { runCount: 5, timezone: 'local' });
      
      expect(result).toContain('Next 5 Runs');
    });

    it('handles specific timezone', async () => {
      const result = await cronParser.runBrowser!(mockContext, '0 9 * * *', { runCount: 5, timezone: 'America/New_York' });
      
      expect(result).toContain('Next 5 Runs');
    });

    it('handles invalid timezone gracefully', async () => {
      const result = await cronParser.runBrowser!(mockContext, '0 9 * * *', { runCount: 5, timezone: 'Invalid/Zone' });
      
      expect(result).toContain('invalid timezone');
    });
  });
});
