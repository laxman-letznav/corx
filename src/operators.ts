import { Observable } from 'rxjs';

export class CorxOpertor {
  constructor(public symbol: symbol, public args: any[]) {
  }
}

export const symbols = {
  wait: Symbol('corx_wait'),
  put: Symbol('corx_put'),
  chain: Symbol('corx_chain'),
};

const corxOperator = (symbol: symbol) => (...args: any[]) => new CorxOpertor(symbol, args);

export const wait = corxOperator(symbols.wait) as (waitOn: Observable<any>) => CorxOpertor;
export const put = corxOperator(symbols.put);
export const chain = corxOperator(symbols.chain) as (toChain: Observable<any>) => CorxOpertor;
