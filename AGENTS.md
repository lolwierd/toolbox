# Toolbox Development Guide

## Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev           # Run both web and API
pnpm dev:web       # Run web only
pnpm dev:api       # Run API only

# Type check
pnpm check

# Build
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Architecture

- **Monorepo** using pnpm workspaces
- **Frontend**: SvelteKit 2 + Svelte 5 (runes mode) + TypeScript
- **Backend**: Fastify + TypeScript (optional, for server-side tools)
- **Shared**: `@toolbox/toolkit` package for tool definitions and types

## Adding Tools

1. Create tool in `apps/web/src/lib/tools/<category>/<name>.ts`
2. Use `defineTool()` from `@toolbox/toolkit`
3. Register in `apps/web/src/lib/tools/register.ts`

### Tool Structure

```typescript
import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

export const myTool = defineTool({
  id: 'category.name',      // Unique ID, used in URL
  title: 'Display Name',
  category: 'format',       // See categories.ts
  description: 'Short description',
  keywords: ['search', 'terms'],
  
  mode: 'browser',          // 'browser' | 'server' | 'hybrid'
  
  input: {
    kind: 'file' | 'text' | 'json' | 'none',
    accept: ['.pdf'],       // For file inputs
    multiple: true,         // Allow multiple files
    placeholder: 'Text...'  // For text inputs
  },
  
  output: {
    kind: 'file' | 'text',
    mime: 'application/pdf',
    filename: 'output.pdf'
  },
  
  optionsSchema: z.object({ ... }),  // Zod schema for options
  defaults: { ... },                  // Default option values
  
  async runBrowser(ctx, input, options) {
    ctx.onProgress({ percent: 50, message: 'Working...' });
    return result;  // string | Blob | ArrayBuffer
  }
});
```

## Categories

Defined in `packages/toolkit/src/categories.ts`:
- `pdf`, `convert`, `diff`, `format`, `validate`
- `crypto`, `time`, `image`, `archive`, `dev`, `text`

## UI Components

- `ToolPage.svelte` - Main tool wrapper with input/options/output sections
- `Dropzone.svelte` - File drag-and-drop
- `TextInput.svelte` - Text/JSON input
- `OptionsForm.svelte` - Auto-generated form from Zod schema

## Key Libraries

- **pdf-lib**: PDF manipulation (merge, split, rotate)
- **pdfjs-dist**: PDF preview/rendering
- **zod**: Schema validation and options form generation
- **idb-keyval**: IndexedDB for settings persistence

## Conventions

- Tool IDs: `category.kebab-name` (e.g., `pdf.merge`, `format.json-prettify`)
- Files use `.ts` extension for TypeScript
- Svelte components use `.svelte` extension
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Options persist per-tool in localStorage
