import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';
import { PDFDocument } from 'pdf-lib';

const optionsSchema = z.object({
  pageSize: z.enum(['fit', 'a4', 'letter']).describe('Page size'),
  margin: z.number().min(0).max(100).describe('Margin in pixels'),
});

export const imagesToPdf = defineTool({
  id: 'pdf.images-to-pdf',
  title: 'Images to PDF',
  category: 'pdf',
  description: 'Convert images (JPG, PNG) to a PDF document',
  keywords: ['convert', 'photo', 'picture', 'jpg', 'png'],
  
  mode: 'browser',
  
  input: {
    kind: 'file',
    accept: ['.jpg', '.jpeg', '.png', 'image/jpeg', 'image/png'],
    multiple: true,
    label: 'Drop image files here',
  },
  
  output: {
    kind: 'file',
    mime: 'application/pdf',
    filename: 'images.pdf',
  },
  
  optionsSchema,
  defaults: {
    pageSize: 'fit',
    margin: 0,
  },
  
  async runBrowser(ctx, input, options) {
    const files = input as File[];
    
    if (files.length === 0) {
      throw new Error('Please select at least one image');
    }
    
    ctx.onProgress({ message: 'Creating PDF...' });
    
    const pdf = await PDFDocument.create();
    
    const pageSizes: Record<string, { width: number; height: number }> = {
      a4: { width: 595.28, height: 841.89 },
      letter: { width: 612, height: 792 },
    };
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      ctx.onProgress({ 
        percent: (i / files.length) * 100,
        message: `Processing ${file.name}...`
      });
      
      const bytes = await file.arrayBuffer();
      const uint8 = new Uint8Array(bytes);
      
      let image;
      if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
        image = await pdf.embedPng(uint8);
      } else {
        image = await pdf.embedJpg(uint8);
      }
      
      const imgWidth = image.width;
      const imgHeight = image.height;
      
      let pageWidth: number;
      let pageHeight: number;
      
      if (options.pageSize === 'fit') {
        pageWidth = imgWidth + options.margin * 2;
        pageHeight = imgHeight + options.margin * 2;
      } else {
        const size = pageSizes[options.pageSize];
        pageWidth = size.width;
        pageHeight = size.height;
      }
      
      const page = pdf.addPage([pageWidth, pageHeight]);
      
      let drawWidth = imgWidth;
      let drawHeight = imgHeight;
      
      if (options.pageSize !== 'fit') {
        const availableWidth = pageWidth - options.margin * 2;
        const availableHeight = pageHeight - options.margin * 2;
        
        const scaleX = availableWidth / imgWidth;
        const scaleY = availableHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY, 1);
        
        drawWidth = imgWidth * scale;
        drawHeight = imgHeight * scale;
      }
      
      const x = (pageWidth - drawWidth) / 2;
      const y = (pageHeight - drawHeight) / 2;
      
      page.drawImage(image, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });
    }
    
    ctx.onProgress({ percent: 100, message: 'Saving...' });
    
    const pdfBytes = await pdf.save();
    return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  },
});
