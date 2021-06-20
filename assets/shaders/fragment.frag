#ifdef GL_ES
precision highp float;
#endif

varying vec3 vUv;
uniform float uTime;

void main() { gl_FragColor = vec4(1., 1., 1., 1.); }
