<script setup lang="ts">
import { computed, ref } from "vue";
import { data } from "../releases.data";

const props = withDefaults(
  defineProps<{
    packageName?: string;
    pageSize?: number;
  }>(),
  {
    packageName: "fezrs",
    pageSize: 8,
  }
);

// Loaded at build time (releases.data.ts), so every row is in the HTML; paging
// only hides rows.
const pkg = computed(() => data[props.packageName]);
const releases = computed(() => pkg.value?.releases ?? []);
const currentPage = ref(1);

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(releases.value.length / props.pageSize));
});

const shownRange = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize + 1;
  const end = Math.min(currentPage.value * props.pageSize, releases.value.length);
  return `${start}-${end} of ${releases.value.length} releases`;
});

function isOnPage(index: number) {
  return Math.floor(index / props.pageSize) + 1 === currentPage.value;
}

// UTC, so the build and the browser format the same date.
function formatDate(value: string | null) {
  if (!value) {
    return "No upload date";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function goToPage(page: number) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value);
}
</script>

<template>
  <section class="pypi-releases" aria-live="polite">
    <div class="release-header">
      <h2>PyPI Release Versions</h2>
      <p>
        Release history of
        <a :href="`https://pypi.org/project/${packageName}/#history`" target="_blank" rel="noopener">
          {{ packageName }}
        </a>
        on PyPI<template v-if="pkg">, as of {{ formatDate(pkg.fetchedAt) }}</template>.
        <template v-if="pkg?.requiresPython">Requires Python {{ pkg.requiresPython }}.</template>
      </p>
    </div>

    <div v-if="!releases.length" class="release-state is-error">
      PyPI release data was not available when this page was built. See the
      <a :href="`https://pypi.org/project/${packageName}/#history`" target="_blank" rel="noopener">release history on PyPI</a>.
    </div>

    <template v-else>
      <div class="release-summary">{{ shownRange }}</div>

      <div class="release-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Version</th>
              <th>Uploaded</th>
              <th>Files</th>
              <th>Package Types</th>
              <th>Python</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(release, index) in releases" v-show="isOnPage(index)" :key="release.version">
              <td>
                <a
                  :href="`https://pypi.org/project/${packageName}/${release.version}/`"
                  target="_blank"
                  rel="noopener"
                >
                  {{ release.version }}
                </a>
              </td>
              <td>{{ formatDate(release.uploadedAt) }}</td>
              <td>{{ release.fileCount }}</td>
              <td>{{ release.fileTypes }}</td>
              <td>{{ release.pythonVersions }}</td>
              <td>
                <span class="status-pill" :class="{ 'is-yanked': release.yanked }">
                  {{ release.yanked ? "Yanked" : "Available" }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav v-if="totalPages > 1" class="pagination" aria-label="PyPI release pages">
        <button type="button" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
          Previous
        </button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button
          type="button"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          Next
        </button>
      </nav>
    </template>
  </section>
</template>

<style scoped>
.pypi-releases {
  margin: 32px 0;
  padding: 20px;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg);
}

.release-header {
  margin-bottom: 16px;
}

.release-header h2 {
  margin: 0 0 4px;
  border: 0;
  padding: 0;
}

.release-header p {
  margin: 0;
  color: var(--vp-c-text-2);
}

.pagination button {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  font: inherit;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.release-state {
  padding: 16px;
  border-radius: 6px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
}

.release-state.is-error {
  color: var(--vp-c-danger-1);
}

.release-state a {
  color: inherit;
}

.release-summary {
  margin-bottom: 8px;
  color: var(--vp-c-text-2);
  font-size: 0.9em;
}

.release-table-wrap {
  overflow-x: auto;
}

.release-table-wrap table {
  width: 100%;
  margin: 0;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
  font-size: 0.85em;
  font-weight: 700;
}

.status-pill.is-yanked {
  color: var(--vp-c-danger-1);
}

.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  .pagination {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
