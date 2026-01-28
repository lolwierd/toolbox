import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  x: z.number().min(0).describe('X offset (pixels from left)'),
  y: z.number().min(0).describe('Y offset (pixels from top)'),
  width: z.number().min(1).describe('Crop width (pixels)'),
  height: z.number().min(1).describe('Crop height (pixels)'),
});

export const imageCrop = defineTool({
  id: 'image.crop',
  title: 'Crop Image',
  category: 'image',
  description: 'Crop images to a specific region',
  keywords: ['trim', 'cut', 'region', 'selection'],
  
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
    filename: 'cropped.png',
  },
  
  optionsSchema,
  defaults: {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  },
  
  async runBrowser(ctx, input, options) {
    const files = input as File[];
    const file = files[0];
    
    if (!file) {
      throw new Error('Please select an image');
    }
    
    ctx.onProgress({ message: 'Loading image...' });
    
    const img = await loadImage(file);
    
    if (options.x + options.width > img.width) {
      throw new Error(`Crop region exceeds image width (${img.width}px)`);
    }
    if (options.y + options.height > img.height) {
      throw new Error(`Crop region exceeds image height (${img.height}px)`);
    }
    
    ctx.onProgress({ message: 'Cropping...' });
    
    const canvas = document.createElement('canvas');
    canvas.width = options.width;
    canvas.height = options.height;
    
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) throw new Error('Could not get canvas context');
    
    ctx2d.drawImage(
      img,
      options.x, options.y, options.width, options.height,
      0, 0, options.width, options.height
    );
    
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to crop image'));
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
