# HSV

### 1. Introduction

This module provides the ability to convert satellite band composites into the **HSV (Hue, Saturation, Value)** colour space. The HSV space is often more suitable than RGB for visual analysis and for extracting colour‑based features from images, because it separates chromatic information (Hue, Saturation) from intensity (Value). Two separate classes are designed for two different applications in remote sensing.

**Existing Classes :**

| Class Name        | Application                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `HSVCalculator`   | Convert the **NIR–Green–Blue** false‑colour composite (standard vegetation enhancement) to HSV |
| `IRHSVCalculator` | Convert the **SWIR2–SWIR1–Red** false‑colour composite (infrared burn/soil moisture) to HSV    |

---

### 2. Detailed Documentation for Each Class

#### 2.1. `HSVCalculator` – Standard HSV Space for Vegetation Analysis

**Scientific objective**  
Create a false‑colour image by mapping the NIR band to the red channel, the Green band to the green channel, and the Blue band to the blue channel, then transform the resulting RGB representation into HSV space. This allows the analyst to examine **Hue** (dominant spectral signature), **Saturation** (purity of that signature), and **Value** (overall brightness) independently – properties that are directly linked to vegetation health, soil colour, and water turbidity.

**Full Explanation of the RGB→HSV Conversion Formulas**

All bands are normalised to the range $[0,1]$ beforehand. The conversion implemented by `skimage.color.rgb2hsv` follows the standard algorithm :

Given an RGB triplet $(R,G,B)$ with values in $[0,1]$, let :

    $$V \leftarrow \max(R, G, B)$$
    $$C \leftarrow V - \min(R, G, B)$$
**Value (V)** is simply the maximum of the three colour channels :

$$V = \max(R, G, B)$$

It represents the brightness of the colour. In the false‑colour context, $V$ indicates the overall reflectance intensity in the combined bands – bright pixels correspond to high reflectance in at least one of the three input bands.

**Saturation (S)** is defined as :

    $$S = 
    \begin{cases} 
    0, & \text{if } V = 0 \\
    C\\ 
    V, & \text{otherwise} 
    \end{cases}$$

Saturation measures the purity of the colour. A low saturation means the three bands have nearly equal values (the pixel appears grey/white), while a high saturation indicates one or two bands dominate (pure colour). For example, a healthy vegetation pixel with a very high NIR value but low Green/Blue values will produce a red‑dominated false‑colour with high saturation.

**Hue (H)** encodes the dominant wavelength of the colour as an angle (0° to 360°), mapped to the interval $[0,1]$ in scikit‑image. The formula depends on which channel is the maximum :

- If $V=R$ (i.e., NIR dominates) :
    
    $$H = \frac{60^\circ}{360^\circ} \cdot \left( \frac{G - B}{C} \mod 6 \right)$$
    
    But since $G$ (Green) and $B$ (Blue) are the other channels, the exact angular shift is computed as :
    
    $$H' = \frac{G - B}{C} \quad \text{and} \quad H = \frac{60^\circ \cdot (H' \mod 6)}{360^\circ}$$
    
    More precisely, scikit‑image implements :
    
    $$H = 
    \begin{cases} 
    \frac{60^\circ}{360^\circ} \cdot \left( \frac{G - B}{C} \right) & \text{if } C \neq 0 \\ 
    0 & \text{otherwise}
    \end{cases}$$
    
    If the numerator is negative, the result is shifted by $360^\circ$ and then divided by $360^\circ$ to obtain the final $[0,1]$ value.
    
- If $V=G$ (Green dominates) :
    
    $$H = \frac{60^\circ}{360^\circ} \cdot \left( \frac{B - R}{C} + 2 \right)$$
    
- If $V=B$ (Blue dominates) :
    
    $$H = \frac{60^\circ}{360^\circ} \cdot \left( \frac{R - G}{C} + 4 \right)$$

In the NIR–Green–Blue false‑colour composite :

- **Hue** reveals the colour tone : healthy vegetation (high NIR, low Green and Blue) appears in the red hues ($H≈0$); barren land (higher Green/Blue) may shift towards cyan/bluish.
    
- **Saturation** indicates how strongly the NIR response stands out from the visible bands – a direct measure of photosynthetic activity.
    
- **Value** corresponds to the maximum reflectance among the three bands, giving an image of general brightness that is relatively insensitive to shadow.


The class can return either the full three‑channel HSV cube or a single selected channel, depending on the `channel` parameter.

**Input parameters (`__init__`) :**

| Parameter    | Type                                           | Description                                                    |
| ------------ | ---------------------------------------------- | -------------------------------------------------------------- |
| `channel`    | `Literal["hsv", "hue", "saturation", "value"]` | Desired output channel. `"hsv"` returns the full 3‑band array. |
| `nir_path`   | `str` or `Path`                                | Path to the Near‑Infrared (NIR) band file.                     |
| `blue_path`  | `str` or `Path`                                | Path to the Blue band file.                                    |
| `green_path` | `str` or `Path`                                | Path to the Green band file.                                   |

**Return value of `process()` :**

- If `channel="hsv"` : a three‑band array `(height, width, 3)` containing Hue, Saturation, Value.
    
- If `"hue"`, `"saturation"`, or `"value"` : a 2D array of the single channel.


**Usage example :**
```python
from fezrs.tools.hsv import HSVCalculator

calc = HSVCalculator(
    nir_path="path/to/NIR.tif",
    green_path="path/to/Green.tif",
    blue_path="path/to/Blue.tif",
    channel="hue"
)
calc.execute(
    output_path="./results/",
    title="Hue Channel (NIR-Green-Blue)",
    colormap="hsv",  # suitable for displaying Hue
    show_colorbar=True,
    dpi=300
)
```

---

