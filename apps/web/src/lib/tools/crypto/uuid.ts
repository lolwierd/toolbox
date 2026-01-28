import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  count: z.number().min(1).max(100).describe('Number of UUIDs to generate'),
  uppercase: z.boolean().describe('Uppercase output'),
  noDashes: z.boolean().describe('Remove dashes'),
});

export const uuidGenerator = defineTool({
  id: 'crypto.uuid',
  title: 'UUID Generator',
  category: 'crypto',
  description: 'Generate random UUIDs (v4)',
  keywords: ['guid', 'random', 'unique', 'identifier'],
  
  mode: 'browser',
  
  input: {
    kind: 'none',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    count: 1,
    uppercase: false,
    noDashes: false,
  },
  
  async runBrowser(_ctx, _input, options) {
    const uuids: string[] = [];
    
    for (let i = 0; i < options.count; i++) {
      let uuid: string = crypto.randomUUID();
      
      if (options.noDashes) {
        uuid = uuid.replace(/-/g, '');
      }
      
      if (options.uppercase) {
        uuid = uuid.toUpperCase();
      }
      
      uuids.push(uuid);
    }
    
    return uuids.join('\n');
  },
});
