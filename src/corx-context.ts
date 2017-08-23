import { Observable, Subscriber, Subscription } from 'rxjs';

import { neverResolve } from './utils';

export interface CorxContext<T> {
  get: <S>(waitOn: Observable<S>) => Promise<S>;
  put: (...values: T[]) => Promise<void>;
  chain: (toChain: Observable<T>) => Promise<T>;
}

export class CorxRunCtx<T> {
  public get cancel(): () => any {
    return this._onCancel.bind(this);
  }

  private _isCanceled: boolean = false;
  private _isDone: boolean = false;
  private _waited: Subscription;

  constructor(
    private _subscriber: Subscriber<T>,
    _asyncFunc: (ctx: CorxContext<T>, ...args: any[]) => Promise<any>,
    callArguments: any[]) {

    const context = this._createContext();

    _asyncFunc(context, ...callArguments)
    .then(() => this._complete(), err => this._error(err));
  }

  private _createContext(): CorxContext<T> {
    return {
      get: toWait => this._onWait(toWait),
      chain: toChain => this._onWait(toChain, true),
      put: (...args: T[]) => this._onPut(args),
    };
  }

  private _onWait<S>(observable: Observable<S>, publishValues: boolean = false): Promise<S> {
    if (!(observable instanceof Observable)) {
      this._error(new Error(`wait supports only observables (value: ${observable}).`));
      return neverResolve();
    }

    if (this._isDone) {
      return neverResolve();
    }

    return new Promise<S>((resolve, reject) => {
      let lastValue;
      this._waited = observable.subscribe(nextValue => {
        lastValue = nextValue;
        if (publishValues) {
          this._publish(nextValue as any);
        }
      }, error => {
        this._waited = null;

        if (this._isDone) {
          return;
        }

        this._catch(() => reject(error));
      }, () => {
        this._waited = null;

        if (this._isDone) {
          return;
        }

        this._catch(() => resolve(lastValue));
      });
    });
  }

  private _onPut(values: T[]): Promise<void> {
    values.forEach(arg => this._publish(arg));
    return Promise.resolve();
   }

  private _publish(value: T): void {
    if (this._isDone) {
      return;
    }
    this._subscriber.next(value);
  }

  private _catch(callback: () => any): void {
    try {
      callback();
    } catch (err) {
      this._error(err);
    }
  }

  private _onCancel(): void {
    if (!this._trySetDone()) { return; }

    this._isCanceled = true;
  }

  private _complete(): void {
    if (!this._trySetDone()) { return; }

    this._subscriber.complete();
  }

  private _error(error: any): void {
    if (!this._trySetDone()) { return; }

    this._subscriber.error(error);
  }

  private _trySetDone(): boolean {
    if (this._isDone) {
      return false;
    }

    this._isDone = true;

    if (this._waited) {
      this._waited.unsubscribe();
      this._waited = null;
    }

    return true;
  }
}
