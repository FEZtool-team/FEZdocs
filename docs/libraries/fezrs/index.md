# Overview

FEZrs embraces the **"simple yet powerful"** design principle.

Most tools in this library share a **unified structure** and can be used in a similar way - this makes learning and using FEZrs extremely easy and intuitive.

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

## Contributors

FEZrs is built in public, and every issue, fix, idea, example, and documentation improvement helps the package become more useful for remote sensing and geospatial work.

<div class="contributors-strip" aria-label="FEZrs contributors">
  <a class="contributor-chip" href="https://github.com/mhdned" target="_blank" rel="noopener" aria-label="mhdned on GitHub">
    <img src="https://avatars.githubusercontent.com/u/53142654?v=4" alt="mhdned" loading="lazy">
    <span>mhdned</span>
  </a>
  <a class="contributor-chip" href="https://github.com/aradfarahani" target="_blank" rel="noopener" aria-label="aradfarahani on GitHub">
    <img src="https://avatars.githubusercontent.com/u/90475349?v=4" alt="aradfarahani" loading="lazy">
    <span>aradfarahani</span>
  </a>
  <a class="contributor-chip" href="https://github.com/mkiani12" target="_blank" rel="noopener" aria-label="mkiani12 on GitHub">
    <img src="https://avatars.githubusercontent.com/u/60611017?v=4" alt="mkiani12" loading="lazy">
    <span>mkiani12</span>
  </a>
  <a class="contributor-chip" href="https://github.com/faribakhosravani" target="_blank" rel="noopener" aria-label="faribakhosravani on GitHub">
    <img src="https://avatars.githubusercontent.com/u/261212779?v=4" alt="faribakhosravani" loading="lazy">
    <span>faribakhosravani</span>
  </a>
  <a class="contributor-chip" href="https://github.com/jpyNicolas" target="_blank" rel="noopener" aria-label="jpyNicolas on GitHub">
    <img src="https://avatars.githubusercontent.com/u/106113390?v=4" alt="jpyNicolas" loading="lazy">
    <span>jpyNicolas</span>
  </a>
  <a class="contributor-chip" href="https://github.com/arasbadrooj" target="_blank" rel="noopener" aria-label="arasbadrooj on GitHub">
    <img src="https://avatars.githubusercontent.com/u/199924148?v=4" alt="arasbadrooj" loading="lazy">
    <span>arasbadrooj</span>
  </a>
  <a class="contributor-chip" href="https://github.com/erfan82karim" target="_blank" rel="noopener" aria-label="erfan82karim on GitHub">
    <img src="https://avatars.githubusercontent.com/u/123228810?v=4" alt="erfan82karim" loading="lazy">
    <span>erfan82karim</span>
  </a>
  <a class="contributor-chip" href="https://github.com/Fatemehnajafi97" target="_blank" rel="noopener" aria-label="Fatemehnajafi97 on GitHub">
    <img src="https://avatars.githubusercontent.com/u/182514440?v=4" alt="Fatemehnajafi97" loading="lazy">
    <span>Fatemehnajafi97</span>
  </a>
  <a class="contributor-chip" href="https://github.com/mahlazafar" target="_blank" rel="noopener" aria-label="mahlazafar on GitHub">
    <img src="https://avatars.githubusercontent.com/u/188618676?v=4" alt="mahlazafar" loading="lazy">
    <span>mahlazafar</span>
  </a>
  <a class="contributor-chip" href="https://github.com/NimaRaeisi" target="_blank" rel="noopener" aria-label="NimaRaeisi on GitHub">
    <img src="https://avatars.githubusercontent.com/u/154989369?v=4" alt="NimaRaeisi" loading="lazy">
    <span>NimaRaeisi</span>
  </a>
  <a class="contributor-chip" href="https://github.com/elmielmo" target="_blank" rel="noopener" aria-label="elmielmo on GitHub">
    <img src="https://avatars.githubusercontent.com/u/87499398?v=4" alt="elmielmo" loading="lazy">
    <span>elmielmo</span>
  </a>
  <a class="contributor-chip" href="https://github.com/yooneskiani" target="_blank" rel="noopener" aria-label="yooneskiani on GitHub">
    <img src="https://avatars.githubusercontent.com/u/178902271?v=4" alt="yooneskiani" loading="lazy">
    <span>yooneskiani</span>
  </a>
