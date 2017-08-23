import { Observable, Subscriber } from 'rxjs';

import { CorxRunCtx, CorxContext } from './corx-context';

class Corx<T> {
  private _observable: Observable<T>;
  public get observable(): Observable<T> {
    return this._observable;
  }

  constructor(private _asyncFunc: (ctx: CorxContext<T>, ...args: any[]) => Promise<any>, private _args: any[]) {
    this._observable = Observable.create(this._onSubscribe.bind(this));
  }

  private _onSubscribe(subscriber: Subscriber<T>): () => void {
    const ctx = new CorxRunCtx<T>(subscriber, this._asyncFunc, this._args);
    return ctx.cancel;
  }
}

export const corx = <T>(asyncFunc: (ctx: CorxContext<T>, ...args: any[]) => Promise<any>, ...args: any[]): Observable<T> => {
  return new Corx<T>(asyncFunc, args).observable;
};

export { CorxContext } from './corx-context';
