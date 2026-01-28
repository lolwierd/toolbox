import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockContext2d = {
  drawImage: vi.fn(),
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  fillStyle: '',
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high' as ImageSmoothingQuality,
};

const mockCanvas = {
  width: 100,
  height: 100,
  getContext: vi.fn(() => mockContext2d),
  toBlob: vi.fn((callback: BlobCallback, type?: string, _quality?: number) => {
    callback(new Blob(['test'], { type: type || 'image/png' }));
  }),
};

vi.stubGlobal('document', {
  createElement: vi.fn((tag: string) => {
    if (tag === 'canvas') return mockCanvas;
    if (tag === 'a') return { href: '', download: '', click: vi.fn() };
    return {};
  }),
});

class MockImage {
  width = 100;
  height = 100;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';

  constructor() {
    setTimeout(() => this.onload?.(), 0);
  }
}
vi.stubGlobal('Image', MockImage);

vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'blob:test'),
  revokeObjectURL: vi.fn(),
});

import { imageCompress } from '../compress';
import { imageConvert } from '../convert';
import { imageResize } from '../resize';
import { imageCrop } from '../crop';
import { imageRotate } from '../rotate';
import { imageStripExif } from '../strip-exif';

function createMockFile(name = 'test.png', type = 'image/png'): File {
  return new File(['test'], name, { type });
}

function createMockContext() {
  return {
    onProgress: vi.fn(),
    signal: new AbortController().signal,
  };
}

describe('imageCompress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has correct metadata', () => {
    expect(imageCompress.id).toBe('image.compress');
    expect(imageCompress.title).toBe('Compress Image');
    expect(imageCompress.category).toBe('image');
  });

  it('compresses an image and returns a Blob', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = { quality: 80, format: 'jpeg' as const };

    const result = await imageCompress.runBrowser!(ctx, [file], options);

    expect(result).toBeInstanceOf(Blob);
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/jpeg',
      0.8
    );
    expect(ctx.onProgress).toHaveBeenCalledWith({ message: 'Loading image...' });
    expect(ctx.onProgress).toHaveBeenCalledWith({ message: 'Compressing...' });
  });

  it('throws error when no file is provided', async () => {
    const ctx = createMockContext();
    const options = { quality: 80, format: 'jpeg' as const };

    await expect(imageCompress.runBrowser!(ctx, [], options)).rejects.toThrow(
      'Please select an image'
    );
  });

  it('uses webp format when specified', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = { quality: 90, format: 'webp' as const };

    await imageCompress.runBrowser!(ctx, [file], options);

    expect(mockCanvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/webp',
      0.9
    );
  });
});

describe('imageConvert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has correct metadata', () => {
    expect(imageConvert.id).toBe('image.convert');
    expect(imageConvert.title).toBe('Convert Image');
    expect(imageConvert.category).toBe('image');
  });

  it('converts an image and returns a Blob', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = { format: 'png' as const, quality: 90 };

    const result = await imageConvert.runBrowser!(ctx, [file], options);

    expect(result).toBeInstanceOf(Blob);
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/png',
      undefined
    );
  });

  it('throws error when no file is provided', async () => {
    const ctx = createMockContext();
    const options = { format: 'png' as const, quality: 90 };

    await expect(imageConvert.runBrowser!(ctx, [], options)).rejects.toThrow(
      'Please select an image'
    );
  });

  it('uses quality for jpeg format', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = { format: 'jpeg' as const, quality: 85 };

    await imageConvert.runBrowser!(ctx, [file], options);

    expect(mockCanvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/jpeg',
      0.85
    );
  });

  it('clears canvas for PNG format (transparency support)', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = { format: 'png' as const, quality: 90 };

    await imageConvert.runBrowser!(ctx, [file], options);

    expect(mockContext2d.clearRect).toHaveBeenCalled();
  });

  it('fills white background for non-PNG formats', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = { format: 'jpeg' as const, quality: 90 };

    await imageConvert.runBrowser!(ctx, [file], options);

    expect(mockContext2d.fillRect).toHaveBeenCalled();
  });
});

