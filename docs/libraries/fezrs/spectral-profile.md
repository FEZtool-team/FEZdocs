# Spectral Profile

### 1. Introduction

This module provides the ability to calculate and plot the **average spectral signature** of a multi‑band satellite image. The spectral profile is a fundamental tool in remote sensing for characterising the dominant surface types present in a scene and for comparing the radiometric behaviour of different land‑cover classes.

**Existing Classes :**

|Class Name|Application|
|---|---|
|`SpectralProfileCalculator`|Computes the mean reflectance of each of six bands and plots a line graph of the spectral profile.|

---

<span id="spectral-profile-calculator"></span>

### 2. `SpectralProfileCalculator` – Spectral Profile

#### 2.1 Scientific Objective

Display the **mean** pixel value across the entire image for each spectral band as a line graph. The X‑axis consists of the band names, and the Y‑axis represents the arithmetic mean of all pixel values in that band. This allows a rapid visual assessment of the average spectral response – for example, a high NIR mean paired with a low Red mean indicates abundant vegetation, while a flat profile suggests bare soil or urban areas.

#### 2.2 Full Explanation of the Mathematical Operations

**Step 1: Collection of band arrays**

The constructor receives six paths (Red, Green, Blue, NIR, SWIR1, SWIR2). The `files_handler` loads each band as a 2D NumPy array of size $H×W$. The code then builds a dictionary `image_columns` containing only the bands that are not `None` :

$$\text{image\_columns} = \{ \text{band\_name} : I_{\text{band}}(x, y) \mid I_{\text{band}} \neq \text{None} \}$$

This dictionary is then converted to an ordered list `image_columns_filtered` by sequentially appending the values, while the keys are stored in `image_columns_list_of_bands`. The order depends on the order in which Python iterates over the dictionary, which in Python 3.7+ is the insertion order; the insertion order matches the order of bands in `files_handler.bands` (likely the order they were loaded). Because the bands are loaded by the `files_handler` according to the requested paths, the ordering is deterministic but should be explicitly documented.

**Step 2 : Logarithmic adjustment of the band at index 4 (fifth valid band)**

The code then performs a specific operation on the band that appears at position 4 in the filtered list (zero‑based indexing). This is the **fifth valid band** in the sequence (e.g., SWIR1 or SWIR2, depending on the loading order). The transformation applied is `exposure.adjust_log` with default parameters (`gain=1`, `inv=False`) :

$$I_{\log}(x, y) = \text{gain} \cdot \log(1 + I_{\text{original}}(x, y))$$

Because all bands have been normalised to $[0,1]$, $I_{\text{original}} \in [0,1]$. The output values lie in $[0,\log 2] \approx [0,0.693]$. This non-linear stretch enhances contrast in the darker parts of the image while compressing brighter regions.

The result of this log adjustment is assigned to `self._output`, which becomes the **return value of `process()`** and, in the current buggy state, the image that is saved by `execute()`. This behaviour is **not** the intended spectral profile and is listed as a critical bug (see Section 3).

**Step 3: Calculation of mean values for each band**

After the log‑adjustment step, the code computes the arithmetic mean of every band in `image_columns_filtered` (which still contains the original, un‑adjusted bands). For a band with pixel values $I(x,y)$, the mean is defined as :

$$\mu_{\text{band}} = \frac{1}{H \times W} \sum_{x=1}^{H} \sum_{y=1}^{W} I(x, y)$$

This is computed via `np.mean(img)`. The mean represents the average spectral reflectance (or digital number) of the scene in that band. For instance, a high mean in NIR and a low mean in Red indicates a landscape dominated by green vegetation.

**Step 4: Preparation of the line‑graph data**

Two lists are populated :

- `self.xaxis` : the band names (strings) taken from `image_columns_list_of_bands`, e.g., `["red", "green", "blue", "nir", "swir1", "swir2"]`.
    
- `self.yaxis` : the corresponding mean values `μ` for each band, in the same order.


These two lists contain the data points $(x_i,y_i)$ that will be plotted as a line graph.

**Step 5 : Plotting in `histogram_export` (currently misnamed)**

The `histogram_export` method (which, despite its name, actually creates the spectral profile plot) executes the following :

