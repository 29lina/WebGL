/** Variant 17: sinusoidal surface of revolution, facet-averaged normals. */
export class Model {
  constructor(gl, options = {}) {
    this.gl = gl;
    this.a = options.a ?? 1;
    this.n = options.n ?? 6;
    this.R = options.R ?? 3;
    this.uSegments = options.uSegments ?? 40;
    this.vSegments = options.vSegments ?? 64;
    this.buildGeometry();
  }

  point(u, v) {
    return [u * Math.cos(v), u * Math.sin(v),
      this.a * Math.cos(this.n * Math.PI * u / this.R)];
  }

  buildGeometry() {
    const p = [], uv = [], t = [], normal = [], indices = [];
    const U = this.uSegments, V = this.vSegments;
    const index = (i, j) => i * (V + 1) + j;
    // Duplicate the angular seam so that UV coordinates interpolate 0..1 correctly.
    for (let i = 0; i <= U; i++) {
      const u = this.R * i / U;
      for (let j = 0; j <= V; j++) {
        const v = 2 * Math.PI * j / V;
        p.push(...this.point(u, v));
        uv.push(j / V, i / U);
        const dzdu = -this.a * this.n * Math.PI / this.R *
          Math.sin(this.n * Math.PI * u / this.R);
        const tx = Math.cos(v), ty = Math.sin(v);
        const len = Math.hypot(tx, ty, dzdu);
        t.push(tx / len, ty / len, dzdu / len);
        normal.push(0, 0, 0);
      }
    }
    for (let i = 0; i < U; i++) {
      for (let j = 0; j < V; j++) {
        const a = index(i, j), b = index(i + 1, j);
        const c = index(i + 1, j + 1), d = index(i, j + 1);
        // For the centre, draw only the nondegenerate triangle.
        indices.push(a, b, c);
        if (i > 0) indices.push(a, c, d);
      }
    }
    // Facet Average: add a unit face normal to each adjacent vertex.
    // Exclude zero-area triangles (the surface centre is singular in angular UV).
    for (let k = 0; k < indices.length; k += 3) {
      const ia = indices[k], ib = indices[k + 1], ic = indices[k + 2];
      const ab = [0, 1, 2].map(q => p[3 * ib + q] - p[3 * ia + q]);
      const ac = [0, 1, 2].map(q => p[3 * ic + q] - p[3 * ia + q]);
      const face = [ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0]];
      const length = Math.hypot(...face);
      if (length < 1e-10) continue;
      for (const id of [ia, ib, ic]) {
        for (let q = 0; q < 3; q++) normal[3 * id + q] += face[q] / length;
      }
    }
    // Weld normals across the UV seam without welding UVs themselves.
    for (let i = 0; i <= U; i++) {
      const a = index(i, 0), b = index(i, V);
      for (let q = 0; q < 3; q++) {
        const sum = normal[3 * a + q] + normal[3 * b + q];
        normal[3 * a + q] = sum;
        normal[3 * b + q] = sum;
      }
    }
    // At u=0 all copies represent a single physical point.
    // Average the face normals there to avoid a radial seam in lighting.
    const center = [0, 0, 0];
    for (let j = 0; j < V; j++) {
      for (let q = 0; q < 3; q++) center[q] += normal[3 * index(0, j) + q];
    }
    for (let j = 0; j <= V; j++) {
      for (let q = 0; q < 3; q++) normal[3 * index(0, j) + q] = center[q];
    }
    for (let id = 0; id < p.length / 3; id++) {
      const len = Math.hypot(normal[3 * id], normal[3 * id + 1], normal[3 * id + 2]);
      for (let q = 0; q < 3; q++) normal[3 * id + q] = len > 1e-8 ? normal[3 * id + q] / len : (q === 2 ? 1 : 0);
    }
    this.buffers = {
      position: this.arrayBuffer(new Float32Array(p)),
      normal: this.arrayBuffer(new Float32Array(normal)),
      tangent: this.arrayBuffer(new Float32Array(t)),
      texCoord: this.arrayBuffer(new Float32Array(uv)),
    };
    this.indexBuffer = glBuffer(this.gl, this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices));
    this.indexCount = indices.length;
  }

  arrayBuffer(data) { return glBuffer(this.gl, this.gl.ARRAY_BUFFER, data); }

  draw(info) {
    const gl = this.gl;
    const attributes = [
      ['position', 3], ['normal', 3], ['tangent', 3], ['texCoord', 2]
    ];
    for (const [name, size] of attributes) {
      const location = info.attribLocations[name];
      if (location < 0) continue;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[name]);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
  }

  dispose() {
    for (const buffer of Object.values(this.buffers)) this.gl.deleteBuffer(buffer);
    this.gl.deleteBuffer(this.indexBuffer);
  }
}

function glBuffer(gl, target, data) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(target, buffer);
  gl.bufferData(target, data, gl.STATIC_DRAW);
  return buffer;
}
