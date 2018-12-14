import { Observable } from 'rxjs';

import { corx, CorxContext } from '../../corx';

export function switchMapCorx<T, S>(this: Observable<T>, asyncFunc: (ctx: CorxContext<S>, arg?: T) => Promise<any>, action?: (payload: any) => any): Observable<S> {
  return this.switchMap<T, S>((...args) => corx<S>(asyncFunc, ...args))
    .catch( err => {
      if (action) {
        return Observable.of(action(err));
      } else {
        console.error('switchMapCorx: ', err);
        return Observable.empty();
      }
    });
}

Observable.prototype.switchMapCorx = switchMapCorx;

declare module 'rxjs/Observable' {
  interface Observable<T> {
    switchMapCorx: typeof switchMapCorx;
  }
}
