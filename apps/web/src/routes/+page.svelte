<script lang="ts">
  import { getAllTools, TOOL_CATEGORIES } from '@toolbox/toolkit';
  import '$lib/tools/register';
  
  const tools = getAllTools();
  const categories = Object.entries(TOOL_CATEGORIES);
  
  const toolsByCategory = () => {
    const grouped: Record<string, typeof tools> = {};
    for (const tool of tools) {
      if (!grouped[tool.category]) grouped[tool.category] = [];
      grouped[tool.category].push(tool);
    }
    return grouped;
  };
</script>

<div class="home">
  <header class="hero">
    <h1>Toolbox</h1>
    <p>Your private workbench. Fast, local-first, no tracking.</p>
  </header>
  
  <div class="categories">
    {#each categories as [key, cat]}
      {@const catTools = toolsByCategory()[key] ?? []}
      {#if catTools.length > 0}
        <section class="category">
          <h2>{cat.label}</h2>
          <p class="category-desc">{cat.description}</p>
          <div class="tool-grid">
            {#each catTools as tool}
              <a href="/tools/{tool.id}" class="tool-card">
                <span class="tool-title">{tool.title}</span>
                <span class="tool-desc">{tool.description}</span>
                {#if tool.mode === 'server' || tool.mode === 'hybrid'}
                  <span class="tool-badge">server</span>
                {/if}
              </a>
            {/each}
          </div>
        </section>
      {/if}
    {/each}
  </div>
</div>

<style>
  .home {
    max-width: 1000px;
    margin: 0 auto;
  }
  
  .hero {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .hero h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
  
  .hero p {
    color: var(--text-muted);
    font-size: 1.1rem;
  }
  
  .categories {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }
  
  .category h2 {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }
  
  .category-desc {
    color: var(--text-muted);
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }
  
  .tool-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
  }
  
  .tool-card {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    transition: border-color 0.15s, background 0.15s;
    position: relative;
  }
  
  .tool-card:hover {
    border-color: var(--border-focus);
    background: var(--bg-hover);
    text-decoration: none;
  }
  
  .tool-title {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }
  
  .tool-desc {
    font-size: 0.8rem;
    color: var(--text-muted);
    line-height: 1.4;
  }
  
  .tool-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    font-size: 10px;
    padding: 2px 6px;
    background: var(--bg);
    border-radius: var(--radius-sm);
    color: var(--text-muted);
  }
</style>
