# CGW — Operations on Texture Coordinates — Variant 17

**Task:** scale textures around a user-defined point on the parametric surface (odd variant).

The project reuses the ControlTask code: a sinusoidal surface of revolution, Phong lighting, diffuse/specular/normal maps, tangent-priority Gram–Schmidt orthogonalization, adjustable mesh, moving light source, mouse rotation, and zoom.

## Features
- The Texture scale slider controls texture-coordinate scaling between `0.25x` and `4.00x`.
- `A`/`D`: decrease/increase angular UV coordinate `u` (wraps around the surface).
- `W`/`S`: increase/decrease radial UV coordinate `v` (clamped within the surface).
- The pink sphere visually indicates the pivot point on the 3D surface.
- The yellow sphere indicates the animated point light.
- Reset scale and pivot restores `(u,v)=(0.35,0.55)` and scale `1.0`.
- The same transformed UV is used for all three texture samplers.

## Theory
The UV transformation is `uvNew = pivot + (uvOld - pivot) * scale`. Geometry is unchanged. When `scale > 1` the pattern repeats more frequently (tiles look smaller); when `0 < scale < 1` the pattern becomes larger. The selected pivot remains invariant under scaling.

The original Model.js assigns `uv.push(j / V, i / U)`: texture `u` is the angular component and texture `v` is the radial component. The marker position therefore uses `model.point(pivot.v * R, pivot.u * 2π)`.

## Run (Visual Studio Code + Live Server)
1. Open the project folder in **Visual Studio Code**.
2. Install the **Live Server** extension if it is not installed yet.
3. Right-click `index.html` in Explorer and select **Open with Live Server** (or use **Go Live**).
4. The project opens in the browser using the local address provided by Live Server, commonly `http://127.0.0.1:5500/`.
5. With the page focused, use **A/D/W/S** to move the pink pivot and **Texture scale** to adjust the texture pattern.

The site requires WebGL and must be served over local HTTP, not `file://`. Python is **not** needed to run the site with Live Server; the optional `make_textures.py` utility only regenerates texture files and requires NumPy and Pillow.

## Project layout
- `index.html`: page UI.
- `main.js`: vertex/fragment shaders, texture transform, input handling, rendering, spheres.
- `Model.js`: model generation, normals, tangents and UV coordinates.
- `math.js`: matrix functions.
- `textures/*.png`: diffuse, specular and normal maps.
- `make_textures.py`: optional generator.

## Submission
Submit the GitHub repository through the teacher's form. Practical work **must be in the `CGW` branch** and that branch must contain the PDF paper/report. Do not confuse with the older `ControlTask` branch.
