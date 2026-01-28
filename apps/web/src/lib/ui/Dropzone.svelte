<script lang="ts">
  import type { ToolInput } from '@toolbox/toolkit';
  
  interface Props {
    input: ToolInput;
    files: File[];
    onFilesChange: (files: File[]) => void;
  }
  
  let { input, files, onFilesChange }: Props = $props();
  
  let isDragging = $state(false);
  let fileInput: HTMLInputElement;
  
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    
    const items = e.dataTransfer?.files;
    if (!items) return;
    
    const newFiles = Array.from(items);
    if (input.multiple) {
      onFilesChange([...files, ...newFiles]);
    } else {
      onFilesChange(newFiles.slice(0, 1));
    }
  }
  
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }
  
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
  }
  
  function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    if (!target.files) return;
    
    const newFiles = Array.from(target.files);
    if (input.multiple) {
      onFilesChange([...files, ...newFiles]);
    } else {
      onFilesChange(newFiles.slice(0, 1));
    }
  }
  
  function removeFile(index: number) {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  }
  
  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
</script>

<div class="dropzone-container">
  <div 
    class="dropzone"
    class:dragging={isDragging}
    class:has-files={files.length > 0}
    ondrop={handleDrop}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    onclick={() => fileInput.click()}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
  >
    <input
      bind:this={fileInput}
      type="file"
      accept={input.accept?.join(',')}
      multiple={input.multiple}
      onchange={handleFileSelect}
      hidden
    />
    
    {#if files.length === 0}
      <div class="dropzone-content">
        <div class="dropzone-icon">📁</div>
        <p class="dropzone-label">{input.label ?? 'Drop files here'}</p>
        <p class="dropzone-hint">or click to browse</p>
        {#if input.accept}
          <p class="dropzone-accept">{input.accept.join(', ')}</p>
        {/if}
      </div>
    {:else}
      <div class="dropzone-content">
        <p class="dropzone-label">Drop more files or click to add</p>
      </div>
    {/if}
  </div>
  
  {#if files.length > 0}
    <ul class="file-list">
      {#each files as file, i}
        <li class="file-item">
          <span class="file-name">{file.name}</span>
          <span class="file-size">{formatSize(file.size)}</span>
          <button class="file-remove" onclick={() => removeFile(i)}>×</button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .dropzone-container {
    width: 100%;
  }
  
  .dropzone {
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }
  
  .dropzone:hover,
  .dropzone.dragging {
    border-color: var(--accent);
    background: rgba(59, 130, 246, 0.05);
  }
  
  .dropzone.has-files {
    padding: 1rem;
  }
  
  .dropzone-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  .dropzone-label {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }
  
  .dropzone-hint {
    font-size: 0.875rem;
    color: var(--text-muted);
  }
  
  .dropzone-accept {
    font-size: 0.75rem;
    color: var(--text-dim);
    margin-top: 0.5rem;
  }
  
  .file-list {
    list-style: none;
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .file-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
  }
  
  .file-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .file-size {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  
  .file-remove {
    padding: 0.25rem 0.5rem;
    font-size: 1rem;
    color: var(--text-muted);
    border-radius: var(--radius-sm);
  }
  
  .file-remove:hover {
    background: var(--bg-hover);
    color: var(--error);
  }
</style>
