# Spectral Indices

### 1. Introduction

This module provides a set of **spectral indices** for extracting quantitative information from satellite images. Each index highlights a specific surface feature by mathematically combining two or more spectral bands. The indices are widely used in vegetation monitoring, water resource mapping, soil detection, and urban studies.

**Existing Classes :**

|Class Name|Index|Main Application|
|---|---|---|
|`AFVICalculator`|AFVI|Dense forest and vegetation monitoring|
|`BICalculator`|BI|Bare soil and non‑vegetated area identification|
|`NDVICalculator`|NDVI|Vegetation health and density|
|`NDWICalculator`|NDWI|Water body and moisture detection|
|`SAVICalculator`|SAVI|Modified NDVI for areas with sparse vegetation|
|`UICalculator`|UI|Urban and built‑up area identification|

All classes inherit from `BaseTool` and utilise the `files_handler` for band loading and automatic normalisation to $[0,1]$ via `get_normalized_bands`.

---

### 2. Detailed Documentation of Each Class

<span id="afvi-calculator"></span>

#### 2.1. `AFVICalculator` – Advanced Forest Vegetation Index

**Scientific objective**  
Discriminate dense vegetation (particularly forests) while reducing sensitivity to variations in illumination, shadow, and background soil. The AFVI is designed to maximise the contrast between photosynthetically active vegetation and other land covers.

**Full Explanation of the Formula**

The AFVI implemented in the code is :

$$AFVI = (NIR - 0.66) \times \left( \frac{SWIR1}{NIR + 0.66 \times SWIR1} \right)$$

This formula can be broken down into two interacting components :

1. **NIR offset term (NIR−0.66)(NIR−0.66):**  
    In the normalised band space $[0,1]$, healthy green vegetation typically exhibits high NIR reflectance (well above 0.5) due to strong scattering by the leaf mesophyll, while SWIR1 reflectance is lower because of water absorption. The constant 0.66 acts as a threshold; pixels with $NIR<0.66$ (e.g., water, bare soil, urban surfaces) produce a negative or very small first factor, suppressing the index. Pixels with $NIR>0.66$ (dense vegetation) yield a positive contribution. The value 0.66 is an empirically derived reference level calibrated for typical forest reflectance ranges in NIR.
    
2. **SWIR1 ratio term $\frac{SWIR1}{NIR + 0.66 \times SWIR1}$ :**  
    This is a non‑linear ratio that modulates the NIR offset. For healthy vegetation, SWIR1 is considerably lower than NIR, so the ratio becomes small (approaching $\frac{low}{high + 0.66 \times low}$ $≈\text{low}$ value). The product of a positive $(NIR−0.66)$ and a small ratio still yields a moderate positive value. For non‑vegetated surfaces where SWIR1 is high and NIR is low, the ratio becomes larger while $(NIR−0.66)$ is negative, producing a strong negative or near‑zero output. Thus the AFVI effectively suppresses confusing signals from bright soils, water, and shadows.


The output range in practice lies roughly between 0 and 1 for dense vegetation, with higher values indicating greater canopy density. Because the bands are normalised to $[0,1]$, the index is well‑suited for multi‑temporal comparisons without additional calibration.

**Input parameters :**

| Parameter    | Type   | Description     |
| ------------ | ------ | --------------- |
| `nir_path`   | `Path` | NIR band file   |
| `swir1_path` | `Path` | SWIR1 band file |

**Range :** ~0 to 1 (higher = denser vegetation)

---

<span id="bi-calculator"></span>

#### 2.2. `BICalculator` – Bare Soil Index

**Scientific objective**  
Identify bare soil, rock, and built‑up areas, exploiting the spectral contrast between vegetation and non‑vegetated surfaces.

**Full Explanation of the Formula**

The Bare Soil Index (BI) is computed as :

$$BI = \frac{(NIR - Green) - Red}{(NIR + Green) + Red}$$

This can be rewritten as :

$$BI = \frac{NIR - Green - Red}{NIR + Green + Red}$$

The formulation is a normalised difference between the NIR band and the sum of the two visible bands (Green and Red). The physical basis is :

- **Vegetation :** Green plants reflect moderately in Green, absorb strongly in Red (due to chlorophyll), and reflect strongly in NIR. Therefore, for vegetation, $\text{NIR}≫\text{Green}+\text{Red}$, leading to a large positive numerator and a positive denominator, resulting in a positive BI value. However, typical healthy vegetation actually yields a _negative_ BI when using the common definition (note : many published BI formulas are inverted). In this implementation, because the numerator is $\text{NIR}−(\text{Green}+\text{Red})$, dense vegetation with $\text{NIR}>\text{Green}+\text{Red}$ gives **positive** values, while bare soil, where $\text{NIR}≈\text{Green}≈\text{Red}$ (all relatively similar), yields values near zero. Bare soil can even give negative values if the visible bands exceed NIR. Urban areas (concrete, asphalt) often exhibit low NIR and higher visible reflectance, resulting in negative BI.


