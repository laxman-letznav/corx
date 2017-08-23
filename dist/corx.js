"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var corx_context_1 = require("./corx-context");
var Corx = (function () {
    function Corx(_asyncFunc, _args) {
        this._asyncFunc = _asyncFunc;
        this._args = _args;
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
        var ctx = new corx_context_1.CorxRunCtx(subscriber, this._asyncFunc, this._args);
        return ctx.cancel;
    };
    return Corx;
}());
exports.corx = function (asyncFunc) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return new Corx(asyncFunc, args).observable;
};
//# sourceMappingURL=corx.js.map