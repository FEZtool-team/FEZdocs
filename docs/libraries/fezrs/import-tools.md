# Import Tools

### 1. Introduction

This module is responsible for **extracting and preparing specific bands** from raw satellite imagery. It serves as the entry point of the FEZrs processing chain: users can either load a single multi‑band file (e.g., a GeoEye scene) and pick one band via an index, or supply the individual bands of Landsat 8 (or similar sensors) to construct standard colour composites for visualisation or further analysis.

**Existing Classes :**

|Class Name|Application|
|---|---|
|`Geoeye_Calculator`|Extract a single band from a multi‑band GeoTIFF image (e.g., GeoEye, WorldView, or any stacked raster).|
|`Landsat8_Calculator`|Build standard colour composites – natural RGB, normalised true colour, or false‑colour infrared – from separate Landsat 8 band files.|

---

### 2. Detailed Documentation of Each Class

#### 2.1. `Geoeye_Calculator` – Extract a Band from a Multi‑band Image

**Purpose**  
High‑resolution satellite images (GeoEye, WorldView, etc.) are often distributed as a **single multi‑band GeoTIFF** containing several spectral channels (e.g., Panchromatic, Blue, Green, Red, NIR). This class loads such a file and extracts **one specific band** chosen by its zero‑based index, returning it as a normalised floating‑point array ready for display or further processing.

**Full Explanation of the Mathematical Operations**

- **Data loading and normalisation :**  
    The method `self.files_handler.get_normalized_bands(requested_bands=["tif"])` reads the GeoTIFF and normalises all pixels of **every band** to the range $[0,1]$. The normalisation formula is a simple linear rescaling :
    
    $$I_{\text{norm}}(x, y, b) = \frac{I_{\text{raw}}(x, y, b)}{2^{\text{bits}} - 1}$$
    
    where $b$ is the band index and $bits$ is the radiometric resolution of the sensor (e.g., 8, 11, or 16 bits). This conversion is performed internally by `skimage.img_as_float` (or equivalent). After normalisation, the data type is `float64`, and the full dynamic range of the sensor is preserved linearly.
    
- **Band extraction :**  
    The normalised data cube has shape ($H,W,N_{bands}$​). The requested band at index `level` is extracted by simple array slicing :
    
    $$\text{output} = I_{\text{norm}}[:, :, \text{level]}$$
    
    This yields a 2D array of intensity values in $[0,1]$. No additional mathematical transformation is applied; the band is provided exactly as measured by the sensor, only scaled.
    
- **Validation (`_validate`):**  
    The number of bands $N_{bands}$​ is obtained from `I_{\text{norm}}.shape[2]`. The method checks that the requested `level` satisfies $0≤\text{level}<N_{bands}$​. If not, a `ValueError` is raised, preventing out‑of‑range access.
    

**Input parameters (`__init__`) :**

| Parameter  | Type            | Default  | Description                                                              |
| ---------- | --------------- | -------- | ------------------------------------------------------------------------ |
| `tif_path` | `str` or `Path` | required | Path to the multi‑band GeoTIFF file.                                     |
| `level`    | `int`           | `0`      | Zero‑based index of the desired band. `0` corresponds to the first band. |

**Return value :**  
A 2D `numpy.ndarray` of shape $(H,W)$ with float values in $[0,1]$.

**Usage example :**
```python
from fezrs.tools.import_tools import Geoeye_Calculator

# Extract the fourth band (e.g., NIR in a typical multispectral file) from a GeoEye scene
calc = Geoeye_Calculator(tif_path="geoeye_full_scene.tif", level=3)
calc.execute(output_path="./output/", title="Extracted Band 4 (NIR)", colormap="gray")
```

---
#### 2.2. `Landsat8_Calculator` – Create Landsat 8 Colour Composites

**Purpose**  
Landsat 8 and similar sensors deliver each spectral band as a separate GeoTIFF file. This class accepts paths to six key bands – Red, Green, Blue, NIR, SWIR1, and SWIR2 – and assembles a three‑channel image (composite) according to the user’s choice. The result can be a natural‑colour view (RGB), a contrast‑enhanced true colour, or a false‑colour infrared composite widely used for vegetation and moisture analysis.

**Full Explanation of the Mathematical Operations**

- **Data normalisation (optional):**  
    Depending on the `exportType`, the class either uses the raw digital numbers (DN) directly from `self.files_handler.bands` or calls `get_normalized_bands` to obtain values scaled to $[0,1]$. The normalisation formula is the same as above :
    
    $$I_{\text{norm}} = \frac{I_{\text{raw}}}{2^{\text{bits}} - 1}$$
    
    In the `"raw"` case (when `exportType` is `None`), the bands remain in their original integer DN (often 16‑bit integers). While this preserves the original sensor output, visualisation tools like `matplotlib` may automatically scale the display range; for precise interpretation, it is recommended to use the normalised versions.
    
- **Band assignment and stacking :**  
    Three bands are selected according to the `exportType` :
    
