"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createShader(webGL2RenderingContext, type, source) {
    var shader = webGL2RenderingContext.createShader(type);
    webGL2RenderingContext.shaderSource(shader, source);
    webGL2RenderingContext.compileShader(shader);
    var success = webGL2RenderingContext.getShaderParameter(shader, webGL2RenderingContext.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    console.error(webGL2RenderingContext.getShaderInfoLog(shader));
    webGL2RenderingContext.deleteShader(shader);
}
exports.createShader = createShader;
function createProgram(webGL2RenderingContext, vertexShader, fragmentShader) {
    var program = webGL2RenderingContext.createProgram();
    webGL2RenderingContext.attachShader(program, vertexShader);
    webGL2RenderingContext.attachShader(program, fragmentShader);
    webGL2RenderingContext.linkProgram(program);
    var success = webGL2RenderingContext.getProgramParameter(program, webGL2RenderingContext.LINK_STATUS);
    if (success) {
        return program;
    }
    console.error(webGL2RenderingContext.getProgramInfoLog(program));
    webGL2RenderingContext.deleteProgram(program);
}
exports.createProgram = createProgram;
//# sourceMappingURL=webgl-basics.js.map