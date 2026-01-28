# API Server

Optional backend for server-side tools. Currently a **skeleton** - all 44 tools run in-browser.

## Current State

The API provides the infrastructure but no tool implementations yet:

- `GET /health` - Health check endpoint
- `POST /api/tools/:toolId/jobs` - Create a job (uploads files + options)
- `GET /api/jobs/:jobId` - Check job status
- `GET /api/jobs/:jobId/output` - Download result
- `DELETE /api/jobs/:jobId` - Cancel/cleanup job

**All jobs currently fail** with "not yet implemented" - the runner is a placeholder.

## Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Type check
pnpm check

# Start production server
pnpm start
```

## When You'd Need This

Server-side tools for tasks browsers can't handle well:
- **OCR** - Tesseract CLI for scanned PDFs/images
- **Office conversions** - LibreOffice headless for docx/xlsx/pptx → PDF
- **Heavy PDF operations** - Ghostscript for advanced compression/repair
- **Background removal** - ML models that need GPU/heavy compute

## Adding a Server Tool

1. Create handler in `src/tools/<toolId>.ts`:
```typescript
export async function handleMyTool(
  files: { name: string; data: Buffer }[],
  options: Record<string, unknown>
): Promise<{ output: Buffer; mime: string; filename: string }> {
  // Call CLI tool, process files, return result
}
```

2. Register in `src/jobs/runner.ts`:
```typescript
import { handleMyTool } from '../tools/my-tool.js';

const handlers: Record<string, Handler> = {
  'category.my-tool': handleMyTool,
};
```

3. Mark the tool as `mode: 'server'` or `mode: 'hybrid'` in the web app.

## Architecture

```
src/
├── index.ts          # Fastify server setup
└── jobs/
    ├── routes.ts     # Job API endpoints
    ├── store.ts      # In-memory job storage with TTL cleanup
    └── runner.ts     # Job execution (TODO: add handlers)
```

## Design Principles

- **Ephemeral** - Jobs auto-delete after 1 hour
- **No database** - In-memory store, stateless design
- **CLI-first** - Shell out to battle-tested tools (tesseract, libreoffice, ghostscript)
- **Size limits** - 100MB max upload, runtime timeouts
