<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import { dynamicsExtGroup } from "$lib/schema/dynamicsExt";
  import { makeDefaults, toStoreOption } from "$lib/schema/helpers";
  import type { FilterDef } from "$lib/schema/types";
  import type { DynamicsFilterExtOption } from "$lib/types";
  import FilterGroup from "./settings/FilterGroup.svelte";

  const appState = getAppState();
  const group = dynamicsExtGroup as unknown as Record<
    string,
    FilterDef<{ enabled: boolean }, never>
  >;
  const filterIds = Object.keys(group);

  let values = $state(makeDefaults<DynamicsFilterExtOption>(group));

  $effect(() => {
    appState.dynamicsFilterExt = toStoreOption(values);
  });

  let lastResetCounter = appState.settingsResetCounter;
  $effect(() => {
    const current = appState.settingsResetCounter;
    if (current !== lastResetCounter) {
      lastResetCounter = current;
      values = makeDefaults<DynamicsFilterExtOption>(group);
    }
  });
</script>

<div class="dynamics-settings-ext">
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
  .dynamics-settings-ext {
    display: flex;
    flex-direction: column;
    gap: 16px;
    --param-label-width: 100px;
    --slider-value-width: 64px;
  }
</style>
