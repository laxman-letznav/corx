"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var utils_1 = require("./utils");
var CorxRunCtx = (function () {
    function CorxRunCtx(_subscriber, _asyncFunc, callArguments) {
        var _this = this;
        this._subscriber = _subscriber;
        this._isCanceled = false;
        this._isDone = false;
        var context = this._createContext();
        _asyncFunc.apply(void 0, [context].concat(callArguments)).then(function () { return _this._complete(); }, function (err) { return _this._error(err); });
    }
    Object.defineProperty(CorxRunCtx.prototype, "cancel", {
        get: function () {
            return this._onCancel.bind(this);
        },
        enumerable: true,
        configurable: true
    });
    CorxRunCtx.prototype._createContext = function () {
        var _this = this;
        return {
            get: function (toWait) { return _this._onWait(toWait); },
            chain: function (toChain) { return _this._onWait(toChain, true); },
            put: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return _this._onPut(args);
            },
        };
    };
    CorxRunCtx.prototype._onWait = function (observable, publishValues) {
        var _this = this;
        if (publishValues === void 0) { publishValues = false; }
        if (!(observable instanceof rxjs_1.Observable)) {
            this._error(new Error("wait supports only observables (value: " + observable + ")."));
            return utils_1.neverResolve();
        }
        if (this._isDone) {
            return utils_1.neverResolve();
        }
        return new Promise(function (resolve, reject) {
            var lastValue;
            _this._waited = observable.subscribe(function (nextValue) {
                lastValue = nextValue;
                if (publishValues) {
                    _this._publish(nextValue);
                }
            }, function (error) {
                _this._waited = null;
                if (_this._isDone) {
                    return;
                }
                _this._catch(function () { return reject(error); });
            }, function () {
                _this._waited = null;
                if (_this._isDone) {
                    return;
                }
                _this._catch(function () { return resolve(lastValue); });
            });
        });
    };
    CorxRunCtx.prototype._onPut = function (values) {
        var _this = this;
        values.forEach(function (arg) { return _this._publish(arg); });
        return Promise.resolve();
    };
    CorxRunCtx.prototype._publish = function (value) {
        if (this._isDone) {
            return;
        }
        this._subscriber.next(value);
    };
    CorxRunCtx.prototype._catch = function (callback) {
        try {
            callback();
        }
        catch (err) {
            this._error(err);
        }
    };
    CorxRunCtx.prototype._onCancel = function () {
        if (!this._trySetDone()) {
            return;
        }
        this._isCanceled = true;
    };
    CorxRunCtx.prototype._complete = function () {
        if (!this._trySetDone()) {
            return;
        }
        this._subscriber.complete();
    };
    CorxRunCtx.prototype._error = function (error) {
        if (!this._trySetDone()) {
            return;
        }
        this._subscriber.error(error);
    };
    CorxRunCtx.prototype._trySetDone = function () {
        if (this._isDone) {
            return false;
        }
        this._isDone = true;
        if (this._waited) {
            this._waited.unsubscribe();
            this._waited = null;
        }
        return true;
    };
    return CorxRunCtx;
}());
exports.CorxRunCtx = CorxRunCtx;
//# sourceMappingURL=corx-context.js.map