import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  quality: z.number().min(1).max(100).describe('Output quality (1-100)'),
  format: z.enum(['jpeg', 'webp', 'png']).describe('Output format'),
});

export const imageCompress = defineTool({
  id: 'image.compress',
  title: 'Compress Image',
  category: 'image',
  description: 'Reduce image file size with quality control',
  keywords: ['reduce', 'optimize', 'quality', 'size'],
  
  mode: 'browser',
  
  input: {
    kind: 'file',
    accept: ['image/*'],
    multiple: false,
    label: 'Drop an image here',
  },
  
  output: {
    kind: 'file',
    mime: 'image/jpeg',
    filename: 'compressed.jpg',
  },
  
  optionsSchema,
  defaults: {
    quality: 80,
    format: 'jpeg',
  },
  
  async runBrowser(ctx, input, options) {
    const files = input as File[];
    const file = files[0];
    
    if (!file) {
      throw new Error('Please select an image');
    }
    
    ctx.onProgress({ message: 'Loading image...' });
    
    const img = await loadImage(file);
    
    ctx.onProgress({ message: 'Compressing...' });
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) throw new Error('Could not get canvas context');
    
    ctx2d.drawImage(img, 0, 0);
    
    const mimeType = `image/${options.format}`;
    const quality = options.quality / 100;
    
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        mimeType,
        quality
      );
    });
  },
});

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}
