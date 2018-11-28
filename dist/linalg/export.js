"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vector3_1 = require("./types/vector3");
exports.Vector3 = vector3_1.Vector3;
function normalFromTriangleVertices(a, b, c) {
    return b.subtract(a).cross(c.subtract(a)).normalized();
}
exports.normalFromTriangleVertices = normalFromTriangleVertices;
//# sourceMappingURL=export.js.map