# Filters

### 1. Introduction

This module provides a set of **convolution‑based and statistical filters** for enhancing, denoising, and extracting features from single‑band images. These tools are essential pre‑processing steps for many advanced remote sensing analyses such as edge detection, texture analysis, and image segmentation.

**Existing Classes :**

| Class Name            | Function                   | Common Application                                           |
| --------------------- | -------------------------- | ------------------------------------------------------------ |
| `GuassianCalculator`  | Gaussian blur filter       | Remove white noise, smooth the image while preserving edges  |
| `LaplacianCalculator` | Laplacian filter           | Edge detection and identification of rapid intensity changes |
| `MeanCalculator`      | Mean / average blur filter | Simple, fast image smoothing                                 |
| `MedianCalculator`    | Median blur filter         | Remove salt‑and‑pepper (impulse) noise                       |
| `SobelCalculator`     | Sobel filter               | Horizontal and vertical edge detection                       |

**Fundamentals of spatial filtering – the convolution operation**

All filters in this module (except the median filter) are linear and shift‑invariant, meaning they operate on the image through **discrete convolution** with a small matrix called a **kernel**. For a 2D image $I$ and a kernel $K$ of size $(2a+1)×(2a+1)$, the filtered image $I$′ at pixel $(x,y)$ is given by

$$I'(x, y) = \sum_{i=-a}^{a} \sum_{j=-a}^{a} K(i, j) \cdot I(x + i, y + j)$$

The kernel slides across every pixel of the image; at each position, the dot product of the kernel weights and the overlapping pixel values is computed and assigned to the output pixel. The **border** pixels, where the kernel extends beyond the image, are handled by OpenCV’s default border extrapolation (usually reflection or replication).

The choice of kernel coefficients determines the filter’s behaviour – blurring, sharpening, edge detection, etc. In the following sub‑sections the specific kernel and its mathematical properties are detailed for each class.

---

### 2. Detailed Documentation for Each Class

<span id="guassian-calculator"></span>

#### 2.1. `GuassianCalculator` – Gaussian Filter

**Scientific objective**  
Apply a low‑pass filter with a Gaussian‑shaped kernel to suppress high‑frequency noise while preserving edges better than a simple box‑average filter.

**Full Explanation of the Formula**

- **Gaussian kernel definition :**  
    The 2D isotropic Gaussian kernel has the form
    
    $$G(x, y) = \frac{1}{2\pi\sigma^2} \exp\left(-\frac{x^2 + y^2}{2\sigma^2}\right)$$
    
    where $σ$ is the standard deviation controlling the width of the bell curve. A larger $σ$ produces stronger smoothing.
    
- In OpenCV’s `GaussianBlur`, the user specifies the kernel size (width, height) – which must be odd and positive – and the standard deviation in the X and Y directions. If the standard deviation is set to 0 (as in this code), it is automatically computed from the kernel size as
    
    $$\sigma = 0.3 \cdot \left( \frac{k \cdot size - 1}{2} - 1 \right) + 0.8$$
    
    For a kernel size of 13×13, this yields an effective $σ≈0.3⋅(6−1)+0.8=2.3$. The kernel is then discretised and normalised so that the sum of all coefficients equals 1, preserving the image’s overall brightness.
    
- **Mathematical effect :**  
    The Gaussian filter is a weighted average where pixels closer to the centre contribute more. Because the weights decay smoothly according to the exponential function, the filter strongly attenuates high‑frequency components (noise) while causing less “ringing” artefacts and edge blurring than a uniform mean filter. In the frequency domain, the Gaussian kernel is itself a Gaussian, so convolution with the image corresponds to multiplication of the Fourier transforms – a pure low‑pass filtering with a smooth cut‑off.
    
- **Typical remote sensing use :**  
    Pre‑processing step before edge detection or segmentation, or to reduce sensor noise while maintaining the geometric fidelity of features.


**Input parameters (`__init__`) :**

|Parameter|Type|Description|
|---|---|---|
|`tif_path`|`str` or `Path`|Path to the single‑band input image (GeoTIFF or supported format)|

