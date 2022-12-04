#ifdef GL_ES
precision highp float;
#endif

varying vec3 vUv;
uniform float uTime;

void main() {
  vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);

  gl_Position = projectionMatrix * modelViewPosition;

  vUv = position;
}