describe('imageResize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has correct metadata', () => {
    expect(imageResize.id).toBe('image.resize');
    expect(imageResize.title).toBe('Resize Image');
    expect(imageResize.category).toBe('image');
  });

  it('resizes an image and returns a Blob', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = {
      mode: 'percentage' as const,
      width: 50,
      height: 50,
      maintainAspectRatio: true,
    };

    const result = await imageResize.runBrowser!(ctx, [file], options);

    expect(result).toBeInstanceOf(Blob);
    expect(ctx.onProgress).toHaveBeenCalledWith({ message: 'Resizing...' });
  });

  it('throws error when no file is provided', async () => {
    const ctx = createMockContext();
    const options = {
      mode: 'percentage' as const,
      width: 50,
      height: 50,
      maintainAspectRatio: true,
    };

    await expect(imageResize.runBrowser!(ctx, [], options)).rejects.toThrow(
      'Please select an image'
    );
  });

  it('sets canvas dimensions for percentage mode', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = {
      mode: 'percentage' as const,
      width: 50,
      maintainAspectRatio: true,
    };

    await imageResize.runBrowser!(ctx, [file], options);

    expect(mockCanvas.width).toBe(50);
    expect(mockCanvas.height).toBe(50);
  });

  it('sets canvas dimensions for pixels mode', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = {
      mode: 'pixels' as const,
      width: 200,
      height: 150,
      maintainAspectRatio: false,
    };

    await imageResize.runBrowser!(ctx, [file], options);

    expect(mockCanvas.width).toBe(200);
    expect(mockCanvas.height).toBe(150);
  });
});

describe('imageCrop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has correct metadata', () => {
    expect(imageCrop.id).toBe('image.crop');
    expect(imageCrop.title).toBe('Crop Image');
    expect(imageCrop.category).toBe('image');
  });

  it('crops an image and returns a Blob', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = { x: 0, y: 0, width: 50, height: 50 };

    const result = await imageCrop.runBrowser!(ctx, [file], options);

    expect(result).toBeInstanceOf(Blob);
    expect(ctx.onProgress).toHaveBeenCalledWith({ message: 'Cropping...' });
  });

  it('throws error when no file is provided', async () => {
    const ctx = createMockContext();
    const options = { x: 0, y: 0, width: 50, height: 50 };

    await expect(imageCrop.runBrowser!(ctx, [], options)).rejects.toThrow(
      'Please select an image'
    );
  });

  it('throws error when crop region exceeds image width', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = { x: 50, y: 0, width: 60, height: 50 };

    await expect(imageCrop.runBrowser!(ctx, [file], options)).rejects.toThrow(
      'Crop region exceeds image width'
    );
  });

  it('throws error when crop region exceeds image height', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = { x: 0, y: 50, width: 50, height: 60 };

    await expect(imageCrop.runBrowser!(ctx, [file], options)).rejects.toThrow(
      'Crop region exceeds image height'
    );
  });

  it('sets canvas dimensions to crop size', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = { x: 10, y: 10, width: 30, height: 40 };

    await imageCrop.runBrowser!(ctx, [file], options);

    expect(mockCanvas.width).toBe(30);
    expect(mockCanvas.height).toBe(40);
  });

  it('calls drawImage with correct crop parameters', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = { x: 10, y: 20, width: 30, height: 40 };

    await imageCrop.runBrowser!(ctx, [file], options);

    expect(mockContext2d.drawImage).toHaveBeenCalledWith(
      expect.any(MockImage),
      10,
      20,
      30,
      40,
      0,
      0,
      30,
      40
    );
  });
});

