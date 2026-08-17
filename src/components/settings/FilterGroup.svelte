<script lang="ts">
  import type { AnyControl, FilterDef } from "$lib/schema/types";
  import ParamRow from "./ParamRow.svelte";

  let {
    def,
    values = $bindable(),
    processing,
  }: {
    def: FilterDef<{ enabled: boolean }, never>;
    values: Record<string, unknown> & { enabled: boolean };
    processing: boolean;
  } = $props();

  // def が差し替わってもパラメータ一覧が追従するよう $derived にする
  // （const で受けると初回の def だけを捕まえてしまう）
  const paramKeys = $derived(Object.keys(def.params));
</script>

<div class="filter-section">
  <div class="filter-header">
    <label class="checkbox-label">
      <input type="checkbox" bind:checked={values.enabled} disabled={processing} />
      {def.label} ({def.ffname})
    </label>
    <a
      href={`https://ffmpeg.org/ffmpeg-filters.html#${def.doc}`}
      target="_blank"
      rel="noopener"
      class="doc-link">?</a
    >
  </div>
  {#if paramKeys.length > 0}
    <div class="filter-params" class:disabled={!values.enabled}>
      {#each paramKeys as key}
        <ParamRow
          name={key}
          def={def.params[key as keyof typeof def.params] as AnyControl}
          bind:value={values[key] as never}
          disabled={!values.enabled || processing}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  /* 複数列に並べると項目の境界が分かりにくいので、軽くカード化する */
  .filter-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    border: 1px solid #2b2b24;
    border-radius: 6px;
    /* 段組みの途中で項目が分断されないようにする */
    break-inside: avoid;
    margin-bottom: 12px;
    background: #17170f;
  }
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    color: #a3a3a3;
    cursor: pointer;
  }
  .filter-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .doc-link {
    font-size: 0.7rem;
    color: #71717a;
    text-decoration: none;
  }
  .doc-link:hover {
    color: #a3a825;
  }
  .filter-params {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-left: 4px;
    transition: opacity 0.15s;
  }
  .filter-params.disabled {
    opacity: 0.35;
    pointer-events: none;
  }
</style>
