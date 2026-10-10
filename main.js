import { Model } from './Model.js';
import { mat4Multiply, mat4Perspective, mat4LookAt, mat4RotationX,
  mat4RotationY, mat4TransformPoint } from './math.js';

const canvas = document.querySelector('#glCanvas');
const gl = canvas.getContext('webgl', { antialias: true });
if (!gl) throw new Error('WebGL is not supported by this browser.');

// Variant 17: tangent MUST take priority during Gram-Schmidt.
const vertexShader = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aTangent;
attribute vec2 aTexCoord;
uniform mat4 uModelView;
uniform mat4 uProjection;
varying vec3 vPositionView;
varying vec3 vNormalView;
varying vec3 vTangentView;
varying vec2 vTexCoord;
void main() {
  vec4 positionView = uModelView * vec4(aPosition, 1.0);
  vPositionView = positionView.xyz;
  // This project rotates the model but does not scale it non-uniformly.
  vNormalView = normalize(mat3(uModelView) * aNormal);
  vTangentView = normalize(mat3(uModelView) * aTangent);
  vTexCoord = aTexCoord;
  gl_Position = uProjection * positionView;
}`;

const fragmentShader = `
precision highp float;
uniform vec3 uLightPositionView;
uniform sampler2D uDiffuseMap;
uniform sampler2D uSpecularMap;
uniform sampler2D uNormalMap;
uniform bool uUseDiffuse;
uniform bool uUseSpecular;
uniform bool uUseNormal;
varying vec3 vPositionView;
varying vec3 vNormalView;
varying vec3 vTangentView;
varying vec2 vTexCoord;
void main() {
  // IMPORTANT: Tangent has priority: keep T unchanged, adjust N against T.
  vec3 T = normalize(vTangentView);
  vec3 N0 = normalize(vNormalView);
  vec3 N = normalize(N0 - dot(N0, T) * T);
  vec3 B = normalize(cross(N, T));
  mat3 TBN = mat3(T, B, N);

  vec3 mapNormal = texture2D(uNormalMap, vTexCoord).rgb * 2.0 - 1.0;
  vec3 finalNormal = uUseNormal ? normalize(TBN * normalize(mapNormal)) : N;
  vec3 diffuseColor = uUseDiffuse ? texture2D(uDiffuseMap, vTexCoord).rgb
                                   : vec3(0.25, 0.55, 0.90);
  vec3 specularColor = uUseSpecular ? texture2D(uSpecularMap, vTexCoord).rgb
                                     : vec3(1.0);
  vec3 L = normalize(uLightPositionView - vPositionView);
  vec3 V = normalize(-vPositionView);
  float lambert = max(dot(finalNormal, L), 0.0);
  vec3 ambient = 0.18 * diffuseColor;
  vec3 diffuse = 0.75 * lambert * diffuseColor;
  float shine = 0.0;
  if (lambert > 0.0) {
    vec3 R = reflect(-L, finalNormal);
    shine = pow(max(dot(R, V), 0.0), 32.0);
  }
  vec3 specular = 0.65 * shine * specularColor;
  gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}`;

const lightVS = `
attribute vec3 aPosition;
uniform mat4 uModelView;
uniform mat4 uProjection;
uniform vec3 uLightPosition;
void main() {
  gl_Position = uProjection * uModelView *
    vec4(aPosition * 0.18 + uLightPosition, 1.0);
}`;
const lightFS = `precision mediump float;
void main() { gl_FragColor = vec4(1.0, 0.9, 0.2, 1.0); }`;

function compile(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}
function createProgram(vs, fs) {
  const v = compile(gl.VERTEX_SHADER, vs), f = compile(gl.FRAGMENT_SHADER, fs);
  const program = gl.createProgram();
  gl.attachShader(program, v);
  gl.attachShader(program, f);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }
  gl.deleteShader(v);
  gl.deleteShader(f);
  return program;
}
function getInfo(program, attributes, uniforms) {
  return {
    program,
    attribLocations: Object.fromEntries(attributes.map(([key, name]) => [key, gl.getAttribLocation(program, name)])),
    uniformLocations: Object.fromEntries(uniforms.map(name => [name, gl.getUniformLocation(program, name)])),
  };
}
const surface = getInfo(createProgram(vertexShader, fragmentShader),
  [['position', 'aPosition'], ['normal', 'aNormal'], ['tangent', 'aTangent'], ['texCoord', 'aTexCoord']],
  ['uModelView', 'uProjection', 'uLightPositionView', 'uDiffuseMap', 'uSpecularMap', 'uNormalMap',
    'uUseDiffuse', 'uUseSpecular', 'uUseNormal']);
const light = getInfo(createProgram(lightVS, lightFS),
  [['position', 'aPosition']], ['uModelView', 'uProjection', 'uLightPosition']);

function loadTexture(path, unit, fallbackRGBA) {
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
    gl.UNSIGNED_BYTE, new Uint8Array(fallbackRGBA));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  const image = new Image();
  image.onload = () => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  };
  image.onerror = () => console.error(`Could not load texture ${path}. Use Live Server.`);
  image.src = path;
  return texture;
}
const maps = [
  loadTexture('./textures/diffuse.png', 0, [64, 140, 230, 255]),
  loadTexture('./textures/specular.png', 1, [200, 200, 200, 255]),
  loadTexture('./textures/normal.png', 2, [128, 128, 255, 255]),
];

function buildLightSphere(latSegments = 14, lonSegments = 20) {
  const points = [], indices = [];
  for (let i = 0; i <= latSegments; i++) {
    const theta = Math.PI * i / latSegments;
    for (let j = 0; j <= lonSegments; j++) {
      const phi = 2 * Math.PI * j / lonSegments;
      points.push(Math.sin(theta) * Math.cos(phi),
        Math.sin(theta) * Math.sin(phi), Math.cos(theta));
    }
  }
  for (let i = 0; i < latSegments; i++) for (let j = 0; j < lonSegments; j++) {
    const a = i * (lonSegments + 1) + j, b = a + lonSegments + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const vertex = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertex);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
  const elements = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elements);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  return { vertex, elements, count: indices.length };
}
const lightSphere = buildLightSphere();
const uSlider = document.querySelector('#uSlider');
const vSlider = document.querySelector('#vSlider');
let model = new Model(gl, { a: 1, n: 6, R: 3, uSegments: +uSlider.value,
  vSegments: +vSlider.value });
function rebuildModel() {
  document.querySelector('#uValue').textContent = uSlider.value;
  document.querySelector('#vValue').textContent = vSlider.value;
  model.dispose();
  model = new Model(gl, { a: 1, n: 6, R: 3, uSegments: +uSlider.value,
    vSegments: +vSlider.value });
}
uSlider.addEventListener('input', rebuildModel);
vSlider.addEventListener('input', rebuildModel);
let rotationX = -0.95, rotationY = 0.65, cameraDistance = 8;
let dragging = false, previousX = 0, previousY = 0;
canvas.addEventListener('mousedown', e => { dragging = true; previousX = e.clientX; previousY = e.clientY; });
window.addEventListener('mouseup', () => { dragging = false; });
window.addEventListener('mousemove', e => {
  if (!dragging) return;
  rotationY += (e.clientX - previousX) * 0.01;
  rotationX += (e.clientY - previousY) * 0.01;
  previousX = e.clientX; previousY = e.clientY;
});
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  cameraDistance = Math.max(5, Math.min(14, cameraDistance + e.deltaY * 0.01));
}, { passive: false });

function drawLight(modelView, projection, lightPosition) {
  gl.useProgram(light.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, lightSphere.vertex);
  gl.enableVertexAttribArray(light.attribLocations.position);
  gl.vertexAttribPointer(light.attribLocations.position, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lightSphere.elements);
  gl.uniformMatrix4fv(light.uniformLocations.uModelView, false, modelView);
  gl.uniformMatrix4fv(light.uniformLocations.uProjection, false, projection);
  gl.uniform3fv(light.uniformLocations.uLightPosition, lightPosition);
  gl.drawElements(gl.TRIANGLES, lightSphere.count, gl.UNSIGNED_SHORT, 0);
}
function render(milliseconds) {
  const dpr = window.devicePixelRatio || 1;
  const width = Math.floor(canvas.clientWidth * dpr);
  const height = Math.floor(canvas.clientHeight * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width; canvas.height = height;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0.045, 0.075, 0.12, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const projection = mat4Perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
  const view = mat4LookAt([0, 0, cameraDistance], [0, 0, 0], [0, 1, 0]);
  const modelMatrix = mat4Multiply(mat4RotationY(rotationY), mat4RotationX(rotationX));
  const modelView = mat4Multiply(view, modelMatrix);
  const seconds = milliseconds * 0.0006;
  const lightModel = [5 * Math.cos(seconds), 5 * Math.sin(seconds), 3.5];
  const lightView = mat4TransformPoint(modelView, lightModel);

  gl.useProgram(surface.program);
  const uni = surface.uniformLocations;
  gl.uniformMatrix4fv(uni.uModelView, false, modelView);
  gl.uniformMatrix4fv(uni.uProjection, false, projection);
  gl.uniform3fv(uni.uLightPositionView, lightView);
  maps.forEach((texture, i) => {
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  });
  gl.uniform1i(uni.uDiffuseMap, 0);
  gl.uniform1i(uni.uSpecularMap, 1);
  gl.uniform1i(uni.uNormalMap, 2);
  gl.uniform1i(uni.uUseDiffuse, document.querySelector('#diffuseEnabled').checked ? 1 : 0);
  gl.uniform1i(uni.uUseSpecular, document.querySelector('#specularEnabled').checked ? 1 : 0);
  gl.uniform1i(uni.uUseNormal, document.querySelector('#normalEnabled').checked ? 1 : 0);
  model.draw(surface);
  drawLight(modelView, projection, lightModel);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
