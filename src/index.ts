import { create } from "domain";
import { createProgram, createShader, projectionMatrix } from "./webgl-basics";
import { Vector3, normalFromTriangleVertices } from "./linalg";
import { SSL_OP_MSIE_SSLV2_RSA_PADDING } from "constants";
import { CornerTable } from "./corner-table/corner-table";

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
  let simplificationSteps = url.searchParams.get('steps');
  if(meshName === null) {
    meshName = "bunny"
  }
  if(simplificationSteps === null) {
    simplificationSteps = '0';
  }
  // return getRequest(`http://mesh-services.ianalbuquerque.com:8999/mesh/` + meshName)
  return getRequest(`http://localhost:8999/mesh/` + meshName + `/` + simplificationSteps)  
  .then((data: string) => {
    JSON.parse(data) as { G: number[], V: number[], O: number[] };
    const compression: { delta: number[], clers: string } = JSON.parse(data) as { delta: number[], clers: string };
    const cornerTableStructure: CornerTable = new CornerTable();
    cornerTableStructure.decompress(compression.delta, compression.clers.split(''))
    const cornerTable: { G: number[], V: number[], O: number[] } = cornerTableStructure.getData();
    // const cornerTable: { G: number[], V: number[], O: number[] } = JSON.parse(data) as { G: number[], V: number[], O: number[] };
    const buffer: number[] = [];
    const triangleCount: number = cornerTable.V.length / 3;
    let triangleLoss: number = 0;

    for(let i = 0; i < triangleCount; i++) {
      const corner1 = i * 3;
      const corner2 = (i * 3) + 1;
      const corner3 = (i * 3) + 2;
      if(cornerTable.O[corner1] == -1 ||
        cornerTable.O[corner2] == -1 ||
        cornerTable.O[corner3] == -1 ) {
        triangleLoss += 1;
        continue;
      }
      const vertex1: number = cornerTable.V[corner1];
      const vertex2: number = cornerTable.V[corner2];
      const vertex3: number = cornerTable.V[corner3];
      const coordinates1: Vector3 = new Vector3(cornerTable.G[vertex1 * 3 + 0],
                                                cornerTable.G[vertex1 * 3 + 1],
                                                cornerTable.G[vertex1 * 3 + 2]);
      const coordinates2: Vector3 = new Vector3(cornerTable.G[vertex2 * 3 + 0],
                                                cornerTable.G[vertex2 * 3 + 1],
                                                cornerTable.G[vertex2 * 3 + 2]);
      const coordinates3: Vector3 = new Vector3(cornerTable.G[vertex3 * 3 + 0],
                                                cornerTable.G[vertex3 * 3 + 1],
                                                cornerTable.G[vertex3 * 3 + 2]);
      const normal: Vector3 = normalFromTriangleVertices(coordinates1, coordinates2, coordinates3);
      [].push.apply(buffer, coordinates1.asArray()); // Syntax note: calls the push method for `buffer` for each element in `....asArray()`
      [].push.apply(buffer, normal.asArray());
      [].push.apply(buffer, coordinates2.asArray());
      [].push.apply(buffer, normal.asArray());
      [].push.apply(buffer, coordinates3.asArray());
      [].push.apply(buffer, normal.asArray());
    }
    console.log("Triangle Loss = " + triangleLoss);
    return {buffer: buffer, triangleCount: triangleCount - triangleLoss };
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
  const vao: WebGLVertexArrayObject = webGL2RenderingContext.createVertexArray();
  const buffer: WebGLBuffer = createDataBuffer(webGL2RenderingContext, vao, data);
  return { vao: vao, buffer: buffer };
}

// Encoding stuff

function ab2str(buf: ArrayBuffer): string {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str: string): ArrayBuffer {
  let buf: ArrayBuffer = new ArrayBuffer(str.length * 1);
  let bufView = new Uint8Array(buf);
  for (let i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}