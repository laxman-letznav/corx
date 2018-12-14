import { Observable } from 'rxjs';
import { CorxContext } from '../../corx';
export declare function switchMapCorx<T, S>(this: Observable<T>, asyncFunc: (ctx: CorxContext<S>, arg?: T) => Promise<any>, action?: (payload: any) => any): Observable<S>;
declare module 'rxjs/Observable' {
    interface Observable<T> {
        switchMapCorx: typeof switchMapCorx;
    }
}
