# PA2 — Filled Surface and Phong Shading

## Variant

17

- Shading: Phong
- Vertex normal: Facet Average

## Surface

Surface of Revolution of a General Sinusoid:

x(u, v) = u cos(v)

y(u, v) = u sin(v)

z(u, v) = a cos(nπu / R)

Parameters:

- a = 1
- n = 6
- R = 3
- 0 <= u <= R
- 0 <= v < 2π

## Geometry

The surface is rendered using filled indexed triangles.

Vertex coordinates are stored in a VBO.

Vertex normals are stored in a separate VBO.

Triangle connectivity is stored in an index buffer
(ELEMENT_ARRAY_BUFFER).

Rendering is performed with:

gl.drawElements(gl.TRIANGLES, ...)

## Surface granularity

Two sliders control the number of subdivisions:

- U granularity
- V granularity

Changing either slider rebuilds the triangle mesh.

## Vertex normals

Variant 17 uses Facet Average vertex normals.

For every triangle:

1. Two triangle edges are calculated.
2. Their cross product gives the facet normal.
3. The facet normal is normalized.
4. The normalized facet normal is added to all adjacent vertices.
5. The resulting vertex normals are normalized.

## Phong shading

Phong shading is implemented in the fragment shader.

The vertex shader passes interpolated:

- vertex position
- vertex normal

to the fragment shader.

The fragment shader calculates:

Irgb = Ambient + Diffuse + Specular

## Point light

One point light source moves in a circular trajectory around the surface.

The light coordinates are transformed by the ModelView matrix
before being passed to the GPU as a uniform.

## Projection

Perspective projection is used.

## Controls

- Mouse drag — rotate
- Mouse wheel — zoom
- U slider — change U granularity
- V slider — change V granularity