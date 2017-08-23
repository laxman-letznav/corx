import { Observable, Subscriber } from 'rxjs';
export interface CorxContext<T> {
    wait: <S>(waitOn: Observable<S>) => Promise<S>;
    put: (...values: T[]) => Promise<void>;
    chain: (toChain: Observable<T>) => Promise<T>;
}
export declare class CorxRunCtx<T> {
    private _subscriber;
    readonly cancel: () => any;
    private _isCanceled;
    private _isDone;
    private _waited;
    constructor(_subscriber: Subscriber<T>, _asyncFunc: (ctx: CorxContext<T>, ...args: any[]) => Promise<any>, callArguments: any[]);
    private _createContext();
    private _onWait<S>(observable, publishValues?);
    private _onPut(values);
    private _publish(value);
    private _catch(callback);
    private _onCancel();
    private _complete();
    private _error(error);
    private _trySetDone();
}
