import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  mode: z.enum(['pixels', 'percentage']).describe('Resize mode'),
  width: z.number().min(1).max(10000).describe('Width (pixels or %)'),
  height: z.number().min(1).max(10000).optional().describe('Height (pixels or %)'),
  maintainAspectRatio: z.boolean().describe('Maintain aspect ratio'),
});

export const imageResize = defineTool({
  id: 'image.resize',
  title: 'Resize Image',
  category: 'image',
  description: 'Resize images by pixels or percentage',
  keywords: ['scale', 'dimension', 'size', 'width', 'height'],
  
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
    filename: 'resized.png',
  },
  
  optionsSchema,
  defaults: {
    mode: 'percentage',
    width: 50,
    height: 50,
    maintainAspectRatio: true,
  },
  
  async runBrowser(ctx, input, options) {
    const files = input as File[];
    const file = files[0];
    
    if (!file) {
      throw new Error('Please select an image');
    }
    
    ctx.onProgress({ message: 'Loading image...' });
    
    const img = await loadImage(file);
    
    ctx.onProgress({ message: 'Resizing...' });
    
    let newWidth: number;
    let newHeight: number;
    
    if (options.mode === 'percentage') {
      newWidth = Math.round(img.width * (options.width / 100));
      newHeight = options.maintainAspectRatio
        ? Math.round(img.height * (options.width / 100))
        : Math.round(img.height * ((options.height ?? options.width) / 100));
    } else {
      newWidth = options.width;
      if (options.maintainAspectRatio) {
        newHeight = Math.round(img.height * (options.width / img.width));
      } else {
        newHeight = options.height ?? Math.round(img.height * (options.width / img.width));
      }
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) throw new Error('Could not get canvas context');
    
    ctx2d.imageSmoothingEnabled = true;
    ctx2d.imageSmoothingQuality = 'high';
    ctx2d.drawImage(img, 0, 0, newWidth, newHeight);
    
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to resize image'));
          }
        },
        'image/png'
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
