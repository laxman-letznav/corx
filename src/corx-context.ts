import { Observable, Subscriber, Subscription } from 'rxjs';

import { CorxOpertor, symbols } from './operators';
import { isPromise } from './utils';

export class CorxRunCtx {
  public get cancel(): () => any {
    return this._onCancel.bind(this);
  }

  private _isCanceled: boolean = false;
  private _isDone: boolean = false;
  private _waited: Subscription;

  constructor(
    private _generator: Generator,
    private _subscriber: Subscriber<any>) {
    this._next({});
  }

  private _next({ value, error }: { value?: any, error?: any }): void {
    if (this._isDone) {
      return;
    }

    try {
      let result: IteratorResult<any>;
      if (typeof error !== 'undefined') {
        result = this._generator.throw(error);
      } else {
        result = this._generator.next(value);
      }

      if (this._isDone) {
        return;
      }

      if (result.done) {
        this._complete();
        return;
      }

      this._processValue(result.value);
    } catch (ex) {
      this._error(ex);
    }
  }

  private _processValue(value: any): void {
    if (value instanceof Observable) {
      this._onWait(value);
    } else if (isPromise(value)) {
      this._onPromise(value);
    } else if (value instanceof CorxOpertor) {
      const operator = value as CorxOpertor;
      switch (operator.symbol) {
        case symbols.put:
          this._onPut(operator);
          break;
        case symbols.chain:
          this._onWait(operator.args[0], true);
          break;
        case symbols.wait:
          this._onWait(operator.args[0]);
          break;
        default:
          this._error(new Error(`unknown operator: ${operator.symbol}`));
          break;
      }
    } else {
      this._error(new Error(`must not yield such value: ${value}.`));
    }
  }

  private _onPromise(promise: Promise<any>): void {
    promise.then(
      value => this._next({ value }),
      error => this._next({ error })
    );
  }

  private _onPut(operator: CorxOpertor): void {
    operator.args.forEach(arg => this._publish(arg));
    this._next({});
  }

  private _onWait(observable: Observable<any>, publishValues: boolean = false): void {
    let lastValue;
    this._waited = observable.subscribe(nextValue => {
      lastValue = nextValue;
      if (publishValues) {
        this._publish(nextValue);
      }
    }, error => {
      this._waited = null;
      this._next({ error });
    }, () => {
      this._waited = null;
      this._next({ value: lastValue });
    });
  }

  private _publish(value: any): void {
    if (this._isDone) {
      return;
    }
    this._subscriber.next(value);
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
