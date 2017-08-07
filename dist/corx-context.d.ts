import { Subscriber } from 'rxjs';
export declare class CorxRunCtx {
    private _generator;
    private _subscriber;
    readonly cancel: () => any;
    private _isCanceled;
    private _isDone;
    private _waited;
    constructor(_generator: Generator, _subscriber: Subscriber<any>);
    private next({value, error});
    private processValue(value);
    private onPromise(promise);
    private onPut(operator);
    private onChain(observable);
    private onWait(observable);
    private publish(value);
    private onCancel();
    private complete();
    private error(error);
    private trySetDone();
}
