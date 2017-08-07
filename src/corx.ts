import { Observable, Subscriber } from 'rxjs';

import { CorxRunCtx } from './corx-context';

class Corx {
  private _observable: Observable<any>;
  public get observable(): Observable<any> {
    return this._observable;
  }

  constructor(private _generatorFunc: () => Generator) {
    this._observable = Observable.create(this._onSubscribe.bind(this));
  }

  private _onSubscribe(subscriber: Subscriber<any>): () => void {
    const ctx = new CorxRunCtx(this._generatorFunc(), subscriber);
    return ctx.cancel;
  }
}

export const corx = (generatorFunc: () => Generator, thisArg: any = null) => {
  const bound = thisArg !== null ? generatorFunc.bind(thisArg) : generatorFunc;
  return new Corx(bound).observable;
};
