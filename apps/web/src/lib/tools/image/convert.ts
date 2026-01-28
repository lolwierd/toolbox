import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  format: z.enum(['png', 'jpeg', 'webp']).describe('Output format'),
  quality: z.number().min(1).max(100).describe('Quality for JPEG/WebP'),
});

export const imageConvert = defineTool({
  id: 'image.convert',
  title: 'Convert Image',
  category: 'image',
  description: 'Convert images between PNG, JPEG, and WebP',
  keywords: ['format', 'png', 'jpg', 'webp'],
  
  mode: 'browser',
  
  input: {
    kind: 'file',
    accept: ['image/*'],
    multiple: false,
    label: 'Drop an image here',
  },
  
  output: {
    kind: 'file',
    mime: 'image/png',
    filename: 'converted.png',
  },
  
  optionsSchema,
  defaults: {
    format: 'png',
    quality: 90,
  },
  
  async runBrowser(ctx, input, options) {
    const files = input as File[];
    const file = files[0];
    
    if (!file) {
      throw new Error('Please select an image');
    }
    
    ctx.onProgress({ message: 'Loading image...' });
    
    const img = await loadImage(file);
    
    ctx.onProgress({ message: 'Converting...' });
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) throw new Error('Could not get canvas context');
    
    // For PNG with transparency, we need to be careful
    if (options.format === 'png') {
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx2d.fillStyle = '#ffffff';
      ctx2d.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx2d.drawImage(img, 0, 0);
    
    const mimeType = `image/${options.format}`;
    const quality = options.format === 'png' ? undefined : options.quality / 100;
    
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image'));
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
