<script lang="ts" module>
  let rowSeq = 0;
</script>

<script lang="ts">
  import type { AnyControl } from "$lib/schema/types";

  let {
    name,
    def,
    value = $bindable(),
    disabled,
  }: {
    name: string;
    def: AnyControl;
    value: never;
    disabled: boolean;
  } = $props();

  // ラベル文字列は param キーそのまま（既存コンポーネントと同じ）。
  // label と入力を id で関連付ける（見た目は変わらず、ラベルクリックで操作できる）
  const inputId = `param-${++rowSeq}`;
</script>

<div class="param-row">
  <label for={inputId}>{name}</label>
  {#if def.control === "number"}
    <input
      id={inputId}
      type="number"
      bind:value
      min={def.min}
      max={def.max}
      step={def.step}
      {disabled}
    />
    {#if def.unit}
      <span class="unit">{def.unit}</span>
    {/if}
  {:else if def.control === "range"}
    <input
      id={inputId}
      type="range"
      bind:value
      min={def.min}
      max={def.max}
      step={def.step}
      {disabled}
    />
    <span class="slider-value">
      {def.format ? def.format(value as unknown as number) : value}
    </span>
  {:else if def.control === "select"}
    <select id={inputId} bind:value {disabled}>
      {#each def.options as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  {:else if def.control === "checkbox"}
    <input
      id={inputId}
      type="checkbox"
      bind:checked={value as unknown as boolean}
      {disabled}
    />
    {#if def.desc}
      <span class="param-desc">{def.desc}</span>
    {/if}
  {:else if def.control === "text"}
    <input id={inputId} type="text" bind:value {disabled} />
  {/if}
</div>

<style>
  .param-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-left: 20px;
  }
  .param-row label {
    font-size: 0.8rem;
    color: #a3a3a3;
    white-space: nowrap;
    min-width: var(--param-label-width, 100px);
    font-family: monospace;
  }
  .param-row input[type="number"] {
    width: 100px;
    padding: 4px 6px;
    border: 1px solid #3f3f36;
    border-radius: 4px;
    background: #1a1a17;
    color: #e4e4e7;
    font-size: 0.85rem;
    font-family: monospace;
  }
  .param-row input[type="number"]:disabled {
    opacity: 0.5;
  }
  .param-row input[type="text"] {
    width: 200px;
    padding: 4px 6px;
    border: 1px solid #3f3f36;
    border-radius: 4px;
    background: #1a1a17;
    color: #e4e4e7;
    font-size: 0.85rem;
    font-family: monospace;
  }
  .param-row input[type="text"]:disabled {
    opacity: 0.5;
  }
  .param-row select {
    padding: 4px 6px;
    border: 1px solid #3f3f36;
    border-radius: 4px;
    background: #1a1a17;
    color: #e4e4e7;
    font-size: 0.85rem;
  }
  .param-row select:disabled {
    opacity: 0.5;
  }
  .param-row input[type="range"] {
    flex: 1;
    accent-color: #a3a825;
  }
  .param-row input[type="checkbox"] {
    accent-color: #a3a825;
  }
  .unit {
    font-size: 0.8rem;
    color: #a3a3a3;
    min-width: 24px;
  }
  .slider-value {
    font-size: 0.8rem;
    color: #d4d4d8;
    min-width: var(--slider-value-width, 64px);
    text-align: right;
    font-family: monospace;
  }
  .param-desc {
    font-size: 0.75rem;
    color: #737373;
  }
</style>
