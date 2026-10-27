// PyPI release history, fetched once per build so the release list is in the
// page HTML. The site is rebuilt on every push to main, which keeps it current.
// .mts like config.mts: package.json is CommonJS and vitepress is ESM-only.
import { defineLoader } from "vitepress";

// Packages that <PyPIReleases package-name="..."> can show.
const packages = ["fezrs"];

type PyPIFile = {
  packagetype?: string;
  python_version?: string;
  upload_time_iso_8601?: string;
  yanked?: boolean;
};

type PyPIResponse = {
  info: { requires_python?: string | null };
  releases: Record<string, PyPIFile[]>;
};

export type Release = {
  version: string;
  uploadedAt: string | null;
  fileCount: number;
  fileTypes: string;
  pythonVersions: string;
  yanked: boolean;
};

export type PackageReleases = {
  releases: Release[];
  requiresPython: string | null;
  fetchedAt: string;
  error?: string;
};

declare const data: Record<string, PackageReleases>;
export { data };

function uniqueValues(files: PyPIFile[], key: "packagetype" | "python_version") {
  const values = files.map((file) => file[key]).filter((value): value is string => Boolean(value));
  return [...new Set(values)].join(", ") || "-";
}

function latestUpload(files: PyPIFile[]) {
  const timestamps = files
    .map((file) => Date.parse(file.upload_time_iso_8601 ?? ""))
    .filter((value) => !Number.isNaN(value));
  return timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null;
}

function mapReleases(data: PyPIResponse): Release[] {
  return Object.entries(data.releases)
    .map(([version, files]) => ({
      version,
      uploadedAt: latestUpload(files),
      fileCount: files.length,
      fileTypes: uniqueValues(files, "packagetype"),
      pythonVersions: uniqueValues(files, "python_version"),
      yanked: files.some((file) => file.yanked),
    }))
    .sort((a, b) => Date.parse(b.uploadedAt ?? "0") - Date.parse(a.uploadedAt ?? "0"));
}

async function loadPackage(name: string): Promise<PackageReleases> {
  const fetchedAt = new Date().toISOString();
  try {
    const response = await fetch(`https://pypi.org/pypi/${name}/json`);
    if (!response.ok) throw new Error(`PyPI returned ${response.status}`);
    const json = (await response.json()) as PyPIResponse;
    return { releases: mapReleases(json), requiresPython: json.info.requires_python ?? null, fetchedAt };
  } catch (error) {
    // Don't fail the deploy over PyPI; the component links to PyPI instead.
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[releases.data] ${name}: ${message}`);
    return { releases: [], requiresPython: null, fetchedAt, error: message };
  }
}

export default defineLoader({
  async load() {
    const entries = await Promise.all(packages.map(async (name) => [name, await loadPackage(name)] as const));
    return Object.fromEntries(entries);
  },
});
