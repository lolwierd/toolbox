import { get, set } from 'idb-keyval';

const SETTINGS_PREFIX = 'toolbox:settings:';

export function getSettings(toolId: string): Record<string, unknown> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(SETTINGS_PREFIX + toolId);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

export function saveSettings(toolId: string, settings: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(SETTINGS_PREFIX + toolId, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

export function clearSettings(toolId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SETTINGS_PREFIX + toolId);
}

export async function getWorkspaceData<T>(key: string): Promise<T | undefined> {
  return get<T>(`toolbox:workspace:${key}`);
}

export async function setWorkspaceData<T>(key: string, value: T): Promise<void> {
  return set(`toolbox:workspace:${key}`, value);
}
