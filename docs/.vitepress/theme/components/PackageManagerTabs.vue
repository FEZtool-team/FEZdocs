<script setup lang="ts">
import { computed, ref } from "vue";

type InstallOption = {
  id: string;
  label: string;
  command: string;
  note?: string;
};

const props = withDefaults(
  defineProps<{
    packageName?: string;
  }>(),
  {
    packageName: "fezrs",
  }
);

const options = computed<InstallOption[]>(() => [
  {
    id: "pip",
    label: "pip",
    command: `pip install ${props.packageName}`,
  },
  {
    id: "conda",
    label: "conda",
    command: `conda install -c FEZtool ${props.packageName}`,
  },
  {
    id: "mamba",
    label: "mamba",
    command: `mamba install FEZtool::${props.packageName}`,
    note: "Mamba must be installed. If it is not available, use the conda tab.",
  },
]);

const activeTab = ref(options.value[0].id);

const activeOption = computed(() => {
  return options.value.find((option) => option.id === activeTab.value) ?? options.value[0];
});
</script>

<template>
  <section class="pm-tabs" aria-label="Package manager install commands">
    <div class="pm-tab-list" role="tablist">
      <button
        v-for="option in options"
        :id="`pm-tab-${option.id}`"
        :key="option.id"
        class="pm-tab"
        :class="{ 'is-active': activeTab === option.id }"
        type="button"
        role="tab"
        :aria-selected="activeTab === option.id"
        :aria-controls="`pm-panel-${option.id}`"
        @click="activeTab = option.id"
      >
        {{ option.label }}
      </button>
    </div>

    <div
      :id="`pm-panel-${activeOption.id}`"
      class="pm-panel"
      role="tabpanel"
      :aria-labelledby="`pm-tab-${activeOption.id}`"
    >
      <pre><code>{{ activeOption.command }}</code></pre>
      <p v-if="activeOption.note" class="pm-note">{{ activeOption.note }}</p>
    </div>
  </section>
</template>

<style scoped>
.pm-tabs {
  margin: 24px 0;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg);
}

.pm-tab-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-border);
}

.pm-tab {
  padding: 10px 18px;
  border: 0;
  border-right: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
  background: transparent;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.pm-tab:hover,
.pm-tab.is-active {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
}

.pm-panel {
  padding: 16px;
}

.pm-panel pre {
  margin: 0;
  padding: 14px 16px;
  border-radius: 6px;
  overflow-x: auto;
  background: var(--vp-code-block-bg);
}

.pm-panel code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.95em;
}

.pm-note {
  margin: 12px 0 0;
  color: var(--vp-c-text-2);
}
</style>
