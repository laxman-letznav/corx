import { Observable } from 'rxjs';
export declare class CorxOpertor {
    symbol: symbol;
    args: any[];
    constructor(symbol: symbol, args: any[]);
}
export declare const symbols: {
    wait: symbol;
    put: symbol;
    chain: symbol;
};
export declare const wait: (waitOn: Observable<any>) => CorxOpertor;
export declare const put: (...args: any[]) => CorxOpertor;
export declare const chain: (toChain: Observable<any>) => CorxOpertor;
