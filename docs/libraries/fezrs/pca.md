# PCA

### 1. Introduction

This module provides the **Principal Component Analysis (PCA)** algorithm for dimensionality reduction and spectral‑spatial information compression of multi‑band images. In the current implementation, six input bands are transformed into six principal components that explain the variance **across the band dimension**, revealing dominant spatial patterns.

**Existing Classes :**

| Class Name      | Application                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------- |
| `PCACalculator` | Computes 6 spatial principal components from 6 bands and displays them as maps with histograms. |

---

### 2. `PCACalculator` – Principal Component Analysis

#### 2.1 Scientific Objective

Transform the six original spectral bands (Red, Green, Blue, NIR, SWIR1, SWIR2) into six new **principal component** images that are uncorrelated with each other and are ordered by the amount of total variance they explain. The resulting components can be used for data compression, noise reduction, and the extraction of meaningful spatial structures.

#### 2.2 Full Explanation of the PCA Mathematics

PCA is a classic multivariate statistical technique. The implementation in this class applies PCA to a data matrix where **rows represent the six bands** and **columns represent the pixels** (i.e., each pixel is treated as a variable). This is a **transposed (spatial) PCA** – it identifies the dominant spatial patterns that account for the most variability across the set of input bands, rather than the more common spectral PCA that operates on pixel vectors.

**Data matrix construction**

Let each band $b$ (with $b=1,…,6$) be a 2D image of height $H$ and width $W$, flattened into a row vector of length $N=H×W$. The full data matrix $X$ is then

$$
X =
\begin{bmatrix}
\text{band}_1 \\
\text{band}_2 \\
\vdots \\
\text{band}_6
\end{bmatrix} \in \mathbb{R}^{6 \times N}.
$$

Thus, for this analysis, we have $m=6$ **samples** (the spectral bands) and $n=N$ **features** (the pixels).

**Centering the data**

Prior to decomposition, PCA subtracts the mean of each feature (pixel) across the six samples. Let $\bar{x}_j = \frac{1}{m} \sum_{i=1}^{m} X_{ij}$​ be the mean of pixel $j$. The centered matrix $X_c$​ is

$$X_c = X - \begin{bmatrix} \bar{x}_1 & \bar{x}_2 & \dots & \bar{x}_N \end{bmatrix}_{1 \times N} \quad (\text{broadcast over rows})$$

**Covariance matrix and its decomposition**

The covariance matrix of the features (pixels) is

$$C = \frac{1}{m-1} X_c^T X_c \quad \in \mathbb{R}^{N \times N}$$

Because $N$ (the number of pixels) is typically enormous, directly building and decomposing $C$ is computationally prohibitive. Instead, a **singular value decomposition (SVD)** of the centered matrix $X_c$​ is used :

$$X_c = U \Sigma V^T,$$

where

- $U \in \mathbb{R}^{6 \times 6}$ is orthogonal and contains the left singular vectors,
- $\Sigma \in \mathbb{R}^{6 \times 6}$ is diagonal with singular values $\sigma_1 \geq \sigma_2 \geq \cdots \geq \sigma_6 \geq 0$,
- $V \in \mathbb{R}^{N \times 6}$ contains the right singular vectors.

The principal components are the **right singular vectors** $V$; the rows of $V^T$ (or equivalently the columns of $V$) are the eigenvectors of the $N×N$ covariance matrix. The diagonal elements of $Σ$ are related to the eigenvalues $λ_k$​ of the covariance matrix by $\lambda_k = \frac{\sigma_k^2}{m-1}$​​.

**Principal components and explained variance**

The $k-th$ principal component vector (as stored in `pca.components_`) is the $k-th$ row of $V^T$ (a vector of length $N$). Its corresponding eigenvalue $λ_k$​ measures the amount of variance captured by that component. The fraction of total variance explained by component $k$ is

$$VE_k = \frac{\lambda_k}{\sum_{j=1}^6 \lambda_j} = \frac{\sigma_k^2}{\sum_{j=1}^6 \sigma_j^2}$$

Because the singular values are sorted in descending order, PC1 explains the largest portion of variance, PC2 the second largest, and so on.

**Spatial interpretation**

When each principal component vector of length $N$ is reshaped back to $(H,W)$, we obtain a **spatial map** (an image). These images have the following properties :

- **PC1** captures the most dominant spatial pattern that is common to (or varies most across) the six input bands. In practice, PC1 often resembles a panchromatic brightness image because all bands tend to increase or decrease together with overall illumination.
- **PC2**, orthogonal to PC1, reveals the second most important pattern – often related to the contrast between vegetation (high NIR) and other surfaces.
- **PC3–PC6** represent progressively finer‑scale or noise‑driven patterns. High‑order components frequently carry sensor noise and can be discarded for compression.

**Transformation of original bands (not performed in this code)**

