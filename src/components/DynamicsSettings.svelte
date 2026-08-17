<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import { dynamicsGroup } from "$lib/schema/dynamics";
  import { makeDefaults, toStoreOption } from "$lib/schema/helpers";
  import type { FilterDef } from "$lib/schema/types";
  import type { DynamicsFilterOption } from "$lib/types";
  import FilterGroup from "./settings/FilterGroup.svelte";

  const appState = getAppState();
  const group = dynamicsGroup as unknown as Record<
    string,
    FilterDef<{ enabled: boolean }, never>
  >;
  const filterIds = Object.keys(group);

  let values = $state(makeDefaults<DynamicsFilterOption>(group));

  $effect(() => {
    appState.dynamicsFilter = toStoreOption(values);
  });

  let lastResetCounter = appState.settingsResetCounter;
  $effect(() => {
    const current = appState.settingsResetCounter;
    if (current !== lastResetCounter) {
      lastResetCounter = current;
      values = makeDefaults<DynamicsFilterOption>(group);
    }
  });
</script>

<div class="dynamics-settings">
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
  /* 親 (.tab-content.filters) のグリッドへ各項目を直接並べるため箱を消す。
     カスタムプロパティは display:contents でも子に継承される。 */
  .dynamics-settings {
    display: contents;
    --param-label-width: 80px;
    --slider-value-width: 72px;
  }
</style>
