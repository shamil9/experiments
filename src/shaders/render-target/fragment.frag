
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;

float circle(in vec2 _st, in float _radius){
    vec2 dist = _st-vec2(0.5);
	return 1.-smoothstep(_radius-(_radius*0.01),
                         _radius+(_radius*0.01),
                         dot(dist,dist)*4.0);
}

void main() {
  vec4 texture = LinearTosRGB(texture2D(map, vUv.xy));

  // X Crop
  float alpha = step(0.3, vUv.x);
  alpha = alpha - step(0.7, vUv.x);

  // Y Crop
  alpha = alpha * step(0.25, vUv.y);
  alpha = alpha - step(0.65, vUv.y);
  // vec3 c = mix(texture.xyz, color, 0.2);
  // vec3 color = circle(vUv,0.9);

  gl_FragColor = vec4(texture.xyz * color, alpha);
}
