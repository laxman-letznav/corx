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
        this._next({});
    }
    Object.defineProperty(CorxRunCtx.prototype, "cancel", {
        get: function () {
            return this._onCancel.bind(this);
        },
        enumerable: true,
        configurable: true
    });
    CorxRunCtx.prototype._next = function (_a) {
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
                this._complete();
                return;
            }
            this._processValue(result.value);
        }
        catch (ex) {
            this._error(ex);
        }
    };
    CorxRunCtx.prototype._processValue = function (value) {
        if (value instanceof rxjs_1.Observable) {
            this._onWait(value);
        }
        else if (utils_1.isPromise(value)) {
            this._onPromise(value);
        }
        else if (value instanceof operators_1.CorxOpertor) {
            var operator = value;
            switch (operator.symbol) {
                case operators_1.symbols.put:
                    this._onPut(operator);
                    break;
                case operators_1.symbols.chain:
                    this._onWait(operator.args[0], true);
                    break;
                case operators_1.symbols.wait:
                    this._onWait(operator.args[0]);
                    break;
                default:
                    this._error(new Error("unknown operator: " + operator.symbol));
                    break;
            }
        }
        else {
            this._error(new Error("must not yield such value: " + value + "."));
        }
    };
    CorxRunCtx.prototype._onPromise = function (promise) {
        var _this = this;
        promise.then(function (value) { return _this._next({ value: value }); }, function (error) { return _this._next({ error: error }); });
    };
    CorxRunCtx.prototype._onPut = function (operator) {
        var _this = this;
        operator.args.forEach(function (arg) { return _this._publish(arg); });
        this._next({});
    };
    CorxRunCtx.prototype._onWait = function (observable, publishValues) {
        var _this = this;
        if (publishValues === void 0) { publishValues = false; }
        var lastValue;
        this._waited = observable.subscribe(function (nextValue) {
            lastValue = nextValue;
            if (publishValues) {
                _this._publish(nextValue);
            }
        }, function (error) {
            _this._waited = null;
            _this._next({ error: error });
        }, function () {
            _this._waited = null;
            _this._next({ value: lastValue });
        });
    };
    CorxRunCtx.prototype._publish = function (value) {
        if (this._isDone) {
            return;
        }
        this._subscriber.next(value);
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