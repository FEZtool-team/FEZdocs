<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

type PyPIFile = {
  filename?: string;
  packagetype?: string;
  python_version?: string;
  upload_time_iso_8601?: string;
  yanked?: boolean;
};

type PyPIResponse = {
  releases: Record<string, PyPIFile[]>;
};

type ReleaseRow = {
  version: string;
  uploadedAt: string | null;
  fileCount: number;
  fileTypes: string;
  pythonVersions: string;
  yanked: boolean;
};

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

const releases = ref<ReleaseRow[]>([]);
const isLoading = ref(true);
const errorMessage = ref("");
const currentPage = ref(1);

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(releases.value.length / props.pageSize));
});

const visibleReleases = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize;
  return releases.value.slice(start, start + props.pageSize);
});

const shownRange = computed(() => {
  if (releases.value.length === 0) {
    return "0 releases";
  }

  const start = (currentPage.value - 1) * props.pageSize + 1;
  const end = Math.min(currentPage.value * props.pageSize, releases.value.length);
  return `${start}-${end} of ${releases.value.length} releases`;
});

function formatDate(value: string | null) {
  if (!value) {
    return "No upload date";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function uniqueValues(files: PyPIFile[], key: "packagetype" | "python_version") {
  const values = files
    .map((file) => file[key])
    .filter((value): value is string => Boolean(value));

  return [...new Set(values)].join(", ") || "-";
}

function latestUpload(files: PyPIFile[]) {
  const timestamps = files
    .map((file) => file.upload_time_iso_8601)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

function mapReleases(data: PyPIResponse) {
  return Object.entries(data.releases)
    .map(([version, files]) => ({
      version,
      uploadedAt: latestUpload(files),
      fileCount: files.length,
      fileTypes: uniqueValues(files, "packagetype"),
      pythonVersions: uniqueValues(files, "python_version"),
      yanked: files.some((file) => file.yanked),
    }))
    .sort((a, b) => {
      const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      return bTime - aTime;
    });
}

async function fetchReleases() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetch(`https://pypi.org/pypi/${props.packageName}/json`);

    if (!response.ok) {
      throw new Error(`PyPI returned ${response.status}`);
    }

    const data = (await response.json()) as PyPIResponse;
    releases.value = mapReleases(data);
    currentPage.value = 1;
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Unable to load release data.";
  } finally {
    isLoading.value = false;
  }
}

function goToPage(page: number) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value);
}

onMounted(fetchReleases);
</script>

<template>
  <section class="pypi-releases" aria-live="polite">
    <div class="release-header">
      <div>
        <h2>PyPI Release Versions</h2>
        <p>
          Live release data for
          <a :href="`https://pypi.org/project/${packageName}/#history`" target="_blank" rel="noopener">
            {{ packageName }}
          </a>
          from PyPI.
        </p>
      </div>
      <button class="refresh-button" type="button" :disabled="isLoading" @click="fetchReleases">
        {{ isLoading ? "Loading" : "Refresh" }}
      </button>
    </div>

    <div v-if="isLoading" class="release-state">Loading release versions from PyPI...</div>

    <div v-else-if="errorMessage" class="release-state is-error">
      PyPI release data could not be loaded. {{ errorMessage }}
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
            <tr v-for="release in visibleReleases" :key="release.version">
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

      <nav class="pagination" aria-label="PyPI release pages">
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
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
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

.refresh-button,
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

.refresh-button:disabled,
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
  .release-header,
  .pagination {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
