#version 300 es

precision mediump float;

in vec4 positionCameraSpace;
in vec4 normalCameraSpace;

uniform vec3 lightPosition;

uniform vec3 materialAmbient;
uniform vec3 materialDiffuse;
uniform vec3 materialSpecular;
uniform float materialShininess;
 
out vec4 outColor;

void main() {
  vec3 fragmentNormal = normalize(normalCameraSpace.xyz);
  vec3 lightDir = normalize(lightPosition - positionCameraSpace.xyz);
  float incidence = dot(fragmentNormal, lightDir);

  vec3 ambientColor = vec3(0.0, 0.0, 0.0);
  vec3 diffuseColor = vec3(0.0, 0.0, 0.0);
  vec3 specularColor = vec3(0.0, 0.0, 0.0);
  
  ambientColor = materialAmbient;
  if (incidence >= 0.0) {
    diffuseColor = incidence * materialDiffuse;

    vec3 cameraDir = normalize(vec3(0.0, 0.0, 0.0) - positionCameraSpace.xyz);
    vec3 sumDir = normalize(cameraDir + lightDir);
    float specularFactor = pow(max(dot(fragmentNormal, sumDir), 0.0), materialShininess);

    specularColor = specularFactor * materialSpecular;
  }

  outColor = vec4(ambientColor + diffuseColor + specularColor, 1.0);
}
