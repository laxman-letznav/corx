"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPromise = function (obj) {
    return obj && typeof obj.subscribe !== 'function' && typeof obj.then === 'function';
};
//# sourceMappingURL=utils.js.map