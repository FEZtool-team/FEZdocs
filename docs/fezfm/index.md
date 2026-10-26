# FEZfm

FEZfm is the fault and geohazard monitoring tool of FEZtool. Version 1 is an earthquake monitor: every 30 minutes it collects reports from USGS and EMSC, merges reports of the same quake, stores them in DuckDB, and publishes a feed, a map and downloadable data to GitHub Pages. It needs no server.

FEZfm builds on Faultiuo, a monitor for 21 active fault zones in Iran by Fariba Khosravani and Mahdi Farmahini Farahani.

<dl class="fact-grid">
  <div>
    <dt>Sources</dt>
    <dd>USGS and EMSC, worldwide. IRSC for Iran, off by default.</dd>
  </div>
  <div>
    <dt>Updates</dt>
    <dd>Every 30 minutes, by a scheduled GitHub Actions workflow</dd>
  </div>
  <div>
    <dt>Data</dt>
    <dd>Event feed, Atom feed, CSV, GeoJSON, Parquet and the full DuckDB file</dd>
  </div>
  <div>
    <dt>License</dt>
    <dd>Code under Apache-2.0, documentation under CC BY 4.0</dd>
  </div>
</dl>

- [Open the monitor](https://fezfm.feztool.com/)
- [FEZfm on GitHub](https://github.com/FEZtool-team/FEZfm)

::: warning Not a warning service
FEZfm is a research tool, not an official earthquake warning service. Data are 30 to 45 minutes behind real time. Use your national seismological agency for warnings.
:::

---

## The monitor

The site has five pages:

| Page | What it shows |
|---|---|
| Feed | Recent earthquakes as a list next to a map, with daily counts and source status. Filters for time window, country, minimum magnitude, depth, event type and reporting source. |
| Map | A full-screen map of the same events. Layers for the monitored fault zones, plate boundaries, active faults (GEM) and GEBCO shaded relief can be switched on and off. |
| Archive | Every stored event, one calendar month at a time, with a CSV file per month. |
| Data | Download links for each time window and format, the Atom feed, the map layers and the full database. |
| About | Sources, method, flags and limits. |

The map uses Leaflet on a canvas with a self-hosted Natural Earth basemap. Every map layer is served by the site itself, so the map works without a tile service, including from networks where common tile providers are blocked. The world view is centred on the Pacific.

The site follows the system light or dark setting and can be switched from the navbar.

---

## Sources

| Source | Coverage | How |
|---|---|---|
| USGS, United States Geological Survey | Worldwide | FDSN event service at earthquake.usgs.gov |
| EMSC, European-Mediterranean Seismological Centre | Worldwide; also relays Iranian agencies | FDSN event service at seismicportal.eu |
| IRSC, Iranian Seismological Center (Institute of Geophysics, University of Tehran) | Iran and adjacent areas, M2.5+ | Off by default, see [IRSC](#irsc) |

All events in Iran and adjacent areas are kept; elsewhere, M2.5 and above. The Iran region is IRSC's box: latitude 24 to 41, longitude 42 to 64.

Each event is tagged with its country, or the nearest country within about 150 km for offshore events. The site's country filter uses this tag.

### IRSC

IRSC is not collected by default. irsc.ut.ac.ir cannot be reached from outside Iran, so GitHub's runners time out on it. Iranian events come from EMSC, which relays Iranian agencies, and from USGS. These list fewer small events than IRSC: in one week of October 2026, IRSC listed 44 events in the Iran region and EMSC and USGS together 11.

IRSC events collected earlier stay in the database. The IRSC source still works from a machine inside Iran:

```bash
uv run fezfm --db irsc.duckdb collect --source irsc
```

The scheduled collector can then merge that file with `fezfm collect --snapshot irsc.duckdb`. Sources that the snapshot ran in the last 2 hours are not fetched again.

---

## How it works

```text
Monitor workflow, GitHub Actions (every 30 min)
  ├─ download fezfm.duckdb from the "data-latest" release
  ├─ fezfm collect     fetch the last 2 days from USGS and EMSC
  │                    (one failing source never stops the other)
  │                    merge reports of the same quake
  │                    tag fault zones, significant events, active sequences
  ├─ upload fezfm.duckdb back to the release
  ├─ fezfm export      web/public/data: latest.json, feed.xml,
  │                    CSV / GeoJSON / Parquet downloads, monthly archive
  └─ nuxt generate  →  GitHub Pages
```

1. Every 30 minutes a GitHub Actions job requests the last two days from each source. Re-reading two days picks up late reports and revised magnitudes and locations.
2. Reports are stored in DuckDB, one row per source and event (`raw_events`).
3. Reports from different sources are merged into one event (`events`). Events from the last 14 days are rebuilt on each run; older events are frozen.
4. Each event is tagged with its country, checked against the monitored fault zones, and flagged as significant or part of an active sequence.
5. The site, the Atom feed and the download files are rebuilt and published to GitHub Pages.

### Merging

Two reports are the same earthquake when they are within **45 seconds**, **80 km** and **1 magnitude unit** of each other.

The merged event takes its location, depth and magnitude from one preferred source:

| Where | Preference |
|---|---|
| Outside the Iran region | USGS, then EMSC, then IRSC |
| Inside the Iran region | IRSC, then USGS, then EMSC |

This is the same priority Faultiuo uses. The `sources` column lists every source that reported the event.

---

## Flags

| Flag | Rule |
|---|---|
| Significant | M5 or larger anywhere, or M4 or larger in the Iran region |
| Active sequence | At least 5 events within 25 km in 6 hours. This covers aftershock sequences and swarms alike. |
| Fault zone | The epicentre lies inside the buffer of one of the 21 zones Faultiuo monitors |

### Monitored fault zones

Avaj, Bam-Ravar, Damavand, Dehshir, Ipak, Kazeroon, Kerman, Kopedagh, Kuhbanan, NE-Lut, Neyshabur, Qom, Sabzvar, Seimare, Semnan, Shahrud, Tehran, Turkmanchay, Van-Tabriz, West-Lut and Zagros.

Each buffer has a half-width of 20 km, except Kopedagh (40 km), Seimare and Zagros (50 km).

The zone traces are approximate until Faultiuo's KML files are added. With those files, one command replaces them and clears the "approximate" note on the site:

```bash
cd collector
uv run fezfm import-kml ~/GMTdata/KML/Time_Section
```

---

## Data and downloads

Every file is rebuilt each time the collector runs. Times are UTC. One row is one earthquake after merging.

| File | Contents |
|---|---|
| `data/downloads/events_{2h,24h,7d,30d}.{csv,geojson,parquet}` | Events in each time window |
| `data/archive/YYYY-MM.csv` and `.json` | Every stored event, one file per calendar month |
| `data/latest.json` | The last 7 days as used by the site, with daily counts and source status |
| `data/feed.xml` | Atom feed: significant events, active sequences, and M3.5+ in the Iran region |
| `data/fault_zones.geojson` | The 21 monitored zones and their buffer widths |
| `layers/gem_active_faults.geojson` | GEM active faults worldwide, simplified |
| `layers/plate_boundaries.geojson` | Plate boundaries from Bird (2003), PB2002 |
| `fezfm.duckdb` | The full database, attached to the repository's `data-latest` release |

Paths are relative to the monitor's address, `https://fezfm.feztool.com/`.

### Columns

| Column | Meaning |
|---|---|
| `event_id` | Preferred source and its event id, e.g. `irsc:213507` |
| `time_utc` | Origin time, UTC |
| `lat`, `lon` | Epicentre, degrees |
| `depth_km` | Hypocentre depth, km |
| `mag`, `mag_type` | Magnitude and its type as reported by the preferred source |
| `place` | Location description from the preferred source |
| `country` | Country of the epicentre, or the nearest within about 150 km offshore (GeoJSON and site data only) |
| `preferred_source` | The source the event's values come from |
| `sources` | Every source that reported the event |
| `in_iran_region` | Inside IRSC's box for Iran and adjacent areas |
| `fault_zone` | Monitored fault zone whose buffer contains the epicentre, if any |
| `fault_distance_km` | Distance from the zone trace |
| `significant` | M5+ worldwide, or M4+ in the Iran region |
| `sequence` | 5 or more events within 25 km in the 6 hours up to this event |

### The database

`fezfm.duckdb` has three tables: raw reports from each source (`raw_events`), merged events (`events`) and the collector log (`source_runs`).

```sql
-- duckdb fezfm.duckdb
SELECT time_utc, mag, place, sources
FROM events
WHERE in_iran_region
ORDER BY time_utc DESC
LIMIT 20;
```

The Parquet files can be read directly from Python:

```python
import pandas as pd

url = "https://fezfm.feztool.com/data/downloads/events_7d.parquet"
events = pd.read_parquet(url)
print(events[events["significant"]][["time_utc", "mag", "place"]])
```

---

## Run locally

The repository has two parts:

| Folder | Contents |
|---|---|
| `collector/` | Python 3.12 package `fezfm` (DuckDB, httpx, shapely), tests in `collector/tests` |
| `web/` | Nuxt 3 static site with the FEZhome design tokens and a Leaflet map |

### Collector

The collector needs [uv](https://docs.astral.sh/uv/).

```bash
cd collector
uv run pytest -q
uv run fezfm backfill --days 7      # creates fezfm.duckdb
uv run fezfm collect                # what the schedule runs
uv run fezfm export                 # writes ../web/public/data
```

| Command | What it does |
|---|---|
| `fezfm collect` | Fetch the last 2 days from every source and rebuild events. `--source` limits it to one source; `--snapshot FILE` first merges a database from another collector. |
| `fezfm backfill --days N` | Seed history, 30 days by default. |
| `fezfm export` | Write the site data files. `--out`, `--site-url` and `--db-url` set the output folder and the public addresses. |
| `fezfm import-kml DIR` | Replace the approximate zone traces with Faultiuo KML files. |

Every command takes `--db FILE` to choose the DuckDB file (default `fezfm.duckdb`).

### Site

```bash
cd web
npm install
npm run dev                         # http://localhost:3036
```

---

## Publish on GitHub Pages

1. Push to `main` on GitHub. The repository must be public for free, unlimited Actions minutes.
2. Under **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Under **Actions → Monitor**, choose **Run workflow**. The first run backfills 30 days, creates the `data-latest` release and deploys the site to GitHub Pages.

The FEZtool deployment is served from the custom domain `fezfm.feztool.com`, so the workflow builds the site for the root path (`NUXT_APP_BASE_URL="/"`). A copy published at `https://<owner>.github.io/FEZfm/` without a custom domain needs `NUXT_APP_BASE_URL="/FEZfm/"` instead.

After that the schedule runs every 30 minutes. GitHub may start scheduled runs late, and it pauses schedules in repositories with no activity for 60 days; the workflow re-enables itself on each run to prevent that.

---

## Limits

- Data are 30 to 45 minutes behind real time, and GitHub can delay scheduled runs further.
- Outside the Iran region only M2.5 and above are kept, so small events elsewhere are not shown.
- Magnitudes of different types (ML, mb, Mw) are shown as reported and are not converted.
- Fault zone traces are approximate until Faultiuo's KML files are added.
- Without IRSC, fewer small events are listed in Iran.

---

## Credits and license

- Earthquake reports: USGS and EMSC; earlier events also from IRSC (Institute of Geophysics, University of Tehran).
- Active faults: [GEM Global Active Faults Database](https://github.com/GEMScienceTools/gem-global-active-faults), CC BY-SA 4.0.
- Plate boundaries: Bird (2003), [PB2002](https://github.com/fraxen/tectonicplates), ODC-BY 1.0.
- Relief: [GEBCO Grid](https://www.gebco.net/) shaded relief, GEBCO Compilation Group.
- Country outlines: [Natural Earth](https://www.naturalearthdata.com/), public domain.

When you use the data, credit the original agencies and FEZfm.

FEZfm code is released under the Apache License 2.0 and its documentation under CC BY 4.0.
