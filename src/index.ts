const fs = require('fs');

const vertexShaderStringCode: string = fs.readFileSync(__dirname + './../shaders/vertex.glsl').toString();
const fragmentShaderrStringCode: string = fs.readFileSync(__dirname + './../shaders/fragment.glsl').toString();

initCanvas('canvas_id');

function initCanvas(canvasId: string): void {
  const htmlCanvasElement: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById(canvasId);
  const webGL2RenderingContext : WebGL2RenderingContext  = htmlCanvasElement.getContext("webgl2");
  if (!webGL2RenderingContext) {
    throw 'WebGL2 not supported.';
  }

  const vertexShader = createShader(webGL2RenderingContext, webGL2RenderingContext.VERTEX_SHADER, vertexShaderStringCode);
  const fragmentShader = createShader(webGL2RenderingContext, webGL2RenderingContext.FRAGMENT_SHADER, fragmentShaderrStringCode);
  const program = createProgram(webGL2RenderingContext, vertexShader, fragmentShader);

  const positionAttributeLocation = webGL2RenderingContext.getAttribLocation(program, "a_position");
  const positionBuffer = webGL2RenderingContext.createBuffer();

  webGL2RenderingContext.bindBuffer(webGL2RenderingContext.ARRAY_BUFFER, positionBuffer);
  // three 2d points
  const positions = [
    0, 0,
    0, 0.5,
    0.7, 0,
  ];
  webGL2RenderingContext.bufferData(webGL2RenderingContext.ARRAY_BUFFER, new Float32Array(positions), webGL2RenderingContext.STATIC_DRAW);

  const vao = webGL2RenderingContext.createVertexArray();
  webGL2RenderingContext.bindVertexArray(vao);

  webGL2RenderingContext.enableVertexAttribArray(positionAttributeLocation);
  const size = 2;          // 2 components per iteration
  const type = webGL2RenderingContext.FLOAT;   // the data is 32bit floats
  const normalize = false; // don't normalize the data
  const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  const vertexAttribPointer_offset = 0;        // start at the beginning of the buffer
  webGL2RenderingContext.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, vertexAttribPointer_offset)

  webGL2RenderingContext.viewport(0, 0, webGL2RenderingContext.canvas.width, webGL2RenderingContext.canvas.height);

  // Clear the canvas
  webGL2RenderingContext.clearColor(0, 0, 0, 0);
  webGL2RenderingContext.clear(webGL2RenderingContext.COLOR_BUFFER_BIT);

  webGL2RenderingContext.useProgram(program);
  webGL2RenderingContext.bindVertexArray(vao);

  const primitiveType = webGL2RenderingContext.TRIANGLES;
  const drawArrays_offset = 0;
  const count = 3;
  webGL2RenderingContext.drawArrays(primitiveType, drawArrays_offset, count);
}

function createShader(webGL2RenderingContext: WebGL2RenderingContext, type: number, source: string): WebGLShader {
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

function createProgram(webGL2RenderingContext: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
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