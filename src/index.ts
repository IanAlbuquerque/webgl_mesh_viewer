import { create } from "domain";
import { createProgram, createShader, projectionMatrix } from "./webgl-basics";
import { Vector3, normalFromTriangleVertices } from "./linalg";
import { SSL_OP_MSIE_SSLV2_RSA_PADDING } from "constants";

const fs = require('fs');
const https = require('http');

const vertexShaderStringCode: string = fs.readFileSync(__dirname + './../shaders/vertex.glsl').toString();
const fragmentShaderrStringCode: string = fs.readFileSync(__dirname + './../shaders/fragment.glsl').toString();

initCanvas('canvas_id');

let resW: number;
let resH: number;


//==================================

function getRequest(url: string): Promise<any> {
  return new Promise<any>(
    function (resolve, reject) {
      https.get(url, (resp) => {
        let data = '';
        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
          data += chunk;
        });
        // The whole response has been received. Print out the result.
        resp.on('end', () => {
          resolve(data);
        });
      }).on("error", (err) => {
        reject(err);
      });
    }
  );
}

//========================

function initCanvas(canvasId: string): void {
  const htmlCanvasElement: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById(canvasId);
  const href = window.location.href;
  const url = new URL(href);
  resW = 800;
  resH = 600;
  htmlCanvasElement.width = resW;
  htmlCanvasElement.height = resH;
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

  startDrawLoop(webGL2RenderingContext, uniformLocations);  
}

function startDrawLoop(webGL2RenderingContext: WebGL2RenderingContext, uniformLocations): void {
  
  const htmlCanvasElement: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById('canvas_id');

  genPositionsAndNormals()
  .then( (info: { buffer: number[], triangleCount: number }) => {
    let data: number[] = info.buffer;
    let triangleCount: number = info.triangleCount;

    const loadInitialTime = new Date().getTime();
    const buffers: { vao: WebGLVertexArrayObject, buffer: WebGLBuffer } = loadDataInGPU(webGL2RenderingContext, data);
    webGL2RenderingContext.bindVertexArray(buffers.vao);
    const loadEndTime = new Date().getTime();
    const loadTime = (loadEndTime - loadInitialTime) / 1000.0;
  
    const initialTime = new Date().getTime();
    let frameCount = 0;
    function loop() {
      const currentTime: number = new Date().getTime() - initialTime;
      draw(webGL2RenderingContext, uniformLocations, currentTime, triangleCount);
      window.requestAnimationFrame(loop);
    }
    loop();
  });
}

function draw(webGL2RenderingContext: WebGL2RenderingContext, uniformLocations, currentTime, triangleCount) {
  webGL2RenderingContext.clear(webGL2RenderingContext.COLOR_BUFFER_BIT);
  webGL2RenderingContext.enable(webGL2RenderingContext.DEPTH_TEST);

  webGL2RenderingContext.uniformMatrix4fv(uniformLocations.m, false, new Float32Array([ Math.cos(currentTime/1000), 0, Math.sin(currentTime/1000), 0,
                                                                                        0, 1, 0, 0,
                                                                                        - Math.sin(currentTime/1000), 0, Math.cos(currentTime/1000), 0,
                                                                                        0, 0, 0, 1]));
  webGL2RenderingContext.uniformMatrix4fv(uniformLocations.v, false, new Float32Array([ 1, 0, 0, 0,
                                                                                        0, 1, 0, 0,
                                                                                        0, 0, 1, 0,
                                                                                        0, 0, -2, 1]));
  webGL2RenderingContext.uniformMatrix4fv(uniformLocations.p, false, new Float32Array(projectionMatrix(1.0, 1.0, 1.0, 20.0)));
  webGL2RenderingContext.uniform3f(uniformLocations.lightPosition, 0.0, 0.0, 0.0);      
  webGL2RenderingContext.uniform3f(uniformLocations.materialAmbient, 0.3, 0.0, 0.0);    
  webGL2RenderingContext.uniform3f(uniformLocations.materialDiffuse, 1.0, 0.0, 0.0);    
  webGL2RenderingContext.uniform3f(uniformLocations.materialSpecular, 1.0, 1.0, 1.0);   
  webGL2RenderingContext.uniform1f(uniformLocations.materialShininess, 24.0);  

  const primitiveType = webGL2RenderingContext.TRIANGLES;
  const drawArrays_offset = 0;
  const count = 3 * triangleCount;
  webGL2RenderingContext.drawArrays(primitiveType, drawArrays_offset, count);
}

function genPositionsAndNormals(): Promise<{ buffer: number[], triangleCount: number }>{
  const href = window.location.href;
  const url = new URL(href);
  let meshName = url.searchParams.get('mesh');
  if(meshName === null) {
    meshName = "bunny"
  }
  return getRequest(`http://mesh-services.ianalbuquerque.com:8999/mesh/` + meshName)
  .then((data: string) => {
    const buffer: number[] = [];
    let triangleCount: number = 0;
    const words: string[] = data.replace( /\n/g, " " ).split( " " );
    const vertices: Vector3[] = [];
    for(let i=0; i<words.length; i++) {
      if(words[i].includes("v")) {
        vertices.push(new Vector3( +words[i+1], +words[i+2], +words[i+3]));
        i+=3;
        continue;
      }
      if(words[i].includes("f")) {
        const v1: number = +words[i+1] - 1; // Syntax note: +stringVariable evaluates stringVariable to a number
        const v2: number = +words[i+2] - 1;
        const v3: number = +words[i+3] - 1;

        const normal: Vector3 = normalFromTriangleVertices(vertices[v1], vertices[v2], vertices[v3]);

        buffer.push(vertices[v1].x); buffer.push(vertices[v1].y); buffer.push(vertices[v1].z);
        buffer.push(normal.x); buffer.push(normal.y); buffer.push(normal.z);
        buffer.push(vertices[v2].x); buffer.push(vertices[v2].y); buffer.push(vertices[v2].z);
        buffer.push(normal.x); buffer.push(normal.y); buffer.push(normal.z);
        buffer.push(vertices[v3].x); buffer.push(vertices[v3].y); buffer.push(vertices[v3].z);
        buffer.push(normal.x); buffer.push(normal.y); buffer.push(normal.z);
        i+=3;
        triangleCount+=1;
        continue;
      }
    }
    console.log(triangleCount);
    return { buffer: buffer, triangleCount: triangleCount };
  })
}

function createDataBuffer(  webGL2RenderingContext: WebGL2RenderingContext, 
                            vao: WebGLVertexArrayObject,
                            data: number[] ): WebGLBuffer { 
  const positionBuffer: WebGLBuffer = webGL2RenderingContext.createBuffer();

  webGL2RenderingContext.bindVertexArray(vao);

  webGL2RenderingContext.bindBuffer(webGL2RenderingContext.ARRAY_BUFFER, positionBuffer);

  webGL2RenderingContext.bufferData(  webGL2RenderingContext.ARRAY_BUFFER,
                                      new Float32Array(data),
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
                        data: number[] ): { vao: WebGLVertexArrayObject, buffer: WebGLBuffer } {
  const vao = webGL2RenderingContext.createVertexArray();
  const buffer = createDataBuffer(webGL2RenderingContext, vao, data);
  return { vao: vao, buffer: buffer };
}
