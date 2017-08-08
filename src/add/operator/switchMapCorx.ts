import { Observable } from 'rxjs';

import { corx } from '../../corx';

export function switchMapCorx<T>(this: Observable<T>, generatorFunc: (arg?: T) => Generator, thisArg?: any): Observable<any> {
  return this.switchMap((...args) => corx(generatorFunc.bind(thisArg, ...args)));
}

Observable.prototype.switchMapCorx = switchMapCorx;

declare module 'rxjs/Observable' {
  interface Observable<T> {
    switchMapCorx: typeof switchMapCorx;
  }
}
