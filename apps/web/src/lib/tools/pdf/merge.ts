import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';
import { PDFDocument } from 'pdf-lib';

const optionsSchema = z.object({});

export const pdfMerge = defineTool({
  id: 'pdf.merge',
  title: 'Merge PDFs',
  category: 'pdf',
  description: 'Combine multiple PDF files into one document',
  keywords: ['combine', 'join', 'concatenate'],
  
  mode: 'browser',
  
  input: {
    kind: 'file',
    accept: ['.pdf', 'application/pdf'],
    multiple: true,
    label: 'Drop PDF files here',
  },
  
  output: {
    kind: 'file',
    mime: 'application/pdf',
    filename: 'merged.pdf',
  },
  
  optionsSchema,
  defaults: {},
  
  async runBrowser(ctx, input, _options) {
    const files = input as File[];
    
    if (files.length < 2) {
      throw new Error('Please select at least 2 PDF files to merge');
    }
    
    ctx.onProgress({ message: 'Creating merged document...' });
    
    const mergedPdf = await PDFDocument.create();
    
    for (let i = 0; i < files.length; i++) {
      ctx.onProgress({ 
        percent: (i / files.length) * 100,
        message: `Processing ${files[i].name}...`
      });
      
      const bytes = await files[i].arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      
      for (const page of pages) {
        mergedPdf.addPage(page);
      }
    }
    
    ctx.onProgress({ percent: 100, message: 'Saving...' });
    
    const pdfBytes = await mergedPdf.save();
    return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  },
});
