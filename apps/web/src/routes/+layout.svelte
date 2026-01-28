<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import { TOOL_CATEGORIES, getAllTools } from '@toolbox/toolkit';
  import '$lib/tools/register';

  let { children } = $props();
  
  let searchQuery = $state('');
  let sidebarOpen = $state(true);
  
  const categories = Object.entries(TOOL_CATEGORIES);
  
  const toolsByCategory = $derived(() => {
    const tools = getAllTools();
    const grouped: Record<string, typeof tools> = {};
    for (const tool of tools) {
      if (!grouped[tool.category]) grouped[tool.category] = [];
      grouped[tool.category].push(tool);
    }
    return grouped;
  });
</script>

<div class="layout">
  <aside class="sidebar" class:collapsed={!sidebarOpen}>
    <header class="sidebar-header">
      <a href="/" class="logo">
        <svg viewBox="0 0 32 32" width="24" height="24">
          <rect width="32" height="32" rx="6" fill="var(--accent)"/>
          <path d="M8 11h16M8 16h16M8 21h10" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Toolbox</span>
      </a>
      <button class="toggle-btn" onclick={() => sidebarOpen = !sidebarOpen}>
        {sidebarOpen ? '◀' : '▶'}
      </button>
    </header>
    
    {#if sidebarOpen}
      <div class="sidebar-search">
        <input 
          type="search" 
          placeholder="Search tools..." 
          bind:value={searchQuery}
        />
      </div>
      
      <nav class="sidebar-nav">
        {#each categories as [key, cat]}
          {@const tools = toolsByCategory()[key] ?? []}
          {#if tools.length > 0}
            <div class="nav-category">
              <span class="nav-category-label">{cat.label}</span>
              {#each tools as tool}
                {@const isActive = page.url.pathname === `/tools/${tool.id}`}
                <a 
                  href="/tools/{tool.id}" 
                  class="nav-item"
                  class:active={isActive}
                >
                  {tool.title}
                </a>
              {/each}
            </div>
          {/if}
        {/each}
      </nav>
    {/if}
  </aside>
  
  <main class="main">
    {@render children()}
  </main>
</div>

<style>
  .layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }
  
  .sidebar {
    width: 260px;
    background: var(--bg-surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    transition: width 0.2s;
    flex-shrink: 0;
  }
  
  .sidebar.collapsed {
    width: 48px;
  }
  
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--border);
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: var(--text);
  }
  
  .logo:hover {
    text-decoration: none;
  }
  
  .toggle-btn {
    padding: 0.25rem;
    color: var(--text-muted);
    font-size: 12px;
  }
  
  .sidebar-search {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border);
  }
  
  .sidebar-search input {
    width: 100%;
  }
  
  .sidebar-nav {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem 0;
  }
  
  .nav-category {
    margin-bottom: 0.5rem;
  }
  
  .nav-category-label {
    display: block;
    padding: 0.5rem 1rem;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }
  
  .nav-item {
    display: block;
    padding: 0.5rem 1rem 0.5rem 1.5rem;
    color: var(--text);
    font-size: 13px;
  }
  
  .nav-item:hover {
    background: var(--bg-hover);
    text-decoration: none;
  }
  
  .nav-item.active {
    background: var(--bg-active);
    color: var(--accent);
  }
  
  .main {
    flex: 1;
    overflow: auto;
    padding: 2rem;
  }
</style>