_Note :_ The kernel size is hard‑coded to `(13, 13)` and the standard deviation is automatically determined.

**Usage example :**
```python
from fezrs.tools.filters import GuassianCalculator

calc = GuassianCalculator(tif_path="path/to/band.tif")
calc.execute(output_path="./output/", title="Gaussian Blur", dpi=300)
```

---

<span id="laplacian-calculator"></span>

#### 2.2. `LaplacianCalculator` – Laplacian Filter

**Scientific objective**  
Compute the second spatial derivative of the image intensity to highlight regions of rapid intensity change (edges). The Laplacian detects edges irrespective of their orientation.

**Full Explanation of the Formula**

- **Laplacian operator :**  
    For a 2D continuous function $f(x,y)$, the Laplacian is defined as the sum of the second partial derivatives :
    
    $$\nabla^2 f = \frac{\partial^2 f}{\partial x^2} + \frac{\partial^2 f}{\partial y^2}$$
    
    In the discrete domain, the Laplacian is approximated by a convolution kernel. The OpenCV `Laplacian` function uses a kernel derived from central finite differences. A common 3×3 approximation (which OpenCV scales depending on `ksize`) is :
    
    $$K_L = 
    \begin{bmatrix}
    0 & 1 & 0 \\
    1 & -4 & 1 \\
    0 & 1 & 0
    \end{bmatrix}$$
    
    or the “eight‑neighbour” variant :
    
    $$\begin{bmatrix}
    1 & 1 & 1 \\
    1 & -8 & 1 \\
    1 & 1 & 1
    \end{bmatrix}$$
    
    For larger kernel sizes, OpenCV extends the approximation to incorporate more neighbours, but the principle remains: the centre weight is negative and the surrounding weights are positive, summing to zero so that homogeneous regions produce zero output.
    
- **Interpretation of the output :**
    
    - Zero crossings in the Laplacian correspond to edges.
        
    - The magnitude of the response indicates the sharpness of the intensity transition.
        
    - Because the Laplacian can output both positive and negative values, the code uses `-1` as the output data depth (`ddepth=-1`), meaning the output has the same depth as the input. For visualisation, it is common to take the absolute value to show all edges as bright features.
    
- **Edge detection mechanism :**  
    In a region of constant intensity, the second derivative is zero. Near an edge, the intensity changes abruptly, so the first derivative has a peak and the second derivative crosses zero. The Laplacian therefore marks both the location and the steepness of edges.
    
- **Parameter `kernel_size` :**  
    Must be positive and odd (e.g., 1, 3, 5, 7). A kernel size of 1 corresponds to a very simple discrete approximation. Larger kernels smooth the image somewhat before computing derivatives, making the edge detection less sensitive to noise.
    

**Input parameters :**

| Parameter     | Type            | Description                                                  |
| ------------- | --------------- | ------------------------------------------------------------ |
| `tif_path`    | `str` or `Path` | Path to the single‑band image                                |
| `kernel_size` | `int`           | Kernel size; must be a positive odd integer (e.g., 3, 5, 7). |

**Validation :** The `_validate` method checks that `kernel_size` is an integer, positive, and odd.

**Usage example :**
```python
calc = LaplacianCalculator(tif_path="band.tif", kernel_size=5)
calc.execute(output_path="./output/", title="Laplacian Edge Detection")
```

---

<span id="mean-calculator"></span>

#### 2.3. `MeanCalculator` – Mean (Average) Filter

**Scientific objective**  
Perform a simple uniform averaging over a square neighbourhood to blur the image and reduce noise. It is the simplest linear smoothing filter.

**Full Explanation of the Formula**

- **Mean filter kernel :**  
    The mean (or box) filter replaces each pixel with the arithmetic mean of all pixels inside a kernel of size $k×k$. The kernel coefficients are all equal:
    
    $$K_{mean}(i,j) = \frac{1}{k^2} \quad \text{for all } i, j$$
    
    For the fixed kernel size used in the code ($9×9$), the kernel is a 9×9 matrix with each entry = $1/81$.
    
