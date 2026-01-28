# Toolbox

A private, local-first personal workbench for file conversions, formatting, encoding, and dev utilities.

## Philosophy

- **Local-first**: Tools run in your browser when possible. Files stay on your device.
- **Server when needed**: Heavy tasks (OCR, office conversions) use an optional backend you control.
- **No tracking**: No accounts, no analytics, no cloud calls.
- **Boring is good**: Fast, stable, consistent.

## Getting Started

```bash
# Install dependencies
pnpm install

# Run the web app (browser-only tools)
pnpm dev:web

# Run both web app and API server
pnpm dev
```

The web app runs on http://localhost:5173

## Project Structure

```
toolbox/
├── apps/
│   ├── web/           # SvelteKit frontend (browser tools)
│   └── api/           # Fastify backend (server tools)
├── packages/
│   └── toolkit/       # Shared tool definitions and types
└── pnpm-workspace.yaml
```

## Available Tools (44)

### PDF (6 tools)
- **Merge PDFs** - Combine multiple PDFs into one
- **Split PDF** - Split by page ranges or extract pages
- **Rotate PDF** - Rotate pages 90°, 180°, 270°
- **Compress PDF** - Basic size reduction
- **PDF Metadata** - View or wipe metadata
- **Images to PDF** - Convert images to PDF document

### Format (6 tools)
- **JSON Prettify** - Format with indentation
- **JSON Minify** - Compact JSON
- **YAML Prettify** - Format and validate YAML
- **XML Prettify** - Format XML
- **SQL Format** - Format SQL queries
- **Markdown Preview** - Convert to HTML

### Diff (4 tools)
- **Text Diff** - Compare two texts
- **JSON Diff** - Compare JSON objects
- **YAML Diff** - Compare YAML documents
- **CSV Diff** - Compare CSV files

### Encode/Hash (7 tools)
- **Base64 Encode/Decode** - Text to/from Base64
- **URL Encode/Decode** - URL encoding
- **Hash Generator** - SHA-256, SHA-512, SHA-1
- **UUID Generator** - Generate random UUIDs
- **JWT Decode** - Decode and inspect JWT tokens

### Time (2 tools)
- **Timestamp Converter** - Unix ↔ human-readable dates
- **Cron Converter** - Parse cron expressions, show next runs

### Image (6 tools)
- **Compress Image** - Reduce file size
- **Convert Image** - PNG/JPG/WebP conversion
- **Resize Image** - By pixels or percentage
- **Crop Image** - Crop to region
- **Rotate Image** - Rotate and flip
- **Strip EXIF** - Remove metadata

### Archive (2 tools)
- **Create Zip** - Zip multiple files
- **Extract Zip** - Unzip archives

### Text (6 tools)
- **Line Endings** - Convert LF/CRLF
- **Sort Lines** - Sort alphabetically, numerically, etc.
- **Word Count** - Count words, characters, lines
- **Find & Replace** - With regex support
- **Case Convert** - To various case formats
- **Remove Duplicates** - Unique lines

### Dev (4 tools)
- **Color Converter** - Hex/RGB/HSL conversion
- **Regex Tester** - Test patterns with matches
- **Query String ↔ JSON** - Convert between formats
- **Byte Converter** - B/KB/MB/GB conversion

## Adding a New Tool

1. Create a new file in `apps/web/src/lib/tools/<category>/<tool>.ts`
2. Use `defineTool()` to define the tool with its schema and implementation
3. Register it in `apps/web/src/lib/tools/register.ts`

Example:

```typescript
import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';

const optionsSchema = z.object({
  myOption: z.boolean().describe('Description for the UI'),
});

export const myTool = defineTool({
  id: 'category.my-tool',
  title: 'My Tool',
  category: 'format',
  description: 'What this tool does',
  
  mode: 'browser', // or 'server' or 'hybrid'
  
  input: { kind: 'text', placeholder: 'Enter text...' },
  output: { kind: 'text' },
  
  optionsSchema,
  defaults: { myOption: false },
  
  async runBrowser(ctx, input, options) {
    // Implementation
    return 'result';
  },
});
```

## Development

```bash
# Type check
pnpm check

# Build for production
pnpm build
```

## Deployment

### Local only
Just run `pnpm dev:web` - all browser tools work without the API.

### With server tools
1. Build: `pnpm build`
2. Run API: `cd apps/api && pnpm start`
3. Serve web: Deploy `apps/web/build` to any static host or run with adapter-node

## Tech Stack

- **Frontend**: SvelteKit 2, Svelte 5, TypeScript
- **Backend**: Fastify, TypeScript
- **PDF**: pdf-lib
- **Images**: Canvas API
- **Validation**: Zod
- **Storage**: localStorage, IndexedDB
