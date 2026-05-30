## 1. Module Overview

The `clustering` module delivers unsupervised machine learning architectures designed for data-driven satellite image partitioning, thematic land-cover mapping, and unsupervised image segmentation. By isolating structural patterns directly from multi-spectral digital numbers ($DN$) without relying on prior training samples or ground-truth regions of interest ($ROI$), this module provides automated spatial categorization baseline maps.

### Core Architecture

In its production baseline, the module centers around a highly optimized, single-band iteration of the K-Means clustering algorithm. It inherits directly from the unified core architecture (`fezrs.base.BaseTool`) and integrates smoothly with the file-handling pipelines for automated spatial matrix loading and radiometric range standardization.

```
         fezrs.base.BaseTool [Base Architecture]
                   │
                   ▼
   ┌──────────────────────────────────────────────┐
   │         fezrs.tools.clustering Module        │
   ├──────────────────────────────────────────────┤
   │                                              │
   ▼                                              ▼
KMeansCalculator [Core Logic]           scikit-learn Pipeline
   │                                              │
   ▼                                              ▼
1D Feature Matrix ──────────────────────► WCSS Minimization Optimization
```

## 2. Comprehensive Class Specification: `KMeansCalculator`

### 2.1. Scientific and Mathematical Objective

The algorithmic mission of `KMeansCalculator` is to partition an input image's continuous spectral space into a discrete number of mutually exclusive, high-homogeneity classes ($K$). The mathematical objective function seeks to minimize the total structural variance within each individual spatial segment. This is achieved by iteratively optimizing cluster assignments to lower the **Within-Cluster Sum of Squares ($WCSS$)**, also known as algorithmic **inertia**.

In this execution architecture, the model operates over a one-dimensional feature space derived from the standardized pixel magnitudes of the Near-Infrared ($NIR$) band:

$$x_i \in \mathbb{R}^1 \quad \forall \quad i \in \{1, 2, \dots, N\}$$

### 2.2. Algorithmic Matrix Iterations & Mathematical Foundations

Given a discrete sequence containing $N$ scalar data points $X=\{x_1​,x_2​,…,x_N​\}$ extracted from the flattened image grid, and an explicit user-defined cluster cardinality integer $K$, the mathematical objective minimizes the unified structural cost function $J$:

$$J = \sum_{k=1}^{K} \sum_{x_i \in C_k} \|x_i - \mu_k\|^2$$

Where:

- $C_k$​ represents the explicit spatial subset containing all data vectors mapped to the $k$-th cluster group.
    
- $μ_k$​ is the derived geometric mean vector, marking the explicit multidimensional coordinate coordinate position of the $k$-th cluster centroid.
    
- $∥⋅∥^2$ represents the standard Euclidean norm vector distance metric.


Because this structural calculator evaluates a singular band domain, the multi-dimensional distance reduces to an absolute scalar square operation:

$$\|x_i - \mu_k\|^2 = (x_i - \mu_k)^2$$

```
[Flatten 2D Raster] ──► [Construct 1D Column Matrix] ──► [Seed Centroids via k-means++]
                                                                   ▲
                                                                   │ (Iterate Loop)
[Check Convergence] ◄── [Recalculate Means (M-Step)] ◄── [Map Minimum Distance (E-Step)]
```

#### Detailed Iterative Execution Framework (Lloyd's Optimization Workflow)

##### Step 1: High-Fidelity Initialization Framework

The system seeds $K$ initial centroid coordinates within the scalar spectrum domain:

$$\mu_1^{(0)}, \mu_2^{(0)}, \dots, \mu_K^{(0)}$$

By default, the optimization bypasses standard random seeding in favor of the **`k-means++`** topology. This approach samples initial centroids via a probability distribution proportional to the squared distance from existing centers, ensuring well-spaced initial seeds and accelerating global convergence.

##### Step 2: Spatial Expectation Step (E-Step)

Each individual pixel value $x_i$​ across the entire array is mapped concurrently to its mathematically nearest centroid coordinate position:

$$C_k^{(t)} = \left\{ x_i : (x_i - \mu_k^{(t)})^2 \le (x_i - \mu_j^{(t)})^2 \quad \forall \quad 1 \le j \le K \right\}$$

If a pixel exhibits an identical spatial distance to two separate centroids, the tie is broken arbitrarily using numerical priority logic.

