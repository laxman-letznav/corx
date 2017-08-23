"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var corx_1 = require("../../corx");
function switchMapCorx(asyncFunc) {
    return this.switchMap(function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return corx_1.corx.apply(void 0, [asyncFunc].concat(args));
    });
}
exports.switchMapCorx = switchMapCorx;
rxjs_1.Observable.prototype.switchMapCorx = switchMapCorx;
//# sourceMappingURL=switchMapCorx.js.map