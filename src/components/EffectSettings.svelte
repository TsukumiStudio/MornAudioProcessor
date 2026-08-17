<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import { effectGroup } from "$lib/schema/effect";
  import { makeDefaults, toStoreOption } from "$lib/schema/helpers";
  import type { FilterDef } from "$lib/schema/types";
  import type { EffectFilterOption } from "$lib/types";
  import FilterGroup from "./settings/FilterGroup.svelte";

  const appState = getAppState();
  const group = effectGroup as unknown as Record<
    string,
    FilterDef<{ enabled: boolean }, never>
  >;
  const filterIds = Object.keys(group);

  let values = $state(makeDefaults<EffectFilterOption>(group));

  $effect(() => {
    appState.effectFilter = toStoreOption(values);
  });

  let lastResetCounter = appState.settingsResetCounter;
  $effect(() => {
    const current = appState.settingsResetCounter;
    if (current !== lastResetCounter) {
      lastResetCounter = current;
      values = makeDefaults<EffectFilterOption>(group);
    }
  });
</script>

<div class="effect-settings">
  {#each filterIds as id}
    <FilterGroup
      def={group[id]}
      bind:values={
        (values as unknown as Record<string, { enabled: boolean }>)[id] as never
      }
      processing={appState.isProcessing}
    />
  {/each}
</div>

<style>
  .effect-settings {
    display: flex;
    flex-direction: column;
    gap: 16px;
    --param-label-width: 80px;
    --slider-value-width: 72px;
  }
</style>
