/**
 * PA1 - Variant 17
 * Surface of Revolution of a General Sinusoid
 *
 * Parameters:
 *   u = r
 *   v = beta
 *
 * Surface:
 *   x(u, v) = u * cos(v)
 *   y(u, v) = u * sin(v)
 *   z(u, v) = a * cos(n * PI * u / R)
 *
 * U-curves:
 *   v = const, u changes from 0 to R
 *
 * V-curves:
 *   u = const, v changes from 0 to 2*PI
 */

export class Model {
  constructor(gl, options = {}) {
    this.gl = gl;

    // Parameters of the analytical surface
    this.a = options.a ?? 1.0;
    this.n = options.n ?? 6;
    this.R = options.R ?? 3.0;

    // Number of separate U- and V-curves
    this.uCurveCount = options.uCurveCount ?? 28;
    this.vCurveCount = options.vCurveCount ?? 19;

    // Number of samples inside each polyline
    this.uSamples = options.uSamples ?? 120;
    this.vSamples = options.vSamples ?? 120;

    /*
     * Two separate sets of vertices.
     *
     * Every three numbers represent one 3D vertex:
     * [x0, y0, z0, x1, y1, z1, ...]
     */
    this.uVertices = [];
    this.vVertices = [];

    /*
     * Ranges tell WebGL where each individual polyline
     * begins inside the corresponding vertex array.
     *
     * Example:
     * { first: 0, count: 121 }
     */
    this.uRanges = [];
    this.vRanges = [];

    this.buildUCurves();
    this.buildVCurves();

    /*
     * WebGL works efficiently with typed arrays,
     * so normal JavaScript arrays are converted
     * to Float32Array before uploading to GPU.
     */
    this.uVertexData = new Float32Array(this.uVertices);
    this.vVertexData = new Float32Array(this.vVertices);

    // Two separate GPU vertex buffers
    this.uBuffer = this.createBuffer(this.uVertexData);
    this.vBuffer = this.createBuffer(this.vVertexData);
  }

  /**
   * Calculates one point of the analytical surface.
   */
  surfacePoint(u, v) {
    const x = u * Math.cos(v);
    const y = u * Math.sin(v);

    const z =
      this.a *
      Math.cos(
        (this.n * Math.PI * u) / this.R
      );

    return [x, y, z];
  }

  /**
   * U-curves.
   *
   * v remains constant.
   * u changes from 0 to R.
   *
   * These curves correspond to meridians.
   */
  buildUCurves() {
    for (
      let line = 0;
      line < this.uCurveCount;
      line++
    ) {
      const v =
        (2 * Math.PI * line) /
        this.uCurveCount;

      const first =
        this.uVertices.length / 3;

      for (
        let sample = 0;
        sample <= this.uSamples;
        sample++
      ) {
        const u =
          (this.R * sample) /
          this.uSamples;

        const [x, y, z] =
          this.surfacePoint(u, v);

        this.uVertices.push(x, y, z);
      }

      this.uRanges.push({
        first: first,
        count: this.uSamples + 1,
      });
    }
  }

  /**
   * V-curves.
   *
   * u remains constant.
   * v changes from 0 to 2*PI.
   *
   * These curves correspond to parallels.
   */
  buildVCurves() {
    /*
     * Start at line = 1 instead of 0 because
     * u = 0 would produce a degenerate circle:
     * all its points would be identical.
     */
    for (
      let line = 1;
      line <= this.vCurveCount;
      line++
    ) {
      const u =
        (this.R * line) /
        this.vCurveCount;

      const first =
        this.vVertices.length / 3;

      for (
        let sample = 0;
        sample <= this.vSamples;
        sample++
      ) {
        /*
         * The last point has v = 2*PI.
         * It coincides with v = 0 and therefore
         * closes the circular polyline.
         */
        const v =
          (2 * Math.PI * sample) /
          this.vSamples;

        const [x, y, z] =
          this.surfacePoint(u, v);

        this.vVertices.push(x, y, z);
      }

      this.vRanges.push({
        first: first,
        count: this.vSamples + 1,
      });
    }
  }

  /**
   * Creates one WebGL ARRAY_BUFFER.
   */
  createBuffer(data) {
    const gl = this.gl;

    const buffer = gl.createBuffer();

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

  /**
   * Draws both curve families.
   */
  draw(programInfo, mvpMatrix) {
    const gl = this.gl;

    gl.uniformMatrix4fv(
      programInfo.uniformLocations.mvp,
      false,
      mvpMatrix
    );

    gl.enableVertexAttribArray(
      programInfo.attribLocations.position
    );

    // U-curves - blue
    this.drawCurveFamily(
      this.uBuffer,
      this.uRanges,
      programInfo,
      [0.05, 0.25, 0.70, 1.0]
    );

    // V-curves - orange
    this.drawCurveFamily(
      this.vBuffer,
      this.vRanges,
      programInfo,
      [0.85, 0.25, 0.10, 1.0]
    );
  }

  /**
   * Draws all polylines of one family.
   */
  drawCurveFamily(
    buffer,
    ranges,
    programInfo,
    color
  ) {
    const gl = this.gl;

    gl.bindBuffer(
      gl.ARRAY_BUFFER,
      buffer
    );

    gl.vertexAttribPointer(
      programInfo.attribLocations.position,
      3,          // x, y, z
      gl.FLOAT,
      false,
      0,
      0
    );

    gl.uniform4fv(
      programInfo.uniformLocations.color,
      color
    );

    for (const range of ranges) {
      gl.drawArrays(
        gl.LINE_STRIP,
        range.first,
        range.count
      );
    }
  }
}