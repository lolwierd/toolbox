import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';
import { PDFDocument } from 'pdf-lib';

const optionsSchema = z.object({
  mode: z.enum(['range', 'every', 'extract']).describe('Split mode'),
  rangeStart: z.number().min(1).describe('Start page (for range mode)'),
  rangeEnd: z.number().min(1).describe('End page (for range mode)'),
  everyN: z.number().min(1).describe('Split every N pages'),
  extractPages: z.string().describe('Pages to extract (e.g., "1,3,5-7")'),
});

export const pdfSplit = defineTool({
  id: 'pdf.split',
  title: 'Split PDF',
  category: 'pdf',
  description: 'Split PDF by page ranges or extract specific pages',
  keywords: ['extract', 'separate', 'pages'],
  
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
    filename: 'split.pdf',
  },
  
  optionsSchema,
  defaults: {
    mode: 'range',
    rangeStart: 1,
    rangeEnd: 1,
    everyN: 1,
    extractPages: '1',
  },
  
  async runBrowser(ctx, input, options) {
    const files = input as File[];
    const file = files[0];
    
    if (!file) {
      throw new Error('Please select a PDF file');
    }
    
    ctx.onProgress({ message: 'Loading PDF...' });
    
    const bytes = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(bytes);
    const totalPages = sourcePdf.getPageCount();
    
    let pageIndices: number[] = [];
    
    if (options.mode === 'range') {
      const start = Math.max(1, options.rangeStart) - 1;
      const end = Math.min(totalPages, options.rangeEnd);
      for (let i = start; i < end; i++) {
        pageIndices.push(i);
      }
    } else if (options.mode === 'extract') {
      pageIndices = parsePageList(options.extractPages, totalPages);
    } else if (options.mode === 'every') {
      for (let i = 0; i < totalPages; i += options.everyN) {
        for (let j = i; j < Math.min(i + options.everyN, totalPages); j++) {
          pageIndices.push(j);
        }
      }
    }
    
    if (pageIndices.length === 0) {
      throw new Error('No pages selected');
    }
    
    ctx.onProgress({ message: `Extracting ${pageIndices.length} pages...` });
    
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(sourcePdf, pageIndices);
    
    for (const page of pages) {
      newPdf.addPage(page);
    }
    
    ctx.onProgress({ percent: 100, message: 'Saving...' });
    
    const pdfBytes = await newPdf.save();
    return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  },
});

function parsePageList(input: string, maxPages: number): number[] {
  const result: number[] = [];
  const parts = input.split(',').map(s => s.trim());
  
  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(maxPages, end); i++) {
          result.push(i - 1);
        }
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= maxPages) {
        result.push(page - 1);
      }
    }
  }
  
  return [...new Set(result)].sort((a, b) => a - b);
}
