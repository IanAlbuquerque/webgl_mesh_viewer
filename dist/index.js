"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var webgl_basics_1 = require("./webgl-basics");
var fs = require('fs');
var vertexShaderStringCode = fs.readFileSync(__dirname + './../shaders/vertex.glsl').toString();
var fragmentShaderrStringCode = fs.readFileSync(__dirname + './../shaders/fragment.glsl').toString();
initCanvas('canvas_id');
var resW;
var resH;
function getRequest(url) {
    return new Promise(function (resolve, reject) {
        var request = new XMLHttpRequest();
        request.onload = function () {
            if (this.status === 200) {
                resolve(this.response);
            }
            else {
                reject(new Error(this.statusText));
            }
        };
        request.onerror = function () {
            reject(new Error('XMLHttpRequest Error: ' + this.statusText));
        };
        request.open('GET', url);
        request.send();
    });
}
function initCanvas(canvasId) {
    var htmlCanvasElement = document.getElementById(canvasId);
    var href = window.location.href;
    var url = new URL(href);
    resW = 800;
    resH = 600;
    htmlCanvasElement.width = resW;
    htmlCanvasElement.height = resH;
    var webGL2RenderingContext = htmlCanvasElement.getContext("webgl2");
    if (!webGL2RenderingContext) {
        throw 'WebGL2 not supported.';
    }
    getRequest("localhost:8999/bunny")
        .then(function (data) {
        console.log(data);
    });
    var vertexShader = webgl_basics_1.createShader(webGL2RenderingContext, webGL2RenderingContext.VERTEX_SHADER, vertexShaderStringCode);
    var fragmentShader = webgl_basics_1.createShader(webGL2RenderingContext, webGL2RenderingContext.FRAGMENT_SHADER, fragmentShaderrStringCode);
    var program = webgl_basics_1.createProgram(webGL2RenderingContext, vertexShader, fragmentShader);
    webGL2RenderingContext.viewport(0, 0, webGL2RenderingContext.canvas.width, webGL2RenderingContext.canvas.height);
    webGL2RenderingContext.clearColor(0, 0, 0, 0);
    webGL2RenderingContext.useProgram(program);
    var uniformLocations = {
        m: webGL2RenderingContext.getUniformLocation(program, "m"),
        v: webGL2RenderingContext.getUniformLocation(program, "v"),
        p: webGL2RenderingContext.getUniformLocation(program, "p"),
        lightPosition: webGL2RenderingContext.getUniformLocation(program, "lightPosition"),
        materialAmbient: webGL2RenderingContext.getUniformLocation(program, "materialAmbient"),
        materialDiffuse: webGL2RenderingContext.getUniformLocation(program, "materialDiffuse"),
        materialSpecular: webGL2RenderingContext.getUniformLocation(program, "materialSpecular"),
        materialShininess: webGL2RenderingContext.getUniformLocation(program, "materialShininess")
    };
    startDrawLoop(webGL2RenderingContext, uniformLocations, 100000);
}
function startDrawLoop(webGL2RenderingContext, uniformLocations, triangleCount) {
    var htmlCanvasElement = document.getElementById('canvas_id');
    var data = genPositionsAndNormals(triangleCount);
    var loadInitialTime = new Date().getTime();
    var buffers = loadDataInGPU(webGL2RenderingContext, data);
    webGL2RenderingContext.bindVertexArray(buffers.vao);
    var loadEndTime = new Date().getTime();
    var loadTime = (loadEndTime - loadInitialTime) / 1000.0;
    var initialTime = new Date().getTime();
    var frameCount = 0;
    function loop() {
        var currentTime = new Date().getTime() - initialTime;
        draw(webGL2RenderingContext, uniformLocations, currentTime, triangleCount);
        window.requestAnimationFrame(loop);
    }
    loop();
}
function draw(webGL2RenderingContext, uniformLocations, currentTime, triangleCount) {
    webGL2RenderingContext.clear(webGL2RenderingContext.COLOR_BUFFER_BIT);
    webGL2RenderingContext.enable(webGL2RenderingContext.DEPTH_TEST);
    webGL2RenderingContext.uniformMatrix4fv(uniformLocations.m, false, new Float32Array([Math.cos(currentTime / 1000), 0, Math.sin(currentTime / 1000), 0,
        0, 1, 0, 0,
        -Math.sin(currentTime / 1000), 0, Math.cos(currentTime / 1000), 0,
        0, 0, 0, 1]));
    webGL2RenderingContext.uniformMatrix4fv(uniformLocations.v, false, new Float32Array([1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, -2, 1]));
    webGL2RenderingContext.uniformMatrix4fv(uniformLocations.p, false, new Float32Array(webgl_basics_1.projectionMatrix(1.0, 1.0, 1.0, 20.0)));
    webGL2RenderingContext.uniform3f(uniformLocations.lightPosition, 0.0, 0.0, 0.0);
    webGL2RenderingContext.uniform3f(uniformLocations.materialAmbient, 0.3, 0.0, 0.0);
    webGL2RenderingContext.uniform3f(uniformLocations.materialDiffuse, 1.0, 0.0, 0.0);
    webGL2RenderingContext.uniform3f(uniformLocations.materialSpecular, 1.0, 1.0, 1.0);
    webGL2RenderingContext.uniform1f(uniformLocations.materialShininess, 24.0);
    var primitiveType = webGL2RenderingContext.TRIANGLES;
    var drawArrays_offset = 0;
    var count = 3 * triangleCount;
    webGL2RenderingContext.drawArrays(primitiveType, drawArrays_offset, count);
}
function genPositionsAndNormals(triangleCount) {
    var n = Math.ceil(Math.cbrt(triangleCount));
    var d = 2.0 / n;
    var x = 0;
    var y = 0;
    var z = 0;
    var numTrianglesDrawn = 0;
    var buffer = [];
    for (var i = 0; i < n && numTrianglesDrawn < triangleCount; i++) {
        for (var j = 0; j < n && numTrianglesDrawn < triangleCount; j++) {
            for (var k = 0; k < n && numTrianglesDrawn < triangleCount; k++) {
                x = -1.0 + d * i;
                y = -1.0 + d * j;
                z = -1.0 + d * k;
                buffer.push(x);
                buffer.push(y);
                buffer.push(z);
                buffer.push(1.0);
                buffer.push(1.0);
                buffer.push(1.0);
                buffer.push(x + d);
                buffer.push(y);
                buffer.push(z);
                buffer.push(1.0);
                buffer.push(1.0);
                buffer.push(1.0);
                buffer.push(x);
                buffer.push(y + d);
                buffer.push(z + d);
                buffer.push(1.0);
                buffer.push(1.0);
                buffer.push(1.0);
            }
        }
    }
    return buffer;
}
function createDataBuffer(webGL2RenderingContext, vao, data) {
    var positionBuffer = webGL2RenderingContext.createBuffer();
    webGL2RenderingContext.bindVertexArray(vao);
    webGL2RenderingContext.bindBuffer(webGL2RenderingContext.ARRAY_BUFFER, positionBuffer);
    webGL2RenderingContext.bufferData(webGL2RenderingContext.ARRAY_BUFFER, new Float32Array(data), webGL2RenderingContext.STATIC_DRAW);
    webGL2RenderingContext.enableVertexAttribArray(0);
    webGL2RenderingContext.vertexAttribPointer(0, 3, // size
    webGL2RenderingContext.FLOAT, // type
    false, // normalize
    6 * 4, // stride
    0 * 4); //offset
    webGL2RenderingContext.enableVertexAttribArray(1);
    webGL2RenderingContext.vertexAttribPointer(1, 3, // size
    webGL2RenderingContext.FLOAT, // type
    false, // normalize
    6 * 4, // stride
    3 * 4); //offset                                            
    return positionBuffer;
}
function loadDataInGPU(webGL2RenderingContext, data) {
    var vao = webGL2RenderingContext.createVertexArray();
    var buffer = createDataBuffer(webGL2RenderingContext, vao, data);
    return { vao: vao, buffer: buffer };
}
//# sourceMappingURL=index.js.map