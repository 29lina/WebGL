# Control Task — WebGL Normal Mapping — Variant 17

This practical assignment extends PA#2 using its parametric surface, Phong lighting, facet-averaged vertex normals, model rotation, zoom, U/V mesh granularity controls and moving point-light sphere.

## Variant 17: prioritize tangent

During Gram–Schmidt orthogonalization **tangent T has priority**:

```glsl
vec3 T = normalize(vTangentView);
vec3 N0 = normalize(vNormalView);
vec3 N = normalize(N0 - dot(N0, T) * T);
vec3 B = normalize(cross(N, T));
mat3 TBN = mat3(T, B, N);
```

This keeps T unchanged and removes its component from N, unlike normal-priority orthogonalization.

## Three separate texture files

- `textures/diffuse.png` — modulates the **diffuse** lighting component (and is used for the ambient base color).
- `textures/specular.png` — modulates the **specular** reflection component.
- `textures/normal.png` — tangent-space normals sampled **per pixel**, converted from RGB to the interval [-1, 1], then transformed with TBN.

The texture images were generated together from a periodic relief pattern, so the height features correspond to the diffuse/specular details. They are included in the repository. The optional `make_textures.py` script can regenerate them (requires Python, NumPy and Pillow); running the site does NOT require Python.

## Original PA#2 retained

Surface of Revolution of a General Sinusoid:

- `x = u cos(v)`
- `y = u sin(v)`
- `z = a cos(nπu/R)`
- `a = 1`, `n = 6`, `R = 3`; `0 ≤ u ≤ R` and `0 ≤ v < 2π`.

The surface uses indexed triangle rendering, facet-average vertex normals, and per-fragment Phong shading. The new mesh provides tangent vectors and UV coordinates. The seam is duplicated for UV interpolation while normal vectors are welded across it. The normal-mapping TBN frame is built in the fragment shader.

## How to run

1. Open this folder in **Visual Studio Code**.
2. Install the **Live Server** extension.
3. Right-click `index.html` and select **Open with Live Server**.
4. Open the displayed local URL, normally `http://127.0.0.1:5500/index.html`.

Do not open the HTML directly using `file://`, because ES modules and texture loading require an HTTP server.

## Controls and demo

- Drag with left mouse button to rotate.
- Scroll wheel to zoom.
- U/V granularity sliders rebuild the surface mesh.
- Toggle **Diffuse texture**, **Specular texture**, and **Normal texture** independently to compare the three effects.
- The small yellow sphere marks the moving point light.

## File organization

- `index.html` — WebGL canvas and controls.
- `main.js` — shaders, three texture units, TBN, lighting and animation.
- `Model.js` — surface geometry, UVs, tangent calculation and facet-average normals.
- `math.js` — PA#2 matrix utilities.
- `textures/` — three PNG textures.
- `make_textures.py` — optional reproducible texture generator.

## Submission

Submit a GitHub repository **link to the `ControlTask` branch**, a **single screenshot**, and a **2-minute video** as requested in the assignment instructions.
