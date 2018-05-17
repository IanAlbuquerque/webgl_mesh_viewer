#version 300 es
 
precision mediump float;

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;

uniform mat4 m;
uniform mat4 v;
uniform mat4 p;
 
out vec4 positionCameraSpace;
out vec4 normalCameraSpace;

void main() {
  vec4 positionVec4 = vec4(position, 1.0);
  vec4 normalVec4 = vec4(normal, 0.0);

  mat4 mv = v * m;
  mat4 mvp = p * mv;
  mat4 mv_ti = transpose(inverse(mv)); 

  gl_Position = mvp * positionVec4;
  positionCameraSpace = mv * positionVec4;
  normalCameraSpace = mv_ti * normalVec4;
}
