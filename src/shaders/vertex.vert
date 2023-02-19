#ifdef GL_ES
precision highp float;
#endif

attribute vec3 position;
attribute vec4 color;

varying vec3 vUv;
uniform float uTime;

void main() {
  vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);

  gl_Position = projectionMatrix * modelViewPosition;

  vUv = position;
}
