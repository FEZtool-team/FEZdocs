
### 1. Module Introduction

This module provides a set of algorithms for improving the **visual and radiometric quality** of satellite images. The purpose of these tools is to increase sharpness, correct contrast, improve brightness, and prepare images for visual analysis or as input to machine learning models.

All classes in this module inherit from `BaseTool` and `HistogramExportMixin` (for saving the output histogram).

**Existing Classes :**

| Class Name                | Image Type  | Application                                        |
| ------------------------- | ----------- | -------------------------------------------------- |
| `OriginalCalculator`      | Single‑band | Extracts the raw image as float (control baseline) |
| `OriginalRGBCalculator`   | RGB         | Extracts the raw RGB composite (natural colour)    |
| `FloatCalculator`         | Single‑band | Converts the image to float format ([0,1])         |
| `EqualizeCalculator`      | Single‑band | Histogram equalisation                             |
| `EqualizeRGBCalculator`   | RGB         | Histogram equalisation for each RGB channel        |
| `AdaptiveCalculator`      | Single‑band | Adaptive histogram equalisation (CLAHE)            |
| `AdaptiveRGBCalculator`   | RGB         | CLAHE on each RGB channel                          |
| `GammaCalculator`         | Single‑band | Gamma correction                                   |
| `GammaRGBCalculator`      | RGB         | Gamma correction on each RGB channel               |
| `LogAdjustCalculator`     | Single‑band | Logarithmic adjustment                             |
| `SigmoidAdjustCalculator` | Single‑band | Sigmoid contrast adjustment                        |

---

### 2. Detailed Documentation of Classes

#### 2.1. `OriginalCalculator` and `OriginalRGBCalculator` – Raw Image Extraction

**Purpose**  
Provide the input image without any changes as a baseline for comparison with other image enhancement methods.

|Class|Bands|Output|
|---|---|---|
|`OriginalCalculator`|`nir_path`|2D float array|
|`OriginalRGBCalculator`|`red_path`, `green_path`, `blue_path`|3‑band float array|

**Full Explanation of the Process**  
These classes do not apply any enhancement transformation. They merely convert the raw pixel values to floating‑point numbers in the range $[0,1]$ using `skimage.img_as_float`. The mapping for an integer image with bit depth $b$ is :

$$I_{\text{float}}(x, y) = \frac{I_{\text{int}}(x, y)}{2^b - 1}$$

For the RGB version, the normalised Red, Green, and Blue bands are stacked along the third axis to create an `(H, W, 3)` array. No further calculations are performed.

**Example :**
```python
calc = OriginalCalculator(nir_path="NIR.tif").execute("./output/")
```

---

#### 2.2. `FloatCalculator` – Convert to Float

**Purpose**  
Convert the input image (e.g., uint16) to the range $[0,1]$ of type float for subsequent processing.

**Full Explanation of the Formula**  
Identical to the mapping used in `OriginalCalculator` :

$$I_{\text{float}} = \frac{I}{I_{\text{max}}}$$

where $I_{\text{max}} = 2^{b} - 1$. This is performed by `skimage.img_as_float`. The operation is linear and preserves the shape of the histogram.

**Parameters :** `nir_path`  
**Output :** float array

---

#### 2.3. `EqualizeCalculator` and `EqualizeRGBCalculator` – Histogram Equalisation

**Scientific objective**  
Improve overall image contrast by uniformly distributing the pixel intensity values. This method is particularly useful for dark or low‑contrast images.

**Full Explanation of the Formula**

Histogram equalisation transforms the image so that the output histogram is approximately flat (uniform). The theory is based on the cumulative distribution function (CDF) of the pixel values.

Let $p(r_k​)$ be the normalised histogram (probability) of intensity level $r_k$​ (with $k=0,1,…,L−1, L=256$ in the code). The cumulative probability is :

$$C(r_k) = \sum_{i=0}^k p(r_i)$$

The equalised intensity $s_k​$ is obtained by scaling the CDF to the full range $[0,1]$ :

$$s_k = C(r_k) = \sum_{i=0}^k p(r_i)$$

In the discrete implementation (256 bins), each pixel's value is replaced by the normalised CDF of its bin. Because the input is already floating in $[0,1]$, `exposure.equalize_hist` effectively computes :

$$I_{\text{eq}}(x, y) = \frac{1}{N} \sum_{j=1}^{\text{rank}(I(x,y))} \text{count}(j)$$

where rank is the index of the pixel value among all sorted values, and $N$ is the total number of pixels.

The RGB version applies this transform to each of the Red, Green, and Blue channels independently. This can enhance contrast but may alter the colour balance.

| Class                   | Parameters                            | Note                                 |
| ----------------------- | ------------------------------------- | ------------------------------------ |
| `EqualizeCalculator`    | `nir_path`                            | On single‑band image                 |
| `EqualizeRGBCalculator` | `red_path`, `green_path`, `blue_path` | Each channel is equalised separately |

