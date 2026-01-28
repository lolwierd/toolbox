<script lang="ts">
  import { page } from '$app/state';
  import { getTool } from '@toolbox/toolkit';
  import ToolPage from '$lib/ui/ToolPage.svelte';
  import '$lib/tools/register';
  
  const tool = $derived(page.params.id ? getTool(page.params.id) : undefined);
</script>

<svelte:head>
  {#if tool}
    <title>{tool.title} - Toolbox</title>
  {:else}
    <title>Tool Not Found - Toolbox</title>
  {/if}
</svelte:head>

{#if tool}
  <ToolPage {tool} />
{:else}
  <div class="not-found">
    <h1>Tool Not Found</h1>
    <p>The tool "{page.params.id}" doesn't exist.</p>
    <a href="/">← Back to home</a>
  </div>
{/if}

<style>
  .not-found {
    text-align: center;
    padding: 4rem 2rem;
  }
  
  .not-found h1 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
  
  .not-found p {
    color: var(--text-muted);
    margin-bottom: 1.5rem;
  }
</style>
