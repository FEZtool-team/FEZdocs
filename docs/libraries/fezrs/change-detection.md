# Change Detection

### 1. Introduction

This module contains a set of tools for analysing **temporal changes** in satellite images. The main goal is to identify and quantify changes that have occurred between two time periods – typically before and after an event such as a fire, a flood, or land‑use modification.

**Existing Classes :**

|Class Name|Specialised Application|
|---|---|
|`BurnCalculator`|Identifies burned areas using the **Normalized Burn Ratio (NBR)** and its differenced form dNBR|
|`IndicesCalculator`|Calculates the NBR index for either the pre‑event or the post‑event image|
|`MagDirCalculator`|Computes the **change vector** (magnitude and direction) in the NIR–SWIR spectral space|
|`SubDivCalculator`|Performs simple subtraction or division between bands of the two dates|
|`TimeCalculator`|Extracts one of the input images (pre‑ or post‑event) in raw form|

---

### 2. Common Dependencies

All classes in this module inherit from `fezrs.base.BaseTool` and use the `self.files_handler` mechanism for file management. The main processing method in each class is named `process()`, and the final output is saved via the `execute()` method.

---

### 3. Detailed Documentation for Each Class

<span id="burn-calculator"></span>

#### 3.1. `BurnCalculator` – Burn Severity Calculation (dNBR)

**Scientific objective**  
Compute the differenced Normalized Burn Ratio (dNBR), the standard metric for determining fire severity and mapping burn scars.

**Full Explanation of the Formulas**

The Normalized Burn Ratio (NBR) is a spectral index that leverages the distinct spectral behaviour of healthy vegetation and burned surfaces in the near‑infrared (NIR) and short‑wave infrared (SWIR2) regions.

- **Spectral basis :**  
    Healthy green vegetation reflects strongly in NIR (typically 40–60% of incoming radiation) while absorbing most SWIR2 due to leaf water content. After a fire, vegetation is removed, exposing soil and ash. Ash and bare soil reflect much less in NIR and more in SWIR2 relative to vegetation. Consequently, fire‑affected areas show a sharp drop in NIR reflectance and an increase in SWIR2 reflectance.
    
- **Normalized Burn Ratio (NBR) :**  
    The NBR index captures this contrast through a normalised difference formula:
    
	$$NBR = \frac{NIR - SWIR2}{NIR + SWIR2}$$
    
    This formulation is borrowed from the well‑known NDVI but uses SWIR2 instead of red. The normalisation by the sum of the two bands reduces the influence of variable illumination (sun angle, topography) and atmospheric effects.  
    NBR values theoretically range from –1 to +1:
    
    - High positive values (≈ +0.5 to +1) indicate robust vegetation (high NIR, low SWIR2).
        
    - Low or negative values are associated with bare soil, rock, or burned areas.
        
    - Water bodies produce negative NBR because NIR is strongly absorbed and SWIR2 may be relatively higher.
    
- **Differenced NBR (dNBR) :**  
    To isolate change due exclusively to fire, the NBR of the pre‑event image is subtracted from that of the post‑event image :
    
    $$dNBR = NBR_{before} - NBR_{after}$$
	
    
    A positive dNBR means the NBR decreased after the event, i.e., the pixel lost vegetation and likely burned. The magnitude of dNBR correlates with burn severity.
    
    In the code, the subtraction is implemented as `indices_before - indices_after`, which is mathematically equivalent.
    
- **Severity thresholding :**  
    The code then applies a threshold `dNBR > 0.7` to produce a binary mask of high‑severity burned areas.  
    Standard interpretation of dNBR (Key & Benson, 2006; USGS) is:
    
    - dNBR < 0.1 → unburned
        
    - 0.1 – 0.27 → low severity
        
    - 0.27 – 0.66 → moderate severity
        
    - `>` 0.66 → high severity  
	    The value 0.7 is a conservative, commonly used cutoff for severe burns. The output is a Boolean array (`True` for high severity).
    
- **Mathematical note on division by zero :**  
    The denominator `NIR + SWIR2` can be zero (e.g., in areas of complete darkness). In practice, such pixels are rare, but if they occur, the resulting `NaN` is handled by the `> 0.7` comparison (evaluating to `False`). A future improvement could explicitly set these to `False`.


**Input parameters (`__init__`) :**

|Parameter|Type|Description|
|---|---|---|
|`nir_path`|`str` or `Path`|Path to the NIR band file (post‑event)|
|`swir2_path`|`str` or `Path`|Path to the SWIR2 band file (post‑event)|
|`before_nir_path`|`str` or `Path`|Path to the NIR band file (pre‑event)|
|`before_swir2_path`|`str` or `Path`|Path to the SWIR2 band file (pre‑event)|

**Return value of `process()` :**  
`numpy.ndarray` of type `bool` (burn mask).