describe('imageRotate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has correct metadata', () => {
    expect(imageRotate.id).toBe('image.rotate');
    expect(imageRotate.title).toBe('Rotate Image');
    expect(imageRotate.category).toBe('image');
  });

  it('rotates an image and returns a Blob', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = {
      rotation: '90' as const,
      flipHorizontal: false,
      flipVertical: false,
    };

    const result = await imageRotate.runBrowser!(ctx, [file], options);

    expect(result).toBeInstanceOf(Blob);
    expect(ctx.onProgress).toHaveBeenCalledWith({ message: 'Rotating...' });
  });

  it('throws error when no file is provided', async () => {
    const ctx = createMockContext();
    const options = {
      rotation: '90' as const,
      flipHorizontal: false,
      flipVertical: false,
    };

    await expect(imageRotate.runBrowser!(ctx, [], options)).rejects.toThrow(
      'Please select an image'
    );
  });

  it('swaps dimensions for 90 degree rotation', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = {
      rotation: '90' as const,
      flipHorizontal: false,
      flipVertical: false,
    };

    await imageRotate.runBrowser!(ctx, [file], options);

    expect(mockContext2d.rotate).toHaveBeenCalledWith(Math.PI / 2);
  });

  it('swaps dimensions for 270 degree rotation', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = {
      rotation: '270' as const,
      flipHorizontal: false,
      flipVertical: false,
    };

    await imageRotate.runBrowser!(ctx, [file], options);

    expect(mockContext2d.rotate).toHaveBeenCalledWith((270 * Math.PI) / 180);
  });

  it('applies horizontal flip', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = {
      rotation: '180' as const,
      flipHorizontal: true,
      flipVertical: false,
    };

    await imageRotate.runBrowser!(ctx, [file], options);

    expect(mockContext2d.scale).toHaveBeenCalledWith(-1, 1);
  });

  it('applies vertical flip', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = {
      rotation: '180' as const,
      flipHorizontal: false,
      flipVertical: true,
    };

    await imageRotate.runBrowser!(ctx, [file], options);

    expect(mockContext2d.scale).toHaveBeenCalledWith(1, -1);
  });

  it('applies both flips', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = {
      rotation: '180' as const,
      flipHorizontal: true,
      flipVertical: true,
    };

    await imageRotate.runBrowser!(ctx, [file], options);

    expect(mockContext2d.scale).toHaveBeenCalledWith(-1, -1);
  });
});

describe('imageStripExif', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has correct metadata', () => {
    expect(imageStripExif.id).toBe('image.strip-exif');
    expect(imageStripExif.title).toBe('Strip EXIF Data');
    expect(imageStripExif.category).toBe('image');
  });

  it('strips EXIF data and returns a Blob', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = { format: 'png' as const, quality: 90 };

    const result = await imageStripExif.runBrowser!(ctx, [file], options);

    expect(result).toBeInstanceOf(Blob);
    expect(ctx.onProgress).toHaveBeenCalledWith({
      message: 'Stripping EXIF data...',
    });
  });

  it('throws error when no file is provided', async () => {
    const ctx = createMockContext();
    const options = { format: 'png' as const, quality: 90 };

    await expect(imageStripExif.runBrowser!(ctx, [], options)).rejects.toThrow(
      'Please select an image'
    );
  });

  it('uses quality for jpeg format', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = { format: 'jpeg' as const, quality: 85 };

    await imageStripExif.runBrowser!(ctx, [file], options);

    expect(mockCanvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/jpeg',
      0.85
    );
  });

  it('does not use quality for png format', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = { format: 'png' as const, quality: 90 };

    await imageStripExif.runBrowser!(ctx, [file], options);

    expect(mockCanvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/png',
      undefined
    );
  });

  it('clears canvas for PNG format (transparency support)', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = { format: 'png' as const, quality: 90 };

    await imageStripExif.runBrowser!(ctx, [file], options);

    expect(mockContext2d.clearRect).toHaveBeenCalled();
  });

  it('fills white background for non-PNG formats', async () => {
    const ctx = createMockContext();
    const file = createMockFile();
    const options = { format: 'webp' as const, quality: 90 };

    await imageStripExif.runBrowser!(ctx, [file], options);

    expect(mockContext2d.fillRect).toHaveBeenCalled();
  });
});
