import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  rotation: z.enum(['90', '180', '270']).describe('Rotation angle (clockwise)'),
  flipHorizontal: z.boolean().describe('Flip horizontally'),
  flipVertical: z.boolean().describe('Flip vertically'),
});

export const imageRotate = defineTool({
  id: 'image.rotate',
  title: 'Rotate Image',
  category: 'image',
  description: 'Rotate and flip images',
  keywords: ['turn', 'flip', 'mirror', 'orientation'],
  
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
    filename: 'rotated.png',
  },
  
  optionsSchema,
  defaults: {
    rotation: '90',
    flipHorizontal: false,
    flipVertical: false,
  },
  
  async runBrowser(ctx, input, options) {
    const files = input as File[];
    const file = files[0];
    
    if (!file) {
      throw new Error('Please select an image');
    }
    
    ctx.onProgress({ message: 'Loading image...' });
    
    const img = await loadImage(file);
    
    ctx.onProgress({ message: 'Rotating...' });
    
    const angle = parseInt(options.rotation, 10);
    const swapDimensions = angle === 90 || angle === 270;
    
    const canvas = document.createElement('canvas');
    canvas.width = swapDimensions ? img.height : img.width;
    canvas.height = swapDimensions ? img.width : img.height;
    
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) throw new Error('Could not get canvas context');
    
    ctx2d.translate(canvas.width / 2, canvas.height / 2);
    ctx2d.rotate((angle * Math.PI) / 180);
    
    const scaleX = options.flipHorizontal ? -1 : 1;
    const scaleY = options.flipVertical ? -1 : 1;
    ctx2d.scale(scaleX, scaleY);
    
    ctx2d.drawImage(img, -img.width / 2, -img.height / 2);
    
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to rotate image'));
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
