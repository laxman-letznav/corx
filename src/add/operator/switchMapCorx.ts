import { Observable } from 'rxjs';

import { corx, CorxContext } from '../../corx';

export function switchMapCorx<T, S>(this: Observable<T>, asyncFunc: (ctx: CorxContext<S>, arg?: T) => Promise<any>): Observable<S> {
  return this.switchMap<T, S>((...args) => corx<S>(asyncFunc, ...args));
}

Observable.prototype.switchMapCorx = switchMapCorx;

declare module 'rxjs/Observable' {
  interface Observable<T> {
    switchMapCorx: typeof switchMapCorx;
  }
}