##### Step 3: Maximization Update Step (M-Step)

The coordinate positions of all cluster centroids are updated by computing the arithmetic mean of all pixel values assigned to that specific cluster:

$$\mu_k^{(t+1)} = \frac{1}{|C_k^{(t)}|} \sum_{x_i \in C_k^{(t)}} x_i$$

Where ${|C_k^{(t)}|}$ is the absolute cardinality (total pixel count) of the targeted cluster subset.

##### Step 4: Mathematical Convergence Criteria

The calculator loops Steps 2 and 3 until it meets one of the following stopping criteria:

- The absolute coordinate movement of the centroids falls below the convergence tolerance parameter $(ϵ=1e−4)$:

$$\max_k |\mu_k^{(t+1)} - \mu_k^{(t)}| < \epsilon$$

- The system reaches its maximum execution iteration limit (`max_iter=300`).

### 2.3. Radiometric Mapping Matrix Strategy

Once the clustering routine converges, `kmeans.cluster_centers_` stores the final optimized continuous scalar centroids ($μ_k$​), and `kmeans.labels_` holds the discrete pixel assignments ($0≤label≤K−1$).

Rather than exporting raw categorical class labels, the processing pipeline generates a custom radiometric reconstruction map:

$$\text{Output}[i, j] = \mu_{\text{label}[i, j]}$$

This maps each pixel to the continuous floating-point value of its corresponding cluster centroid. This approach preserves the absolute physical properties of the input data, producing a simplified, constant approximation that remains directly comparable to the input imagery.

### 2.4. Interface Architecture

#### Constructor Method Input Arguments (`__init__`)

- `nir_path` (`str` | `Path`): File location pointing to the single-band raster target (typically Near-Infrared).
    
- `n_clusters` (`int`): Target cluster cardinality integer constraint. Must satisfy:
	
$$n_{\text{clusters}} \ge 2$$
	
- `random_state` (`int` | `None`): Hardcoded seed initialization controller for reproducible centroid generation.

#### Validation Engineering (`_validate`)

The explicit `_validate()` methodology enforces strict programmatic constraints before execution:

1. Verifies that `n_clusters` is a valid integer and greater than or equal to 2.
    
2. Assures `random_state` matches proper typing constraints (`int` or `None`).
    
3. Confirms the input raster resolves into a true two-dimensional array (`ndim == 2`).
    
4. Checks the input metadata to ensure positive dimensional extents:

$$\text{Height} > 0 \quad \text{and} \quad \text{Width} > 0$$

#### Return State (`process()`)

Returns a continuous floating-point 2D `numpy.ndarray` array with spatial dimensions matching the input image. Each pixel contains the absolute centroid value of its assigned cluster, scaled to the standardized range of $[0.0,1.0]$.

### 2.5. Operational Implementation

```Python
from pathlib import Path
from fezrs.tools.clustering import KMeansCalculator

# Initialize the unsupervised K-Means pipeline
segmentation_engine = KMeansCalculator(
    nir_path=Path("./data/Sentinel2_NIR.tif"),
    n_clusters=4,
    random_state=101
)

# Execute unsupervised classification and save spatial partitions
# Note: Perceptually uniform colormaps like 'viridis' or 'plasma' 
# maximize visual separation across adjacent continuous centroid levels.
segmentation_engine.execute(
    output_path="./exports/unsupervised_segments/",
    title="K-Means Unsupervised Segmentation (4 Classes)",
    colormap="viridis",
    show_colorbar=True,
    dpi=500
)
```

## 3. Engineering Enhancements & Vectorization Guide

### 3.1. Upgrading to Multi-Spectral Feature Vectors

The single-band configuration limits the algorithm's ability to differentiate complex land-cover classes that share similar NIR signatures but differ across other wavelengths (e.g., urban concrete vs. highly reflective soils). Upgrading the feature space to accept arbitrary multi-spectral stacks significantly improves classification accuracy.

#### Production-Ready Multi-Band Architecture

The implementation below updates the initialization logic to process an arbitrary list of spectral bands, reorganizing the feature space into an optimized multi-spectral matrix format:

