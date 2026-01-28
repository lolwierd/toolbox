import type { ToolDefinition } from './tool.js';
import type { ToolCategory } from './categories.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tools: Map<string, ToolDefinition<any>> = new Map();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerTool(tool: ToolDefinition<any>): void {
  if (tools.has(tool.id)) {
    console.warn(`Tool "${tool.id}" is already registered, overwriting.`);
  }
  tools.set(tool.id, tool);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTool(id: string): ToolDefinition<any> | undefined {
  return tools.get(id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAllTools(): ToolDefinition<any>[] {
  return Array.from(tools.values());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getToolsByCategory(category: ToolCategory): ToolDefinition<any>[] {
  return getAllTools().filter((t) => t.category === category);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function searchTools(query: string): ToolDefinition<any>[] {
  const q = query.toLowerCase().trim();
  if (!q) return getAllTools();
  
  return getAllTools().filter((tool) => {
    const searchable = [
      tool.id,
      tool.title,
      tool.description,
      tool.category,
      ...(tool.keywords ?? []),
    ].join(' ').toLowerCase();
    return searchable.includes(q);
  });
}
