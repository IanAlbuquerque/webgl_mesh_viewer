import { create } from "domain";
import { createProgram, createShader } from "./webgl-basics";

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

  webGL2RenderingContext.viewport(0, 0, webGL2RenderingContext.canvas.width, webGL2RenderingContext.canvas.height);

  webGL2RenderingContext.clearColor(0, 0, 0, 0);
  webGL2RenderingContext.useProgram(program);

  const timeUniformLocation = webGL2RenderingContext.getUniformLocation(program, "currentTime");

  testLoad(webGL2RenderingContext, timeUniformLocation, 100000, 10000);  
}

function testFinished(webGL2RenderingContext: WebGL2RenderingContext, timeUniformLocation, drawLoad: number, maxDuration: number): void {
  testLoad(webGL2RenderingContext, timeUniformLocation, 100000 + drawLoad, maxDuration);
}

function testLoad(webGL2RenderingContext: WebGL2RenderingContext, timeUniformLocation, drawLoad: number, maxDuration: number): void {
  console.log("==================================="); 
  console.log("Test drawLoad =", drawLoad);

  const loadInitialTime = new Date().getTime();
  const buffers: { vao: WebGLVertexArrayObject, buffer: WebGLBuffer } = loadDataInGPU(webGL2RenderingContext, drawLoad);
  webGL2RenderingContext.bindVertexArray(buffers.vao);
  const loadEndTime = new Date().getTime();
  const loadTime = (loadEndTime - loadInitialTime) / 1000.0
  console.log("Load Time =", loadTime, "seconds");

  const initialTime = new Date().getTime();
  let frameCount = 0;
  function loop() {
    const currentTime: number = new Date().getTime() - initialTime;
    draw(webGL2RenderingContext, timeUniformLocation, currentTime, drawLoad);
    frameCount += 1;
    if (currentTime < maxDuration) {
      window.requestAnimationFrame(loop);
    } else {
      const fps = frameCount / (currentTime/1000.0);
      webGL2RenderingContext.deleteBuffer(buffers.buffer)
      webGL2RenderingContext.deleteVertexArray(buffers.vao);
      console.log("Finishing test with drawLoad =", drawLoad);
      console.log("Time elapsed =", currentTime / 1000.0, "seconds");
      console.log("FPS =", fps);
      console.log(drawLoad, loadTime, currentTime / 1000.0, fps);
      testFinished(webGL2RenderingContext, timeUniformLocation, drawLoad, maxDuration);
    }
  }
  loop();

}

function draw(webGL2RenderingContext: WebGL2RenderingContext, timeUniformLocation, currentTime, drawLoad) {
  webGL2RenderingContext.clear(webGL2RenderingContext.COLOR_BUFFER_BIT);

  webGL2RenderingContext.uniform1f(timeUniformLocation, currentTime / 1000.0);

  const primitiveType = webGL2RenderingContext.TRIANGLES;
  const drawArrays_offset = 0;
  const count = 3 * drawLoad;
  webGL2RenderingContext.drawArrays(primitiveType, drawArrays_offset, count);
}

function createDataBuffer(  webGL2RenderingContext: WebGL2RenderingContext, 
                            vao: WebGLVertexArrayObject,
                            drawLoad: number): WebGLBuffer { 
  const positionBuffer: WebGLBuffer = webGL2RenderingContext.createBuffer();

  webGL2RenderingContext.bindVertexArray(vao);

  webGL2RenderingContext.bindBuffer(webGL2RenderingContext.ARRAY_BUFFER, positionBuffer);
  const positions: number[] = [];
  const N = drawLoad;
  for(let i = 0; i < N; i++) {
    positions.push(Math.cos(2.0*Math.PI*i/N));
    positions.push(Math.sin(2.0*Math.PI*i/N));
    positions.push(0.0);

    positions.push(Math.cos(2.0*Math.PI*(i+1)/N));
    positions.push(Math.sin(2.0*Math.PI*(i+1)/N));
    positions.push(0.0);

    positions.push(0.0);
    positions.push(0.0);
    positions.push(0.0);
  }
  webGL2RenderingContext.bufferData(webGL2RenderingContext.ARRAY_BUFFER, new Float32Array(positions), webGL2RenderingContext.STATIC_DRAW);

  webGL2RenderingContext.enableVertexAttribArray(0);
  const size = 3;          // 2 components per iteration
  const type = webGL2RenderingContext.FLOAT;   // the data is 32bit floats
  const normalize = false; // don't normalize the data
  const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  const vertexAttribPointer_offset = 0;        // start at the beginning of the buffer
  webGL2RenderingContext.vertexAttribPointer(0, size, type, normalize, stride, vertexAttribPointer_offset)

  return positionBuffer;
}

function loadDataInGPU( webGL2RenderingContext: WebGL2RenderingContext,
                        drawLoad: number): { vao: WebGLVertexArrayObject, buffer: WebGLBuffer } {
  const vao = webGL2RenderingContext.createVertexArray();
  const buffer = createDataBuffer(webGL2RenderingContext, vao, drawLoad);
  return { vao: vao, buffer: buffer };
}
