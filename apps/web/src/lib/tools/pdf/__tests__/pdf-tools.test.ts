import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { pdfMerge } from '../merge';
import { pdfSplit } from '../split';
import { pdfRotate } from '../rotate';
import { pdfCompress } from '../compress';
import { pdfMetadata } from '../metadata';
import { imagesToPdf } from '../images-to-pdf';

function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

function createMockContext() {
  return {
    signal: new AbortController().signal,
    onProgress: vi.fn(),
  };
}

function createMockFile(bytes: Uint8Array, name: string, type: string): File {
  const blob = new Blob([bytes as unknown as BlobPart], { type });
  const file = new File([blob], name, { type }) as File & {
    arrayBuffer: () => Promise<ArrayBuffer>;
  };
  file.arrayBuffer = async () => bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  return file;
}

async function createTestPdf(pageCount = 1, metadata?: {
  title?: string;
  author?: string;
  subject?: string;
}): Promise<File> {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage([612, 792]);
  }
  if (metadata?.title) pdf.setTitle(metadata.title);
  if (metadata?.author) pdf.setAuthor(metadata.author);
  if (metadata?.subject) pdf.setSubject(metadata.subject);
  const bytes = await pdf.save();
  return createMockFile(bytes, 'test.pdf', 'application/pdf');
}

const MINIMAL_PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
  0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
  0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59,
  0xe7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
  0x44, 0xae, 0x42, 0x60, 0x82
]);

const MINIMAL_JPEG_BYTES = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
  0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
  0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c,
  0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
  0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d,
  0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
  0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
  0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
  0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34,
  0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4,
  0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
  0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
  0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff,
  0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
  0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04,
  0x00, 0x00, 0x01, 0x7d, 0x01, 0x02, 0x03, 0x00,
  0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
  0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32,
  0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1,
  0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
  0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a,
  0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35,
  0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45,
  0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55,
  0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65,
  0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
  0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85,
  0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94,
  0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3,
  0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2,
  0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba,
  0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
  0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8,
  0xd9, 0xda, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6,
  0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4,
  0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda,
  0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
  0xfb, 0xd5, 0xdb, 0x20, 0xa8, 0xf1, 0x45, 0xff,
  0xd9
]);

function createTestPng(): File {
  return createMockFile(MINIMAL_PNG_BYTES, 'test.png', 'image/png');
}

function createTestJpeg(): File {
  return createMockFile(MINIMAL_JPEG_BYTES, 'test.jpg', 'image/jpeg');
}

async function getPageCount(blob: Blob): Promise<number> {
  const bytes = await blobToArrayBuffer(blob);
  const pdf = await PDFDocument.load(bytes);
  return pdf.getPageCount();
}

async function getPageRotation(blob: Blob, pageIndex: number): Promise<number> {
  const bytes = await blobToArrayBuffer(blob);
  const pdf = await PDFDocument.load(bytes);
  return pdf.getPage(pageIndex).getRotation().angle;
}

async function getPdfMetadata(blob: Blob) {
  const bytes = await blobToArrayBuffer(blob);
  const pdf = await PDFDocument.load(bytes);
  return {
    title: pdf.getTitle(),
    author: pdf.getAuthor(),
    subject: pdf.getSubject(),
    pageCount: pdf.getPageCount(),
  };
}

async function loadPdfFromBlob(blob: Blob): Promise<PDFDocument> {
  const bytes = await blobToArrayBuffer(blob);
  return PDFDocument.load(bytes);
}

describe('pdfMerge', () => {
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should merge two PDFs', async () => {
    const pdf1 = await createTestPdf(2);
    const pdf2 = await createTestPdf(3);
    
    const result = await pdfMerge.runBrowser!(ctx, [pdf1, pdf2], {});
    
    expect(result).toBeInstanceOf(Blob);
    const pageCount = await getPageCount(result as Blob);
    expect(pageCount).toBe(5);
  });

  it('should merge multiple PDFs in order', async () => {
    const pdf1 = await createTestPdf(1);
    const pdf2 = await createTestPdf(2);
    const pdf3 = await createTestPdf(3);
    
    const result = await pdfMerge.runBrowser!(ctx, [pdf1, pdf2, pdf3], {});
    
    expect(result).toBeInstanceOf(Blob);
    const pageCount = await getPageCount(result as Blob);
    expect(pageCount).toBe(6);
  });

  it('should throw error when merging less than 2 files', async () => {
    const pdf1 = await createTestPdf(1);
    
    await expect(pdfMerge.runBrowser!(ctx, [pdf1], {}))
      .rejects.toThrow('Please select at least 2 PDF files to merge');
  });

  it('should throw error when merging zero files', async () => {
    await expect(pdfMerge.runBrowser!(ctx, [], {}))
      .rejects.toThrow('Please select at least 2 PDF files to merge');
  });

  it('should call onProgress during merge', async () => {
    const pdf1 = await createTestPdf(1);
    const pdf2 = await createTestPdf(1);
    
    await pdfMerge.runBrowser!(ctx, [pdf1, pdf2], {});
    
    expect(ctx.onProgress).toHaveBeenCalled();
    expect(ctx.onProgress).toHaveBeenCalledWith(expect.objectContaining({ percent: 100 }));
  });
});