```Python
import numpy as np
from sklearn.cluster import KMeans
from fezrs.base import BaseTool

class MultiSpectralKMeansCalculator(BaseTool):
    def __init__(self, band_paths: list, n_clusters: int = 4, random_state: int = 42):
        # Initialize parent architecture with dynamic band arguments
        super().__init__(**{f"band_{i}": path for i, path in enumerate(band_paths)})
        self.n_clusters = n_clusters
        self.random_state = random_state
        self.band_paths = band_paths

    def process(self):
        # Extract and normalize imagery arrays via files_handler
        bands_list = []
        for i in range(len(self.band_paths)):
            band_data = self.files_handler.get_normalized_bands([f"band_{i}"])[f"band_{i}"]
            bands_list.append(band_data)
            
        # Capture precise original spatial layout coordinates
        height, width = bands_list[0].shape
        n_bands = len(bands_list)
        
        # Stack individual matrices into a continuous multi-spectral array: (Height, Width, Bands)
        stacked_raster = np.stack(bands_list, axis=2)
        
        # Reshape to 2D matrix format: (Total Pixels, Multi-Spectral Features)
        # Structural Complexity: Transforming from O(N*M) spatial loops into O(1) vectorized blocks
        feature_matrix = stacked_raster.reshape((height * width, n_bands))
        
        # Initialize optimized Scikit-Learn KMeans infrastructure
        kmeans = KMeans(
            n_clusters=self.n_clusters, 
            init="k-means++", 
            random_state=self.random_state,
            n_init="auto"
        )
        
        # Fit model on multi-spectral feature vectors
        labels = kmeans.fit_predict(feature_matrix)
        centroids = kmeans.cluster_centers_
        
        # Map pixels to their respective multi-spectral centroid vector magnitudes
        # Computes the continuous vector length to generate a visualizable 2D representation
        centroid_magnitudes = np.linalg.norm(centroids, axis=1)
        reconstructed_flat = centroid_magnitudes[labels]
        
        # Reshape the output vector back to the original 2D spatial dimensions
        self._output = reconstructed_flat.reshape((height, width))
        return self._output
```

### 3.2. Adding Categorical Mask Controls via Dual-Return Vectors

The standard pipeline displays continuous centroid values directly for immediate visualization. However, downstream GIS applications often require discrete categorical index maps (e.g., to perform pixel count evaluations or areal coverage assessments).

To support both workflows, update the execution pipeline to conditionally export standard integer classification maps (`labels_map`) using a `return_labels` configuration flag:

```Python
def process(self, return_labels: bool = False):
    self._validate()
    
    # Isolate geometry attributes
    height = self.metadata_shape["nir"]["height"]
    width = self.metadata_shape["nir"]["width"]
    
    # Flatten spatial arrays into unified feature columns
    flat_features = self.files_handler.get_images_collection()["nir"].flatten().reshape(-1, 1)
    
    kmeans = KMeans(n_clusters=self.n_clusters, init="k-means++", random_state=self.random_state)
    kmeans.fit(flat_features)
    
    if return_labels:
        # Export programmatic integer discrete indices directly: [0, 1, ..., K-1]
        self._output = kmeans.labels_.reshape((height, width))
    else:
        # Reconstruct custom continuous scalar centroid map
        centroids = kmeans.cluster_centers_.flatten()
        self._output = centroids[kmeans.labels_].reshape((height, width))
        
    return self._output
```

### 3.3. Performance Optimization for Large Raster Datasets

When processing massive satellite grids (e.g., complete Landsat scenes of $≈8000×8000$ pixels), standard K-Means can hit severe memory and compute walls. This bottleneck can be resolved by transitioning the processing pipeline to use **`MiniBatchKMeans`**.

#### Performance Matrix Analysis

- **Standard KMeans (Full Batch):** Computes distance profiles across every single pixel vector simultaneously during each iteration step. This exhibits linear memory scaling requirements $O(N)$ that can quickly exhaust system RAM on large datasets.
    
- **MiniBatchKMeans Optimization:** Samples small, randomized pixel subsets (e.g., `batch_size=2048`) during each optimization step. This keeps the memory footprint bounded at a constant value $O(1)$, dramatically reducing execution times while maintaining comparable clustering accuracy.

```
[Full Batch K-Means]   ──► Computes All ~64M Pixels Simultaneously ──► High RAM Load
[MiniBatch K-Means]    ──► Iterates via Randomized 2048-Pixel Buffers  ──► Constant RAM Load (Fast)
```
