# Modules

## **Overview**

FEZrs embraces the **"simple yet powerful"** design principle.

Most tools in this library share a **unified structure** and can be used in a similar way — this makes learning and using FEZrs extremely easy and intuitive.

> Unless noted otherwise, nearly **all modules can be used as shown in the [Usage](docs/getting-started.md) section**.

These modules serve as **core calculators** for the main tool categories like:

- `change_detection`
- `clustering`
- `filters`
- `glcm`
- `hsv`
- `image_enhancement`
- `import_tools`
- `mosaic`
- `pca`
- `spectral_indices`
- `spectral_profile`
- `svm`

Each module is accessible directly and can be plugged into custom workflows or pipelines built on `BaseTool`.

---

## Module Table

| Module                    | Input Bands    | Parameters                          | Description                           | Tool Category     |
| ------------------------- | -------------- | ----------------------------------- | ------------------------------------- | ----------------- |
| KMeansCalculator          | 1–N            | `n_clusters`, `init`, `max_iter`    | Applies K-Means clustering            | Clustering        |
| GuassianCalculator        | 1              | `kernel_size`, `sigma`              | Gaussian blur filter                  | Filters           |
| LaplacianCalculator       | 1              | `ksize`                             | Edge detection via Laplacian operator | Filters           |
| MeanCalculator            | 1              | `kernel_size`                       | Mean (box) filter                     | Filters           |
| MedianCalculator          | 1              | `kernel_size`                       | Median noise reduction                | Filters           |
| SobelCalculator           | 1              | `dx`, `dy`, `ksize`                 | Sobel edge detector                   | Filters           |
| GLCMCalculator            | 1              | `distances`, `angles`, `properties` | Texture extraction (GLCM)             | GLCM              |
| HSVCalculator             | RGB            | —                                   | Converts RGB to HSV                   | HSV               |
| IRHSVCalculator           | IR, R, G       | —                                   | Alternative HSV calc with IR          | HSV               |
| AdaptiveCalculator        | 1              | `clip_limit`, `tile_grid_size`      | Adaptive histogram equalization       | Image Enhancement |
| AdaptiveRGBCalculator     | RGB            | same as above                       | Adaptive hist. for RGB images         | Image Enhancement |
| EqualizeCalculator        | 1              | —                                   | Global histogram equalization         | Image Enhancement |
| EqualizeRGBCalculator     | RGB            | —                                   | Equalization for RGB                  | Image Enhancement |
| FloatCalculator           | 1              | —                                   | Converts bands to float32             | Image Enhancement |
| GammaCalculator           | 1              | `gamma`                             | Gamma correction                      | Image Enhancement |
| GammaRGBCalculator        | RGB            | `gamma`                             | Gamma correction for RGB              | Image Enhancement |
| LogAdjustCalculator       | 1              | `gain`                              | Logarithmic brightness adjust         | Image Enhancement |
| OriginalCalculator        | 1              | —                                   | Returns unmodified input              | Image Enhancement |
| OriginalRGBCalculator     | RGB            | —                                   | Returns RGB input unchanged           | Image Enhancement |
| SigmoidAdjustCalculator   | 1              | `gain`, `cutoff`                    | Sigmoid contrast adjustment           | Image Enhancement |
| PCACalculator             | N              | `n_components`                      | Principal Component Analysis          | PCA               |
| AFVICalculator            | NIR, Red, Blue | —                                   | Calculates AFVI index                 | Spectral Indices  |
| BICalculator              | SWIR1, SWIR2   | —                                   | Brightness Index                      | Spectral Indices  |
| NDVICalculator            | NIR, Red       | —                                   | NDVI vegetation index                 | Spectral Indices  |
| NDWICalculator            | Green, NIR     | —                                   | NDWI water index                      | Spectral Indices  |
| SAVICalculator            | NIR, Red       | `L`                                 | Soil Adjusted Vegetation Index        | Spectral Indices  |
| UICalculator              | Blue, Red      | —                                   | Urban Index                           | Spectral Indices  |
| SpectralProfileCalculator | N              | `pixels`, `wavelengths`             | Extracts spectral signature           | Spectral Profile  |
