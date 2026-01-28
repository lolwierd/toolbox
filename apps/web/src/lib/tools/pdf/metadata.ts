import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';
import { PDFDocument } from 'pdf-lib';

const optionsSchema = z.object({
  action: z.enum(['view', 'wipe']).describe('View or wipe metadata'),
});

export const pdfMetadata = defineTool({
  id: 'pdf.metadata',
  title: 'PDF Metadata',
  category: 'pdf',
  description: 'View or wipe PDF document metadata',
  keywords: ['properties', 'info', 'author', 'title', 'privacy'],
  
  mode: 'browser',
  
  input: {
    kind: 'file',
    accept: ['.pdf', 'application/pdf'],
    multiple: false,
    label: 'Drop a PDF file here',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    action: 'view',
  },
  
  async runBrowser(ctx, input, options) {
    const files = input as File[];
    const file = files[0];
    
    if (!file) {
      throw new Error('Please select a PDF file');
    }
    
    ctx.onProgress({ message: 'Loading PDF...' });
    
    const bytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    
    if (options.action === 'view') {
      const metadata = {
        'Title': pdf.getTitle() || '(not set)',
        'Author': pdf.getAuthor() || '(not set)',
        'Subject': pdf.getSubject() || '(not set)',
        'Keywords': pdf.getKeywords() || '(not set)',
        'Creator': pdf.getCreator() || '(not set)',
        'Producer': pdf.getProducer() || '(not set)',
        'Creation Date': pdf.getCreationDate()?.toISOString() || '(not set)',
        'Modification Date': pdf.getModificationDate()?.toISOString() || '(not set)',
        'Page Count': pdf.getPageCount().toString(),
      };
      
      ctx.onProgress({ percent: 100, message: 'Done!' });
      
      return Object.entries(metadata)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    } else {
      ctx.onProgress({ message: 'Wiping metadata...' });
      
      pdf.setTitle('');
      pdf.setAuthor('');
      pdf.setSubject('');
      pdf.setKeywords([]);
      pdf.setCreator('');
      pdf.setProducer('');
      
      const pdfBytes = await pdf.save();
      
      ctx.onProgress({ percent: 100, message: 'Metadata wiped!' });
      
      return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
    }
  },
});
