import { create } from "domain";
import { createProgram, createShader, projectionMatrix } from "./webgl-basics";

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

  const uniformLocations = {
    m:                  webGL2RenderingContext.getUniformLocation(program, "m"),
    v:                  webGL2RenderingContext.getUniformLocation(program, "v"),
    p:                  webGL2RenderingContext.getUniformLocation(program, "p"),
    lightPosition:      webGL2RenderingContext.getUniformLocation(program, "lightPosition"),
    materialAmbient:    webGL2RenderingContext.getUniformLocation(program, "materialAmbient"),
    materialDiffuse:    webGL2RenderingContext.getUniformLocation(program, "materialDiffuse"),
    materialSpecular:   webGL2RenderingContext.getUniformLocation(program, "materialSpecular"),
    materialShininess:  webGL2RenderingContext.getUniformLocation(program, "materialShininess")
  }

  testLoad(webGL2RenderingContext, uniformLocations, 100000, 20000);  
}

function testFinished(webGL2RenderingContext: WebGL2RenderingContext, uniformLocations, drawLoad: number, maxDuration: number): void {
  testLoad(webGL2RenderingContext, uniformLocations, 100000 + drawLoad, maxDuration);
}

function testLoad(webGL2RenderingContext: WebGL2RenderingContext, uniformLocations, drawLoad: number, maxDuration: number): void {
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
    draw(webGL2RenderingContext, uniformLocations, currentTime, drawLoad);
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
      testFinished(webGL2RenderingContext, uniformLocations, drawLoad, maxDuration);
    }
  }
  loop();

}

function draw(webGL2RenderingContext: WebGL2RenderingContext, uniformLocations, currentTime, drawLoad) {
  webGL2RenderingContext.clear(webGL2RenderingContext.COLOR_BUFFER_BIT);
  webGL2RenderingContext.enable(webGL2RenderingContext.DEPTH_TEST);

  webGL2RenderingContext.uniformMatrix4fv(uniformLocations.m, false, new Float32Array([ Math.cos(currentTime/1000), 0, Math.sin(currentTime/1000), 0,
                                                                                        0, 1, 0, 0,
                                                                                        - Math.sin(currentTime/1000), 0, Math.cos(currentTime/1000), 0,
                                                                                        0, -2, 0, 1]));
  webGL2RenderingContext.uniformMatrix4fv(uniformLocations.v, false, new Float32Array([ 1, 0, 0, 0,
                                                                                        0, 1, 0, 0,
                                                                                        0, 0, 1, 0,
                                                                                        0, 0, -2, 1]));
  webGL2RenderingContext.uniformMatrix4fv(uniformLocations.p, false, new Float32Array(projectionMatrix(5.0, 5.0, 1.0, 20.0)));
  console.log(currentTime);
  webGL2RenderingContext.uniform3f(uniformLocations.lightPosition, 0.0, 0.0, 0.0);      
  webGL2RenderingContext.uniform3f(uniformLocations.materialAmbient, 0.1, 0.0, 0.0);    
  webGL2RenderingContext.uniform3f(uniformLocations.materialDiffuse, 1.0, 0.0, 0.0);    
  webGL2RenderingContext.uniform3f(uniformLocations.materialSpecular, 1.0, 1.0, 1.0);   
  webGL2RenderingContext.uniform1f(uniformLocations.materialShininess, 24.0);  

  const primitiveType = webGL2RenderingContext.TRIANGLES;
  const drawArrays_offset = 0;
  const count = 36 // 3 * drawLoad;
  webGL2RenderingContext.drawArrays(primitiveType, drawArrays_offset, count);
}

function createDataBuffer(  webGL2RenderingContext: WebGL2RenderingContext, 
                            vao: WebGLVertexArrayObject,
                            drawLoad: number): WebGLBuffer { 
  const positionBuffer: WebGLBuffer = webGL2RenderingContext.createBuffer();

  webGL2RenderingContext.bindVertexArray(vao);

  webGL2RenderingContext.bindBuffer(webGL2RenderingContext.ARRAY_BUFFER, positionBuffer);
  // const positions: number[] = [];
  // const N = drawLoad;
  // for(let i = 0; i < N; i++) {
  //   positions.push(Math.cos(2.0*Math.PI*i/N));
  //   positions.push(Math.sin(2.0*Math.PI*i/N));
  //   positions.push(0.0);

  //   positions.push(Math.cos(2.0*Math.PI*(i+1)/N));
  //   positions.push(Math.sin(2.0*Math.PI*(i+1)/N));
  //   positions.push(0.0);

  //   positions.push(0.0);
  //   positions.push(0.0);
  //   positions.push(0.0);
  // }
  const positions: number[] = [
    -1, -1, -1,
    1, -1, -1,
    1, 1, -1,

    1, 1, -1,
    -1, 1, -1,
    -1, -1, -1,

    1, 1, -1,
    1, -1, -1,
    1, -1, 1,

    1, 1, 1,
    1, 1, -1,
    1, -1, 1,

    1, 1, 1,
    -1, 1, 1,
    1, -1, 1,
    
    -1, 1, 1,
    -1, -1, 1,
    1, -1, 1,

    -1, 1, 1,
    -1, -1, 1,
    -1, -1, -1,

    -1, 1, -1,
    -1, 1, 1,
    -1, -1, -1,

    -1, 1, 1,
    -1, 1, -1,
    1, 1, -1,

    1, 1, -1,
    1, 1, 1,
    -1, 1, 1,

    1, -1, 1,
    -1, -1, -1,
    -1, -1, 1,

    1, -1, 1,
    1, -1, -1,
    -1, -1, -1
  ];
  const normals: number[] = [
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,

    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,

    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
  ];
  let bufferArray: number[] = [];
  for (let i = 0; i < positions.length / 3; i++) {
    bufferArray.push(positions[3 * i + 0]);
    bufferArray.push(positions[3 * i + 1]);
    bufferArray.push(positions[3 * i + 2]);
    bufferArray.push(normals[3 * i + 0]);
    bufferArray.push(normals[3 * i + 1]);
    bufferArray.push(normals[3 * i + 2]);
  }

  webGL2RenderingContext.bufferData(  webGL2RenderingContext.ARRAY_BUFFER,
                                      new Float32Array(bufferArray),
                                      webGL2RenderingContext.STATIC_DRAW);

  webGL2RenderingContext.enableVertexAttribArray(0);
  webGL2RenderingContext.vertexAttribPointer( 0,    
                                              3,  // size
                                              webGL2RenderingContext.FLOAT, // type
                                              false,  // normalize
                                              6 * 4, // stride
                                              0 * 4); //offset

  webGL2RenderingContext.enableVertexAttribArray(1);
  webGL2RenderingContext.vertexAttribPointer( 1,    
                                              3,  // size
                                              webGL2RenderingContext.FLOAT, // type
                                              false,  // normalize
                                              6 * 4, // stride
                                              3 * 4); //offset                                            

  return positionBuffer;
}

function loadDataInGPU( webGL2RenderingContext: WebGL2RenderingContext,
                        drawLoad: number): { vao: WebGLVertexArrayObject, buffer: WebGLBuffer } {
  const vao = webGL2RenderingContext.createVertexArray();
  const buffer = createDataBuffer(webGL2RenderingContext, vao, drawLoad);
  return { vao: vao, buffer: buffer };
}
