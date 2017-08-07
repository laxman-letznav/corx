"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CorxOpertor = (function () {
    function CorxOpertor(symbol, args) {
        this.symbol = symbol;
        this.args = args;
    }
    return CorxOpertor;
}());
exports.CorxOpertor = CorxOpertor;
exports.symbols = {
    wait: Symbol('corx_wait'),
    put: Symbol('corx_put'),
    chain: Symbol('corx_chain'),
};
var corxOperator = function (symbol) { return function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return new CorxOpertor(symbol, args);
}; };
exports.wait = corxOperator(exports.symbols.wait);
exports.put = corxOperator(exports.symbols.put);
exports.chain = corxOperator(exports.symbols.chain);
//# sourceMappingURL=operators.js.map