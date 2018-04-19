#version 300 es

precision mediump float;
 
out vec4 outColor;
 
uniform float currentTime;

void main() {
  float r = 1.0 * sin(currentTime*2.0 + 2.3);
  float g = 1.0 * sin(currentTime*3.0 + 1.3);
  float b = 1.0 * sin(currentTime*5.0 + 3.9);
  outColor = vec4(r, g, b, 1.0) ;
}