If one wished to project the original band images onto the principal components (i.e., obtain the “scores”), one would compute

$$T = X_c V \in \mathbb{R}^{6 \times 6}$$

but that would give a 6×6 matrix of component strengths per band, not a pixel‑wise transformation. The present implementation focuses on the **eigenimages** themselves (the $V$ vectors), which directly show the spatial structures responsible for the variance.

**The code’s specific steps**

1. The six bands are flattened to row vectors; the 6×N matrix `images` is created.
2. `PCA(n_components=6)` fits the model, storing `components_` (shape `(6, N)` – rows = principal components).
3. `self._output` is set to `pca.components_[:6]`, which contains all six eigenimages.
4. For visualisation, each component is reshaped to $(H,W)$ and displayed alongside its histogram.

**Input parameters (`__init__`) :**

| Parameter    | Type                                                        | Description                                                |
| ------------ | ----------------------------------------------------------- | ---------------------------------------------------------- |
| `red_path`   | `Path`                                                      | Path to the Red band                                       |
| `green_path` | `Path`                                                      | Path to the Green band                                     |
| `blue_path`  | `Path`                                                      | Path to the Blue band                                      |
| `nir_path`   | `Path`                                                      | Path to the NIR band                                       |
| `swir1_path` | `Path`                                                      | Path to the SWIR1 band                                     |
| `swir2_path` | `Path`                                                      | Path to the SWIR2 band                                     |
| `selectBand` | `Literal["red","green","blue" ,"nir","swir1","swir2",None]` | Band for which a separate histogram is computed (optional) |
|              |                                                             |                                                            |

**Processing steps :**

- Each band image is flattened into a 1D array.
- The six flattened arrays form a `(6, N_pixels)` matrix, which is passed to scikit‑learn’s PCA with `n_components=6`.
- The principal component vectors (each of length `N_pixels`) are stored in `self._output`.

**Visual output (`_export_file`) :**  
A composite 6×2 grid is generated :

- **Left column :** each principal component reshaped to the original image shape.
- **Right column :** the histogram of that component.  
   The components are labeled PC1 to PC6.

**Return value :**  
A NumPy array of shape `(6, N_pixels)`, where each row is one principal component vector.

**Usage example :**

```python
from fezrs.tools.pca import PCACalculator

calc = PCACalculator(
    red_path="B4.tif",
    green_path="B3.tif",
    blue_path="B2.tif",
    nir_path="B5.tif",
    swir1_path="B6.tif",
    swir2_path="B7.tif"
)

# Save the 6‑panel PDF with components and histograms
calc.execute(output_path="./pca_results/", title="PCA of 6 Landsat Bands", dpi=500)

# For a histogram of a single component (e.g., the one most related to SWIR2)
calc = PCACalculator(..., selectBand="swir2")
calc.histogram_export(output_path="./", title="PC Component analogous to SWIR2")
```

---

### 3. Technical Notes and Interpretation of Results

- **Importance of PC1 :** Often accounts for more than 90 % of the total variance. The PC1 image typically resembles a high‑resolution panchromatic image because brightness variations dominate the dataset.
- **PC2 and PC3 :** These components contain complementary spectral information that can distinguish between vegetation, soil, and water. A colour composite using PC1, PC2, and PC3 serves as an effective alternative to a natural‑colour image for visual analysis.
- **PC4–PC6 :** Primarily consist of sensor noise or very subtle variations. They are frequently omitted in data compression workflows.
- **Memory considerations :** The current implementation loads all pixel data into memory at once and performs SVD on a `(6, N)` matrix, which is memory‑efficient because N is large but m=6 is tiny. However, if the image is extremely large, the flattening step may still consume significant RAM.
- **Data scaling :** PCA is sensitive to the scale of the input variables. In this transposed approach, the variables are pixels, and their values are the raw or normalised reflectances. If the bands are not normalised beforehand, bands with larger dynamic ranges can dominate the first components. The code uses `get_images_collection()`, which may return raw digital numbers; applying a consistent normalisation before PCA is advisable.
- **Repeated computation in `histogram_export` :** Calling this method runs `process()` again, which recomputes the entire PCA. For large images this doubles the computation time; caching the result or computing the histogram directly from `self._output` would be more efficient.

---

### 4. Suggestions for Development

- **Data standardisation :** Add a `standardize=True` parameter to subtract the mean and divide by the standard deviation of each band (or each pixel in this transposed case) before PCA.
- **Save PCA model :** Allow exporting the trained PCA object (the eigenvectors) for applying the same transformation to other images.
- **GeoTIFF output :** Currently only PNG is saved. Adding the ability to store each principal component as a separate GeoTIFF file with georeferencing would facilitate further geospatial analysis.
- **Adjustable number of components :** Introduce an `n_components` parameter to let the user extract fewer than six components, reducing output size.
