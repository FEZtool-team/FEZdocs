# Gray Level Co-occurrence Matrix

### 1. Introduction

This module provides the ability to compute **Haralick texture features** based on the Gray-Level Co-occurrence Matrix (GLCM). Texture analysis is a fundamental tool in remote sensing for identifying repetitive spatial patterns, quantifying surface heterogeneity, and improving land-cover classification in cases where spectral information alone is insufficient (e.g., distinguishing urban areas from bare soil, or row crops from natural grassland).

**Existing Classes :**

| Class Name       | Application                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| `GLCMCalculator` | Compute a texture feature map (contrast, correlation, energy, homogeneity, etc.) for a single‑band image |

---

<span id="glcm-calculator"></span>

### 2. `GLCMCalculator` – GLCM Texture Analysis

#### 2.1 Scientific Objective

Compute the Gray-Level Co-occurrence Matrix within a sliding window across the image and extract a user‑specified Haralick texture feature at each pixel position. The output is a continuous‑valued map that characterises the local spatial structure of the image.

#### 2.2 Full Explanation of the GLCM and Haralick Features

The GLCM is a second‑order statistical method that captures the spatial relationship between pairs of pixels. While a standard histogram describes the frequency of each grey level independently, the GLCM describes how often a given grey level appears next to another grey level at a specified offset (distance and angle).

---

**Mathematical Definition of the GLCM**

Let an image $I$ have integer grey levels in the range {$0,1,…,G−1$}, where $G$ is the number of quantised grey levels (typically 256 for 8‑bit images; in the code, the image is cast to `uint8`, so $G=256$). For a given spatial offset defined by a displacement vector $d=(d_x​,d_y​)$, the **un‑normalised GLCM** is a square matrix $P$ of size $G×G$ whose element $P(i,j)$ is the count of pixel pairs with grey levels $i$ and $j$ separated by the vector $d$ :

$$P(i, j \mid d) = \sum_x \sum_y 
\begin{cases} 
1, & \text{if } I(x, y) = i \text{ and } I(x + d_x, y + d_y) = j \\ 
0, & \text{otherwise} 
\end{cases}$$

In the code, the displacement is `distance = 1` and `angle = 0` (horizontal). Thus :

$$\mathbf{d} = (0, 1) \quad (\text{one pixel to the right})$$

For a window of size $W×W$ (where $W$ = `window_size`, e.g., 3, 5, 7…), the GLCM is computed only from the pixels within that local neighbourhood. The matrix is then **normalised** (`normed=True`) so that the sum of all entries equals 1, converting counts to joint probabilities :

$$p(i,j) = \frac{P(i,j)}{\sum_{a=0}^{G-1} \sum_{b=0}^{G-1} P(a,b)}$$

Hence $p(i,j)$ represents the estimated joint probability that two pixels separated by $\mathbf{d}$ have grey levels $i$ and $j$.

Additionally, the code sets `symmetric=True`, meaning that the GLCM is made symmetric by adding its transpose : $P_{\text{sym}} = P + P^{T}$, and then normalising. This is equivalent to considering the relationship between two pixels as undirected (the pair $(i,j)$ is the same as $(j,i)$).

---

**Haralick Texture Features**

From the normalised symmetric GLCM $p(i,j)$, several scalar features can be computed. The code currently supports the following six features, selected via the `propery` parameter :

---

**1. Contrast**

$$\text{Contrast} = \sum_{i=0}^{G-1} \sum_{j=0}^{G-1} (i - j)^2 \cdot p(i, j)$$

- **Meaning :** Contrast measures the local intensity variation. The squared difference $(i−j)^2$ acts as a weight that increases quadratically as the grey levels of neighbouring pixels diverge. Large values indicate strong local variation (rough texture, edges, heterogeneous surfaces). Smooth, uniform regions yield low contrast.
    
- **Remote sensing application :** Distinguishing urban areas (high contrast due to buildings and roads) from water or agricultural fields (low contrast).


---

**2. Dissimilarity**

$$\text{Dissimilarity} =\sum_{i=0}^{G-1} \sum_{j=0}^{G-1} |i - j| \cdot p(i, j)$$

- **Meaning :** Very similar to contrast, but uses the absolute difference $∣i−j∣$ instead of the squared difference. The linear weighting means that large grey‑level differences contribute less dominantly than in contrast, making dissimilarity a more balanced measure of texture roughness.
    
- **Remote sensing application :** Separating rough (e.g., forest canopy) from smooth (e.g., calm water) textures when the dynamic range of grey levels is large.


