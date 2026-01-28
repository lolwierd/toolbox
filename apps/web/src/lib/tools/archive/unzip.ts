import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';
import JSZip from 'jszip';

const optionsSchema = z.object({});

export const zipExtract = defineTool({
  id: 'archive.unzip',
  title: 'Extract Zip',
  category: 'archive',
  description: 'Extract files from a zip archive',
  keywords: ['decompress', 'unarchive', 'extract', 'unpack'],
  
  mode: 'browser',
  
  input: {
    kind: 'file',
    accept: ['.zip', 'application/zip', 'application/x-zip-compressed'],
    multiple: false,
    label: 'Drop zip file here',
  },
  
  output: {
    kind: 'file',
    mime: 'application/zip',
    filename: 'extracted.zip',
  },
  
  optionsSchema,
  defaults: {},
  
  async runBrowser(ctx, input) {
    const files = input as File[];
    const file = files[0];
    
    if (!file) {
      throw new Error('Please select a zip file');
    }
    
    ctx.onProgress({ message: 'Reading zip archive...' });
    
    const data = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(data);
    
    const fileNames = Object.keys(zip.files).filter(name => !zip.files[name].dir);
    
    if (fileNames.length === 0) {
      throw new Error('Zip archive is empty');
    }
    
    const extractedFiles: { name: string; blob: Blob }[] = [];
    
    for (let i = 0; i < fileNames.length; i++) {
      const name = fileNames[i];
      ctx.onProgress({ 
        percent: (i / fileNames.length) * 100,
        message: `Extracting ${name}...`
      });
      
      const blob = await zip.files[name].async('blob');
      extractedFiles.push({ name, blob });
    }
    
    ctx.onProgress({ percent: 100, message: 'Done' });
    
    if (extractedFiles.length === 1) {
      const extracted = extractedFiles[0];
      return new File([extracted.blob], extracted.name, { type: extracted.blob.type });
    }
    
    const resultZip = new JSZip();
    for (const { name, blob } of extractedFiles) {
      resultZip.file(name, blob);
    }
    
    return resultZip.generateAsync({ type: 'blob' });
  },
});