**Usage example :**
```python
from pathlib import Path
from fezrs.tools.change_detection import BurnCalculator

calc = BurnCalculator(
    nir_path="path/to/after_B4.tif",
    swir2_path="path/to/after_B7.tif",
    before_nir_path="path/to/before_B4.tif",
    before_swir2_path="path/to/before_B7.tif"
)
calc.execute(output_path="./results/", title="Burn Severity Mask", colormap="Reds")
```

---

<span id="indices-calculator"></span>

#### 3.2. `IndicesCalculator` – Compute NBR for a Single Date

**Scientific objective**  
Calculate the raw Normalized Burn Ratio (NBR) for one of the two images (pre‑event or post‑event only). This tool is useful for previewing the vegetation condition on a single date or for intermediate analyses.

**Full Explanation of the Formula**

- The NBR formula is identical to that in `BurnCalculator`:
    
	$$NBR = \frac{NIR - SWIR2}{NIR + SWIR2}$$
    
    The choice of the image is controlled by the `time` parameter. If `"after"`, the post‑event NIR and SWIR2 bands are used; if `"before"`, the pre‑event bands are used.
    
- The output is a floating‑point array between –1 and 1. Since no differencing is applied, the result shows the absolute vegetation‑fuel condition at that date. For example, a low NBR in a pre‑fire image might already indicate a dry, stressed vegetation state, whereas a high NBR suggests lush vegetation.
    
- This index can be used independently of fire – it is essentially a vegetation index sensitive to leaf water content and standing biomass, and can be applied to any multi‑spectral image possessing NIR and SWIR2 bands.


**Input parameters :**

| Parameter           | Type                         | Description                                |
| ------------------- | ---------------------------- | ------------------------------------------ |
| `nir_path`          | `str` or `Path`              | NIR band (post‑event)                      |
| `swir2_path`        | `str` or `Path`              | SWIR2 band (post‑event)                    |
| `before_nir_path`   | `str` or `Path`              | NIR band (pre‑event)                       |
| `before_swir2_path` | `str` or `Path`              | SWIR2 band (pre‑event)                     |
| `time`              | `Literal["before", "after"]` | Determines for which image NBR is computed |

**Return value :**  
`numpy.ndarray` (float values between –1 and 1).

**Usage example :**
```python
calc = IndicesCalculator(..., time="after")
calc.execute("./output", title="NBR After Event")
```

---

<span id="magdir-calculator"></span>

#### 3.3. `MagDirCalculator` – Change Vector Magnitude and Direction (CVA)

**Scientific objective**  
Perform Change Vector Analysis (CVA) in the two‑band spectral space formed by NIR and SWIR1. For each pixel, the algorithm calculates both the **magnitude** of change (how much it changed) and the **direction** (what kind of change occurred).

**Full Explanation of the Formulas**
CVA models a pixel’s spectral evolution as a vector. If we plot the pre‑event pixel as a point ($NIR_{\text{before}}, SWIR1_{\text{before}}$) and the post‑event pixel as ($NIR_{\text{after}}, SWIR1_{\text{after}}$), the change vector is :

$$\vec{V} = (NIR_{after} - NIR_{before}, SWIR1_{after} - SWIR1_{before})$$

- **Magnitude of change :**  
    The Euclidean length of $\vec{V}$ quantifies the total spectral change :
    
    $$|\vec{V}| = \sqrt{(NIR_{after} - NIR_{before})^2 + (SWIR1_{after} - SWIR1_{before})^2}$$
    
    Larger magnitude implies a stronger alteration, regardless of its nature. This is particularly useful for rapidly identifying hotspots of change (e.g., logging, fire, urban expansion).
    
- **Direction of change (discrete coding) :**  
    The direction is determined by the signs of the differences in both bands. The algorithm assigns a code from 1 to 4 based on these sign combinations :
	
| NIR change | SWIR1 change | Code | Interpretation                                                                                       |
| ---------- | ------------ | ---- | ---------------------------------------------------------------------------------------------------- |
| decrease   | decrease     | 1    | Vegetation decrease + moisture decrease (e.g., fire, die‑off)                                        |
| increase   | decrease     | 2    | Vegetation increase + moisture decrease (healthy plant growth)                                       |
| decrease   | increase     | 3    | Vegetation decrease + moisture increase (flood, soil saturation)                                     |
| increase   | increase     | 4    | Both increase (possible atmospheric or sensor anomaly, or land‑cover conversion to brighter surface) |

These codes are discrete and qualitative; they do not capture the precise angle of the vector. For a full quantitative CVA, one would compute the angular direction $θ=arctan2$ ($SWIR1_{\text{diff}}, NIR_{\text{diff}}$) and potentially define sectors for different change types. The current approach provides a simple and intuitive classification.
	