---

**3. Homogeneity (also called Inverse Difference Moment)**

$$\text{Homogeneity}=\sum_{i=0}^{G-1} \sum_{j=0}^{G-1} \frac{p(i,j)}{1 + (i - j)^2} $$

- **Meaning :** Homogeneity quantifies the closeness of the distribution to the main diagonal of the GLCM. The weight $\frac{1}{1+(i-j)^2}$​ is large (close to 1) when $i≈j$ (neighbouring pixels have similar grey levels) and small when $i$ and $j$ differ strongly. Thus, homogeneous regions (e.g., water bodies, bare soil) yield high values, while textured regions (urban, forest) yield low values.
    
- **Remote sensing application :** Mapping uniform surfaces; detecting water bodies, sand dunes, or homogeneous crop fields.


---

**4. ASM – Angular Second Moment (also called Uniformity or Energy²)**

$$ASM = \sum_{i=0}^{G-1} \sum_{j=0}^{G-1} (p(i,j))^2$$

- **Meaning :** ASM measures the orderliness of the texture. When the image is uniform (pixel pairs are concentrated in a few grey‑level combinations), the squared probabilities $p(i,j)^2$ are relatively large, and ASM is high. When many different pixel pairs occur, the probabilities are spread out and ASM is low.
    
- **Note on name :** In the original Haralick paper, ASM is called “Energy²”. The actual **Energy** is the square root of ASM (see below).
    
- **Remote sensing application :** Detecting regular patterns such as row crops, orchards, or artificial structures.


---

**5. Energy**

$$\text{Energy} = \sqrt{ASM} = \sqrt{\sum_{i=0}^{G-1} \sum_{j=0}^{G-1} (p(i,j))^2}$$

- **Meaning :** Energy is the square root of ASM. It provides a similar measure of textural uniformity but with a more linear scale. High energy indicates a repetitive, orderly texture; low energy indicates randomness.
    
- **Remote sensing application :** Same as ASM, but with a different dynamic range; sometimes preferred for visualisation.


---

**6. Correlation**

$$\text{Correlation} =\sum_{i=0}^{G-1} \sum_{j=0}^{G-1} \frac{ (i - \mu_i)(j - \mu_j) p(i, j)}{\sigma_i \sigma_j}$$

where :

- $\mu_i = \sum_i \sum_j i \cdot p(i, j) \text{ (marginal mean of reference pixels)}$
    
- $\mu_j = \sum_i \sum_j j \cdot p(i, j) \quad (\text{marginal mean of neighbour pixels})$
    
- $\sigma_i = \sqrt{\sum_i \sum_j (i - \mu_i)^2 \cdot p(i, j)} \quad (\text{standard deviation of reference pixels})$
    
- $\sigma_j = \sqrt{\sum_i \sum_j (j - \mu_j)^2 \cdot p(i, j)} \quad (\text{standard deviation of neighbour pixels})$
    
- **Meaning :** Correlation quantifies the linear dependency between the grey levels of neighbouring pixels. It ranges from –1 to +1. High positive correlation means that pixel pairs have grey levels that are linearly related (e.g., a bright pixel is likely to be next to another bright pixel, as in smooth gradients). Low or negative correlation indicates uncorrelated or inversely related grey levels (random texture). Flat regions may yield undefined correlation ($σ_iσ_j=0$); in practice these are often set to 0.
    
- **Remote sensing application :** Identifying directional textures (e.g., geological faults, road networks, linear dunes); high correlation along the direction of the structure.


---

**Processing Workflow in the Code**

1. **Input pre‑processing :** The NIR band is fetched from `files_handler` and cast to an 8‑bit integer array (`uint8`). This quantisation is required by `graycomatrix`. If the original data are 16‑bit or float, information may be compressed; a prior explicit normalisation to 0–255 is recommended.
    
2. **Sliding window :** A square window of size `window_size` (e.g., 3×3) advances with a stride of 1 pixel across the full image. For each window position, the GLCM is computed (distance 1, angle 0, symmetric, normalised).
    
3. **Feature extraction :** From each local GLCM, the selected Haralick property is extracted using `graycoprops`.
    
4. **Output assembly :** The feature value is placed at the upper‑left corner `[i, j]` of the window in the output array. This implies that the output dimensions are `(width - window_size + 1) × (height - window_size + 1)`; pixels near the right and bottom boundaries that cannot accommodate a full window remain at their initial value (zero from `np.empty`).