**Example :**
```python
calc = EqualizeCalculator(nir_path="NIR.tif").execute("./", title="Histogram Equalized")
```

---

#### 2.4. `AdaptiveCalculator` and `AdaptiveRGBCalculator` – Adaptive Equalisation (CLAHE)

**Scientific objective**  
Apply **Contrast Limited Adaptive Histogram Equalisation (CLAHE)**, which improves contrast locally and prevents noise amplification. It is suitable for images with large variations in brightness.

**Full Explanation of the Formula**

CLAHE partitions the image into small tiles (by default 8×8) and computes the histogram equalisation mapping for each tile independently. To avoid amplifying noise, the contrast enhancement is limited by clipping the histogram at a specified **clip limit**.

- For a tile of $M×M$ pixels and $N_{\text{bins}} = 256$, the average number of pixels per bin is $\bar{n} = \frac{M^2}{N_{\text{bins}}}$​.
    
- The **clip limit** `C` is defined as a multiple of $\bar{n}$ :
    
    $$\text{actual clip height} = C \cdot \bar{n}$$
    
    In the code, the user passes `clip_limit` which corresponds to this factor $C$ (a typical value is 0.01 to 0.1). Any histogram bin exceeding this height is clipped, and the excess is redistributed evenly among all bins.
    
- The equalisation mapping is then computed from the clipped histogram for that tile.
    
- To avoid block artefacts, the mapping for each pixel is bilinearly interpolated from the mappings of the four nearest tiles.


Mathematically, for each tile $t$, let $h_t(k)$ be the clipped histogram. Then the mapping function is:

$$T_t(r_k) = \frac{1}{N_t} \sum_{i=0}^k h_t(i)$$

where $N_t$​ is the total number of pixels in the tile after clipping and redistribution. For a pixel at location $(x,y)$, the final value is :

$$I_{\text{CLAHE}}(x, y) = \text{interpolate}(T_{t_1}, T_{t_2}, T_{t_3}, T_{t_4})$$

where $t_{1..4}​$ are the four neighbouring tiles.

The result is an image with enhanced local contrast but with smooth transitions.

Parameters for `AdaptiveCalculator` :

| Parameter    | Type    | Description                                                              |
| ------------ | ------- | ------------------------------------------------------------------------ |
| `nir_path`   | `Path`  | Single‑band image                                                        |
| `clip_limit` | `float` | Clipping limit to prevent noise amplification (typical values: 0.01–0.1) |

Parameters for `AdaptiveRGBCalculator` :

| Parameter                             | Type   | Description |
| ------------------------------------- | ------ | ----------- |
| `red_path`, `green_path`, `blue_path` | `Path` | RGB bands   |

_Note :_ In `AdaptiveRGBCalculator`, the `clip_limit` is fixed at 0.08.

**Example :**
```python
calc = AdaptiveCalculator(nir_path="NIR.tif", clip_limit=0.05)
calc.execute("./", title="CLAHE Enhanced")
```

---

#### 2.5. `GammaCalculator` and `GammaRGBCalculator` – Gamma Correction

**Scientific objective**  
Adjust image brightness by applying a power‑law (gamma) function. Brighten dark areas ($γ<1$) or darken bright areas ($γ>1$).

**Full Explanation of the Formula**

Gamma correction is a point transformation defined as :

$$I_{\text{out}} = \text{gain} \cdot I_{\text{in}}^{\gamma}$$

where $I_{in}$​ is the input pixel value in $[0,1]$. The gain factor (default 1) scales the output linearly.

The effect of $γ$ :

- $γ=1$ : identity.
    
- $0<γ<1$ : lifts the mid‑tones and shadows (dark areas become brighter), compressing highlights.
    
- $γ>1$ : darkens the image, stretching bright areas and compressing dark areas.


The transformation is applied pixel‑wise. For the RGB version, a fixed $γ=0.5$ and gain = 1 are used for each channel.

_Note on the `while` loop in `GammaCalculator` :_  
The current implementation contains a loop that increases $γ$ by 0.2 if the mean of the output is greater than the mean of the input. This is a heuristic to ensure the image does not become overly bright, but it can lead to non‑convergent behaviour. The mathematical model is still the standard power‑law.

Parameters for `GammaCalculator` :

| Parameter  | Type    | Default | Description       |
| ---------- | ------- | ------- | ----------------- |
| `nir_path` | `Path`  | –       | Single‑band image |
| `gamma`    | `float` | 0.2     | Gamma value       |
| `gain`     | `int`   | 1       | Gain factor       |

Parameters for `GammaRGBCalculator` :

|Parameter|Type|Description|
|---|---|---|
|`red_path`, `green_path`, `blue_path`|`Path`|RGB bands|

**Example :**
```python
calc = GammaCalculator(nir_path="NIR.tif", gamma=0.5, gain=1)
calc.execute("./", title="Gamma Corrected")
```