#### 2.2. `IRHSVCalculator` – Infrared HSV Space (IR‑HSV)

**Scientific objective**  
Build a false‑colour composite where the red channel is SWIR2, the green channel is SWIR1, and the blue channel is Red, then convert to HSV. This combination is particularly sensitive to **soil moisture**, **burned areas**, and **vegetation stress**, because SWIR bands are strongly absorbed by water and exhibit high reflectance from bare soil and ash.

**Full Explanation of the Formulas**

The conversion mechanism is identical to that described for `HSVCalculator` – the same `rgb2hsv` function is applied. The crucial difference lies in the **physical meaning** of the RGB channels.

In this composite :

- **R ← SWIR2 (Short‑Wave Infrared 2, e.g., Landsat Band 7)**  
    Sensitive to mineral composition, soil moisture, and burnt areas. High SWIR2 reflectance is typical of exposed minerals, dry soil, and ash.
    
- **G ← SWIR1 (Short‑Wave Infrared 1, e.g., Landsat Band 6)**  
    Also sensitive to moisture and vegetation structure, but with slightly different absorption features than SWIR2.
    
- **B ← Red (visible Red, e.g., Landsat Band 4)**  
    Strongly absorbed by green vegetation; low Red reflectance indicates healthy, dense vegetation.


Thus, in the HSV output derived from `(SWIR2, SWIR1, Red)` :

- **irhue :** Encodes the dominant “colour” in this false‑colour space. For example, a pixel where SWIR2 >> SWIR1 ≈ Red (burnt area) appears in the red/orange hue range ($H≈0$). Healthy vegetation, with low Red and moderate SWIR values, appears in a different hue quadrant.
    
- **irsaturation :** Measures how pure the spectral signature is. High saturation occurs when one band dominates strongly (e.g., strong SWIR2 dominance over SWIR1 and Red → bright red in the false‑colour, hence high saturation).
    
- **irvalue :** Indicates the maximum reflectance among SWIR2, SWIR1, and Red. Bright areas (clouds, sand) yield high Value; dark areas (deep water, shadows) yield low Value.


The mathematical definitions remain :

$$V = \max(SWIR2, SWIR1, Red)$$
$$S = 
\begin{cases} 
0, & V = 0 \\ 
\frac{V - \min(SWIR2, SWIR1, Red)}{V}, & \text{otherwise}
\end{cases}$$

$$H = \text{computed via the same piecewise formula, using SWIR2 as R, SWIR1 as G, Red as B}$$

This quantitative separation allows automatic thresholding : e.g., burned areas typically exhibit high irvalue (ash is bright in SWIR2), moderate irsaturation, and irhue in a narrow range around 0.0–0.15 (red/orange).

**Input parameters :**

| Parameter    | Type                                                   | Default   | Description                                           |
| ------------ | ------------------------------------------------------ | --------- | ----------------------------------------------------- |
| `red_path`   | `str` or `Path`                                        | required  | Path to the Red band file.                            |
| `swir1_path` | `str` or `Path`                                        | required  | Path to the SWIR1 band file (e.g., Landsat 8 Band 6). |
| `swir2_path` | `str` or `Path`                                        | required  | Path to the SWIR2 band file (e.g., Landsat 8 Band 7). |
| `channel`    | `Literal["irhsv", "irhue", "irsaturation", "irvalue"]` | `"irhsv"` | Desired output channel.                               |

**Return value :**
Similar to `HSVCalculator`; a three‑band cube or a single 2D array, depending on `channel`.

**Usage example :**
```python
from fezrs.tools.hsv import IRHSVCalculator

calc = IRHSVCalculator(
    red_path="path/to/Red.tif",
    swir1_path="path/to/SWIR1.tif",
    swir2_path="path/to/SWIR2.tif",
    channel="irvalue"
)
calc.execute(
    output_path="./results/",
    title="IR-Value Channel (SWIR2-SWIR1-Red)",
    colormap="gray",
    dpi=300
)
```

---

### 3. Common Technical Notes

- **Dependency :** Uses `skimage.color.rgb2hsv` for the conversion.
    
- **Data normalisation :** Both classes use `self.files_handler.get_normalized_bands()`, ensuring that band values are in $[0,1]$ before compositing. This is essential because `rgb2hsv` assumes input in that range.
    
- **HSV output ranges :**
    
    - **Hue :** $[0,1]$, where 0 corresponds to 0° (red) and 1 to 360° (again red, wrapping around).
        
    - **Saturation :** $[0,1]$, with 0 = completely unsaturated (grey) and 1 = fully saturated pure colour.
        
    - **Value :** $[0,1]$, 0 = black, 1 = maximum brightness.
    
- **Displaying Hue :** Use a cyclic colormap such as `'hsv'` or `'twilight'` so that the wraparound at 0/1 is visually seamless.
    
- **Key applications of IR‑HSV :**
    
    - `irhue` : Discrimination of burned areas (red/orange hue) from healthy vegetation and water.
        
    - `irsaturation` : Highlights areas where SWIR2 deviates strongly from SWIR1 and Red – typical of fire scars or mineral outcrops.
        
    - `irvalue` : Provides an albedo‑like image, useful for separating clouds/snow (high) from water (low).

---

### 4. Suggestions for Development

- **Parameterisation of band composites :** Currently the band assignment is hard‑coded. In future versions, allowing the user to specify which band maps to which RGB channel would make the tool applicable to any sensor and any thematic composite (e.g., NIR–Red–Green, or NDVI‑based colour transforms).
    
- **Direct Hue‑Saturation‑Value thresholding :** Adding methods to extract binary masks based on ranges of Hue, Saturation, or Value (e.g., `irhue between 0.0 and 0.1` for burned areas) would turn the module into a powerful interactive interpretation tool.