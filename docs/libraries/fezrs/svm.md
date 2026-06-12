# SVM


### 1. Introduction

This module implements the **Support Vector Machine (SVM)** algorithm for supervised classification of multi‑band satellite images. Its distinctive feature is the **interactive selection** of training samples directly on an RGB preview of the image using an OpenCV graphical interface.

**Existing Classes :**

| Class Name      | Application                                                                |
| --------------- | -------------------------------------------------------------------------- |
| `SVMCalculator` | Image classification with SVM and training sample selection via OpenCV GUI |

**Note on `__init__.py` :** The file `__init__.py` inside the `svm` folder is currently empty. It must be corrected to export the class :
``` python
 from .svm_calculator import SVMCalculator
``` 

 ---

<span id="svm-calculator"></span>

### 2. `SVMCalculator` – Supervised SVM Classification

#### 2.1 Scientific Objective

Separate different land‑cover types (water, forest, urban area, bare soil, etc.) by training a Support Vector Machine on user‑selected pixels. The algorithm learns a decision boundary in the six‑dimensional spectral space and then classifies every pixel of the image accordingly.

#### 2.2 Full Mathematical Explanation of the SVM Algorithm Used

The core of the classification is a supervised machine learning method that constructs a separating hyperplane (or set of hyperplanes) in a high‑dimensional feature space, maximising the margin between different classes.

**1. Feature representation**

Each pixel is represented by a feature vector of length 6 : its reflectance (or normalised digital number) in the six input bands :

$$x = [\text{Red, Green, Blue, NIR, SWIR1, SWIR2}]^T \in \mathbb{R}^6$$

The training set consists of $N$ labelled examples $(x_i,y_i)$, where $y_i \in \{1, \ldots, K\}$ (with $K = \text{class\_number}$) is the class label manually assigned by the user.

**2. The binary SVM – maximal margin classifier**

Originally, SVM is a binary classifier. For two classes with labels encoded as $+1$ and $-1$, it seeks the hyperplane

$$w^T x + b = 0$$

that separates the classes with the largest possible **margin**. The margin is defined as the distance from the hyperplane to the nearest data point of any class. Maximising the margin leads to the optimisation problem :

$$\min_{w,b} \frac{1}{2} \|w\|^2$$

subject to

$$y_i(\mathbf{w}^\top \mathbf{x}_i + b) \geq 1 \quad \forall i$$

The points lying exactly on the boundaries $y_i(\mathbf{w}^\top x_i+b)=1$ are the **support vectors**.

**3. Soft‑margin SVM (C‑SVM)**

When the data are not perfectly separable, slack variables $\xi_i \geq 0$ are introduced to allow some misclassification :

$$\min_{w,b,\xi} \frac{1}{2} \|w\|^2 + C \sum_{i=1}^N \xi_i$$

subject to

$$y_i(\mathbf{w}^\top \mathbf{x}_i + b) \geq 1 - \xi_i, \quad \xi_i \geq 0$$

The parameter $C>0$ controls the trade‑off between a wide margin and the number of misclassified training points. In the code, the default $C=1$ is used (scikit‑learn’s default).

**4. The kernel trick and the RBF kernel**

For data that are not linearly separable in the original feature space, SVM can implicitly map the input vectors into a higher‑dimensional space via a kernel function $K(x_i,x_j)=\phi(x_i)^\top\phi(x_j)$. The decision function then becomes

$$f(x) = \sum_{i \in SV} \alpha_i y_i K(x_i, x) + b$$

where $\alpha_i$ are the Lagrange multipliers obtained from the dual problem.

The code uses the **Radial Basis Function (RBF)** kernel with `gamma='scale'` (the scikit‑learn default for SVC). The RBF kernel is defined as :

$$K(x_i, x_j) = \exp\left(-\gamma\|x_i - x_j\|^2\right)$$

When `gamma='scale'`, the parameter is computed automatically as

$$\gamma = \frac{1}{n_{\text{features}} \times \text{Var}(X)}$$

where $n_{\text{features}}=6$ and $\operatorname{Var}(X)$ is the variance of the training data. This adaptive scaling ensures that the kernel’s sensitivity to distance is appropriate for the spread of the data.

**5. Multi‑class classification**

While SVM is inherently binary, the code uses scikit‑learn’s `SVC` which handles multiple classes by a **one‑versus‑one** strategy : for $K$ classes, $K(K-1)/2$ binary classifiers are trained. Each classifier separates a pair of classes. A new pixel is assigned to the class that wins the most pairwise contests.

**6. Application in the code**

- The training data matrix $X$ has shape $(N_{\text{train}},6)$, where $N_{\text{train}}=\text{class\_number}\times\text{sample\_number}$.
    
- The label vector $Y$ is built by repeating the class numbers : class 1 repeated `sample_number` times, then class 2, etc.
    
- After the user clicks the last required sample, the SVM is trained :
    
```python
clf = svm.SVC(gamma="scale")
clf.fit(X, Y)
```
    
    
- The prediction step applies the trained classifier to **all** pixels of the image, reshaped to a matrix of shape $(H×W,6)$ :
    
