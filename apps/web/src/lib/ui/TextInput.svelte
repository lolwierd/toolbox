<script lang="ts">
  import type { ToolInput } from '@toolbox/toolkit';
  
  interface Props {
    input: ToolInput;
    value: string;
    onValueChange: (value: string) => void;
  }
  
  let { input, value, onValueChange }: Props = $props();
</script>

<div class="text-input">
  <textarea
    {value}
    placeholder={input.placeholder ?? 'Paste or type here...'}
    oninput={(e) => onValueChange(e.currentTarget.value)}
    rows="10"
  ></textarea>
</div>

<style>
  .text-input {
    width: 100%;
  }
  
  textarea {
    width: 100%;
    resize: vertical;
    min-height: 200px;
    font-family: 'SF Mono', Monaco, 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.5;
  }
</style>
