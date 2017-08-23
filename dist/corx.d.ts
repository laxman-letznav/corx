import { Observable } from 'rxjs';
import { CorxContext } from './corx-context';
export declare const corx: <T>(asyncFunc: (ctx: CorxContext<T>, ...args: any[]) => Promise<any>, ...args: any[]) => Observable<T>;
export { CorxContext } from './corx-context';
