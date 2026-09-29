import { Model } from './Model.js';

import {
  mat4Multiply,
  mat4Perspective,
  mat4LookAt,
  mat4RotationX,
  mat4RotationY,
  mat4TransformPoint,
} from './math.js';


const canvas =
  document.getElementById(
    'glCanvas'
  );

const gl =
  canvas.getContext(
    'webgl'
  );

if (!gl) {
  throw new Error(
    'WebGL is not supported by this browser.'
  );
}


const uSlider =
  document.getElementById(
    'uSlider'
  );

const vSlider =
  document.getElementById(
    'vSlider'
  );

const uValue =
  document.getElementById(
    'uValue'
  );

const vValue =
  document.getElementById(
    'vValue'
  );


// Vertex shader
const vertexShaderSource = `
  attribute vec3 aPosition;
  attribute vec3 aNormal;

  uniform mat4 uModelView;
  uniform mat4 uProjection;

  varying vec3 vPositionView;
  varying vec3 vNormalView;

  void main() {
    vec4 positionView =
      uModelView *
      vec4(aPosition, 1.0);

    vPositionView =
      positionView.xyz;

    vNormalView =
      normalize(
        mat3(uModelView) *
        aNormal
      );

    gl_Position =
      uProjection *
      positionView;
  }
`;


// Fragment shader with Phong shading
const fragmentShaderSource = `
  precision mediump float;

  uniform vec3 uLightPositionView;
  uniform vec3 uBaseColor;

  varying vec3 vPositionView;
  varying vec3 vNormalView;

  void main() {
    vec3 N =
      normalize(
        vNormalView
      );

    vec3 L =
      normalize(
        uLightPositionView -
        vPositionView
      );

    vec3 V =
      normalize(
        -vPositionView
      );


    // Ambient
    vec3 ambient =
      0.18 *
      uBaseColor;


    // Diffuse
    float diffuseFactor =
      max(
        dot(
          N,
          L
        ),
        0.0
      );

    vec3 diffuse =
      0.75 *
      diffuseFactor *
      uBaseColor;


    // Specular
    float specularFactor =
      0.0;

    if (
      diffuseFactor > 0.0
    ) {
      vec3 R =
        reflect(
          -L,
          N
        );

      specularFactor =
        pow(
          max(
            dot(
              R,
              V
            ),
            0.0
          ),
          32.0
        );
    }

    vec3 specular =
      0.65 *
      specularFactor *
      vec3(
        1.0,
        1.0,
        1.0
      );


    vec3 finalColor =
      ambient +
      diffuse +
      specular;


    gl_FragColor =
      vec4(
        finalColor,
        1.0
      );
  }
`;


// Compile shader
function createShader(
  type,
  source
) {
  const shader =
    gl.createShader(
      type
    );

  gl.shaderSource(
    shader,
    source
  );

  gl.compileShader(
    shader
  );

  if (
    !gl.getShaderParameter(
      shader,
      gl.COMPILE_STATUS
    )
  ) {
    const message =
      gl.getShaderInfoLog(
        shader
      );

    gl.deleteShader(
      shader
    );

    throw new Error(
      `Shader compile error: ${message}`
    );
  }

  return shader;
}


// Create shader program
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

  gl.linkProgram(
    program
  );

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

    gl.deleteProgram(
      program
    );

    throw new Error(
      `Program link error: ${message}`
    );
  }

  gl.deleteShader(
    vertexShader
  );

  gl.deleteShader(
    fragmentShader
  );

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

    normal:
      gl.getAttribLocation(
        program,
        'aNormal'
      ),
  },

  uniformLocations: {
    modelView:
      gl.getUniformLocation(
        program,
        'uModelView'
      ),

    projection:
      gl.getUniformLocation(
        program,
        'uProjection'
      ),

    lightPositionView:
      gl.getUniformLocation(
        program,
        'uLightPositionView'
      ),

    baseColor:
      gl.getUniformLocation(
        program,
        'uBaseColor'
      ),
  },
};


// Create initial model
let model =
  new Model(
    gl,
    {
      a: 1.0,
      n: 6,
      R: 3.0,

      uSegments:
        Number(
          uSlider.value
        ),

      vSegments:
        Number(
          vSlider.value
        ),
    }
  );


// Rebuild model after slider change
function rebuildModel() {
  const uSegments =
    Number(
      uSlider.value
    );

  const vSegments =
    Number(
      vSlider.value
    );

  uValue.textContent =
    uSegments;

  vValue.textContent =
    vSegments;

  model.dispose();

  model =
    new Model(
      gl,
      {
        a: 1.0,
        n: 6,
        R: 3.0,

        uSegments:
          uSegments,

        vSegments:
          vSegments,
      }
    );
}


uSlider.addEventListener(
  'input',
  rebuildModel
);

vSlider.addEventListener(
  'input',
  rebuildModel
);


// Initial view
let rotationX =
  -0.95;

let rotationY =
  0.65;

let cameraDistance =
  8.0;


// Mouse rotation
let dragging =
  false;

let previousMouseX =
  0;

let previousMouseY =
  0;


canvas.addEventListener(
  'mousedown',
  (event) => {
    dragging =
      true;

    previousMouseX =
      event.clientX;

    previousMouseY =
      event.clientY;
  }
);


window.addEventListener(
  'mouseup',
  () => {
    dragging =
      false;
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

    rotationY +=
      dx * 0.01;

    rotationX +=
      dy * 0.01;

    previousMouseX =
      event.clientX;

    previousMouseY =
      event.clientY;
  }
);


// Mouse wheel zoom
canvas.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault();

    cameraDistance +=
      event.deltaY *
      0.01;

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


// Resize canvas
function resizeCanvasToDisplaySize() {
  const pixelRatio =
    window.devicePixelRatio ||
    1;

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
    canvas.width =
      width;

    canvas.height =
      height;
  }
}


// Render scene
function render(time) {
  resizeCanvasToDisplaySize();

  gl.viewport(
    0,
    0,
    canvas.width,
    canvas.height
  );

  gl.enable(
    gl.DEPTH_TEST
  );

  gl.disable(
    gl.CULL_FACE
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
      [
        0,
        0,
        cameraDistance
      ],
      [
        0,
        0,
        0
      ],
      [
        0,
        1,
        0
      ]
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

  const modelView =
    mat4Multiply(
      view,
      modelMatrix
    );


  // Moving point light
  const seconds =
    time * 0.001;

  const lightRadius =
    5.0;

  const lightModel = [
    lightRadius *
      Math.cos(
        seconds
      ),

    lightRadius *
      Math.sin(
        seconds
      ),

    3.5,
  ];


  // Transform light to view coordinates
  const lightView =
    mat4TransformPoint(
      modelView,
      lightModel
    );


  gl.uniformMatrix4fv(
    programInfo
      .uniformLocations
      .modelView,
    false,
    modelView
  );


  gl.uniformMatrix4fv(
    programInfo
      .uniformLocations
      .projection,
    false,
    projection
  );


  gl.uniform3f(
    programInfo
      .uniformLocations
      .lightPositionView,

    lightView[0],
    lightView[1],
    lightView[2]
  );


  gl.uniform3f(
    programInfo
      .uniformLocations
      .baseColor,

    0.25,
    0.55,
    0.90
  );


  model.draw(
    programInfo
  );


  requestAnimationFrame(
    render
  );
}


requestAnimationFrame(
  render
);