</div>

<p class="contributors-note">
  Contributor avatars are linked to GitHub profiles and based on the FEZrs public contributor list.
  <a href="https://github.com/FEZtool-team/FEZrs/graphs/contributors" target="_blank" rel="noopener">View the live contributors graph</a>.
</p>

---

## Contributing

<div class="contribution-policy">
  <article>
    <h3>Good first contributions</h3>
    <p>Bug reports, clearer examples, documentation fixes, tests, and small remote-sensing workflow improvements are welcome.</p>
  </article>
  <article>
    <h3>Before opening a pull request</h3>
    <p>Open or check an issue first for larger changes, keep the branch focused, and explain the use case so maintainers can review it quickly.</p>
  </article>
  <article>
    <h3>Quality bar</h3>
    <p>Include tests or examples when behavior changes, keep public APIs documented, and avoid unrelated formatting or refactors in the same pull request.</p>
  </article>
  <article>
    <h3>Community policy</h3>
    <p>Be respectful, practical, and research-minded. FEZrs follows the repository code of conduct for all project spaces.</p>
  </article>
</div>

Useful contribution links:

- [FEZrs repository](https://github.com/FEZtool-team/FEZrs)
- [Open FEZrs issues](https://github.com/FEZtool-team/FEZrs/issues)
- [FEZrs pull requests](https://github.com/FEZtool-team/FEZrs/pulls)
- [FEZrs tests](https://github.com/FEZtool-team/FEZrs/tree/main/tests)
- [FEZrs code of conduct](https://github.com/FEZtool-team/FEZrs/blob/main/CODE_OF_CONDUCT.md)

---

## Module Table

| Calculator | Input Bands | Parameters | Description | Tool Category |
| ---------- | ----------- | ---------- | ----------- | ------------- |
| [BurnCalculator](./change-detection#burn-calculator) | Post/pre NIR, SWIR2 | - | Identifies high-severity burned areas with dNBR | Change Detection |
| [IndicesCalculator](./change-detection#indices-calculator) | Post/pre NIR, SWIR2 | `time` | Computes NBR for one selected date | Change Detection |
| [MagDirCalculator](./change-detection#magdir-calculator) | Post/pre NIR, SWIR1 | `selecte` | Computes change-vector magnitude or direction | Change Detection |
| [SubDivCalculator](./change-detection#subdiv-calculator) | Post/pre band | `operation` | Performs band subtraction or division between dates | Change Detection |
| [TimeCalculator](./change-detection#time-calculator) | Post/pre band | `time` | Extracts a raw before or after image | Change Detection |
| [KMeansCalculator](./clustering#kmeans-calculator) | 1 | `n_clusters`, `random_state` | Applies K-Means clustering | Clustering |
| [GuassianCalculator](./filters#guassian-calculator) | 1 | - | Gaussian blur filter | Filters |
| [LaplacianCalculator](./filters#laplacian-calculator) | 1 | `kernel_size` | Edge detection via Laplacian operator | Filters |
| [MeanCalculator](./filters#mean-calculator) | 1 | - | Mean (box) filter | Filters |
| [MedianCalculator](./filters#median-calculator) | 1 | `kernel_size` | Median noise reduction | Filters |
| [SobelCalculator](./filters#sobel-calculator) | 1 | `kernel_size` | Sobel edge detector | Filters |
| [GLCMCalculator](./glcm#glcm-calculator) | 1 | `window_size`, `propery` | Texture extraction with GLCM features | GLCM |
| [HSVCalculator](./hsv#hsv-calculator) | NIR, Green, Blue | `channel` | Converts a vegetation false-color composite to HSV | HSV |
| [IRHSVCalculator](./hsv#irhsv-calculator) | Red, SWIR1, SWIR2 | `channel` | Converts an infrared false-color composite to HSV | HSV |
| [OriginalCalculator](./image-enhancement#original-calculator) | 1 | - | Returns unmodified single-band input | Image Enhancement |
| [OriginalRGBCalculator](./image-enhancement#original-rgb-calculator) | RGB | - | Returns RGB input unchanged | Image Enhancement |
| [FloatCalculator](./image-enhancement#float-calculator) | 1 | - | Converts a band to float format | Image Enhancement |
| [EqualizeCalculator](./image-enhancement#equalize-calculator) | 1 | - | Global histogram equalization | Image Enhancement |
| [EqualizeRGBCalculator](./image-enhancement#equalize-rgb-calculator) | RGB | - | Histogram equalization for RGB channels | Image Enhancement |
| [AdaptiveCalculator](./image-enhancement#adaptive-calculator) | 1 | `clip_limit` | Adaptive histogram equalization | Image Enhancement |
| [AdaptiveRGBCalculator](./image-enhancement#adaptive-rgb-calculator) | RGB | - | Adaptive histogram equalization for RGB images | Image Enhancement |
| [GammaCalculator](./image-enhancement#gamma-calculator) | 1 | `gamma`, `gain` | Gamma correction | Image Enhancement |
| [GammaRGBCalculator](./image-enhancement#gamma-rgb-calculator) | RGB | - | Gamma correction for RGB channels | Image Enhancement |
| [LogAdjustCalculator](./image-enhancement#log-adjust-calculator) | 1 | `gain`, `inverse` | Logarithmic brightness adjustment | Image Enhancement |
| [SigmoidAdjustCalculator](./image-enhancement#sigmoid-adjust-calculator) | 1 | `gain`, `cutoff`, `inverse` | Sigmoid contrast adjustment | Image Enhancement |
| [Geoeye_Calculator](./import-tools#geoeye-calculator) | Multi-band GeoTIFF | `level` | Extracts one band from a stacked image | Import Tools |
| [Landsat8_Calculator](./import-tools#landsat8-calculator) | Red, Green, Blue, NIR, SWIR1, SWIR2 | `exportType` | Builds true-color or false-color composites | Import Tools |
| [MosaicCalculator](./mosaic#mosaic-calculator) | Multiple GeoTIFFs | `tif_paths` | Merges images into a mosaicked raster | Mosaic |
| [PCACalculator](./pca#pca-calculator) | Red, Green, Blue, NIR, SWIR1, SWIR2 | `selectBand` | Principal Component Analysis | PCA |
| [AFRICalculator](./spectral-indices#afri-calculator) | NIR, SWIR1 | - | Calculates AFRI vegetation index | Spectral Indices |
| [BICalculator](./spectral-indices#bi-calculator) | NIR, Red, Green | - | Calculates Bare Soil Index | Spectral Indices |
| [NDVICalculator](./spectral-indices#ndvi-calculator) | NIR, Red | - | Calculates NDVI vegetation index | Spectral Indices |
| [NDWICalculator](./spectral-indices#ndwi-calculator) | Green, NIR | - | Calculates NDWI water index | Spectral Indices |
| [SAVICalculator](./spectral-indices#savi-calculator) | NIR, Red | - | Calculates Soil Adjusted Vegetation Index | Spectral Indices |
| [UICalculator](./spectral-indices#ui-calculator) | NIR, SWIR2 | - | Calculates Urban Index | Spectral Indices |
| [SpectralProfileCalculator](./spectral-profile#spectral-profile-calculator) | Red, Green, Blue, NIR, SWIR1, SWIR2 | - | Extracts a spectral signature | Spectral Profile |
| [SVMCalculator](./svm#svm-calculator) | Red, Green, Blue, NIR, SWIR1, SWIR2 | `class_number`, `sample_number` | Classifies images with interactive SVM training | SVM |
