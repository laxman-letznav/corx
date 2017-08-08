import { Observable } from 'rxjs';
export declare function switchMapCorx<T>(this: Observable<T>, generatorFunc: (arg?: T) => Generator, thisArg?: any): Observable<any>;
declare module 'rxjs/Observable' {
    interface Observable<T> {
        switchMapCorx: typeof switchMapCorx;
    }
}
