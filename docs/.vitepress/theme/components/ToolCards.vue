<script setup lang="ts">
import { withBase } from "vitepress";

// The FEZ ecosystem, as presented on FEZhome (components/landing/Tools.vue).
// Each card carries its tool's color; nothing else on the home page does.
type Tool = {
  code: "rs" | "fm" | "cc";
  name: string;
  domain: string;
  status: string;
  summary: string;
  links: { text: string; href: string; primary?: boolean }[];
};

const tools: Tool[] = [
  {
    code: "rs",
    name: "FEZrs",
    domain: "Remote sensing",
    status: "Available",
    summary:
      "A Python package for geospatial multispectral image processing: spectral indices, filters, image enhancement, change detection, clustering and classification behind one calculator API.",
    links: [
      { text: "Read the docs", href: withBase("/libraries/fezrs/"), primary: true },
      { text: "Install", href: withBase("/libraries/fezrs/installation") },
    ],
  },
  {
    code: "fm",
    name: "FEZfm",
    domain: "Fault and geohazard monitoring",
    status: "Live",
    summary:
      "Version 1 is an earthquake monitor. Every 30 minutes it collects reports from USGS and EMSC, merges reports of the same quake, tags fault zones, significant events and active sequences, and publishes a feed, a map and downloadable data.",
    links: [
      { text: "Read the docs", href: withBase("/fezfm/"), primary: true },
      { text: "Open the monitor", href: "https://fezfm.feztool.com/" },
    ],
  },
  {
    code: "cc",
    name: "FEZcc",
    domain: "Climate change",
    status: "In planning",
    summary:
      "Climate-change analytics: trend detection and indicator calculation for climate and land-surface time series.",
    links: [],
  },
];
</script>

<template>
  <div class="tool-cards">
    <article
      v-for="tool in tools"
      :key="tool.code"
      class="tool-card"
      :class="[`tool-card--${tool.code}`, { 'tool-card--planned': !tool.links.length }]"
      :aria-labelledby="`tool-card-${tool.code}`"
    >
      <div class="tool-card__head">
        <span class="tool-badge" :class="`tool-badge--${tool.code}`" :aria-label="`${tool.name} badge`">
          {{ tool.code.toUpperCase() }}
        </span>
        <span class="tool-card__status">{{ tool.status }}</span>
      </div>
      <h3 :id="`tool-card-${tool.code}`">{{ tool.name }}</h3>
      <p class="tool-card__domain">{{ tool.domain }}</p>
      <p class="tool-card__summary">{{ tool.summary }}</p>
      <div v-if="tool.links.length" class="tool-card__links">
        <a
          v-for="link in tool.links"
          :key="link.href"
          :href="link.href"
          class="tool-card__link"
          :class="{ 'tool-card__link--primary': link.primary }"
          :target="link.href.startsWith('http') ? '_blank' : undefined"
          :rel="link.href.startsWith('http') ? 'noopener' : undefined"
        >
          {{ link.text }}
        </a>
      </div>
    </article>
  </div>
</template>

<style scoped>
.tool-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin: 8px 0 24px;
}

.tool-card {
  --c-300: var(--fez-300);
  --c-500: var(--fez-500);
  display: flex;
  flex-direction: column;
  padding: 28px;
  border: 1px solid rgb(var(--c-500) / 0.35);
  border-radius: var(--radius-lg);
  background: rgb(var(--fez-800) / 0.45);
  box-shadow: 0 0 64px -16px rgb(var(--c-500) / 0.45);
}

.tool-card--rs {
  --c-300: var(--rs-300);
  --c-500: var(--rs-500);
}

.tool-card--fm {
  --c-300: var(--fm-300);
  --c-500: var(--fm-500);
}

.tool-card--cc {
  --c-300: var(--cc-300);
  --c-500: var(--cc-500);
}

.tool-card--planned {
  grid-column: 1 / -1;
  border-style: dashed;
  background: transparent;
  box-shadow: none;
}

.tool-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.tool-card__status {
  padding: 2px 12px;
  border-radius: 999px;
  background: rgb(var(--c-500) / 0.15);
  color: rgb(var(--c-300));
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.6;
}

.tool-card h3 {
  margin: 24px 0 0;
  padding: 0;
  border: 0;
  color: rgb(var(--fez-50));
  font-size: 1.6rem;
  font-weight: 600;
  line-height: 1.3;
}

.tool-card--planned h3 {
  margin-top: 16px;
  font-size: 1.3rem;
}

.tool-card__domain {
  margin: 4px 0 0;
  color: rgb(var(--c-300));
  font-size: 0.875rem;
  line-height: 1.5;
}

.tool-card__summary {
  flex: 1;
  margin: 16px 0 0;
  color: var(--vp-c-text-2);
  font-size: 0.94rem;
  line-height: 1.65;
}

.tool-card__links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
}

.tool-card__link {
  display: inline-flex;
  align-items: center;
  padding: 8px 18px;
  border: 1px solid var(--border-glass-strong);
  border-radius: 999px;
  color: rgb(var(--fez-100));
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.tool-card__link:hover {
  border-color: rgb(var(--fez-400));
  color: rgb(var(--fez-50));
}

/* Tool-colored CTA, only inside that tool's own card. */
.tool-card__link--primary {
  border-color: transparent;
  background: rgb(var(--c-500));
  color: rgb(var(--on-tool));
}

.tool-card__link--primary:hover {
  border-color: transparent;
  background: rgb(var(--c-500) / 0.85);
  color: rgb(var(--on-tool));
}

@media (max-width: 719px) {
  .tool-cards {
    grid-template-columns: 1fr;
  }

  .tool-card {
    padding: 22px;
  }
}
</style>
