<script lang="ts">
  import FormatSettings from "./FormatSettings.svelte";
  import VolumeSettings from "./VolumeSettings.svelte";
  import BitrateSettings from "./BitrateSettings.svelte";
  import SampleRateSettings from "./SampleRateSettings.svelte";
  import SilenceRemoveSettings from "./SilenceRemoveSettings.svelte";
  import NoiseReduceSettings from "./NoiseReduceSettings.svelte";
  import FrequencySettings from "./FrequencySettings.svelte";
  import DynamicsSettings from "./DynamicsSettings.svelte";
  import EffectSettings from "./EffectSettings.svelte";
  import ChannelSettings from "./ChannelSettings.svelte";
  import FrequencySettingsExt from "./FrequencySettingsExt.svelte";
  import DynamicsSettingsExt from "./DynamicsSettingsExt.svelte";
  import EffectSettingsExt from "./EffectSettingsExt.svelte";
  import RepairSettings from "./RepairSettings.svelte";
  import StereoSettings from "./StereoSettings.svelte";
  import MetadataSettings from "./MetadataSettings.svelte";
  import { getAppState } from "$lib/stores.svelte";
  import { SvelteSet } from "svelte/reactivity";

  const appState = getAppState();

  type Tab = "basic" | "frequency" | "dynamics" | "effects" | "channel" | "repair" | "stereo" | "metadata";
  let activeTab = $state<Tab>("basic");
  // 処理側 (+page.svelte) が「詳細フィルタを適用するか」の判定に使うため store で持つ
  let showAdvanced = $derived(appState.showAdvanced);

  // 一度も開いていないタブは初期マウントしない (巨大な設定コンポーネントの構築を遅延させる)。
  // 一度開いたタブはアンマウントせず class:hidden で隠すだけにして、入力値を保持する (keep-alive)。
  const visited = new SvelteSet<Tab>(["basic"]);

  function selectTab(id: Tab) {
    visited.add(id);
    activeTab = id;
  }

  const basicTabs: { id: Tab; label: string }[] = [
    { id: "basic", label: "基本機能" },
  ];

  const advancedTabs: { id: Tab; label: string }[] = [
    { id: "frequency", label: "周波数系" },
    { id: "dynamics", label: "ダイナミクス系" },
    { id: "effects", label: "エフェクト系" },
    { id: "channel", label: "チャンネル系" },
    { id: "repair", label: "修復系" },
    { id: "stereo", label: "ステレオ系" },
    { id: "metadata", label: "メタ編集" },
  ];

  const visibleTabs = $derived(showAdvanced ? [...basicTabs, ...advancedTabs] : basicTabs);

  $effect(() => {
    if (!showAdvanced && activeTab !== "basic") {
      activeTab = "basic";
    }
  });

</script>

  <section class="processing-form">
    <div class="form-header">
      <h2>処理設定</h2>
      <label class="advanced-toggle">
        <input
          type="checkbox"
          bind:checked={appState.showAdvanced}
          disabled={appState.isProcessing}
        />
        高度な機能
      </label>
    </div>
    <div class="tab-bar">
      {#each visibleTabs as tab}
        <button
          class="tab-btn"
          class:active={activeTab === tab.id}
          onclick={() => selectTab(tab.id)}
          disabled={appState.isProcessing}
        >
          {tab.label}
        </button>
      {/each}
    </div>
    <div class="tab-content" class:hidden={activeTab !== "basic"}>
      <div class="settings-grid">
        <div class="settings-col">
          <FormatSettings />
          <SampleRateSettings />
          <SilenceRemoveSettings />
          <NoiseReduceSettings />
        </div>
        <div class="settings-col">
          <BitrateSettings />
          <VolumeSettings />
        </div>
      </div>
    </div>
    {#if visited.has("frequency")}
      <div class="tab-content" class:hidden={activeTab !== "frequency"}>
        <FrequencySettings />
        <FrequencySettingsExt />
      </div>
    {/if}
    {#if visited.has("dynamics")}
      <div class="tab-content" class:hidden={activeTab !== "dynamics"}>
        <DynamicsSettings />
        <DynamicsSettingsExt />
      </div>
    {/if}
    {#if visited.has("effects")}
      <div class="tab-content" class:hidden={activeTab !== "effects"}>
        <EffectSettings />
        <EffectSettingsExt />
      </div>
    {/if}
    {#if visited.has("channel")}
      <div class="tab-content" class:hidden={activeTab !== "channel"}>
        <ChannelSettings />
      </div>
    {/if}
    {#if visited.has("repair")}
      <div class="tab-content" class:hidden={activeTab !== "repair"}>
        <RepairSettings />
      </div>
    {/if}
    {#if visited.has("stereo")}
      <div class="tab-content" class:hidden={activeTab !== "stereo"}>
        <StereoSettings />
      </div>
    {/if}
    {#if visited.has("metadata")}
      <div class="tab-content" class:hidden={activeTab !== "metadata"}>
        <MetadataSettings />
      </div>
    {/if}
  </section>

<style>
  .processing-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .form-header {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #d4d4d8;
  }
  .advanced-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    color: #a3a3a3;
    cursor: pointer;
  }
  .advanced-toggle input[type="checkbox"] {
    accent-color: #a3a825;
  }
  .tab-bar {
    display: flex;
    gap: 0;
    border-bottom: 1px solid #3f3f36;
  }
  .tab-btn {
    padding: 8px 20px;
    border: 1px solid #3f3f36;
    border-bottom: none;
    border-radius: 6px 6px 0 0;
    background: #1a1a17;
    color: #71717a;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    margin-bottom: -1px;
    transition: color 0.15s, background 0.15s;
  }
  .tab-btn:hover:not(:disabled):not(.active) {
    color: #a3a3a3;
    background: #222220;
  }
  .tab-btn.active {
    background: #28281f;
    color: #e4e4e7;
    border-bottom: 1px solid #28281f;
  }
  .tab-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  .tab-content {
    padding: 16px 0 0;
  }
  .tab-content.hidden {
    display: none;
  }
  .settings-grid {
    display: flex;
    gap: 16px;
  }
  .settings-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>
