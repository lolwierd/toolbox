import { describe, it, expect, vi } from 'vitest';
import { base64Encode } from '../base64-encode';
import { base64Decode } from '../base64-decode';
import { hashGenerator } from '../hash';
import { uuidGenerator } from '../uuid';
import { urlEncode } from '../url-encode';
import { urlDecode } from '../url-decode';
import { jwtDecode } from '../jwt-decode';

const mockContext = {
  signal: new AbortController().signal,
  onProgress: vi.fn(),
};

describe('base64Encode', () => {
  it('encodes text to base64', async () => {
    const result = await base64Encode.runBrowser!(mockContext, 'hello', { urlSafe: false });
    expect(result).toBe('aGVsbG8=');
  });

  it('encodes unicode text to base64', async () => {
    const result = await base64Encode.runBrowser!(mockContext, 'hello 世界', { urlSafe: false });
    expect(result).toBe('aGVsbG8g5LiW55WM');
  });

  it('encodes with URL-safe option', async () => {
    const input = 'subjects?_d';
    const result = await base64Encode.runBrowser!(mockContext, input, { urlSafe: true });
    expect(result).not.toContain('+');
    expect(result).not.toContain('/');
    expect(result).not.toContain('=');
  });

  it('throws error for empty input', async () => {
    await expect(base64Encode.runBrowser!(mockContext, '', { urlSafe: false })).rejects.toThrow(
      'Please enter some text'
    );
  });
});

describe('base64Decode', () => {
  it('decodes base64 to text', async () => {
    const result = await base64Decode.runBrowser!(mockContext, 'aGVsbG8=', {});
    expect(result).toBe('hello');
  });

  it('decodes base64 without padding', async () => {
    const result = await base64Decode.runBrowser!(mockContext, 'aGVsbG8', {});
    expect(result).toBe('hello');
  });

  it('decodes URL-safe base64', async () => {
    const urlSafeBase64 = 'c3ViamVjdHM_X2Q';
    const result = await base64Decode.runBrowser!(mockContext, urlSafeBase64, {});
    expect(result).toBe('subjects?_d');
  });

  it('decodes unicode base64', async () => {
    const result = await base64Decode.runBrowser!(mockContext, 'aGVsbG8g5LiW55WM', {});
    expect(result).toBe('hello 世界');
  });

  it('throws error for empty input', async () => {
    await expect(base64Decode.runBrowser!(mockContext, '', {})).rejects.toThrow(
      'Please enter a Base64 string'
    );
  });

  it('throws error for invalid base64', async () => {
    await expect(base64Decode.runBrowser!(mockContext, '!!!invalid!!!', {})).rejects.toThrow(
      'Invalid Base64 string'
    );
  });
});

