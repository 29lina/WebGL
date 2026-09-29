export function mat4Multiply(a, b) {
  const out = new Float32Array(16);

  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      out[column * 4 + row] =
        a[0 * 4 + row] *
          b[column * 4 + 0] +
        a[1 * 4 + row] *
          b[column * 4 + 1] +
        a[2 * 4 + row] *
          b[column * 4 + 2] +
        a[3 * 4 + row] *
          b[column * 4 + 3];
    }
  }

  return out;
}

export function mat4Perspective(
  fovyRadians,
  aspect,
  near,
  far
) {
  const f =
    1.0 /
    Math.tan(fovyRadians / 2);

  const nf =
    1 /
    (near - far);

  return new Float32Array([
    f / aspect, 0, 0, 0,

    0, f, 0, 0,

    0,
    0,
    (far + near) * nf,
    -1,

    0,
    0,
    2 * far * near * nf,
    0,
  ]);
}

export function mat4LookAt(
  eye,
  center,
  up
) {
  let zx = eye[0] - center[0];
  let zy = eye[1] - center[1];
  let zz = eye[2] - center[2];

  let len = Math.hypot(
    zx,
    zy,
    zz
  );

  zx /= len;
  zy /= len;
  zz /= len;

  let xx =
    up[1] * zz -
    up[2] * zy;

  let xy =
    up[2] * zx -
    up[0] * zz;

  let xz =
    up[0] * zy -
    up[1] * zx;

  len = Math.hypot(
    xx,
    xy,
    xz
  );

  xx /= len;
  xy /= len;
  xz /= len;

  const yx =
    zy * xz -
    zz * xy;

  const yy =
    zz * xx -
    zx * xz;

  const yz =
    zx * xy -
    zy * xx;

  return new Float32Array([
    xx, yx, zx, 0,

    xy, yy, zy, 0,

    xz, yz, zz, 0,

    -(
      xx * eye[0] +
      xy * eye[1] +
      xz * eye[2]
    ),

    -(
      yx * eye[0] +
      yy * eye[1] +
      yz * eye[2]
    ),

    -(
      zx * eye[0] +
      zy * eye[1] +
      zz * eye[2]
    ),

    1,
  ]);
}

export function mat4RotationX(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return new Float32Array([
    1, 0, 0, 0,

    0, c, s, 0,

    0, -s, c, 0,

    0, 0, 0, 1,
  ]);
}

export function mat4RotationY(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return new Float32Array([
    c, 0, -s, 0,

    0, 1, 0, 0,

    s, 0, c, 0,

    0, 0, 0, 1,
  ]);
}

// Transform a 3D point by a 4x4 matrix
export function mat4TransformPoint(
  matrix,
  point
) {
  const x = point[0];
  const y = point[1];
  const z = point[2];

  return [
    matrix[0] * x +
      matrix[4] * y +
      matrix[8] * z +
      matrix[12],

    matrix[1] * x +
      matrix[5] * y +
      matrix[9] * z +
      matrix[13],

    matrix[2] * x +
      matrix[6] * y +
      matrix[10] * z +
      matrix[14],
  ];
}