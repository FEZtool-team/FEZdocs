# Mosaic

### 1. Introduction

This module provides the ability to **merge multiple satellite images** (with georeferencing) into a single image in a unified coordinate system. The output is a single GeoTIFF file that can serve as input for any other FEZrs tool, enabling seamless regional or large‑area analyses.

**Existing Classes :**

|Class Name|Application|
|---|---|
|`MosaicCalculator`|Merges multiple GeoTIFF images (that share the same CRS) into a single mosaicked raster.|

**Important note regarding `__init__.py`:** 

The current `__init__.py` exports `BaseTool` by mistake. For the module to work correctly, it must be changed to:
```python
from .mosaic_calculator import MosaicCalculator
```
	
---

### 2. `MosaicCalculator` – Image Mosaicking

#### 2.1 Scientific Objective

Create a continuous, seamless image from several separate scenes that together cover a larger geographic area. This process is essential for regional analyses, the production of wall‑to‑wall maps, and the removal of artificial boundaries between adjacent satellite swaths.

#### 2.2 Full Explanation of the Mosaicking Algorithm and Coordinate Transformations

Mosaicking in the geospatial domain is more than just pasting images side by side; it requires precise alignment of every pixel to a common coordinate reference system (CRS) and a unified pixel grid. The `MosaicCalculator` uses `rasterio.merge.merge` to perform this task. The underlying mathematics are detailed below.

**1. Affine georeferencing of each input image**

Each input GeoTIFF is accompanied by an **affine transformation matrix** that maps pixel coordinates (row $r$, column $c$) to real‑world coordinates (e.g., UTM easting $x$, northing $y$) :

$$\begin{bmatrix}
x \\
y \\
1
\end{bmatrix}
=
\begin{bmatrix}
a & b & c \\
d & e & f \\
0 & 0 & 1
\end{bmatrix}
\begin{bmatrix}
c \\
r \\
1
\end{bmatrix}$$

where :

- $a$ = pixel width (size in $x$ direction),
    
- $e$ = pixel height (usually negative for north‑up images, so e<0e<0),
    
- $b,d$ = rotation/shear terms (zero for north‑up images),
    
- $c$ = $x$ coordinate of the centre of the upper‑left pixel,
    
- $f$ = $y$ coordinate of the centre of the upper‑left pixel.


For every pixel, this affine allows computing its exact geographic footprint.

**2. Determination of the output extent and pixel grid**

When multiple images are merged, the output must cover the **union** of all input extents. For each input image $I_k$​ with bounding box ($x_{\min}^k, \; y_{\min}^k, \; x_{\max}^k, \; y_{\max}^k$​), the output bounding box is :

$$x_{\text{min}}^{\text{out}} = \min_k(x_{\text{min}}^k), \quad y_{\text{min}}^{\text{out}} = \min_k(y_{\text{min}}^k)$$
$$x_{max}^{out} = \max_k(x_{max}^k), \quad y_{max}^{out} = \max_k(y_{max}^k)$$
The output pixel resolution is normally taken from the first image in the list (the `merge` function retains the georeferencing parameters of the first dataset by default). The output affine transform is then constructed such that :

$$a^{\text{out}} = a^1, \quad e^{\text{out}} = e^1, \quad b^{\text{out}} = b^1, \quad d^{\text{out}} = d^1$$
$$c^{\text{out}} = x_{min}^{\text{out}} + \frac{a_{\text{out}}^{\text{out}}}{2}, \quad f^{\text{out}} = y_{max}^{\text{out}} - \frac{|e_{\text{out}}^{\text{out}}|}{2}$$
(assuming $e$ is negative; the exact corner handling follows GDAL conventions). The output raster dimensions (width WoutWout, height HoutHout) are then :

$$W^{out} = \left| \frac{x_{max}^{out} - x_{min}^{out}}{a_{out}} \right|, \quad H^{out} = \left| \frac{y_{max}^{out} - y_{min}^{out}}{e_{out}} \right|$$

**3. Placing input pixels onto the output grid**

For each input image, `rasterio.merge` computes, for every output pixel ($c^{out},r^{out}$), its corresponding geographic coordinates using the output affine, then applies the **inverse affine** of the input image to find the source pixel coordinates :

$$\begin{bmatrix}
c_{in} \\
r_{in}
\end{bmatrix}
= \text{Affine}_{in}^{-1}
\left( \text{Affine}_{out}
\begin{bmatrix}
c_{out} \\
r_{out} \\
1
\end{bmatrix} \right)
$$

