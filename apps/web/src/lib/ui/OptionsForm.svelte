<script lang="ts">
  import type { z } from 'zod';
  
  interface Props {
    schema: z.ZodTypeAny;
    values: Record<string, unknown>;
    onValuesChange: (values: Record<string, unknown>) => void;
  }
  
  let { schema, values, onValuesChange }: Props = $props();
  
  type FieldDef = {
    key: string;
    type: string;
    description?: string;
    options?: string[];
    min?: number;
    max?: number;
  };
  
  function extractFields(s: z.ZodTypeAny): FieldDef[] {
    const shape = (s as z.ZodObject<z.ZodRawShape>)._def?.shape?.();
    if (!shape) return [];
    
    return Object.entries(shape).map(([key, field]) => {
      const f = field as z.ZodTypeAny;
      const def = f._def;
      const description = def?.description;
      
      let type = 'string';
      let options: string[] | undefined;
      let min: number | undefined;
      let max: number | undefined;
      
      const innerType = def?.innerType ?? f;
      const typeName = innerType._def?.typeName;
      
      if (typeName === 'ZodBoolean') {
        type = 'boolean';
      } else if (typeName === 'ZodNumber') {
        type = 'number';
        min = innerType._def?.checks?.find((c: {kind: string}) => c.kind === 'min')?.value;
        max = innerType._def?.checks?.find((c: {kind: string}) => c.kind === 'max')?.value;
      } else if (typeName === 'ZodEnum') {
        type = 'enum';
        options = innerType._def?.values;
      }
      
      return { key, type, description, options, min, max };
    });
  }
  
  const fields = $derived(extractFields(schema));
  
  function updateField(key: string, value: unknown) {
    onValuesChange({ ...values, [key]: value });
  }
</script>

{#if fields.length > 0}
  <div class="options-form">
    {#each fields as field}
      <div class="field">
        <label class="field-label">
          <span class="field-name">{field.key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
          {#if field.description}
            <span class="field-desc">{field.description}</span>
          {/if}
        </label>
        
        {#if field.type === 'boolean'}
          <label class="checkbox">
            <input 
              type="checkbox" 
              checked={Boolean(values[field.key])}
              onchange={(e) => updateField(field.key, e.currentTarget.checked)}
            />
            <span class="checkmark"></span>
          </label>
        {:else if field.type === 'number'}
          <input 
            type="number" 
            value={values[field.key] as number}
            min={field.min}
            max={field.max}
            oninput={(e) => updateField(field.key, Number(e.currentTarget.value))}
          />
        {:else if field.type === 'enum' && field.options}
          <select 
            value={values[field.key] as string}
            onchange={(e) => updateField(field.key, e.currentTarget.value)}
          >
            {#each field.options as opt}
              <option value={opt}>{opt}</option>
            {/each}
          </select>
        {:else}
          <input 
            type="text" 
            value={values[field.key] as string}
            oninput={(e) => updateField(field.key, e.currentTarget.value)}
          />
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  .options-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .field-label {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }
  
  .field-name {
    font-weight: 500;
    font-size: 0.875rem;
  }
  
  .field-desc {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  
  input[type="number"],
  input[type="text"],
  select {
    width: 100%;
    max-width: 300px;
  }
  
  .checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  
  .checkbox input {
    width: 18px;
    height: 18px;
    accent-color: var(--accent);
  }
</style>