|`exportType`|Red channel (R)|Green channel (G)|Blue channel (B)|Physical meaning|
|---|---|---|---|---|
|`None` (raw)|Red (Band 4)|Green (Band 3)|Blue (Band 2)|Un‑normalised true colour; direct DN values.|
|`"rgb"`|Red (normalised)|Green (normalised)|Blue (normalised)|True colour with enhanced contrast, suitable for human viewing.|
|`"infrared"`|SWIR2 (Band 7)|SWIR1 (Band 6)|NIR (Band 5)|False‑colour infrared: highlights moisture, active vegetation, and burned areas.|
    The three selected 2D arrays are stacked into a 3‑band cube using NumPy’s `np.stack` along `axis=2` :
    
    $$output = np.stack([R, G, B], axis = 2)$$
    
This operation takes three arrays of shape $(H,W)$ and produces a single array of shape $(H,W,3)$, where the third dimension indexes the red, green, and blue colour channels. This is the standard memory layout expected by imaging libraries and colour‑display functions.
    
Mathematically, the pixel at location (x,y)(x,y) in the output is the vector :
    
    $$\vec{P}(x, y) = 
\begin{bmatrix}
R(x, y) \\
G(x, y) \\
B(x, y)
\end{bmatrix}$$​
	
	
- **Spectral rationale for the infrared composite :**  
    In the `"infrared"` mode, the assignment SWIR2→R, SWIR1→G, NIR→B is not arbitrary :
    
    - **SWIR2** (≈2.2 µm) is sensitive to mineral content and moisture; burned areas and bare soil reflect strongly in SWIR2, so they appear red in the composite.
        
    - **SWIR1** (≈1.6 µm) also responds to moisture and vegetation structure; it is slightly greener in the composite.
        
    - **NIR** (≈0.85 µm) is strongly reflected by healthy vegetation and appears blue in the composite.
    
    Healthy vegetation therefore appears in shades of **cyan** (low red, moderate green, high blue), while burned scars appear **red** (high SWIR2, low NIR). This decomposition allows the analyst to easily differentiate surface types.
    
- **Validation (`_validate`) :**  
    Currently empty, but future versions should check that all six bands have identical spatial dimensions (height, width, and geotransform) to ensure proper stacking. Mismatched arrays would cause `np.stack` to raise an error.


**Input parameters :**

|Parameter|Type|Description|
|---|---|---|
|`red_path`|`Path`|Path to the Red band (Landsat 8 Band 4).|
|`green_path`|`Path`|Path to the Green band (Band 3).|
|`blue_path`|`Path`|Path to the Blue band (Band 2).|
|`nir_path`|`Path`|Path to the Near‑Infrared band (Band 5).|
|`swir1_path`|`Path`|Path to the SWIR1 band (Band 6).|
|`swir2_path`|`Path`|Path to the SWIR2 band (Band 7).|
|`exportType`|`Literal[None, "rgb", "infrared"]`|Composite type. `None` = raw DN true colour; `"rgb"` = normalised true colour; `"infrared"` = false‑colour IR.|

**Return value :**  
A 3‑band `numpy.ndarray` of shape (H,W,3)(H,W,3). Data type is integer (uint16) when `exportType=None`, and float when `"rgb"` or `"infrared"`.

**Usage example :**
```python
from fezrs.tools.import_tools import Landsat8_Calculator

# Create a false‑colour infrared composite for burn mapping
calc = Landsat8_Calculator(
    red_path="LC08_B4.tif",
    green_path="LC08_B3.tif",
    blue_path="LC08_B2.tif",
    nir_path="LC08_B5.tif",
    swir1_path="LC08_B6.tif",
    swir2_path="LC08_B7.tif",
    exportType="infrared"
)
calc.execute(output_path="./output/", title="False Color Infrared (SWIR2-SWIR1-NIR)")
```

---

### 3. Technical Notes and Suggestions

- **File format :** Both classes rely on `rasterio` (through `files_handler`) to read GeoTIFF data. Input files must be valid GeoTIFFs; other raster formats are not yet supported.
    
- **Normalisation in `Geoeye_Calculator` :** The `get_normalized_bands` method always scales the data to $[0,1]$. If the original radiance or reflectance values are needed (e.g., for quantitative analysis), the current implementation cannot provide them. Adding a `normalize=False` parameter would be a useful enhancement.
    
- **Dimension check in `Landsat8_Calculator `:** The `_validate` method is presently empty. It is strongly recommended to add a check that all six input bands share the same spatial dimensions and coordinate reference system. Without this, `np.stack` will fail with a cryptic error if arrays are not aligned.
    
- **Compatibility with other sensors :** Although named `Landsat8_Calculator`, the logic works with any sensor that provides similar bands (e.g., Sentinel‑2 with bands B4, B3, B2, B8, B11, B12). The class simply maps band paths to RGB channels; the user must ensure the spectral meaning matches the intended composite.
    
- **Default fail‑safe :** If an unsupported `exportType` string is supplied, the `match` statement falls back to the raw RGB composite (`_` case). This prevents crashes but may cause confusion. A warning could be logged in future versions.