describe('hashGenerator', () => {
  it('generates SHA-256 hash', async () => {
    const result = await hashGenerator.runBrowser!(mockContext, 'hello', {
      algorithm: 'SHA-256',
      uppercase: false,
    });
    expect(result).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('generates SHA-1 hash', async () => {
    const result = await hashGenerator.runBrowser!(mockContext, 'hello', {
      algorithm: 'SHA-1',
      uppercase: false,
    });
    expect(result).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
  });

  it('generates SHA-512 hash', async () => {
    const result = await hashGenerator.runBrowser!(mockContext, 'hello', {
      algorithm: 'SHA-512',
      uppercase: false,
    });
    expect(result).toBe(
      '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043'
    );
  });

  it('generates uppercase hash', async () => {
    const result = await hashGenerator.runBrowser!(mockContext, 'hello', {
      algorithm: 'SHA-256',
      uppercase: true,
    });
    expect(result).toBe('2CF24DBA5FB0A30E26E83B2AC5B9E29E1B161E5C1FA7425E73043362938B9824');
  });

  it('throws error for empty input', async () => {
    await expect(
      hashGenerator.runBrowser!(mockContext, '', { algorithm: 'SHA-256', uppercase: false })
    ).rejects.toThrow('Please enter some text');
  });
});

describe('uuidGenerator', () => {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it('generates valid UUID v4 format', async () => {
    const result = await uuidGenerator.runBrowser!(mockContext, undefined, {
      count: 1,
      uppercase: false,
      noDashes: false,
    });
    expect(result).toMatch(uuidV4Regex);
  });

  it('generates multiple UUIDs', async () => {
    const result = await uuidGenerator.runBrowser!(mockContext, undefined, {
      count: 5,
      uppercase: false,
      noDashes: false,
    });
    const uuids = result.split('\n');
    expect(uuids).toHaveLength(5);
    uuids.forEach((uuid) => {
      expect(uuid).toMatch(uuidV4Regex);
    });
  });

  it('generates uppercase UUIDs', async () => {
    const result = await uuidGenerator.runBrowser!(mockContext, undefined, {
      count: 1,
      uppercase: true,
      noDashes: false,
    });
    expect(result).toBe(result.toUpperCase());
    expect(result).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/);
  });

  it('generates UUIDs without dashes', async () => {
    const result = await uuidGenerator.runBrowser!(mockContext, undefined, {
      count: 1,
      uppercase: false,
      noDashes: true,
    });
    expect(result).not.toContain('-');
    expect(result).toHaveLength(32);
  });

  it('generates unique UUIDs', async () => {
    const result = await uuidGenerator.runBrowser!(mockContext, undefined, {
      count: 10,
      uppercase: false,
      noDashes: false,
    });
    const uuids = result.split('\n');
    const uniqueUuids = new Set(uuids);
    expect(uniqueUuids.size).toBe(10);
  });
});

describe('urlEncode', () => {
  it('encodes spaces', async () => {
    const result = await urlEncode.runBrowser!(mockContext, 'hello world', {});
    expect(result).toBe('hello%20world');
  });

  it('encodes special characters', async () => {
    const result = await urlEncode.runBrowser!(mockContext, 'key=value&foo=bar', {});
    expect(result).toBe('key%3Dvalue%26foo%3Dbar');
  });

  it('encodes unicode characters', async () => {
    const result = await urlEncode.runBrowser!(mockContext, 'こんにちは', {});
    expect(result).toBe('%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF');
  });

  it('preserves unreserved characters', async () => {
    const result = await urlEncode.runBrowser!(mockContext, 'abc123-_.~', {});
    expect(result).toBe('abc123-_.~');
  });

  it('throws error for empty input', async () => {
    await expect(urlEncode.runBrowser!(mockContext, '', {})).rejects.toThrow(
      'Please enter some text'
    );
  });
});

describe('urlDecode', () => {
  it('decodes percent-encoded spaces', async () => {
    const result = await urlDecode.runBrowser!(mockContext, 'hello%20world', {});
    expect(result).toBe('hello world');
  });

  it('decodes special characters', async () => {
    const result = await urlDecode.runBrowser!(mockContext, 'key%3Dvalue%26foo%3Dbar', {});
    expect(result).toBe('key=value&foo=bar');
  });

  it('decodes unicode characters', async () => {
    const result = await urlDecode.runBrowser!(
      mockContext,
      '%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF',
      {}
    );
    expect(result).toBe('こんにちは');
  });

  it('preserves already decoded text', async () => {
    const result = await urlDecode.runBrowser!(mockContext, 'hello', {});
    expect(result).toBe('hello');
  });

  it('throws error for empty input', async () => {
    await expect(urlDecode.runBrowser!(mockContext, '', {})).rejects.toThrow(
      'Please enter some text'
    );
  });

  it('throws error for invalid URL-encoded text', async () => {
    await expect(urlDecode.runBrowser!(mockContext, '%ZZ', {})).rejects.toThrow(
      'Invalid URL-encoded text'
    );
  });
});

describe('jwtDecode', () => {
  const validJwt =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  it('decodes valid JWT and shows header', async () => {
    const result = await jwtDecode.runBrowser!(mockContext, validJwt, {});
    expect(result).toContain('HEADER');
    expect(result).toContain('"alg": "HS256"');
    expect(result).toContain('"typ": "JWT"');
  });

  it('decodes valid JWT and shows payload', async () => {
    const result = await jwtDecode.runBrowser!(mockContext, validJwt, {});
    expect(result).toContain('PAYLOAD');
    expect(result).toContain('"sub": "1234567890"');
    expect(result).toContain('"name": "John Doe"');
    expect(result).toContain('"iat": 1516239022');
  });

  it('handles JWT with exp claim', async () => {
    const jwtWithExp =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNTE2MjM5MDIyfQ.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ';
    const result = await jwtDecode.runBrowser!(mockContext, jwtWithExp, {});
    expect(result).toContain('TIMESTAMPS');
    expect(result).toContain('Expires (exp)');
  });

  it('trims whitespace from input', async () => {
    const result = await jwtDecode.runBrowser!(mockContext, `  ${validJwt}  `, {});
    expect(result).toContain('HEADER');
  });

  it('throws error for empty input', async () => {
    await expect(jwtDecode.runBrowser!(mockContext, '', {})).rejects.toThrow(
      'Please enter a JWT token'
    );
  });

  it('throws error for invalid JWT format (not 3 parts)', async () => {
    await expect(jwtDecode.runBrowser!(mockContext, 'invalid.jwt', {})).rejects.toThrow(
      'Invalid JWT format. Expected 3 parts separated by dots.'
    );
  });

  it('throws error for invalid JWT header', async () => {
    await expect(jwtDecode.runBrowser!(mockContext, '!!!.payload.signature', {})).rejects.toThrow(
      'Invalid JWT header - could not decode'
    );
  });

  it('throws error for invalid JWT payload', async () => {
    const invalidPayloadJwt = 'eyJhbGciOiJIUzI1NiJ9.!!!invalid!!!.signature';
    await expect(jwtDecode.runBrowser!(mockContext, invalidPayloadJwt, {})).rejects.toThrow(
      'Invalid JWT payload - could not decode'
    );
  });
});
