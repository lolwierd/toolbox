import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';
import JSZip from 'jszip';

const optionsSchema = z.object({
  compressionLevel: z.number().min(0).max(9).describe('Compression level (0=none, 9=max)'),
});

export const zipCreate = defineTool({
  id: 'archive.zip',
  title: 'Create Zip',
  category: 'archive',
  description: 'Create a zip archive from multiple files',
  keywords: ['compress', 'archive', 'bundle', 'package'],
  
  mode: 'browser',
  
  input: {
    kind: 'file',
    accept: ['*/*'],
    multiple: true,
    label: 'Drop files to zip',
  },
  
  output: {
    kind: 'file',
    mime: 'application/zip',
    filename: 'archive.zip',
  },
  
  optionsSchema,
  defaults: {
    compressionLevel: 6,
  },
  
  async runBrowser(ctx, input, options) {
    const files = input as File[];
    
    if (files.length < 1) {
      throw new Error('Please select at least 1 file to zip');
    }
    
    ctx.onProgress({ message: 'Creating zip archive...' });
    
    const zip = new JSZip();
    
    for (let i = 0; i < files.length; i++) {
      ctx.onProgress({ 
        percent: (i / files.length) * 80,
        message: `Adding ${files[i].name}...`
      });
      
      const data = await files[i].arrayBuffer();
      zip.file(files[i].name, data);
    }
    
    ctx.onProgress({ percent: 80, message: 'Compressing...' });
    
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: options.compressionLevel > 0 ? 'DEFLATE' : 'STORE',
      compressionOptions: { level: options.compressionLevel },
    });
    
    ctx.onProgress({ percent: 100, message: 'Done' });
    
    return blob;
  },
});
