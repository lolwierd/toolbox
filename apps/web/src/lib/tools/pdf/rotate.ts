import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';
import { PDFDocument, degrees } from 'pdf-lib';

const optionsSchema = z.object({
  rotation: z.enum(['90', '180', '270']).describe('Rotation angle (clockwise)'),
  pages: z.string().describe('Pages to rotate (e.g., "1,3,5-7" or "all")'),
});

export const pdfRotate = defineTool({
  id: 'pdf.rotate',
  title: 'Rotate PDF',
  category: 'pdf',
  description: 'Rotate PDF pages by 90, 180, or 270 degrees',
  keywords: ['turn', 'orientation', 'landscape', 'portrait'],
  
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
    filename: 'rotated.pdf',
  },
  
  optionsSchema,
  defaults: {
    rotation: '90',
    pages: 'all',
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
    const totalPages = pdf.getPageCount();
    
    const pageIndices = parsePageSelection(options.pages, totalPages);
    const rotationDegrees = parseInt(options.rotation, 10);
    
    ctx.onProgress({ message: `Rotating ${pageIndices.length} pages...` });
    
    for (const index of pageIndices) {
      const page = pdf.getPage(index);
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees(currentRotation + rotationDegrees));
    }
    
    ctx.onProgress({ percent: 100, message: 'Saving...' });
    
    const pdfBytes = await pdf.save();
    return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  },
});

function parsePageSelection(input: string, maxPages: number): number[] {
  if (input.toLowerCase() === 'all') {
    return Array.from({ length: maxPages }, (_, i) => i);
  }
  
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