---

#### 2.6. `LogAdjustCalculator` – Logarithmic Adjustment

**Scientific objective**  
Increase contrast in dark areas of the image using a logarithmic transformation.

**Full Explanation of the Formula**

The logarithmic transformation implemented by `exposure.adjust_log` is :

$$I_{\text{out}} = \text{gain} \cdot \log(1 + I_{\text{in}})$$

where $I_{in}$​ is in $[0,1]$. Because $log⁡(1+0)=0$ and $log⁡(1+1)=log⁡2≈0.693$, the output range with default gain = 1 is $[0,0.693]$. The transformation stretches the lower values and compresses higher values, thereby enhancing details in shadows.

If `inverse = True`, the inverse transformation is applied :

$$I_{\text{out}} = \text{gain} \cdot (e^{I_{\text{in}}} - 1)$$

This does the opposite : it stretches bright regions and compresses dark ones.

**Parameters :**

| Parameter  | Type   | Default | Description                                          |
| ---------- | ------ | ------- | ---------------------------------------------------- |
| `nir_path` | `Path` | –       | Single‑band image                                    |
| `gain`     | `int`  | 1       | Scaling factor                                       |
| `inverse`  | `bool` | `False` | If `True`, applies the inverse exponential transform |

**Example :**
```python
calc = LogAdjustCalculator(nir_path="NIR.tif", gain=2, inverse=False)
calc.execute("./", title="Log Adjusted")
```

---

#### 2.7. `SigmoidAdjustCalculator` – Sigmoid Adjustment

**Scientific objective**  
Compress mid‑range values and stretch dark and bright areas using a sigmoid (logistic) function. This enhances local contrast without losing details in mid‑tones.

**Full Explanation of the Formula**

The sigmoid adjustment in `skimage.exposure.adjust_sigmoid` is given by :

$$I_{\text{out}} = \frac{1}{1 + \exp(\text{gain} \cdot (\text{cutoff} - I_{\text{in}}))}$$

- `cutoff` (in $[0,1]$) is the inflection point. Pixels with intensity equal to `cutoff` map to 0.5.
    
- `gain` controls the steepness of the curve. A larger gain produces a steeper transition, resulting in higher contrast near the cutoff.
    
- The function squashes the input into $[0,1]$. If `inverse = True`, the transformation is reversed :
    
    $$I_{\text{out}} = \text{cutoff} - \frac{1}{\text{gain}} \ln \left( \frac{1}{I_{\text{in}}} - 1 \right)$$
    
    which stretches the mid‑tones and compresses the extremes.
    

**Parameters :**

|Parameter|Type|Default|Description|
|---|---|---|---|
|`nir_path`|`Path`|–|Single‑band image|
|`gain`|`int`|1|Steepness of the sigmoid curve|
|`cutoff`|`float`|0.5|Inflection point (range 0 to 1)|
|`inverse`|`bool`|`False`|If `True`, applies the inverse sigmoid|

**Example :**
```python
calc = SigmoidAdjustCalculator(nir_path="NIR.tif", gain=10, cutoff=0.5)
calc.execute("./", title="Sigmoid Contrast")
```

---

### 3. Common Feature: Histogram Output

All classes in this module (except `LogAdjustCalculator`) have a `histogram_export()` method that saves the histogram of the processed image as a plot. This method automatically adds the **FEZrs watermark** to the plot.

**Parameters for `histogram_export` :**

|Parameter|Type|Description|
|---|---|---|
|`output_path`|`Path`|Save path|
|`title`|`str`|Plot title|
|`figsize`|`tuple`|Figure size|
|`filename_prefix`|`str`|File name prefix|
|`dpi`|`int`|Output quality|

**Example :**
```python
calc = EqualizeCalculator(nir_path="NIR.tif")
calc.histogram_export("./histograms/", title="Equalized Histogram")
```

---

### 4. Technical Notes and Development Suggestions

- **Unexpected behaviour in `GammaCalculator` :** The `while` loop that changes the gamma value if the mean increases may cause an infinite loop or unpredictable results. It is recommended to remove this logic or replace it with a controlled condition.
    
- **Fixed values in RGB versions :** In `AdaptiveRGBCalculator` and `GammaRGBCalculator`, parameters `clip_limit` and `gamma` are hard‑coded. Exposing them as constructor arguments would increase flexibility.
    
- **`LogAdjustCalculator` inheritance :** This class has a `histogram_export` method but does not inherit from `HistogramExportMixin`. This inconsistency should be addressed in a future update.
    
- **Automatic watermark :** The `_add_watermark` method (from `HistogramExportMixin`) adds the FEZrs logo to all histograms, which is excellent for professional publications.
    
- **Performance of RGB processing :** Processing each channel separately and then stacking with `np.stack` may consume significant memory for very large images. Using chunked or Dask‑based processing is recommended for future versions.