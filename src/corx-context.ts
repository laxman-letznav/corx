import { Observable, Subscriber, Subscription } from 'rxjs';

import { CorxOpertor, symbols } from './operators';
import { isPromise } from './utils';

export class CorxRunCtx {
  public get cancel(): () => any {
    return this.onCancel.bind(this);
  }

  private _isCanceled: boolean = false;
  private _isDone: boolean = false;
  private _waited: Subscription;

  constructor(
    private _generator: Generator,
    private _subscriber: Subscriber<any>) {
    this.next({});
  }

  private next({ value, error }: { value?: any, error?: any }): void {
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
        this.complete();
        return;
      }

      this.processValue(result.value);
    } catch (ex) {
      this.error(ex);
    }
  }

  private processValue(value: any): void {
    if (value instanceof Observable) {
      this.onWait(value);
    } else if (isPromise(value)) {
      this.onPromise(value);
    } else if (value instanceof CorxOpertor) {
      const operator = value as CorxOpertor;
      if (operator.symbol === symbols.put) {
        this.onPut(operator);
      } else if (operator.symbol === symbols.chain) {
        this.onChain(operator.args[0]);
      } else if (operator.symbol === symbols.wait) {
        this.onWait(operator.args[0]);
      } else {
        this.error(new Error(`unknown operator: ${operator.symbol}`));
      }
    } else {
      this.error(new Error(`must not yield such value: ${value}.`));
    }
  }

  private onPromise(promise: Promise<any>): void {
    promise.then(
      value => this.next({ value }),
      error => this.next({ error })
    );
  }

  private onPut(operator: CorxOpertor): void {
    operator.args.forEach(arg => this.publish(arg));
    this.next({});
  }

  private onChain(observable: Observable<any>): void {
    let lastValue;
    this._waited = observable.subscribe(nextValue => {
      lastValue = nextValue;
      this.publish(nextValue);
    }, error => {
      this._waited = null;
      this.next({ error });
    }, () => {
      this._waited = null;
      this.next({ value: lastValue });
    });
  }

  private onWait(observable: Observable<any>): void {
    let lastValue;
    this._waited = observable.subscribe(nextValue => {
      lastValue = nextValue;
    }, error => {
      this._waited = null;
      this.next({ error });
    }, () => {
      this._waited = null;
      this.next({ value: lastValue });
    });
  }

  private publish(value: any): void {
    if (this._isDone) {
      return;
    }
    this._subscriber.next(value);
  }

  private onCancel(): void {
    if (!this.trySetDone()) { return; }

    this._isCanceled = true;
  }

  private complete(): void {
    if (!this.trySetDone()) { return; }

    this._subscriber.complete();
  }

  private error(error: any): void {
    if (!this.trySetDone()) { return; }

    this._subscriber.error(error);
  }

  private trySetDone(): boolean {
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
