"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("./operators");
var utils_1 = require("./utils");
var CorxRunCtx = (function () {
    function CorxRunCtx(_generator, _subscriber) {
        this._generator = _generator;
        this._subscriber = _subscriber;
        this._isCanceled = false;
        this._isDone = false;
        this.next({});
    }
    Object.defineProperty(CorxRunCtx.prototype, "cancel", {
        get: function () {
            return this.onCancel.bind(this);
        },
        enumerable: true,
        configurable: true
    });
    CorxRunCtx.prototype.next = function (_a) {
        var value = _a.value, error = _a.error;
        if (this._isDone) {
            return;
        }
        try {
            var result = void 0;
            if (typeof error !== 'undefined') {
                result = this._generator.throw(error);
            }
            else {
                result = this._generator.next(value);
            }
            if (this._isDone) {
                return;
            }
            if (result.done) {
                this.complete();
                return;
            }
            this.processValue(result.value);
        }
        catch (ex) {
            this.error(ex);
        }
    };
    CorxRunCtx.prototype.processValue = function (value) {
        if (value instanceof rxjs_1.Observable) {
            this.onWait(value);
        }
        else if (utils_1.isPromise(value)) {
            this.onPromise(value);
        }
        else if (value instanceof operators_1.CorxOpertor) {
            var operator = value;
            if (operator.symbol === operators_1.symbols.put) {
                this.onPut(operator);
            }
            else if (operator.symbol === operators_1.symbols.chain) {
                this.onChain(operator.args[0]);
            }
            else if (operator.symbol === operators_1.symbols.wait) {
                this.onWait(operator.args[0]);
            }
            else {
                this.error(new Error("unknown operator: " + operator.symbol));
            }
        }
        else {
            this.error(new Error("must not yield such value: " + value + "."));
        }
    };
    CorxRunCtx.prototype.onPromise = function (promise) {
        var _this = this;
        promise.then(function (value) { return _this.next({ value: value }); }, function (error) { return _this.next({ error: error }); });
    };
    CorxRunCtx.prototype.onPut = function (operator) {
        var _this = this;
        operator.args.forEach(function (arg) { return _this.publish(arg); });
        this.next({});
    };
    CorxRunCtx.prototype.onChain = function (observable) {
        var _this = this;
        var lastValue;
        this._waited = observable.subscribe(function (nextValue) {
            lastValue = nextValue;
            _this.publish(nextValue);
        }, function (error) {
            _this._waited = null;
            _this.next({ error: error });
        }, function () {
            _this._waited = null;
            _this.next({ value: lastValue });
        });
    };
    CorxRunCtx.prototype.onWait = function (observable) {
        var _this = this;
        var lastValue;
        this._waited = observable.subscribe(function (nextValue) {
            lastValue = nextValue;
        }, function (error) {
            _this._waited = null;
            _this.next({ error: error });
        }, function () {
            _this._waited = null;
            _this.next({ value: lastValue });
        });
    };
    CorxRunCtx.prototype.publish = function (value) {
        if (this._isDone) {
            return;
        }
        this._subscriber.next(value);
    };
    CorxRunCtx.prototype.onCancel = function () {
        if (!this.trySetDone()) {
            return;
        }
        this._isCanceled = true;
    };
    CorxRunCtx.prototype.complete = function () {
        if (!this.trySetDone()) {
            return;
        }
        this._subscriber.complete();
    };
    CorxRunCtx.prototype.error = function (error) {
        if (!this.trySetDone()) {
            return;
        }
        this._subscriber.error(error);
    };
    CorxRunCtx.prototype.trySetDone = function () {
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