If the computed source coordinates fall within the valid extent of the input image, the pixel value is read (with nearest‑neighbour interpolation by default, unless a resampling method is specified) and written to the output.

**4. Handling overlapping areas**

In regions where two or more input images overlap, a decision rule must be applied. The code calls `merge` **without** a `method` argument, which means the default behaviour is **“first”**: the pixel value from the first dataset in the list that covers that location is used. Subsequent overlapping pixels are ignored.

Formally, the algorithm iterates over the input images in the given order; for each output pixel location, the first image that has a valid (non‑nodata) pixel at that position supplies the value. This is equivalent to :

$$output(x, y) = I_{k^*}(x, y) \quad \text{where } k^* = \min\{k \mid I_k \text{ is valid at } (x, y)\}$$

Alternative merging methods (e.g., taking the minimum, maximum, mean, or a colour‑balancing blend) can be enabled by passing the `method` parameter to `merge`. Future versions of FEZrs could expose this choice.

**5. Metadata finalization**

After the pixel arrays are assembled, the metadata dictionary is updated with :

- `driver` : `"GTiff"` (GeoTIFF),
    
- `height` and `width` : computed as above,
    
- `transform` : the new output affine matrix,
    
- `crs` : taken from the first input image (all inputs _must_ share this CRS; otherwise `merge` reprojects on‑the‑fly, which may introduce undesired resampling).


The resulting `mimg` array has shape `(bands, H, W)`, and the metadata allows direct writing to a new GeoTIFF file with full georeferencing.

**Input parameters (`__init__`) :**

|Parameter|Type|Description|
|---|---|---|
|`tif_paths`|`List[str or Path]`|A list of paths to the GeoTIFF files to be mosaicked. All images **must** be in the same coordinate reference system to avoid reprojection.|

**`process` method :**

- Uses `rasterio.merge.merge` to combine the images.
    
- Extracts and updates the metadata (`transform`, `width`, `height`, `crs`) from the first input image.
    
- Stores the merged array in `self.mosaic_mimg` and the metadata in `self.mosaic_meta`.


**`_export_file` method (custom override) :**  
Unlike other tools that only save a PNG, this method :

- Writes a complete **GeoTIFF** file with full georeferencing to the output directory.
    
- Generates a **PNG** preview for quick visual inspection.
    
- Names the files automatically using the prefix `Mosaic_` and a unique identifier (UUID).


**Return value (`execute`) :**

- The path of the saved GeoTIFF file is stored in `self._output`, enabling chained processing.


**Usage example :**
```python
from pathlib import Path
from fezrs.tools.mosaic import MosaicCalculator

tiles = [
    "path/to/tile_01.tif",
    "path/to/tile_02.tif",
    "path/to/tile_03.tif"
]

calc = MosaicCalculator(tif_paths=tiles)
result_tif = calc.execute(output_path="./mosaic_output/")
print(f"Mosaic saved at: {result_tif}")
```

---

### 3. Technical Notes and Requirements

- **Consistent CRS :** All input images must have the same projection. If they differ, `rasterio.merge` will automatically reproject them to the CRS of the first image, which may lead to spatial shifts or interpolation artefacts. It is strongly recommended to pre‑process the images with `rio warp` to a common CRS and resolution before mosaicking.
    
- **Overlap handling :** In overlapping areas the pixel from the image appearing first in the list is kept (the `"first"` method). For more sophisticated blending (e.g., feathering, averaging), the `method` parameter of `merge` must be explicitly set.
    
- **Memory consumption :** The entire mosaic is held in memory as a NumPy array (`self.mosaic_mimg`). For very large regions (e.g., country‑scale at high resolution), this can exceed available RAM. In such cases, windowed or tiled processing with `rasterio` would be needed.
    
- **No direct visualisation :** The `execute` method does not display the image interactively; it only writes files. This avoids loading large rasters into the graphics backend and ensures server compatibility.
    
- **Dependency :** This module requires the `rasterio` library, which is standard in most remote sensing Python environments.

---

### 4. Suggestions for Development

- **Exposed `method` parameter :** Add an optional `method` argument to the calculator (e.g., `"first"`, `"last"`, `"min"`, `"max"`, `"mean"`, `"sum"`) to control how overlapping regions are combined.
    
- **COG (Cloud Optimized GeoTIFF) support :** While COG files can be read, the current implementation does not exploit their ability to read only partial regions. Future versions could implement lazy mosaicking for massive datasets.
    
- **Fix the `__init__.py` bug :** Correct the import statement to export `MosaicCalculator` instead of `BaseTool`.