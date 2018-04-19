"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var webgl_basics_1 = require("./webgl-basics");
var fs = require('fs');
var vertexShaderStringCode = fs.readFileSync(__dirname + './../shaders/vertex.glsl').toString();
var fragmentShaderrStringCode = fs.readFileSync(__dirname + './../shaders/fragment.glsl').toString();
initCanvas('canvas_id');
function initCanvas(canvasId) {
    var htmlCanvasElement = document.getElementById(canvasId);
    var webGL2RenderingContext = htmlCanvasElement.getContext("webgl2");
    if (!webGL2RenderingContext) {
        throw 'WebGL2 not supported.';
    }
    var vertexShader = webgl_basics_1.createShader(webGL2RenderingContext, webGL2RenderingContext.VERTEX_SHADER, vertexShaderStringCode);
    var fragmentShader = webgl_basics_1.createShader(webGL2RenderingContext, webGL2RenderingContext.FRAGMENT_SHADER, fragmentShaderrStringCode);
    var program = webgl_basics_1.createProgram(webGL2RenderingContext, vertexShader, fragmentShader);
    webGL2RenderingContext.viewport(0, 0, webGL2RenderingContext.canvas.width, webGL2RenderingContext.canvas.height);
    webGL2RenderingContext.clearColor(0, 0, 0, 0);
    webGL2RenderingContext.useProgram(program);
    var timeUniformLocation = webGL2RenderingContext.getUniformLocation(program, "currentTime");
    testLoad(webGL2RenderingContext, timeUniformLocation, 100000, 10000);
}
function testFinished(webGL2RenderingContext, timeUniformLocation, drawLoad, maxDuration) {
    testLoad(webGL2RenderingContext, timeUniformLocation, 100000 + drawLoad, maxDuration);
}
function testLoad(webGL2RenderingContext, timeUniformLocation, drawLoad, maxDuration) {
    console.log("===================================");
    console.log("Test drawLoad =", drawLoad);
    var loadInitialTime = new Date().getTime();
    var buffers = loadDataInGPU(webGL2RenderingContext, drawLoad);
    webGL2RenderingContext.bindVertexArray(buffers.vao);
    var loadEndTime = new Date().getTime();
    var loadTime = (loadEndTime - loadInitialTime) / 1000.0;
    console.log("Load Time =", loadTime, "seconds");
    var initialTime = new Date().getTime();
    var frameCount = 0;
    function loop() {
        var currentTime = new Date().getTime() - initialTime;
        draw(webGL2RenderingContext, timeUniformLocation, currentTime, drawLoad);
        frameCount += 1;
        if (currentTime < maxDuration) {
            window.requestAnimationFrame(loop);
        }
        else {
            var fps = frameCount / (currentTime / 1000.0);
            webGL2RenderingContext.deleteBuffer(buffers.buffer);
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
function draw(webGL2RenderingContext, timeUniformLocation, currentTime, drawLoad) {
    webGL2RenderingContext.clear(webGL2RenderingContext.COLOR_BUFFER_BIT);
    webGL2RenderingContext.uniform1f(timeUniformLocation, currentTime / 1000.0);
    var primitiveType = webGL2RenderingContext.TRIANGLES;
    var drawArrays_offset = 0;
    var count = 3 * drawLoad;
    webGL2RenderingContext.drawArrays(primitiveType, drawArrays_offset, count);
}
function createDataBuffer(webGL2RenderingContext, vao, drawLoad) {
    var positionBuffer = webGL2RenderingContext.createBuffer();
    webGL2RenderingContext.bindVertexArray(vao);
    webGL2RenderingContext.bindBuffer(webGL2RenderingContext.ARRAY_BUFFER, positionBuffer);
    var positions = [];
    var N = drawLoad;
    for (var i = 0; i < N; i++) {
        positions.push(Math.cos(2.0 * Math.PI * i / N));
        positions.push(Math.sin(2.0 * Math.PI * i / N));
        positions.push(0.0);
        positions.push(Math.cos(2.0 * Math.PI * (i + 1) / N));
        positions.push(Math.sin(2.0 * Math.PI * (i + 1) / N));
        positions.push(0.0);
        positions.push(0.0);
        positions.push(0.0);
        positions.push(0.0);
    }
    webGL2RenderingContext.bufferData(webGL2RenderingContext.ARRAY_BUFFER, new Float32Array(positions), webGL2RenderingContext.STATIC_DRAW);
    webGL2RenderingContext.enableVertexAttribArray(0);
    var size = 3; // 2 components per iteration
    var type = webGL2RenderingContext.FLOAT; // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    var vertexAttribPointer_offset = 0; // start at the beginning of the buffer
    webGL2RenderingContext.vertexAttribPointer(0, size, type, normalize, stride, vertexAttribPointer_offset);
    return positionBuffer;
}
function loadDataInGPU(webGL2RenderingContext, drawLoad) {
    var vao = webGL2RenderingContext.createVertexArray();
    var buffer = createDataBuffer(webGL2RenderingContext, vao, drawLoad);
    return { vao: vao, buffer: buffer };
}
//# sourceMappingURL=index.js.map