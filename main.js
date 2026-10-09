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
      vec4(
        aPosition,
        1.0
      );

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


// Light source marker shader
const lightVertexShaderSource = `
  attribute vec3 aPosition;

  uniform mat4 uModelView;
  uniform mat4 uProjection;
  uniform vec3 uLightPosition;

  void main() {
    vec3 position =
      aPosition * 0.18 +
      uLightPosition;

    gl_Position =
      uProjection *
      uModelView *
      vec4(
        position,
        1.0
      );
  }
`;


const lightFragmentShaderSource = `
  precision mediump float;

  void main() {
    gl_FragColor =
      vec4(
        1.0,
        0.9,
        0.2,
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


// Surface shader program
const program =
  createProgram(
    vertexShaderSource,
    fragmentShaderSource
  );


// Light sphere shader program
const lightProgram =
  createProgram(
    lightVertexShaderSource,
    lightFragmentShaderSource
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


const lightProgramInfo = {
  program:
    lightProgram,

  attribLocations: {
    position:
      gl.getAttribLocation(
        lightProgram,
        'aPosition'
      ),
  },

  uniformLocations: {
    modelView:
      gl.getUniformLocation(
        lightProgram,
        'uModelView'
      ),

    projection:
      gl.getUniformLocation(
        lightProgram,
        'uProjection'
      ),

    lightPosition:
      gl.getUniformLocation(
        lightProgram,
        'uLightPosition'
      ),
  },
};


// Create sphere for light source
function createLightSphere(
  latitudeSegments = 12,
  longitudeSegments = 18
) {
  const positions = [];
  const indices = [];


  for (
    let lat = 0;
    lat <= latitudeSegments;
    lat++
  ) {
    const theta =
      (
        lat *
        Math.PI
      ) /
      latitudeSegments;

    const sinTheta =
      Math.sin(
        theta
      );

    const cosTheta =
      Math.cos(
        theta
      );


    for (
      let lon = 0;
      lon <= longitudeSegments;
      lon++
    ) {
      const phi =
        (
          lon *
          2 *
          Math.PI
        ) /
        longitudeSegments;

      const sinPhi =
        Math.sin(
          phi
        );

      const cosPhi =
        Math.cos(
          phi
        );

      positions.push(
        sinTheta *
          cosPhi,

        sinTheta *
          sinPhi,

        cosTheta
      );
    }
  }


  for (
    let lat = 0;
    lat < latitudeSegments;
    lat++
  ) {
    for (
      let lon = 0;
      lon < longitudeSegments;
      lon++
    ) {
      const first =
        lat *
        (
          longitudeSegments +
          1
        ) +
        lon;

      const second =
        first +
        longitudeSegments +
        1;


      indices.push(
        first,
        second,
        first + 1
      );

      indices.push(
        second,
        second + 1,
        first + 1
      );
    }
  }


  const positionBuffer =
    gl.createBuffer();

  gl.bindBuffer(
    gl.ARRAY_BUFFER,
    positionBuffer
  );

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(
      positions
    ),
    gl.STATIC_DRAW
  );


  const indexBuffer =
    gl.createBuffer();

  gl.bindBuffer(
    gl.ELEMENT_ARRAY_BUFFER,
    indexBuffer
  );

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(
      indices
    ),
    gl.STATIC_DRAW
  );


  return {
    positionBuffer,
    indexBuffer,
    indexCount:
      indices.length,
  };
}


const lightSphere =
  createLightSphere();


// Draw light source sphere
function drawLightSphere(
  modelView,
  projection,
  lightPosition
) {
  gl.useProgram(
    lightProgramInfo.program
  );


  gl.bindBuffer(
    gl.ARRAY_BUFFER,
    lightSphere.positionBuffer
  );

  gl.enableVertexAttribArray(
    lightProgramInfo
      .attribLocations
      .position
  );

  gl.vertexAttribPointer(
    lightProgramInfo
      .attribLocations
      .position,
    3,
    gl.FLOAT,
    false,
    0,
    0
  );


  gl.bindBuffer(
    gl.ELEMENT_ARRAY_BUFFER,
    lightSphere.indexBuffer
  );


  gl.uniformMatrix4fv(
    lightProgramInfo
      .uniformLocations
      .modelView,
    false,
    modelView
  );


  gl.uniformMatrix4fv(
    lightProgramInfo
      .uniformLocations
      .projection,
    false,
    projection
  );


  gl.uniform3f(
    lightProgramInfo
      .uniformLocations
      .lightPosition,

    lightPosition[0],
    lightPosition[1],
    lightPosition[2]
  );


  gl.drawElements(
    gl.TRIANGLES,
    lightSphere.indexCount,
    gl.UNSIGNED_SHORT,
    0
  );
}


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
    time * 0.0006;

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


  // Draw surface
  gl.useProgram(
    programInfo.program
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


  // Draw visible light source
  drawLightSphere(
    modelView,
    projection,
    lightModel
  );


  requestAnimationFrame(
    render
  );
}


requestAnimationFrame(
  render
);