- **Mathematical operation :**  
    If $W$ denotes the set of pixel indices in the window of size $k×k$ centred at $(x,y)$,
    
    $$I'(x, y) = \frac{1}{k^2} \sum_{(u, v) \in W} I(u, v)$$
    
    This is equivalent to convolution with the constant kernel.
    
- **Properties :**
    
    - The mean filter is a low‑pass filter : it averages out rapid variations (noise) but also blurs edges.
        
    - It is separable, meaning it can be implemented efficiently as two consecutive 1D convolutions (horizontal then vertical).
        
    - It minimises the variance of the output under Gaussian noise, but is poor for impulse noise (salt‑and‑pepper) because a single outlier can pull the mean significantly.
    
- **In remote sensing :**  
    Quick pre‑smoothing before computing simple indices, or as a baseline for comparing more sophisticated filters.


**Input parameters :**

| Parameter  | Type            | Description                   |
| ---------- | --------------- | ----------------------------- |
| `tif_path` | `str` or `Path` | Path to the single‑band image |

_Note :_ Kernel size is fixed to `(9, 9)` in the current code.

**Usage example :**
```python
calc = MeanCalculator(tif_path="band.tif")
calc.execute(output_path="./output/", title="Mean/Average Filter")
```

---

<span id="median-calculator"></span>

#### 2.4. `MedianCalculator` – Median Filter

**Scientific objective**  
Replace each pixel with the median value of its neighbourhood. This non‑linear filter is exceptionally good at eliminating **salt‑and‑pepper (impulse) noise** while preserving edges.

**Full Explanation of the Formula**

- **Median operation :**  
    For a window of size $k×k$ centred at $(x,y)$, collect all pixel values into a list, sort them, and pick the middle element :
    
    $$I'(x, y) = \text{median} \{I(u, v) \mid (u, v) \in W \}$$
    
    The kernel size in the code is user‑defined and must be an odd integer (e.g., 3, 5, 7). With `ksize=5`, the window contains 25 pixels.
    
- **Why it works :**  
    Isolated noise pixels (e.g., dead pixels or transmission errors) have extreme values (very bright or very dark). Because the median ignores the magnitude of outliers, they are completely removed as long as they occupy less than half of the window. At the same time, genuine edges – where many pixels on one side have similar high or low values – are preserved because the median jumps abruptly only when the majority of pixels in the window change.
    
- **Mathematical properties :**
    
    - The median filter is **non‑linear**, so it cannot be represented as a convolution.
        
    - It is **edge‑preserving** in the sense that it does not blur across edges.
        
    - Repeated application of the median filter eventually produces a root image that remains unchanged under further filtering.
        
    - The computational cost is higher than a mean filter because sorting is required per pixel; OpenCV’s implementation uses histogram‑based optimisations for speed.
    
- **Remote sensing relevance :**  
    Removal of impulse noise from sensor artefacts or atmospheric scattering, without degrading the sharpness of roads, field boundaries, and other high‑contrast structures.


**Input parameters :**

|Parameter|Type|Description|
|---|---|---|
|`tif_path`|`str` or `Path`|Path to the single‑band image|
|`kernel_size`|`int`|Kernel size; must be a positive odd integer.|

**Validation :** The `_validate` method checks the type and parity of `kernel_size`.

**Usage example :**
```python
calc = MedianCalculator(tif_path="noisy_band.tif", kernel_size=5)
calc.execute(output_path="./output/", title="Median Filter Denoising")
```

---

<span id="sobel-calculator"></span>

#### 2.5. `SobelCalculator` – Sobel Filter

**Scientific objective**  
Compute an approximation of the gradient of the image intensity function. The Sobel operator highlights edges by combining the spatial derivatives in the horizontal (x) and vertical (y) directions.

**Full Explanation of the Formula**