Thus, **positive BI values indicate vegetation**, while **negative or near‑zero values indicate bare soil or urban surfaces**. The exact interpretation depends on the sensor and the region, but the index provides a continuous measure where lower (more negative) values correspond to a greater proportion of exposed soil or built‑up material.

The normalisation by the sum $\text{NIR}+\text{Green}+\text{Red}$ in the denominator reduces sensitivity to overall brightness, making the index more robust to topographic shading.

**Input parameters :**

|Parameter|Type|Description|
|---|---|---|
|`nir_path`|`Path`|NIR band file|
|`red_path`|`Path`|Red band file|
|`green_path`|`Path`|Green band file|

**Range :** −1 to +1 (positive = vegetation, negative = bare soil/urban in this implementation)

---

<span id="ndvi-calculator"></span>

#### 2.3. `NDVICalculator` – Normalised Difference Vegetation Index

**Scientific objective**  
The NDVI is the most widely used spectral index for assessing the presence, health, and density of green vegetation. It leverages the sharp contrast between the strong reflectance of vegetation in the NIR and the strong absorption in the Red due to chlorophyll.

**Full Explanation of the Formula**

$$NDVI = \frac{NIR - Red}{NIR + Red}$$

- **Physical basis :** Chlorophyll in healthy leaves absorbs most of the incident red light (low Red reflectance), while the spongy mesophyll tissue scatters NIR radiation strongly (high NIR reflectance). Therefore, NDVI approaches +1 for dense, healthy vegetation.
    
- **For bare soil and rock :** Reflectance is typically similar in both NIR and Red, so the numerator is small and NDVI is near 0 (often between 0.1 and 0.2).
    
- **For water :** Water absorbs almost all NIR, so NIR is near 0, while Red may still have some reflectance. As a result, NDVI becomes negative.
    
- **Clouds and snow :** Reflectance is high and similar in both bands, yielding NDVI close to 0 (though sometimes slightly negative).
    

The normalised ratio structure $\frac{a-b}{a+b}$​ automatically compensates for multiplicative factors such as sun angle variation and atmospheric transmittance, as long as those factors affect both bands similarly. The index ranges from −1 to +1.

In the code, the input bands are normalised to $[0,1]$ before computation, ensuring that NDVI values are consistent regardless of the sensor’s original dynamic range.

**Input parameters :**

|Parameter|Type|Description|
|---|---|---|
|`nir_path`|`Path`|NIR band file|
|`red_path`|`Path`|Red band file|

**Example:**
```python
calc = NDVICalculator(nir_path="B5.tif", red_path="B4.tif")
calc.execute("./", title="NDVI", colormap="RdYlGn", show_colorbar=True)
```

---

<span id="ndwi-calculator"></span>

#### 2.4. `NDWICalculator` – Normalised Difference Water Index

**Scientific objective**  
Enhance the presence of open water bodies and assess vegetation moisture content, originally proposed by McFeeters (1996).

**Full Explanation of the Formula**

$$NDWI =\frac{\text{Green} - \text{NIR}}{\text{Green} + \text{NIR}}$$

- **Physics :** Water strongly absorbs NIR radiation, whereas it reflects a small amount of green light (which is why clear water often appears greenish or blue to the human eye). Consequently, for water pixels, $\text{Green}>\text{NIR}$, leading to positive NDWI values (approaching +1 for very clear, deep water).
    
- **Vegetation :** Healthy vegetation reflects significantly in NIR and moderately in Green, so $\text{NIR}>\text{Green}$, resulting in negative NDWI values.
    
- **Bare soil and urban :** Typically have roughly similar reflectance in Green and NIR, producing NDWI values around 0.


This index effectively separates water from land. It is also sensitive to the water content of vegetation, but a different formulation (using SWIR) is often employed for vegetation moisture (Gao’s NDWI). The current implementation is the classic water‑index version.

**Input parameters :**

|Parameter|Type|Description|
|---|---|---|
|`green_path`|`Path`|Green band file|
|`nir_path`|`Path`|NIR band file|

**Range :** −1 to +1 (positive = water; negative = vegetation/soil)

---

<span id="savi-calculator"></span>

#### 2.5. `SAVICalculator` – Soil Adjusted Vegetation Index

**Scientific objective**  
Modify the NDVI to account for the influence of soil background in areas with sparse vegetation (arid and semi‑arid regions). By introducing an adjustment factor, SAVI minimises the effect of soil brightness variations.

**Full Explanation of the Formula**

The standard SAVI (Huete, 1988) is defined as :

$$SAVI =\frac{NIR - Red}{NIR + Red + L} \times (1 + L)$$

