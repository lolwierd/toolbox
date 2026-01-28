<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import { TOOL_CATEGORIES, getAllTools } from '@toolbox/toolkit';
  import '$lib/tools/register';
  import { browser } from '$app/environment';

  let { children } = $props();
  
  let searchQuery = $state('');
  
  // Auto-detect OS theme preference
  $effect(() => {
    if (browser) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateTheme = (e: MediaQueryList | MediaQueryListEvent) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      
      // Set initial theme
      updateTheme(mediaQuery);
      
      // Listen for changes
      mediaQuery.addEventListener('change', updateTheme);
      
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  });
  
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
  <aside class="sidebar">
    <header class="sidebar-header">
      <a href="/" class="logo">
        <span class="logo-text">Toolbox</span>
      </a>
    </header>
    
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
    flex-shrink: 0;
    overflow: hidden;
  }
  
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    border-bottom: 1px solid var(--border);
    min-height: 56px;
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 600;
    color: var(--text);
    flex: 1;
    min-width: 0;
  }
  
  .logo:hover {
    text-decoration: none;
  }
  
  .logo-icon {
    flex-shrink: 0;
  }
  
  .logo-text {
    white-space: nowrap;
    overflow: hidden;
  }
  
  .sidebar-search {
    padding: 0.75rem;
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

  /* Minimal Scrollbar for Sidebar */
  .sidebar-nav::-webkit-scrollbar {
    width: 6px;
  }
  
  .sidebar-nav::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .sidebar-nav::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 3px;
  }
  
  .sidebar-nav:hover::-webkit-scrollbar-thumb {
    background-color: var(--border);
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
    transition: background 0.15s, color 0.15s;
  }
  
  .nav-item:hover {
    background: var(--bg-hover);
    text-decoration: none;
  }
  
  .nav-item.active {
    background: var(--bg-active);
    color: var(--accent);
    font-weight: 500;
  }
  
  .main {
    flex: 1;
    overflow: auto;
    padding: 2rem;
  }
  
  @media (max-width: 768px) {
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 100;
    }
    
    .main {
      width: 100%;
    }
  }
</style>
