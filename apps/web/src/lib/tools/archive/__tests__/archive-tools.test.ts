import { describe, it, expect, vi } from 'vitest';
import JSZip from 'jszip';
import { zipCreate } from '../zip';
import { zipExtract } from '../unzip';

function createMockContext() {
  return {
    signal: new AbortController().signal,
    onProgress: vi.fn(),
  };
}

interface MockFile extends File {
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
}

function stringToArrayBuffer(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    view[i] = str.charCodeAt(i);
  }
  return buf;
}

function createMockFile(name: string, content: string): MockFile {
  const arrayBuffer = stringToArrayBuffer(content);
  
  const blob = new Blob([content], { type: 'text/plain' });
  const file = new File([blob], name, { type: 'text/plain' }) as MockFile;
  file.arrayBuffer = () => Promise.resolve(arrayBuffer);
  file.text = () => Promise.resolve(content);
  return file;
}

async function createZipFile(files: Record<string, string>, filename = 'archive.zip'): Promise<MockFile> {
  const zip = new JSZip();
  for (const [name, content] of Object.entries(files)) {
    zip.file(name, content);
  }
  const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
  const blob = new Blob([arrayBuffer], { type: 'application/zip' });
  const file = new File([blob], filename, { type: 'application/zip' }) as MockFile;
  file.arrayBuffer = () => Promise.resolve(arrayBuffer);
  file.text = () => Promise.resolve('');
  return file;
}

describe('zipCreate', () => {
  it('creates a zip from multiple files', async () => {
    const ctx = createMockContext();
    const files = [
      createMockFile('file1.txt', 'Hello'),
      createMockFile('file2.txt', 'World'),
    ];

    const result = await zipCreate.runBrowser!(ctx, files, { compressionLevel: 6 });

    expect(result).toBeInstanceOf(Blob);
    const zip = await JSZip.loadAsync(result as Blob);
    expect(Object.keys(zip.files)).toContain('file1.txt');
    expect(Object.keys(zip.files)).toContain('file2.txt');

    const file1Content = await zip.file('file1.txt')?.async('string');
    const file2Content = await zip.file('file2.txt')?.async('string');
    expect(file1Content).toBe('Hello');
    expect(file2Content).toBe('World');
  });

  it('creates a zip from a single file', async () => {
    const ctx = createMockContext();
    const files = [createMockFile('single.txt', 'Single file content')];

    const result = await zipCreate.runBrowser!(ctx, files, { compressionLevel: 6 });

    expect(result).toBeInstanceOf(Blob);
    const zip = await JSZip.loadAsync(result as Blob);
    expect(Object.keys(zip.files)).toHaveLength(1);
    expect(Object.keys(zip.files)).toContain('single.txt');
  });

  it('throws error when no files provided', async () => {
    const ctx = createMockContext();
    await expect(
      zipCreate.runBrowser!(ctx, [], { compressionLevel: 6 })
    ).rejects.toThrow('Please select at least 1 file to zip');
  });

  it('respects compression level 0 (no compression)', async () => {
    const ctx = createMockContext();
    const files = [createMockFile('test.txt', 'Test content')];

    const result = await zipCreate.runBrowser!(ctx, files, { compressionLevel: 0 });

    expect(result).toBeInstanceOf(Blob);
    const zip = await JSZip.loadAsync(result as Blob);
    expect(Object.keys(zip.files)).toContain('test.txt');
  });

  it('respects compression level 9 (max compression)', async () => {
    const ctx = createMockContext();
    const files = [createMockFile('test.txt', 'Test content'.repeat(100))];

    const result = await zipCreate.runBrowser!(ctx, files, { compressionLevel: 9 });

    expect(result).toBeInstanceOf(Blob);
    const zip = await JSZip.loadAsync(result as Blob);
    expect(Object.keys(zip.files)).toContain('test.txt');
  });

  it('calls onProgress during zip creation', async () => {
    const ctx = createMockContext();
    const files = [
      createMockFile('file1.txt', 'Hello'),
      createMockFile('file2.txt', 'World'),
    ];

    await zipCreate.runBrowser!(ctx, files, { compressionLevel: 6 });

    expect(ctx.onProgress).toHaveBeenCalled();
  });
});

describe('zipExtract', () => {
  it('extracts files from a zip archive', async () => {
    const ctx = createMockContext();
    const zipFile = await createZipFile({
      'file1.txt': 'Content 1',
      'file2.txt': 'Content 2',
    });

    const result = await zipExtract.runBrowser!(ctx, [zipFile], {});

    expect(result).toBeInstanceOf(Blob);
    const extractedZip = await JSZip.loadAsync(result as Blob);
    expect(Object.keys(extractedZip.files)).toContain('file1.txt');
    expect(Object.keys(extractedZip.files)).toContain('file2.txt');
  });

  it('returns single file directly when zip contains one file', async () => {
    const ctx = createMockContext();
    const zipFile = await createZipFile({
      'single.txt': 'Single file content',
    });

    const result = await zipExtract.runBrowser!(ctx, [zipFile], {});

    expect(result).toBeInstanceOf(File);
    const file = result as File;
    expect(file.name).toBe('single.txt');
    expect(file.size).toBeGreaterThan(0);
  });

  it('throws error when no file provided', async () => {
    const ctx = createMockContext();
    await expect(
      zipExtract.runBrowser!(ctx, [], {})
    ).rejects.toThrow('Please select a zip file');
  });

  it('throws error when zip is empty', async () => {
    const ctx = createMockContext();
    const zip = new JSZip();
    const emptyZipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    const zipFile = new File([emptyZipBuffer], 'empty.zip', { type: 'application/zip' }) as MockFile;
    zipFile.arrayBuffer = () => Promise.resolve(emptyZipBuffer);

    await expect(
      zipExtract.runBrowser!(ctx, [zipFile], {})
    ).rejects.toThrow('Zip archive is empty');
  });

  it('ignores directories in zip', async () => {
    const ctx = createMockContext();
    const zip = new JSZip();
    zip.folder('subdir');
    zip.file('subdir/file.txt', 'Nested content');
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    const zipFile = new File([zipBuffer], 'archive.zip', { type: 'application/zip' }) as MockFile;
    zipFile.arrayBuffer = () => Promise.resolve(zipBuffer);

    const result = await zipExtract.runBrowser!(ctx, [zipFile], {});

    expect(result).toBeInstanceOf(File);
    const file = result as File;
    expect(file.name).toBe('subdir/file.txt');
  });

  it('calls onProgress during extraction', async () => {
    const ctx = createMockContext();
    const zipFile = await createZipFile({
      'file1.txt': 'Content 1',
    });

    await zipExtract.runBrowser!(ctx, [zipFile], {});

    expect(ctx.onProgress).toHaveBeenCalled();
  });
});