describe('pdfSplit', () => {
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should extract a range of pages', async () => {
    const pdf = await createTestPdf(5);
    
    const result = await pdfSplit.runBrowser!(ctx, [pdf], {
      mode: 'range',
      rangeStart: 2,
      rangeEnd: 4,
      everyN: 1,
      extractPages: '1',
    });
    
    expect(result).toBeInstanceOf(Blob);
    const pageCount = await getPageCount(result as Blob);
    expect(pageCount).toBe(3);
  });

  it('should extract specific pages using extract mode', async () => {
    const pdf = await createTestPdf(10);
    
    const result = await pdfSplit.runBrowser!(ctx, [pdf], {
      mode: 'extract',
      rangeStart: 1,
      rangeEnd: 1,
      everyN: 1,
      extractPages: '1,3,5',
    });
    
    expect(result).toBeInstanceOf(Blob);
    const pageCount = await getPageCount(result as Blob);
    expect(pageCount).toBe(3);
  });

  it('should extract page ranges using dash notation', async () => {
    const pdf = await createTestPdf(10);
    
    const result = await pdfSplit.runBrowser!(ctx, [pdf], {
      mode: 'extract',
      rangeStart: 1,
      rangeEnd: 1,
      everyN: 1,
      extractPages: '1-3,7-9',
    });
    
    expect(result).toBeInstanceOf(Blob);
    const pageCount = await getPageCount(result as Blob);
    expect(pageCount).toBe(6);
  });

  it('should handle everyN mode', async () => {
    const pdf = await createTestPdf(6);
    
    const result = await pdfSplit.runBrowser!(ctx, [pdf], {
      mode: 'every',
      rangeStart: 1,
      rangeEnd: 1,
      everyN: 2,
      extractPages: '1',
    });
    
    expect(result).toBeInstanceOf(Blob);
    const pageCount = await getPageCount(result as Blob);
    expect(pageCount).toBe(6);
  });

  it('should throw error when no file is provided', async () => {
    await expect(pdfSplit.runBrowser!(ctx, [], {
      mode: 'range',
      rangeStart: 1,
      rangeEnd: 1,
      everyN: 1,
      extractPages: '1',
    })).rejects.toThrow('Please select a PDF file');
  });

  it('should throw error when no pages are selected', async () => {
    const pdf = await createTestPdf(5);
    
    await expect(pdfSplit.runBrowser!(ctx, [pdf], {
      mode: 'extract',
      rangeStart: 1,
      rangeEnd: 1,
      everyN: 1,
      extractPages: '100',
    })).rejects.toThrow('No pages selected');
  });

  it('should handle out-of-range pages gracefully', async () => {
    const pdf = await createTestPdf(3);
    
    const result = await pdfSplit.runBrowser!(ctx, [pdf], {
      mode: 'range',
      rangeStart: 1,
      rangeEnd: 100,
      everyN: 1,
      extractPages: '1',
    });
    
    expect(result).toBeInstanceOf(Blob);
    const pageCount = await getPageCount(result as Blob);
    expect(pageCount).toBe(3);
  });
});

