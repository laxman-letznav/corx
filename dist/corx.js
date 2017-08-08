"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var corx_context_1 = require("./corx-context");
var Corx = (function () {
    function Corx(_generatorFunc) {
        this._generatorFunc = _generatorFunc;
        this._observable = rxjs_1.Observable.create(this._onSubscribe.bind(this));
    }
    Object.defineProperty(Corx.prototype, "observable", {
        get: function () {
            return this._observable;
        },
        enumerable: true,
        configurable: true
    });
    Corx.prototype._onSubscribe = function (subscriber) {
        var ctx = new corx_context_1.CorxRunCtx(this._generatorFunc(), subscriber);
        return ctx.cancel;
    };
    return Corx;
}());
exports.corx = function (generatorFunc, thisArg) {
    var bound = typeof thisArg !== 'undefined' ? generatorFunc.bind(thisArg) : generatorFunc;
    return new Corx(bound).observable;
};
//# sourceMappingURL=corx.js.map