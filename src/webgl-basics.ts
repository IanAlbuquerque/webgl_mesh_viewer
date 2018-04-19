
export function createShader(webGL2RenderingContext: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = webGL2RenderingContext.createShader(type);
  webGL2RenderingContext.shaderSource(shader, source);
  webGL2RenderingContext.compileShader(shader);
  const success = webGL2RenderingContext.getShaderParameter(shader, webGL2RenderingContext.COMPILE_STATUS);
  if (success) {
    return shader;
  }
 
  console.error(webGL2RenderingContext.getShaderInfoLog(shader));
  webGL2RenderingContext.deleteShader(shader);
}

export function createProgram(webGL2RenderingContext: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
  const program = webGL2RenderingContext.createProgram();
  webGL2RenderingContext.attachShader(program, vertexShader);
  webGL2RenderingContext.attachShader(program, fragmentShader);
  webGL2RenderingContext.linkProgram(program);
  const success = webGL2RenderingContext.getProgramParameter(program, webGL2RenderingContext.LINK_STATUS);
  if (success) {
    return program;
  }

  console.error(webGL2RenderingContext.getProgramInfoLog(program));
  webGL2RenderingContext.deleteProgram(program);
}
