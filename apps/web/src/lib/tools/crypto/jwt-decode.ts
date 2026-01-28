import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({});

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  return atob(base64);
}

function formatExpiry(exp: number): string {
  const expiryDate = new Date(exp * 1000);
  const now = new Date();
  const isExpired = expiryDate < now;

  const formatted = expiryDate.toISOString();
  const status = isExpired ? '❌ EXPIRED' : '✅ Valid';

  if (isExpired) {
    const diffMs = now.getTime() - expiryDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${formatted} (${status} - expired ${diffDays}d ${diffHours}h ago)`;
  } else {
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${formatted} (${status} - expires in ${diffDays}d ${diffHours}h)`;
  }
}

export const jwtDecode = defineTool({
  id: 'crypto.jwt-decode',
  title: 'JWT Decode',
  category: 'crypto',
  description: 'Decode JWT tokens and view header, payload, and expiry',
  keywords: ['jwt', 'json web token', 'decode', 'parse', 'token', 'auth'],

  mode: 'browser',

  input: {
    kind: 'text',
    placeholder: 'Paste your JWT token here...',
  },

  output: {
    kind: 'text',
  },

  optionsSchema,
  defaults: {},

  async runBrowser(_ctx, input) {
    const token = (input as string).trim();

    if (!token) {
      throw new Error('Please enter a JWT token');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format. Expected 3 parts separated by dots.');
    }

    let header: Record<string, unknown>;
    let payload: Record<string, unknown>;

    try {
      header = JSON.parse(base64UrlDecode(parts[0]));
    } catch {
      throw new Error('Invalid JWT header - could not decode');
    }

    try {
      payload = JSON.parse(base64UrlDecode(parts[1]));
    } catch {
      throw new Error('Invalid JWT payload - could not decode');
    }

    const lines: string[] = [];

    lines.push('═══════════════════════════════════════');
    lines.push('                HEADER');
    lines.push('═══════════════════════════════════════');
    lines.push(JSON.stringify(header, null, 2));

    lines.push('');
    lines.push('═══════════════════════════════════════');
    lines.push('                PAYLOAD');
    lines.push('═══════════════════════════════════════');
    lines.push(JSON.stringify(payload, null, 2));

    if (payload.exp || payload.iat || payload.nbf) {
      lines.push('');
      lines.push('═══════════════════════════════════════');
      lines.push('              TIMESTAMPS');
      lines.push('═══════════════════════════════════════');

      if (typeof payload.iat === 'number') {
        lines.push(`Issued At (iat):    ${new Date(payload.iat * 1000).toISOString()}`);
      }
      if (typeof payload.nbf === 'number') {
        lines.push(`Not Before (nbf):   ${new Date(payload.nbf * 1000).toISOString()}`);
      }
      if (typeof payload.exp === 'number') {
        lines.push(`Expires (exp):      ${formatExpiry(payload.exp)}`);
      }
    }

    return lines.join('\n');
  },
});