describe('pdfRotate', () => {
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should rotate all pages by 90 degrees', async () => {
    const pdf = await createTestPdf(3);
    
    const result = await pdfRotate.runBrowser!(ctx, [pdf], {
      rotation: '90',
      pages: 'all',
    });
    
    expect(result).toBeInstanceOf(Blob);
    const rotation = await getPageRotation(result as Blob, 0);
    expect(rotation).toBe(90);
  });

  it('should rotate all pages by 180 degrees', async () => {
    const pdf = await createTestPdf(2);
    
    const result = await pdfRotate.runBrowser!(ctx, [pdf], {
      rotation: '180',
      pages: 'all',
    });
    
    expect(result).toBeInstanceOf(Blob);
    const rotation = await getPageRotation(result as Blob, 0);
    expect(rotation).toBe(180);
  });

  it('should rotate all pages by 270 degrees', async () => {
    const pdf = await createTestPdf(1);
    
    const result = await pdfRotate.runBrowser!(ctx, [pdf], {
      rotation: '270',
      pages: 'all',
    });
    
    expect(result).toBeInstanceOf(Blob);
    const rotation = await getPageRotation(result as Blob, 0);
    expect(rotation).toBe(270);
  });

  it('should rotate specific pages only', async () => {
    const pdf = await createTestPdf(4);
    
    const result = await pdfRotate.runBrowser!(ctx, [pdf], {
      rotation: '90',
      pages: '1,3',
    });
    
    expect(result).toBeInstanceOf(Blob);
    const rotation0 = await getPageRotation(result as Blob, 0);
    const rotation1 = await getPageRotation(result as Blob, 1);
    const rotation2 = await getPageRotation(result as Blob, 2);
    expect(rotation0).toBe(90);
    expect(rotation1).toBe(0);
    expect(rotation2).toBe(90);
  });

  it('should rotate a range of pages', async () => {
    const pdf = await createTestPdf(5);
    
    const result = await pdfRotate.runBrowser!(ctx, [pdf], {
      rotation: '90',
      pages: '2-4',
    });
    
    expect(result).toBeInstanceOf(Blob);
    const rotation0 = await getPageRotation(result as Blob, 0);
    const rotation1 = await getPageRotation(result as Blob, 1);
    const rotation4 = await getPageRotation(result as Blob, 4);
    expect(rotation0).toBe(0);
    expect(rotation1).toBe(90);
    expect(rotation4).toBe(0);
  });

  it('should throw error when no file is provided', async () => {
    await expect(pdfRotate.runBrowser!(ctx, [], {
      rotation: '90',
      pages: 'all',
    })).rejects.toThrow('Please select a PDF file');
  });
});

describe('pdfCompress', () => {
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should compress a PDF', async () => {
    const pdf = await createTestPdf(3);
    
    const result = await pdfCompress.runBrowser!(ctx, [pdf], {
      removeMetadata: false,
    });
    
    expect(result).toBeInstanceOf(Blob);
    const pageCount = await getPageCount(result as Blob);
    expect(pageCount).toBe(3);
  });

  it('should remove metadata when option is true', async () => {
    const pdf = await createTestPdf(1, {
      title: 'Test Title',
      author: 'Test Author',
      subject: 'Test Subject',
    });
    
    const result = await pdfCompress.runBrowser!(ctx, [pdf], {
      removeMetadata: true,
    });
    
    expect(result).toBeInstanceOf(Blob);
    const metadata = await getPdfMetadata(result as Blob);
    expect(metadata.title).toBe('');
    expect(metadata.author).toBe('');
    expect(metadata.subject).toBe('');
  });

  it('should preserve metadata when option is false', async () => {
    const pdf = await createTestPdf(1, {
      title: 'Test Title',
      author: 'Test Author',
    });
    
    const result = await pdfCompress.runBrowser!(ctx, [pdf], {
      removeMetadata: false,
    });
    
    expect(result).toBeInstanceOf(Blob);
    const metadata = await getPdfMetadata(result as Blob);
    expect(metadata.title).toBe('Test Title');
    expect(metadata.author).toBe('Test Author');
  });

  it('should throw error when no file is provided', async () => {
    await expect(pdfCompress.runBrowser!(ctx, [], {
      removeMetadata: true,
    })).rejects.toThrow('Please select a PDF file');
  });

  it('should call onProgress with compression stats', async () => {
    const pdf = await createTestPdf(2);
    
    await pdfCompress.runBrowser!(ctx, [pdf], {
      removeMetadata: true,
    });
    
    expect(ctx.onProgress).toHaveBeenCalledWith(
      expect.objectContaining({ percent: 100 })
    );
  });
});