#### 2.3 Input Parameters (`__init__`)

| Parameter     | Type            | Default      | Description                                                                                                                              |
| ------------- | --------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `nir_path`    | `str` or `Path` | **required** | Path to the single‑band image (any band works; NIR is recommended as it often carries strong textural information).                      |
| `window_size` | `int`           | `3`          | Size of the square analysis window. Must be odd and ≥ 3. Larger windows capture broader texture but increase computation time.           |
| `propery`     | `str`           | `"contrast"` | Name of the Haralick feature to compute. One of: `"contrast"`, `"dissimilarity"`, `"homogeneity"`, `"ASM"`, `"energy"`, `"correlation"`. |

#### 2.4 Validation (`_validate`)

In the current version this method is empty. A future implementation should check that :

- `window_size` is an odd integer ≥ 3.
    
- `nir_path` points to a valid, readable file.
    
- `propery` belongs to the set of allowed feature names.
    
- The image pixel data type is compatible (uint8 or has been scaled).


#### 2.5 Return Value (`process`)

- A 2D `numpy.ndarray` of shape `(width, height)` containing the computed texture feature at each pixel. Because the initial container is created with `np.empty`, un‑processed edge pixels contain arbitrary values (typically very small floats that appear as black in visualisation). Only the top‑left region up to `(width - window_size + 1, height - window_size + 1)` holds valid feature data.


#### 2.6 Usage Example
```python
from pathlib import Path
from fezrs.tools.glcm import GLCMCalculator

calc = GLCMCalculator(
    nir_path="path/to/nir_band.tif",
    window_size=5,
    propery="homogeneity"
)
calc.execute(
    output_path="./results/",
    title="GLCM Homogeneity Map",
    colormap="viridis",
    show_colorbar=True,
    dpi=300
)
```

---

### 3. Guide for Selecting Texture Features

| Feature         | Formula Highlight                    | Description                                               | Typical Remote Sensing Application              |
| --------------- | ------------------------------------ | --------------------------------------------------------- | ----------------------------------------------- |
| `contrast`      | $\sum (i - j)^2 p(i, j)$             | Weights large grey‑level differences strongly             | Edge detection, heterogeneous areas (urban)     |
| `dissimilarity` | $\sum \|i - j\|p(i, j)$              | Linear weighting of differences; rougher than homogeneity | Distinguishing rough vs. smooth textures        |
| `homogeneity`   | $\sum \frac{p(i,j)}{1 + (i - j)^2}​$ | High when pixel pairs are similar                         | Homogeneous areas (water, sand, uniform forest) |
| `ASM`           | $\sum p(i, j)^2$                     | Second‑order uniformity; high when texture is ordered     | Regular patterns (row crops, orchards)          |
| `energy`        | $\sqrt{ASM}$​                        | Square root of ASM; similar interpretation                | Same as ASM, with different dynamic range       |
| `correlation`   | Complex (see formula above)          | Linear dependence between neighbouring pixels             | Directional structures (faults, roads, dunes)   |

---

### 4. Important Technical Notes

- **Dependency :** Uses `skimage.feature.graycomatrix` and `graycoprops` from **scikit‑image**.
    
- **Data type conversion :** The input is cast to `uint8`. If the original data are 16‑bit or float, normalise to 0–255 beforehand to avoid truncation or information loss.
    
- **Fixed window stride‑1 :** The sliding window uses a step of 1 pixel (fully overlapping windows). This provides the highest spatial resolution but is computationally expensive for large images (especially with larger window sizes).
    
- **Boundary handling :** Pixels at the right and bottom edges where the full window cannot fit are not processed. The output array dimensions equal those of the input image, but only the `[0 : width - window_size + 1, 0 : height - window_size + 1]` region contains valid data. The remaining border is uninitialised (zero or arbitrary).
    
- **Console output :** A `print` statement is emitted for every row, which can be intrusive and slow down processing. It is recommended to remove or disable this in production.
    
- **Fixed GLCM parameters :** The GLCM is computed with `distance=1`, `angle=0` (horizontal), `normed=True`, and `symmetric=True`. For multi‑directional texture analysis, future versions could accept a list of distances and angles and average the resulting features.
    
- **Window size impact :** Larger windows capture macro‑texture (e.g., field patterns) but increase computation time roughly with $O(W^2)$ and blur the spatial precision of the feature map. Small windows (3×3, 5×5) are suitable for fine‑scale texture (e.g., individual tree crowns).
