import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';
import { PDFDocument } from 'pdf-lib';

const optionsSchema = z.object({
  removeMetadata: z.boolean().describe('Remove document metadata'),
});

export const pdfCompress = defineTool({
  id: 'pdf.compress',
  title: 'Compress PDF',
  category: 'pdf',
  description: 'Reduce PDF file size using compression',
  keywords: ['reduce', 'size', 'optimize', 'smaller'],
  
  mode: 'browser',
  
  input: {
    kind: 'file',
    accept: ['.pdf', 'application/pdf'],
    multiple: false,
    label: 'Drop a PDF file here',
  },
  
  output: {
    kind: 'file',
    mime: 'application/pdf',
    filename: 'compressed.pdf',
  },
  
  optionsSchema,
  defaults: {
    removeMetadata: true,
  },
  
  async runBrowser(ctx, input, options) {
    const files = input as File[];
    const file = files[0];
    
    if (!file) {
      throw new Error('Please select a PDF file');
    }
    
    const originalSize = file.size;
    ctx.onProgress({ message: 'Loading PDF...' });
    
    const bytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    
    if (options.removeMetadata) {
      ctx.onProgress({ message: 'Removing metadata...' });
      pdf.setTitle('');
      pdf.setAuthor('');
      pdf.setSubject('');
      pdf.setKeywords([]);
      pdf.setProducer('');
      pdf.setCreator('');
    }
    
    ctx.onProgress({ message: 'Compressing...' });
    
    const pdfBytes = await pdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });
    
    const compressedSize = pdfBytes.length;
    const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    ctx.onProgress({ 
      percent: 100, 
      message: `Done! Reduced by ${savings}% (${formatBytes(originalSize)} → ${formatBytes(compressedSize)})` 
    });
    
    return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  },
});

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