- It calls `self._validate()` and `self.process()` to obtain the x‑axis labels and y‑axis values.
    
- It creates a Matplotlib figure and axis.
    
- It plots the points :
    
    $$\texttt{ax.plot(self.xaxis, self.yaxis)}$$
    
    This draws a line connecting the band names on the X‑axis with the corresponding mean values on the Y‑axis.
    
- It adds a title, attempts to label the axes (though `ax.xlabel` and `ax.ylabel` are incorrect – see bug #3), and applies a grid.
    
- It adds the FEZrs watermark and saves the figure.


**Mathematical interpretation of the spectral profile plot**

The resulting graph is a discrete function $f(\text{band})=\mu_{\text{band}}$. The shape of the curve reveals the dominant spectral signature of the image :

- A peak in NIR with a dip in Red → vegetation.
    
- A flat, low line across all bands → water or shadow.
    
- A gradually increasing line from visible to SWIR → bare soil.
    
- A high SWIR2 and SWIR1 relative to NIR → urban or burned areas.


**Input parameters (`__init__`) :**

|Parameter|Type|Description|
|---|---|---|
|`red_path`|`Path`|Red band file|
|`green_path`|`Path`|Green band file|
|`blue_path`|`Path`|Blue band file|
|`nir_path`|`Path`|NIR band file|
|`swir1_path`|`Path`|SWIR1 band file|
|`swir2_path`|`Path`|SWIR2 band file|

**Usage example (after fixing the bugs, see Section 3) :**
```python
from fezrs.tools.spectral_profile import SpectralProfileCalculator

calc = SpectralProfileCalculator(
    red_path="B4.tif",
    green_path="B3.tif",
    blue_path="B2.tif",
    nir_path="B5.tif",
    swir1_path="B6.tif",
    swir2_path="B7.tif"
)
calc.execute(output_path="./", title="Spectral Profile")
```

---

### 3. Critical Bugs Identified (must be addressed in the final release)

|No.|Problem|Code Location|Suggested Solution|
|---|---|---|---|
|1|`execute()` saves a log‑adjusted image of the band at index 4, **not** a profile plot. The `process()` method sets `self._output` to the log‑adjusted band, so `_export_file` saves that image instead of the spectral profile.|`process()`|Either set `self._output = None` and override `_export_file` to generate a line plot, or store the line‑graph data in a different attribute.|
|2|`histogram_export()` draws a line graph (spectral profile) rather than a histogram. The method name and the plot type mismatch.|`histogram_export()`|Rename the method to `plot_profile()` or move the plotting logic to `execute()` and keep `histogram_export` for an actual histogram.|
|3|Uses `ax.xlabel()` and `ax.ylabel()` which are not valid Matplotlib axis methods (should be `ax.set_xlabel()` and `ax.set_ylabel()`). This raises an `AttributeError`.|`histogram_export()`|Correct to `ax.set_xlabel(...)` and `ax.set_ylabel(...)`.|
|4|Hard‑coded access to `image_columns_filtered[4]` assumes that the fifth band always exists and is a NumPy array. If fewer bands are loaded, the code crashes with an `IndexError`.|`process()`|Remove this log‑adjustment step entirely; a spectral profile does not require a band‑specific log stretch. If log‑adjustment is desired for all bands, apply it uniformly.|

---

### 4. Suggestions for Development

- **Point‑based spectral profile :** Add optional `x`, `y` coordinate parameters to extract the profile of a single pixel instead of the whole‑image average. The output would then be the vector of reflectance values at that location : $\text{s}=[R(x,y),G(x,y),B(x,y),NIR(x,y),SWIR1(x,y),SWIR2(x,y)]$.
    
- **Support for an arbitrary number of bands :** Currently the class requires exactly six bands. Refactoring the `__init__` to accept a list of `(name, path)` pairs would make it sensor‑agnostic.
    
- **Optional normalisation of mean values :** To facilitate comparison between scenes with different illumination, a normalisation step could scale the profile to $[0,1]$ based on the maximum mean value : $\hat{\mu}_b = \mu_b / \max(\mu)$.
    
- **Multi‑profile overlay :** Allow the user to overlay profiles from multiple images (e.g., different land‑cover classes) on the same axes for comparative analysis.