describe('pdfMetadata', () => {
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should view metadata from a PDF', async () => {
    const pdf = await createTestPdf(3, {
      title: 'My Document',
      author: 'John Doe',
      subject: 'Testing',
    });
    
    const result = await pdfMetadata.runBrowser!(ctx, [pdf], {
      action: 'view',
    });
    
    expect(typeof result).toBe('string');
    expect(result).toContain('Title: My Document');
    expect(result).toContain('Author: John Doe');
    expect(result).toContain('Subject: Testing');
    expect(result).toContain('Page Count: 3');
  });

  it('should show (not set) for missing metadata', async () => {
    const pdf = await createTestPdf(1);
    
    const result = await pdfMetadata.runBrowser!(ctx, [pdf], {
      action: 'view',
    });
    
    expect(typeof result).toBe('string');
    expect(result).toContain('Title: (not set)');
    expect(result).toContain('Author: (not set)');
  });

  it('should wipe metadata and return a Blob', async () => {
    const pdf = await createTestPdf(2, {
      title: 'Secret Document',
      author: 'Secret Author',
    });
    
    const result = await pdfMetadata.runBrowser!(ctx, [pdf], {
      action: 'wipe',
    });
    
    expect(result).toBeInstanceOf(Blob);
    const metadata = await getPdfMetadata(result as Blob);
    expect(metadata.title).toBe('');
    expect(metadata.author).toBe('');
    expect(metadata.pageCount).toBe(2);
  });

  it('should throw error when no file is provided', async () => {
    await expect(pdfMetadata.runBrowser!(ctx, [], {
      action: 'view',
    })).rejects.toThrow('Please select a PDF file');
  });
});

describe('imagesToPdf', () => {
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should convert a single PNG to PDF', async () => {
    const png = createTestPng();
    
    const result = await imagesToPdf.runBrowser!(ctx, [png], {
      pageSize: 'fit',
      margin: 0,
    });
    
    expect(result).toBeInstanceOf(Blob);
    const pageCount = await getPageCount(result as Blob);
    expect(pageCount).toBe(1);
  });

  it('should convert a single JPEG to PDF', async () => {
    const jpg = createTestJpeg();
    
    const result = await imagesToPdf.runBrowser!(ctx, [jpg], {
      pageSize: 'fit',
      margin: 0,
    });
    
    expect(result).toBeInstanceOf(Blob);
    const pageCount = await getPageCount(result as Blob);
    expect(pageCount).toBe(1);
  });

  it('should convert multiple images to PDF', async () => {
    const png1 = createTestPng();
    const png2 = createTestPng();
    const jpg = createTestJpeg();
    
    const result = await imagesToPdf.runBrowser!(ctx, [png1, png2, jpg], {
      pageSize: 'fit',
      margin: 0,
    });
    
    expect(result).toBeInstanceOf(Blob);
    const pageCount = await getPageCount(result as Blob);
    expect(pageCount).toBe(3);
  });

  it('should create PDF with A4 page size', async () => {
    const png = createTestPng();
    
    const result = await imagesToPdf.runBrowser!(ctx, [png], {
      pageSize: 'a4',
      margin: 0,
    });
    
    expect(result).toBeInstanceOf(Blob);
    const pdf = await loadPdfFromBlob(result as Blob);
    const page = pdf.getPage(0);
    const { width, height } = page.getSize();
    expect(width).toBeCloseTo(595.28, 1);
    expect(height).toBeCloseTo(841.89, 1);
  });

  it('should create PDF with letter page size', async () => {
    const png = createTestPng();
    
    const result = await imagesToPdf.runBrowser!(ctx, [png], {
      pageSize: 'letter',
      margin: 0,
    });
    
    expect(result).toBeInstanceOf(Blob);
    const pdf = await loadPdfFromBlob(result as Blob);
    const page = pdf.getPage(0);
    const { width, height } = page.getSize();
    expect(width).toBe(612);
    expect(height).toBe(792);
  });

  it('should apply margin when using fit page size', async () => {
    const png = createTestPng();
    const margin = 20;
    
    const result = await imagesToPdf.runBrowser!(ctx, [png], {
      pageSize: 'fit',
      margin,
    });
    
    expect(result).toBeInstanceOf(Blob);
    const pdf = await loadPdfFromBlob(result as Blob);
    const page = pdf.getPage(0);
    const { width, height } = page.getSize();
    expect(width).toBe(1 + margin * 2);
    expect(height).toBe(1 + margin * 2);
  });

  it('should throw error when no images are provided', async () => {
    await expect(imagesToPdf.runBrowser!(ctx, [], {
      pageSize: 'fit',
      margin: 0,
    })).rejects.toThrow('Please select at least one image');
  });

  it('should call onProgress during conversion', async () => {
    const png1 = createTestPng();
    const png2 = createTestPng();
    
    await imagesToPdf.runBrowser!(ctx, [png1, png2], {
      pageSize: 'fit',
      margin: 0,
    });
    
    expect(ctx.onProgress).toHaveBeenCalled();
    expect(ctx.onProgress).toHaveBeenCalledWith(expect.objectContaining({ percent: 100 }));
  });
});