where $L$ is a soil‑adjustment factor. For intermediate vegetation cover, $L=0.5$ is commonly used. The code implements exactly this with $L=0.5$ :

$$SAVI =  \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red} + 0.5} \times 1.5$$

- **Role of LL :** The additional term LL in the denominator reduces the sensitivity of the index to soil brightness. When vegetation is sparse, the soil background contributes significantly to the reflected signal. Without adjustment, NDVI can be artificially raised by bright soils. The factor LL moves the “soil line” to the origin in the NIR–Red feature space, making SAVI nearly insensitive to soil brightness variations.
    
- **Multiplication by $1+L$ :** This scaling ensures that SAVI values remain comparable to NDVI range‑wise (roughly −1 to +1). For dense vegetation, SAVI is only slightly lower than NDVI; for sparse vegetation, SAVI is substantially lower, giving a more accurate measure of green cover.


**Input parameters :**

| Parameter  | Type   | Description   |
| ---------- | ------ | ------------- |
| `nir_path` | `Path` | NIR band file |
| `red_path` | `Path` | Red band file |

---

<span id="ui-calculator"></span>

#### 2.6. `UICalculator` – Urban Index

**Scientific objective**  
Discriminate urban and built‑up areas from other land covers by exploiting the spectral contrast between SWIR2 and NIR.

**Full Explanation of the Formula**

$$UI = \frac{\text{SWIR2} - \text{NIR}}{\text{SWIR2} + \text{NIR}}$$

- **Spectral behaviour :** Urban surfaces (asphalt, concrete, rooftops) generally exhibit higher reflectance in SWIR2 than in NIR, because these materials lack the strong NIR scattering of vegetation. Conversely, dense vegetation has high NIR and relatively low SWIR2 (due to leaf water absorption). Therefore, for urban areas, $SWIR2>NIR → UI$ positive. For vegetation, $NIR>SWIR2 → UI$ negative.
    
- **Water and bare soil :** Water has near‑zero NIR and SWIR2, often leading to near‑zero UI (or slightly negative due to small differences). Bare soil can have variable UI depending on mineral composition, but generally lies between urban and vegetation values.


This index helps to separate built‑up regions from surrounding vegetated areas, and is particularly useful in land‑cover classification and urban growth mapping.

**Input parameters :**

| Parameter    | Type   | Description     |
| ------------ | ------ | --------------- |
| `nir_path`   | `Path` | NIR band file   |
| `swir2_path` | `Path` | SWIR2 band file |

**Range :** −1 to +1 (positive = urban, negative = vegetation)

---

### 3. Summary Table of Indices

| Index | Required Bands  | Application              | Simplified Formula (with constants)                    |
| ----- | --------------- | ------------------------ | ------------------------------------------------------ |
| AFVI  | NIR, SWIR1      | Dense forest vegetation  | $(NIR - 0.66) \times SWIR1 / (NIR + 0.66 \cdot SWIR1)$ |
| BI    | NIR, Red, Green | Bare soil / urban        | $((NIR - Green) - Red) / ((NIR + Green) + Red)$        |
| NDVI  | NIR, Red        | General vegetation       | $(NIR - Red) / (NIR + Red)$                            |
| NDWI  | Green, NIR      | Water & moisture         | $(Green - NIR) / (Green + NIR)$                        |
| SAVI  | NIR, Red        | Sparse vegetation (arid) | $((NIR - Red) / (NIR + Red + 0.5)) \times 1.5$         |
| UI    | NIR, SWIR2      | Urban areas              | $(SWIR2 - NIR) / (SWIR2 + NIR)$                        |

---

### 4. Common Technical Notes

1. **Automatic normalisation :** All calculators use `get_normalized_bands` to scale the input bands to $[0,1]$ before applying the index formula. This ensures consistent output regardless of the sensor’s bit depth.
    
2. **Division by zero :** In the normalised difference formulas, the denominator can approach zero for very dark pixels (e.g., deep shadows or clear water). NumPy converts divisions by zero to `NaN`. It is recommended to add a small epsilon or use `np.where` to replace `NaN` values with a predefined constant (e.g., 0) in future releases.
    
3. **Recommended colormaps :**
    
    - NDVI, SAVI, AFVI → `'RdYlGn'` or `'YlGn'`
        
    - NDWI → `'Blues'`
        
    - BI, UI → `'hot'`, `'inferno'`, or `'coolwarm'`
    
4. **Sensor compatibility :**
    
    - Landsat 8 : NIR = Band 5, Red = Band 4, Green = Band 3, SWIR1 = Band 6, SWIR2 = Band 7
        
    - Sentinel‑2 : NIR = Band 8, Red = Band 4, Green = Band 3, SWIR1 = Band 11, SWIR2 = Band 12
    
5. **Physical units :** Since all bands are normalised to reflectance (or at least to a common scale), the indices are dimensionless and can be compared across different scenes and dates.
