import { Model } from './Model.js';

import {
  mat4Multiply,
  mat4Perspective,
  mat4LookAt,
  mat4RotationX,
  mat4RotationY,
} from './math.js';

const canvas =
  document.getElementById(
    'glCanvas'
  );

const gl =
  canvas.getContext('webgl');

if (!gl) {
  throw new Error(
    'WebGL is not supported by this browser.'
  );
}

/*
 * Very simple vertex shader.
 * It receives one 3D vertex
 * and transforms it by the
 * Model-View-Projection matrix.
 */
const vertexShaderSource = `
  attribute vec3 aPosition;

  uniform mat4 uMVP;

  void main() {
    gl_Position =
      uMVP *
      vec4(aPosition, 1.0);
  }
`;

/*
 * Fragment shader.
 * U- and V-curves receive
 * different colors.
 */
const fragmentShaderSource = `
  precision mediump float;

  uniform vec4 uColor;

  void main() {
    gl_FragColor = uColor;
  }
`;

function createShader(
  type,
  source
) {
  const shader =
    gl.createShader(type);

  gl.shaderSource(
    shader,
    source
  );

  gl.compileShader(shader);

  if (
    !gl.getShaderParameter(
      shader,
      gl.COMPILE_STATUS
    )
  ) {
    const message =
      gl.getShaderInfoLog(shader);

    gl.deleteShader(shader);

    throw new Error(
      `Shader compile error: ${message}`
    );
  }

  return shader;
}

function createProgram(
  vertexSource,
  fragmentSource
) {
  const vertexShader =
    createShader(
      gl.VERTEX_SHADER,
      vertexSource
    );

  const fragmentShader =
    createShader(
      gl.FRAGMENT_SHADER,
      fragmentSource
    );

  const program =
    gl.createProgram();

  gl.attachShader(
    program,
    vertexShader
  );

  gl.attachShader(
    program,
    fragmentShader
  );

  gl.linkProgram(program);

  if (
    !gl.getProgramParameter(
      program,
      gl.LINK_STATUS
    )
  ) {
    const message =
      gl.getProgramInfoLog(
        program
      );

    gl.deleteProgram(program);

    throw new Error(
      `Program link error: ${message}`
    );
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

const program =
  createProgram(
    vertexShaderSource,
    fragmentShaderSource
  );

const programInfo = {
  program,

  attribLocations: {
    position:
      gl.getAttribLocation(
        program,
        'aPosition'
      ),
  },

  uniformLocations: {
    mvp:
      gl.getUniformLocation(
        program,
        'uMVP'
      ),

    color:
      gl.getUniformLocation(
        program,
        'uColor'
      ),
  },
};

/*
 * Create Variant 17 model.
 */
const model =
  new Model(gl, {
    a: 1.0,
    n: 6,
    R: 3.0,

    uCurveCount: 28,
    vCurveCount: 19,

    uSamples: 120,
    vSamples: 120,
  });

/*
 * Initial view.
 */
let rotationX = -0.95;
let rotationY = 0.65;

let cameraDistance = 8.0;

/*
 * Mouse control.
 */
let dragging = false;

let previousMouseX = 0;
let previousMouseY = 0;

canvas.addEventListener(
  'mousedown',
  (event) => {
    dragging = true;

    previousMouseX =
      event.clientX;

    previousMouseY =
      event.clientY;
  }
);

window.addEventListener(
  'mouseup',
  () => {
    dragging = false;
  }
);

window.addEventListener(
  'mousemove',
  (event) => {
    if (!dragging) {
      return;
    }

    const dx =
      event.clientX -
      previousMouseX;

    const dy =
      event.clientY -
      previousMouseY;

    rotationY += dx * 0.01;
    rotationX += dy * 0.01;

    previousMouseX =
      event.clientX;

    previousMouseY =
      event.clientY;
  }
);

/*
 * Mouse wheel = zoom.
 */
canvas.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault();

    cameraDistance +=
      event.deltaY * 0.01;

    cameraDistance =
      Math.max(
        5.0,
        Math.min(
          14.0,
          cameraDistance
        )
      );
  },
  {
    passive: false,
  }
);

function resizeCanvasToDisplaySize() {
  const pixelRatio =
    window.devicePixelRatio || 1;

  const width =
    Math.floor(
      canvas.clientWidth *
        pixelRatio
    );

  const height =
    Math.floor(
      canvas.clientHeight *
        pixelRatio
    );

  if (
    canvas.width !== width ||
    canvas.height !== height
  ) {
    canvas.width = width;
    canvas.height = height;
  }
}

function render() {
  resizeCanvasToDisplaySize();

  gl.viewport(
    0,
    0,
    canvas.width,
    canvas.height
  );

  /*
   * Depth test is important because
   * the surface is three-dimensional.
   */
  gl.enable(
    gl.DEPTH_TEST
  );

  gl.clearColor(
    0.97,
    0.97,
    0.98,
    1.0
  );

  gl.clear(
    gl.COLOR_BUFFER_BIT |
    gl.DEPTH_BUFFER_BIT
  );

  gl.useProgram(
    programInfo.program
  );

  const aspect =
    canvas.width /
    canvas.height;

  const projection =
    mat4Perspective(
      Math.PI / 4,
      aspect,
      0.1,
      100.0
    );

  const view =
    mat4LookAt(
      [0, 0, cameraDistance],
      [0, 0, 0],
      [0, 1, 0]
    );

  const rotateX =
    mat4RotationX(
      rotationX
    );

  const rotateY =
    mat4RotationY(
      rotationY
    );

  const modelMatrix =
    mat4Multiply(
      rotateY,
      rotateX
    );

  const viewModel =
    mat4Multiply(
      view,
      modelMatrix
    );

  const mvp =
    mat4Multiply(
      projection,
      viewModel
    );

  model.draw(
    programInfo,
    mvp
  );

  requestAnimationFrame(
    render
  );
}

render();