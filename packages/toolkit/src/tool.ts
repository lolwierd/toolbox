import { z } from 'zod';
import type { ToolCategory } from './categories.js';

export type ToolIOKind = 'file' | 'text' | 'json' | 'none';

export interface ToolInput {
  kind: ToolIOKind;
  accept?: string[];
  multiple?: boolean;
  label?: string;
  placeholder?: string;
  elements?: {
    name: string;
    kind: ToolIOKind;
    label?: string;
    placeholder?: string;
    accept?: string[];
    optional?: boolean;
  }[];
}

export interface ToolOutput {
  kind: ToolIOKind;
  mime?: string;
  filename?: string;
}

export interface ToolProgress {
  percent?: number;
  message?: string;
}

export type ProgressCallback = (progress: ToolProgress) => void;

export interface BrowserToolContext {
  signal: AbortSignal;
  onProgress: ProgressCallback;
}

export interface ToolDefinition<TOptions extends z.ZodTypeAny = z.ZodTypeAny> {
  id: string;
  title: string;
  category: ToolCategory;
  description: string;
  keywords?: string[];

  mode: 'browser' | 'server' | 'hybrid';

  input: ToolInput;
  output: ToolOutput;

  optionsSchema: TOptions;
  defaults: z.infer<TOptions>;

  runBrowser?: (
    ctx: BrowserToolContext,
    input: ArrayBuffer | string | File[] | Record<string, any>,
    options: z.infer<TOptions>
  ) => Promise<ArrayBuffer | string | Blob>;
}

export function defineTool<TOptions extends z.ZodTypeAny>(
  tool: ToolDefinition<TOptions>
): ToolDefinition<TOptions> {
  return tool;
}
