# Clustering

### 1. Introduction

This module provides **clustering algorithms** for analysing satellite images. In the current version, only the **K‑Means** algorithm is implemented. It can be used for **unsupervised classification** of land cover, image segmentation, or the identification of similar spectral patterns without requiring any training data.

**Existing Classes :**

| Class Name         | Application                                          |
| ------------------ | ---------------------------------------------------- |
| `KMeansCalculator` | K‑Means clustering on a single band (by default NIR) |

---

<span id="kmeans-calculator"></span>

### 2. `KMeansCalculator` – K‑Means Clustering

#### 2.1 Scientific Objective

The goal is to partition the pixels of an input image into a predefined number of groups (`n_clusters`) so that pixels within the same group are as similar as possible to each other, while pixels from different groups are as dissimilar as possible. The K‑Means algorithm achieves this by minimising the **within‑cluster sum of squared errors (WCSS)**, also called inertia.

In the present implementation, each pixel is represented by a single feature – its digital number (DN) in the NIR band after normalisation. The algorithm therefore operates in a one‑dimensional feature space.

#### 2.2 Full Explanation of the K‑Means Algorithm

K‑Means is an iterative, centroid‑based clustering method. Its mathematical formulation is as follows.

**Given :**

- A set of $N$ data points (pixels) $x_1, x_2, \ldots, x_N$, where each point is a vector. In this module, because only one band is used, each $x_i$ is a scalar (the pixel value).
    
- The desired number of clusters $K$.


**Objective :**  
Find a set of $K$ centroids $\mu_1, \mu_2, \ldots, \mu_K$ and an assignment of each data point to exactly one cluster that minimises the **within-cluster sum of squares (WCSS)**:

$$J = \sum_{k=1}^K \sum_{\mathbf{x}_i \in C_k} \| \mathbf{x}_i - \mu_k \|^2$$

where :
- $C_k$ is the set of points assigned to cluster $k$,
    
- $\mu_k$ is the centroid (mean) of the points in $C_k$,
    
- $\lVert \cdot \rVert$ denotes the Euclidean distance.


In the one‑dimensional case, the Euclidean distance reduces to the absolute difference :

$$\|x_i - \mu_k\|^2 = (x_i - \mu_k)^2$$

**Algorithm steps (Lloyd’s algorithm) :**

1. **Initialisation :**  
    Choose $K$ initial centroids. This can be done randomly (as controlled by the `random_state` parameter) or via a more sophisticated method (scikit‑learn’s default is `k-means++`, which spreads initial centroids apart). The initial centroids are denoted $\mu_1^{(0)}, \ldots, \mu_K^{(0)}$
    
2. **Assignment step (E‑step) :**  
    For each data point $x_i$, assign it to the cluster whose centroid is nearest :
$$C_k^{(t)} = \left\{ x_i : \|x_i - \mu_k^{(t)}\|^2 \leq \|x_i - \mu_j^{(t)}\|^2 \text{ for all } j \neq k \right\}$$
	
    Ties are broken arbitrarily.
    
3. **Update step (M‑step) :**  
    Recalculate the centroids as the mean of all points assigned to each cluster :
	
$$\mu_k^{(t+1)} = \frac{1}{|C_k^{(t)}|} \sum_{x_i \in C_k^{(t)}} x_i$$
    
    In the scalar case, this is simply the average of the pixel values in the cluster.
    
4. **Convergence check :**  
    Repeat steps 2 and 3 until the centroids no longer move (or the change is below a tolerance) or a maximum number of iterations is reached. The algorithm is guaranteed to converge to a local minimum of the WCSS.


**Application to the image data in the code :**

- The 2D image array ($height × width$) is reshaped into a 1D column vector of length $N=height×width$. Each element is a scalar representing the pixel’s value.
    
- The K‑Means model from scikit‑learn is then fitted on this data.
    
- After fitting, `kmeans.cluster_centers_` contains the final centroid values (scalars) for each of the $K$ clusters.
    
- `kmeans.labels_` contains the integer label (0 to $K-1$) indicating which cluster each pixel belongs to.
    
- The output image is constructed by taking, for each pixel, the **centroid value** of its assigned cluster (instead of the label). That is :

$$\text{output}[i, j] = \mu_{\text{label}[i,j]}$$

  This yields an image where each pixel is represented by the typical value of its cluster, effectively creating a piecewise constant approximation of the original image.


**Why use centroid values instead of labels?** 
This approach produces a visual output that directly shows the radiometric values characterising each cluster, which can be directly displayed and interpreted. If one needs the discrete class map, the labels can be retrieved by a simple modification of the code (see the technical notes).

#### 2.3 Input Parameters (`__init__`)

|Parameter|Type|Description|
|---|---|---|
|`nir_path`|`str` or `Path`|Path to the single‑band image file (usually NIR) to be clustered.|
|`n_clusters`|`int`|Desired number of clusters. **Must be ≥ 2.**|
|`random_state`|`int` or `None`|Seed for the random number generator to ensure reproducible results. `None` means random initialisation on every run.|

#### 2.4 Validation (`_validate`)

The `_validate` method is fully implemented and checks :

- `n_clusters` is an `int` and ≥ 2.
    
- `random_state` is either `None` or an `int`.
    
- The NIR band is a 2D `numpy.ndarray`.
    
- The metadata dictionary for the NIR band contains valid positive `width` and `height`.


#### 2.5 Return Value (`process`)

- A 2D `numpy.ndarray` of the same height and width as the input image. Each pixel holds the **centroid value** of the cluster to which it belongs (a float, because the input is normalised to $[0,1]$).


#### 2.6 Important Note on Output Display

Because the output is a continuous‑valued image (cluster centres), **using an appropriate colormap is essential** for visually distinguishing the clusters. If a default greyscale colormap is used, the cluster centres may appear very similar. Recommended colormaps: `'viridis'`, `'jet'`, `'plasma'` or any perceptually uniform sequential colormap. The `show_colorbar` option helps to interpret the values.

#### 2.7 Usage Example
```python
from pathlib import Path
from fezrs.tools.clustering import KMeansCalculator

calc = KMeansCalculator(
    nir_path="path/to/nir_band.tif",
    n_clusters=5,
    random_state=42
)

# Note: colormap='viridis' is required to see cluster separation
calc.execute(
    output_path="./results/",
    title="K-Means Clustering (5 Classes)",
    colormap="viridis",
    show_colorbar=True,
    dpi=300
)
```

---

### 3. Technical Notes and Development Suggestions

- **Dependency on scikit‑learn :** This module uses `sklearn.cluster.KMeans`. The installation instructions should confirm that `scikit‑learn` is listed in `requirements.txt`.
    
- **Single‑band limitation :** Currently only one band (NIR) is used. To improve classification accuracy, multiple bands (e.g., NIR, Red, Green) are typically used simultaneously. **Suggested optimisation :** Modify `__init__` to accept a list of band paths and reshape the data to `(n_pixels, n_bands)`.
    
- **Output representation :** The current output replaces pixel values with cluster centres. This is useful for visualisation but not for counting pixels per class.                       **Suggestion:** Add a parameter `return_labels` to allow access to the integer label array (`kmeans.labels_`).
    
- **Performance :** scikit‑learn’s K‑Means is efficient for images of moderate size (a few megapixels). For very large images (e.g., a full Landsat scene of ~8000×8000 pixels), memory and time can become bottlenecks. Future versions could use `MiniBatchKMeans` or sub‑sampling.
    
- **Empty method `_customize_export_file` :** This hook can be used to add custom annotations or a colour legend to the exported figure.