- **Physical interpretation of bands in CVA :**  
    NIR is sensitive to vegetation amount and vigour; SWIR1 is sensitive to moisture content (leaf water, soil moisture). Therefore :
    
    - Code 1 (both decrease) : loss of photosynthetically active vegetation and drying → typical of fire scars or severe drought.
        
    - Code 2 (NIR up, SWIR1 down) : regrowth of healthy plants (higher NIR) and low SWIR1 (less moisture stress) → typical of reforestation or crop development.
        
    - Code 3 (NIR down, SWIR1 up) : vegetation removal (NIR drops) and wetter surface (SWIR1 increases) → flooding or irrigation.
        
    - Code 4 (both increase) : could indicate a change from water to soil/urban (both bands increase), but also can be caused by residual clouds or shadows if not properly masked.

**Input parameters :**

| Parameter           | Type                                | Description                                    |
| ------------------- | ----------------------------------- | ---------------------------------------------- |
| `nir_path`          | `Path`                              | Post‑event NIR band                            |
| `swir1_path`        | `Path`                              | Post‑event SWIR1 band (usually Landsat Band 5) |
| `before_nir_path`   | `Path`                              | Pre‑event NIR band                             |
| `before_swir1_path` | `Path`                              | Pre‑event SWIR1 band                           |
| `selecte`           | `Literal["magnitude", "direction"]` | Type of output to produce                      |

**Return value :**

- If `"magnitude"`: array of floating‑point values (change intensity).
    
- If `"direction"`: array of integers 1–4 (change type code).

**Usage example :**
```python
calc = MagDirCalculator(..., selecte="magnitude")
calc.execute("./output", title="Change Magnitude", colormap="viridis")
```

---

<span id="subdiv-calculator"></span>

#### 3.4. `SubDivCalculator` – Simple Band Subtraction or Division

**Scientific objective**  
A helper tool to visualise the absolute or relative difference of a specific band (e.g., NIR) between two dates. This gives a quick, intuitive picture of change without complex indices.

**Full Explanation of the Formulas**

Two operations are provided :

- **Subtraction :**
	
    $$\Delta = Band_{\text{before}} - Band_{\text{after}}$$        
    This gives the absolute change in reflectance (or digital number). Positive values imply a reduction of reflectance after the event (e.g., vegetation loss), and negative values indicate an increase (e.g., sediment deposition, new built‑up). The result retains the original physical units of the band and is sensitive to the overall brightness of the scene.
    
- **Division (ratio) :**
	
    $$R = \frac{Band_{before}}{Band_{after}}$$    
    The ratio compensates for illumination differences and multiplicative noise. A ratio of 1 means no change; >1 indicates the before value was larger (a decrease after the event); <1 indicates an increase after the event. Ratios are inherently non‑negative and can become very large if the denominator is near zero, so a small epsilon can be added in future versions to avoid division‑by‑zero errors.
    

**Input parameters :**

| Parameter         | Type                            | Description                                 |
| ----------------- | ------------------------------- | ------------------------------------------- |
| `nir_path`        | `Path`                          | Post‑event NIR band (or any band of choice) |
| `before_nir_path` | `Path`                          | Pre‑event NIR band                          |
| `operation`       | `Literal["subtract", "divide"]` | Mathematical operation to apply             |

**Return value :**  
`numpy.ndarray` resulting from the chosen operation.

**Usage example :**
```python
calc = SubDivCalculator(..., operation="subtract")
calc.execute("./output", title="NIR Difference (Before - After)")
```

---

<span id="time-calculator"></span>

#### 3.5. `TimeCalculator` – Raw Image Extraction

**Scientific objective**  
This class provides a simple wrapper for direct access to the NumPy data of one of the two input images. It is used for debugging or for displaying a raw image in the user interface, serving as a baseline.

**Input parameters :**

| Parameter         | Type                         | Description               |
| ----------------- | ---------------------------- | ------------------------- |
| `nir_path`        | `Path`                       | Post‑event NIR band       |
| `before_nir_path` | `Path`                       | Pre‑event NIR band        |
| `time`            | `Literal["before", "after"]` | Selects the desired image |

**Return value :**  
NumPy array of the chosen NIR band (float values after standardisation).

**Usage example :**
```python
calc = TimeCalculator(..., time="before")
calc.execute("./output", title="Raw NIR Image Before Event")
```

---

### 4. Important Technical Notes for Developers

- **Path handling :** The classes support `pathlib.Path`.
    
- **Output resolution :** All `execute()` methods set `dpi=500`, which is suitable for high‑quality printed outputs.
    
- **Validation (`_validate`) :** In the current version these methods are empty. It is recommended to add a check for equal dimensions of pre‑ and post‑event images in future versions to avoid NumPy broadcasting errors.
    
- **Nested loops in `MagDirCalculator`:** This part of the code is written with plain Python `for` loops. For large images (e.g., full Landsat scenes) it will be very slow.  
  **Suggested optimisation :**
    
```python
# Use vectorised NumPy operations instead of loops:
diff_nir = before_nir - nir
diff_swir = before_swir1 - swir1
magnitude = np.sqrt(diff_nir**2 + diff_swir**2)
direction = np.select([(diff_nir<0)&(diff_swir<0), ...], [1,2,3,4])
```
