import { Subscriber } from 'rxjs';
export declare class CorxRunCtx {
    private _generator;
    private _subscriber;
    readonly cancel: () => any;
    private _isCanceled;
    private _isDone;
    private _waited;
    constructor(_generator: Generator, _subscriber: Subscriber<any>);
    private _next({value, error});
    private _processValue(value);
    private _onPromise(promise);
    private _onPut(operator);
    private _onWait(observable, publishValues?);
    private _publish(value);
    private _onCancel();
    private _complete();
    private _error(error);
    private _trySetDone();
}
