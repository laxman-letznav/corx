"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var corx_1 = require("../../corx");
function switchMapCorx(asyncFunc, action) {
    return this.switchMap(function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return corx_1.corx.apply(void 0, [asyncFunc].concat(args));
    })
    .catch(function (err) {
        if (action) {
            return rxjs_1.Observable.of(action(err));
        }
        else {
            console.error('switchMapCorx: ', err);
            return rxjs_1.Observable.empty();
        }
    });
}
exports.switchMapCorx = switchMapCorx;
rxjs_1.Observable.prototype.switchMapCorx = switchMapCorx;
//# sourceMappingURL=switchMapCorx.js.map