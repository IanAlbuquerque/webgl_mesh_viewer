#version 300 es
 
precision mediump float;

layout(location = 0) in vec3 position;

uniform float currentTime;
 
void main() {
  gl_Position = vec4(position * sin(currentTime), 1.0) ;
}