- **Gradient and the Sobel operator :**  
    The gradient of an image $I(x,y)$ is the vector :
    
    $$\nabla I = \begin{bmatrix} \frac{\partial I}{\partial x} & \frac{\partial I}{\partial y} \end{bmatrix}$$
    
    The magnitude of the gradient $∥∇I∥$ indicates how rapidly the intensity changes at a point, thus highlighting edges. The Sobel operator convolves the image with two 3×3 kernels (for a kernel size of 3) to approximate the derivatives. For larger kernel sizes, the operator is extended to smooth the derivatives over a larger area.
    
    The standard Sobel kernels for $ksize=3$ are :
    
    $$G_x = 
    \begin{bmatrix}
    -1 & 0 & +1 \\
    -2 & 0 & +2 \\
    -1 & 0 & +1
    \end{bmatrix}, \quad G_y = 
    \begin{bmatrix}
    -1 & -2 & -1 \\
    0 & 0 & 0 \\
    +1 & +2 & +1
    \end{bmatrix}$$
    
    where $G_x$​ detects vertical edges, and $G_y$​ detects horizontal edges.
    
- **Combined gradient in the code :**  
    The code uses `dx=1, dy=1`, which means both derivatives are computed and the output is the sum of the two gradient images (or more precisely, OpenCV’s `Sobel` with both `dx` and `dy` non‑zero returns the sum of the absolute values of the two directional derivatives if the `ddepth` is not floating‑point, or the sum of the derivatives if `ddepth` allows negative values). Here `ddepth=0` means the output has the same depth as the input (which is float after normalisation). The mixed derivative is not the true gradient magnitude but a reasonable approximation that detects edges in all orientations.
    
- **Mathematical meaning :**  
    For each pixel :
    
    $$\text{output} \approx \left| \frac{\partial I}{\partial x} \right| + \left| \frac{\partial I}{\partial y} \right| \quad \text{or} \quad \left| \frac{\partial I}{\partial x} \right| + \left| \frac{\partial I}{\partial y} \right|$$
    
    Edge pixels yield large output values; flat regions yield values near zero. Because the Sobel kernels incorporate smoothing (the central column/row has higher weights), the operator is less sensitive to noise than a simple central difference.
    
- **Edge detection application :**  
    The resulting image shows bright lines at the locations of edges. It is a first‑order derivative filter, so edges appear as ridges. Typical post‑processing includes thresholding the gradient magnitude to obtain a binary edge map.
    

**Input parameters :**

| Parameter     | Type            | Description                                                        |
| ------------- | --------------- | ------------------------------------------------------------------ |
| `tif_path`    | `str` or `Path` | Path to the single‑band image                                      |
| `kernel_size` | `int`           | Sobel kernel size; must be a positive odd integer (e.g., 3, 5, 7). |

_Note :_ The current code uses `dx=1, dy=1`, which combines horizontal and vertical derivatives. For directional edge detection, `dx=1, dy=0` or `dx=0, dy=1` could be used.

**Usage example :**
```python
calc = SobelCalculator(tif_path="band.tif", kernel_size=3)
calc.execute(output_path="./output/", title="Sobel Edge Detection", colormap="gray")
```

---

### 3. Common Technical Notes

1. **Dependency :** All these tools depend on the **OpenCV‑Python** (`cv2`) library. This library must be listed in `requirements.txt`.
    
2. **Input :** All classes receive a **single‑band** image (2D array). If a multi‑band TIF is loaded, `files_handler` must extract the appropriate band (the key `"tif"` is used).
    
3. **Fixed kernel size in Gaussian and Mean :** Currently, `GuassianCalculator` and `MeanCalculator` use hard‑coded kernel sizes. Future versions could expose `kernel_size` as a constructor parameter for greater flexibility.
    
4. **Typo in class name :** The class `GuassianCalculator` contains a typographical error; the correct spelling is `GaussianCalculator`. The documentation should note this, but the code must be called with `GuassianCalculator` as implemented.
    
5. **Performance :** OpenCV filters are implemented in C and are highly optimised. Even for large remote sensing images (e.g., full Landsat scenes), processing is fast.