```python
pred = clf.predict(all_image_reshape)
```
    
    
- The resulting 1D array of class labels is reshaped back to $(H,W)$ and stored as the output. The classification map contains integer values from 1 to `class_number`.


**7. Decision function and probability**

For an individual pixel $x$, the class label $\hat{y}$ is determined by the majority vote among the binary classifiers. The distance to the hyperplane (decision function value) can optionally be obtained, but the code currently returns only the discrete class labels.

**Input parameters (`__init__`) :**

|Parameter|Type|Default|Description|
|---|---|---|---|
|`red_path`|`Path`|–|Red band file|
|`green_path`|`Path`|–|Green band file|
|`blue_path`|`Path`|–|Blue band file|
|`nir_path`|`Path`|–|NIR band file|
|`swir1_path`|`Path`|–|SWIR1 band file|
|`swir2_path`|`Path`|–|SWIR2 band file|
|`class_number`|`int`|`4`|Number of land‑cover classes (≥ 2).|
|`sample_number`|`int`|`10`|Number of training pixels per class (≥ 1).|

**Interactive execution process :**

1. An OpenCV window titled `"mouseClick"` opens showing an RGB composite (R = Red, G = Green, B = Blue, all normalised to $[0,1]$).
    
2. The user must click on representative pixels for each class, in order: all samples for class 1 first, then class 2, …, up to class `class_number`.
    
3. After `class_number × sample_number` left‑clicks, training starts automatically.
    
4. The trained SVM classifies every pixel in the image.
    
5. The thematic map is saved to the specified output directory as a PNG file (and optionally GeoTIFF if implemented in the future).


**Validation (`_validate`) :**

- Ensures `class_number` ≥ 2 and `sample_number` ≥ 1.
    
- Verifies that the total number of requested samples does not exceed the number of pixels.
    
- Issues a warning if the total sample count exceeds 5 % of all pixels (indicating a heavy manual workload).    

**Return value :**

- A 2D `numpy.ndarray` of shape $(H,W)$ containing integer class labels (1 to `class_number`).


**Usage example :**
```python
from fezrs.tools.svm import SVMCalculator

calc = SVMCalculator(
    red_path="B4.tif",
    green_path="B3.tif",
    blue_path="B2.tif",
    nir_path="B5.tif",
    swir1_path="B6.tif",
    swir2_path="B7.tif",
    class_number=5,
    sample_number=15
)
# An OpenCV window will appear; select 5 classes × 15 samples manually.
calc.execute(output_path="./results/", title="Land Cover Map", colormap="tab10")
```

---

### 3. Important Technical Notes

- **GUI requirement :** The tool uses `cv2.imshow` and therefore **requires a graphical display**. It will not run on headless servers or online notebooks without an X11 virtual framebuffer (Xvfb).
    
- **Dependencies :** `opencv-python`, `scikit-learn`, `pandas`, `scikit-image`.
    
- **Memory usage :** The entire six‑band image is loaded into memory as a single array of shape $(H×W,6)$. For a full Landsat scene (~8000×8000 pixels), this consumes approximately $8000 \times 8000 \times 6 \times 4 \text{ bytes} \approx 1.5 \text{ GB}$. Very large scenes may require sub‑sampling or chunked processing.
    
- **Order of sample collection :** The user must strictly follow the class order. The DataFrame is constructed so that the first `sample_number` rows correspond to class 1, the next group to class 2, etc. Any deviation will assign wrong labels.
    
- **Fixed SVM hyperparameters :** The code uses the RBF kernel with `gamma='scale'` and regularization parameter `C=1` (the scikit‑learn defaults). These values are not exposed to the user but can be changed directly in the source code.
    
- **No feature standardisation :** The feature vectors are taken from the normalised bands (already in $[0,1]$). While the bands are on a common scale, their variances can differ significantly. Standardising (zero mean, unit variance per feature) before training could improve accuracy and is a recommended future enhancement.
    
- **The `__init__.py` file :** At the time of writing, `svm/__init__.py` is empty. It must be created with the correct import statement as shown in Section 1.

---

### 4. Suggestions for Development

- **Save and load training samples :** Enable exporting the clicked coordinates to a CSV or shapefile for reuse in later sessions or to share with collaborators.
    
- **Non‑interactive mode :** Add the ability to pass training data directly from a file (e.g., a CSV of feature vectors and labels) to allow batch processing and scripted workflows.
    
- **Expose SVM parameters :** Allow the user to choose the kernel (`'linear'`, `'poly'`, `'rbf'`, `'sigmoid'`), the regularisation parameter $C$, and the kernel coefficient $γ$ via the constructor arguments.
    
- **Feature standardisation :** Add a boolean parameter `scale=True` that would apply `sklearn.preprocessing.StandardScaler` to the input bands before training and prediction.
    
- **On‑screen feedback :** Display a counter (e.g., `"Class 2 – sample 3/10"`) directly on the OpenCV image to prevent confusion during the lengthy clicking procedure.
    
- **Probability output :** Use `svm.SVC(probability=True)` and return class probabilities in addition to (or instead of) hard labels, enabling uncertainty analysis.
