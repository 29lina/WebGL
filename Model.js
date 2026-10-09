/**
 * PA2 - Variant 17
 * Surface of Revolution of a General Sinusoid
 *
 * Phong shading
 * Facet Average vertex normals
 */

export class Model {
  constructor(
    gl,
    options = {}
  ) {
    this.gl = gl;

    this.a =
      options.a ?? 1.0;

    this.n =
      options.n ?? 6;

    this.R =
      options.R ?? 3.0;

    this.uSegments =
      options.uSegments ?? 40;

    this.vSegments =
      options.vSegments ?? 64;

    this.positions = [];
    this.normals = [];
    this.indices = [];

    this.buildGeometry();


    this.positionData =
      new Float32Array(
        this.positions
      );

    this.normalData =
      new Float32Array(
        this.normals
      );

    this.indexData =
      new Uint16Array(
        this.indices
      );


    this.positionBuffer =
      this.createArrayBuffer(
        this.positionData
      );

    this.normalBuffer =
      this.createArrayBuffer(
        this.normalData
      );

    this.indexBuffer =
      this.createIndexBuffer(
        this.indexData
      );

    this.indexCount =
      this.indexData.length;
  }


  // Calculate one point of the surface
  surfacePoint(u, v) {
    const x =
      u *
      Math.cos(v);

    const y =
      u *
      Math.sin(v);

    const z =
      this.a *
      Math.cos(
        (
          this.n *
          Math.PI *
          u
        ) /
        this.R
      );

    return [
      x,
      y,
      z
    ];
  }


  // Get vertex index on a ring
  ringIndex(
    ring,
    vIndex
  ) {
    const wrappedV =
      (
        vIndex +
        this.vSegments
      ) %
      this.vSegments;

    return (
      1 +
      (ring - 1) *
      this.vSegments +
      wrappedV
    );
  }


  // Build vertices and triangle indices
  buildGeometry() {
    const center =
      this.surfacePoint(
        0,
        0
      );

    this.positions.push(
      center[0],
      center[1],
      center[2]
    );


    // Build surface rings
    for (
      let i = 1;
      i <= this.uSegments;
      i++
    ) {
      const u =
        (
          this.R *
          i
        ) /
        this.uSegments;

      for (
        let j = 0;
        j < this.vSegments;
        j++
      ) {
        const v =
          (
            2 *
            Math.PI *
            j
          ) /
          this.vSegments;

        const point =
          this.surfacePoint(
            u,
            v
          );

        this.positions.push(
          point[0],
          point[1],
          point[2]
        );
      }
    }


    // Triangles around the centre
    for (
      let j = 0;
      j < this.vSegments;
      j++
    ) {
      const current =
        this.ringIndex(
          1,
          j
        );

      const next =
        this.ringIndex(
          1,
          j + 1
        );

      this.indices.push(
        0,
        current,
        next
      );
    }


    // Triangles between neighbouring rings
    for (
      let i = 1;
      i < this.uSegments;
      i++
    ) {
      for (
        let j = 0;
        j < this.vSegments;
        j++
      ) {
        const a =
          this.ringIndex(
            i,
            j
          );

        const b =
          this.ringIndex(
            i + 1,
            j
          );

        const c =
          this.ringIndex(
            i + 1,
            j + 1
          );

        const d =
          this.ringIndex(
            i,
            j + 1
          );

        this.indices.push(
          a,
          b,
          c
        );

        this.indices.push(
          a,
          c,
          d
        );
      }
    }


    this.calculateFacetAverageNormals();
  }


