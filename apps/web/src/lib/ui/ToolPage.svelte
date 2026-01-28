<script lang="ts">
  import type { ToolDefinition } from '@toolbox/toolkit';
  import Dropzone from './Dropzone.svelte';
  import TextInput from './TextInput.svelte';
  import OptionsForm from './OptionsForm.svelte';
  import { getSettings, saveSettings } from '$lib/stores/settings.js';
  
  interface Props {
    tool: ToolDefinition;
  }
  
  let { tool }: Props = $props();
  
  let files = $state<File[]>([]);
  let textInput = $state('');
  let inputValues = $state<Record<string, any>>({});
  let options = $state<Record<string, unknown>>({});
  let output = $state<{ blob?: Blob; text?: string; filename?: string } | null>(null);
  let error = $state<string | null>(null);
  let isRunning = $state(false);
  let progress = $state<{ percent?: number; message?: string } | null>(null);
  
  $effect(() => {
    const saved = getSettings(tool.id);
    options = { ...tool.defaults, ...saved };
    // Reset inputs when tool changes
    files = [];
    textInput = '';
    inputValues = {};
    output = null;
    error = null;
    progress = null;
    isRunning = false;
  });
  
  $effect(() => {
    if (Object.keys(options).length > 0) {
      saveSettings(tool.id, options);
    }
  });
  
  async function run() {
    if (!tool.runBrowser) {
      error = 'This tool requires server-side processing (not yet implemented)';
      return;
    }
    
    error = null;
    output = null;
    isRunning = true;
    progress = { message: 'Processing...' };
    
    const controller = new AbortController();
    
    try {
      let input: ArrayBuffer | string | File[] | Record<string, any>;
      
      if (tool.input.elements) {
        input = inputValues;
      } else if (tool.input.kind === 'file') {
        input = files;
      } else if (tool.input.kind === 'text' || tool.input.kind === 'json') {
        input = textInput;
      } else {
        input = '';
      }
      
      const result = await tool.runBrowser(
        {
          signal: controller.signal,
          onProgress: (p) => { progress = p; },
        },
        input,
        options
      );
      
      if (typeof result === 'string') {
        output = { text: result };
      } else if (result instanceof Blob) {
        output = { 
          blob: result, 
          filename: tool.output.filename ?? `output.${getExtension(tool.output.mime)}` 
        };
      } else if (result instanceof ArrayBuffer) {
        output = { 
          blob: new Blob([result], { type: tool.output.mime ?? 'application/octet-stream' }),
          filename: tool.output.filename ?? `output.${getExtension(tool.output.mime)}` 
        };
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'An error occurred';
    } finally {
      isRunning = false;
      progress = null;
    }
  }
  
  function getExtension(mime?: string): string {
    const map: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/json': 'json',
      'text/plain': 'txt',
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'application/zip': 'zip',
    };
    return map[mime ?? ''] ?? 'bin';
  }
  
  function downloadOutput() {
    if (!output?.blob) return;
    const url = URL.createObjectURL(output.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = output.filename ?? 'output';
    a.click();
    URL.revokeObjectURL(url);
  }
  
  async function copyOutput() {
    if (!output?.text) return;
    await navigator.clipboard.writeText(output.text);
  }
  
  function reset() {
    files = [];
    textInput = '';
    inputValues = {};
    output = null;
    error = null;
  }
  
  const canRun = $derived.by(() => {
    if (tool.input.elements) {
      // Check if at least one non-optional field has a value, 
      // AND all required fields have values.
      // If all are optional, at least one must be filled.
      
      const hasValue = (el: typeof tool.input.elements[0]) => {
        const val = inputValues[el.name];
        if (el.kind === 'file') return Array.isArray(val) && val.length > 0;
        return typeof val === 'string' && val.length > 0;
      };

      const allRequiredFilled = tool.input.elements.every(el => 
        el.optional ? true : hasValue(el)
      );

      const atLeastOneFilled = tool.input.elements.some(el => hasValue(el));

      return allRequiredFilled && atLeastOneFilled;
    }
    return (tool.input.kind === 'file' && files.length > 0) ||
           (tool.input.kind === 'text' && textInput.length > 0) ||
           (tool.input.kind === 'json' && textInput.length > 0) ||
           tool.input.kind === 'none';
  });
</script>

<div class="tool-page">
  <header class="tool-header">
    <h1>{tool.title}</h1>
    <p class="tool-description">{tool.description}</p>
    {#if tool.mode !== 'browser'}
      <span class="tool-mode">Runs on server</span>
    {/if}
  </header>
  
  <div class="tool-layout">
    <section class="tool-section input-section">
      <h2>Input</h2>
      
      {#if tool.input.elements}
        <div class="multi-input">
          {#each tool.input.elements as el}
            <div class="input-group">
              {#if el.label}<label class="input-label" for={el.name}>{el.label}</label>{/if}
              {#if el.kind === 'file'}
                <Dropzone 
                  input={el} 
                  files={inputValues[el.name] || []} 
                  onFilesChange={(f) => inputValues[el.name] = f} 
                />
              {:else if el.kind === 'text' || el.kind === 'json'}
                <TextInput 
                  input={el} 
                  value={inputValues[el.name] || ''} 
                  onValueChange={(v) => inputValues[el.name] = v} 
                />
              {/if}
            </div>
          {/each}
        </div>
      {:else if tool.input.kind === 'file'}
        <Dropzone 
          input={tool.input} 
          {files} 
          onFilesChange={(f) => files = f} 
        />
      {:else if tool.input.kind === 'text' || tool.input.kind === 'json'}
        <TextInput 
          input={tool.input} 
          value={textInput} 
          onValueChange={(v) => textInput = v} 
        />
      {/if}
    </section>
    
    <section class="tool-section options-section">
      <h2>Options</h2>
      <OptionsForm 
        schema={tool.optionsSchema} 
        values={options} 
        onValuesChange={(v) => options = v} 
      />
    </section>
    
    <section class="tool-section actions-section">
      <div class="actions">
        <button 
          class="btn btn-primary"
          disabled={!canRun || isRunning}
          onclick={run}
        >
          {isRunning ? 'Processing...' : 'Run'}
        </button>
        <button class="btn btn-secondary" onclick={reset}>
          Reset
        </button>
      </div>
      
      {#if progress}
        <div class="progress">
          {#if progress.percent !== undefined}
            <div class="progress-bar">
              <div class="progress-fill" style="width: {progress.percent}%"></div>
            </div>
          {/if}
          {#if progress.message}
            <p class="progress-message">{progress.message}</p>
          {/if}
        </div>
      {/if}
    </section>
    
    {#if error}
      <section class="tool-section error-section">
        <div class="error">
          <strong>Error:</strong> {error}
        </div>
      </section>
    {/if}
    
    {#if output}
      <section class="tool-section output-section">
        <h2>Output</h2>
        
        {#if output.text !== undefined}
          <div class="output-text">
            <pre>{output.text}</pre>
            <button class="btn btn-secondary copy-btn" onclick={copyOutput}>
              Copy
            </button>
          </div>
        {/if}
        
        {#if output.blob}
          <div class="output-file">
            <span class="output-filename">{output.filename}</span>
            <span class="output-size">{(output.blob.size / 1024).toFixed(1)} KB</span>
            <button class="btn btn-primary" onclick={downloadOutput}>
              Download
            </button>
          </div>
        {/if}
      </section>
    {/if}
  </div>
</div>

<style>
  .tool-page {
    max-width: 900px;
    margin: 0 auto;
  }
  
  .tool-header {
    margin-bottom: 2rem;
  }
  
  .tool-header h1 {
    font-size: 1.75rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  .tool-description {
    color: var(--text-muted);
  }
  
  .tool-mode {
    display: inline-block;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-muted);
  }
  
  .tool-layout {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .tool-section h2 {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin-bottom: 1rem;
  }
  
  .actions {
    display: flex;
    gap: 0.75rem;
  }
  
  .progress {
    margin-top: 1rem;
  }
  
  .progress-bar {
    height: 4px;
    background: var(--bg-surface);
    border-radius: 2px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: var(--accent);
    transition: width 0.2s;
  }
  
  .progress-message {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-muted);
  }
  
  .error {
    padding: 1rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid var(--error);
    border-radius: var(--radius);
    color: var(--error);
  }
  
  .output-text {
    position: relative;
  }
  
  .output-text pre {
    padding: 1rem;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: auto;
    max-height: 400px;
    font-family: 'SF Mono', Monaco, 'Consolas', monospace;
    font-size: 13px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  
  .copy-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
  }
  
  .output-file {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  
  .output-filename {
    flex: 1;
    font-weight: 500;
  }
  
  .output-size {
    font-size: 0.875rem;
    color: var(--text-muted);
  }

  .multi-input {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .input-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-muted);
  }
</style>