  // Calculate Facet Average normals
  calculateFacetAverageNormals() {
    const vertexCount =
      this.positions.length / 3;

    this.normals =
      new Array(
        vertexCount * 3
      ).fill(0);


    for (
      let i = 0;
      i < this.indices.length;
      i += 3
    ) {
      const ia =
        this.indices[i];

      const ib =
        this.indices[i + 1];

      const ic =
        this.indices[i + 2];


      const ax =
        this.positions[
          ia * 3
        ];

      const ay =
        this.positions[
          ia * 3 + 1
        ];

      const az =
        this.positions[
          ia * 3 + 2
        ];


      const bx =
        this.positions[
          ib * 3
        ];

      const by =
        this.positions[
          ib * 3 + 1
        ];

      const bz =
        this.positions[
          ib * 3 + 2
        ];


      const cx =
        this.positions[
          ic * 3
        ];

      const cy =
        this.positions[
          ic * 3 + 1
        ];

      const cz =
        this.positions[
          ic * 3 + 2
        ];


      // Triangle edges
      const abx =
        bx - ax;

      const aby =
        by - ay;

      const abz =
        bz - az;


      const acx =
        cx - ax;

      const acy =
        cy - ay;

      const acz =
        cz - az;


      // Cross product
      let nx =
        aby * acz -
        abz * acy;

      let ny =
        abz * acx -
        abx * acz;

      let nz =
        abx * acy -
        aby * acx;


      // Normalize facet normal
      const length =
        Math.hypot(
          nx,
          ny,
          nz
        );

      if (
        length < 1e-8
      ) {
        continue;
      }

      nx /= length;
      ny /= length;
      nz /= length;


      // Add normal to triangle vertices
      this.addNormal(
        ia,
        nx,
        ny,
        nz
      );

      this.addNormal(
        ib,
        nx,
        ny,
        nz
      );

      this.addNormal(
        ic,
        nx,
        ny,
        nz
      );
    }


    // Normalize vertex normals
    for (
      let vertex = 0;
      vertex < vertexCount;
      vertex++
    ) {
      const offset =
        vertex * 3;

      let nx =
        this.normals[
          offset
        ];

      let ny =
        this.normals[
          offset + 1
        ];

      let nz =
        this.normals[
          offset + 2
        ];

      const length =
        Math.hypot(
          nx,
          ny,
          nz
        );

      if (
        length > 1e-8
      ) {
        nx /= length;
        ny /= length;
        nz /= length;
      } else {
        nx = 0;
        ny = 0;
        nz = 1;
      }

      this.normals[
        offset
      ] = nx;

      this.normals[
        offset + 1
      ] = ny;

      this.normals[
        offset + 2
      ] = nz;
    }
  }


  // Add normal contribution to one vertex
  addNormal(
    vertexIndex,
    nx,
    ny,
    nz
  ) {
    const offset =
      vertexIndex * 3;

    this.normals[
      offset
    ] += nx;

    this.normals[
      offset + 1
    ] += ny;

    this.normals[
      offset + 2
    ] += nz;
  }


  // Create VBO
  createArrayBuffer(data) {
    const gl =
      this.gl;

    const buffer =
      gl.createBuffer();

    gl.bindBuffer(
      gl.ARRAY_BUFFER,
      buffer
    );

    gl.bufferData(
      gl.ARRAY_BUFFER,
      data,
      gl.STATIC_DRAW
    );

    return buffer;
  }


  // Create index buffer
  createIndexBuffer(data) {
    const gl =
      this.gl;

    const buffer =
      gl.createBuffer();

    gl.bindBuffer(
      gl.ELEMENT_ARRAY_BUFFER,
      buffer
    );

    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      data,
      gl.STATIC_DRAW
    );

    return buffer;
  }


  // Draw indexed triangles
  draw(programInfo) {
    const gl =
      this.gl;


    gl.bindBuffer(
      gl.ARRAY_BUFFER,
      this.positionBuffer
    );

    gl.enableVertexAttribArray(
      programInfo
        .attribLocations
        .position
    );

    gl.vertexAttribPointer(
      programInfo
        .attribLocations
        .position,
      3,
      gl.FLOAT,
      false,
      0,
      0
    );


    gl.bindBuffer(
      gl.ARRAY_BUFFER,
      this.normalBuffer
    );

    gl.enableVertexAttribArray(
      programInfo
        .attribLocations
        .normal
    );

    gl.vertexAttribPointer(
      programInfo
        .attribLocations
        .normal,
      3,
      gl.FLOAT,
      false,
      0,
      0
    );


    gl.bindBuffer(
      gl.ELEMENT_ARRAY_BUFFER,
      this.indexBuffer
    );


    gl.drawElements(
      gl.TRIANGLES,
      this.indexCount,
      gl.UNSIGNED_SHORT,
      0
    );
  }


  // Delete old buffers
  dispose() {
    const gl =
      this.gl;

    if (
      this.positionBuffer
    ) {
      gl.deleteBuffer(
        this.positionBuffer
      );
    }

    if (
      this.normalBuffer
    ) {
      gl.deleteBuffer(
        this.normalBuffer
      );
    }

    if (
      this.indexBuffer
    ) {
      gl.deleteBuffer(
        this.indexBuffer
      );
    }
  }
}