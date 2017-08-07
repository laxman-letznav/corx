import * as assert from 'assert';
import { Observable } from 'rxjs';
import 'mocha';

import { corx, put, wait, chain } from './';

describe('corx', () => {
  it('waits for obserbable and returns last value', done => {
    let beenToEnd = false;

    corx(function*(): Generator {
      const data = yield Observable.timer(1, 1).take(2).map(() => 3);
      assert.equal(data, 3);

      const data2 = yield wait(Observable.timer(1, 1).take(2).map(() => 4));
      assert.equal(data2, 4);

      beenToEnd = true;
    }).subscribe(next => {
      assert.fail('No next');
    }, err => {
      done(`error ${err}`);
    }, () => {
      assert.ok(beenToEnd, 'have not been to end');
      done();
    });
  });

  it('supports cancel', done => {
    let beenToEnd = false;
    let beenCanceled = false;

    let cancel;

    const subscription = corx(function*(): Generator {
      yield Observable.timer(0, 0).take(1);

      yield Observable.create(subscriber => {
        setTimeout(cancel, 0);
        setTimeout(() => subscriber.complete(), 0);

        return () => beenCanceled = true;
      });

      beenToEnd = true;
    }).subscribe(next => {
      assert.fail('No next');
    }, err => {
      done(`error ${err}`);
    }, () => {
      assert.fail('No complete');
    });

    cancel = () => {
      subscription.unsubscribe();

      setTimeout(() => {
        assert.ok(!beenToEnd, 'have been to end');
        assert.ok(beenCanceled, 'inner has not been canceled');

        done();
      }, 0);
    };
  });

  it('propagates cancel properly', done => {
    let beenToEnd = false;
    let subscribeCalled = false;
    let cancel;

    const subscription = corx(function*(): Generator {
      yield Observable.timer(0, 0).take(1);

      yield chain(corx(function*(): Generator {
        yield Observable.timer(0, 0).take(1);

        cancel();

        yield Observable.create(subscriber => {
          subscribeCalled = true;
        });

        beenToEnd = true;
      }));

      beenToEnd = true;
    }).subscribe(next => {
      assert.fail('No next');
    }, err => {
      done(`error ${err}`);
    }, () => {
      assert.fail('No complete');
    });

    cancel = () => {
      subscription.unsubscribe();

      setTimeout(() => {
        assert.ok(!beenToEnd, 'have been to end');
        assert.ok(!subscribeCalled, 'have subscribed to next value');

        done();
      }, 0);
    };
  });

  it('supports put', done => {
    let beenToEnd = false;
    const produced = [];

    corx(function*(): Generator {
      yield put(1);
      yield put(2, 3);

      beenToEnd = true;
    }).subscribe(next => {
      produced.push(next);
    }, err => {
      done(`error ${err}`);
    }, () => {
      assert.deepEqual(produced, [1, 2, 3]);
      assert.ok(beenToEnd, 'have been to end');
      done();
    });
  });

  it('propagates error outside', done => {
    corx(function*(): Generator {
      yield Observable.timer(0, 1000).take(1);

      throw new Error('ups');
    }).subscribe(next => {
      assert.fail('no next');
    }, err => {
      assert.equal(err.message, 'ups');
      done();
    }, () => {
      done('no complete');
    });
  });

  it('propagates error', done => {
    let beenToEnd = false;

    corx(function*(): Generator {
      try {
        yield Observable.timer(0, 0).take(1).switchMap(() => Observable.throw(new Error('ups')));
        assert.fail('error unnoticed');
      } catch (err) {
        assert.equal(err.message, 'ups');
        beenToEnd = true;
      }
    }).subscribe(next => {
      assert.fail('no next');
    }, err => {
      done(`error ${err}`);
    }, () => {
      assert.ok(beenToEnd, 'have been to end');
      done();
    });
  });

  it('supports chain', done => {
    let beenToEnd = false;
    const produced = [];

    corx(function*(): Generator {
      let counter = 0;
      yield chain(Observable.timer(0, 1).take(3).map(() => ++counter));
      beenToEnd = true;
    }).subscribe(next => {
      produced.push(next);
    }, err => {
      done(`error ${err}`);
    }, () => {
      assert.deepEqual(produced, [1, 2, 3]);
      assert.ok(beenToEnd, 'have not been to end');
      done();
    });
  });

  it('supports promises', done => {
    let beenToEnd = false;

    corx(function*(): Generator {
      const resolved = yield new Promise(res => setTimeout(() => res(13), 0));
      assert.equal(resolved, 13);

      try {
        yield new Promise((res, rej) => setTimeout(() => rej(new Error('ups')), 0));
        assert.fail('error not thrown');
      } catch (er) {
        assert.equal(er.message, 'ups');
      }

      beenToEnd = true;
    }).subscribe(next => {
      assert.fail('no next');
    }, err => {
      done(`error ${err}`);
    }, () => {
      assert.ok(beenToEnd, 'have not been to end');
      done();
    });
  });

  it('binds this', done => {
    let beenToEnd = false;

    corx(function*(): Generator {
      assert.equal(this, 13);
      beenToEnd = true;
    }, 13).subscribe(next => {
      assert.fail('no next');
    }, err => {
      done(`error ${err}`);
    }, () => {
      assert.ok(beenToEnd, 'have not been to end');
      done();
    });
  });

  it('throws error on yield of unknown value', done => {
    let beenToEnd = false;

    corx(function*(): Generator {
      yield 10;
      beenToEnd = true;
    }).subscribe(next => {
      assert.fail('no next');
    }, err => {
      assert.ok(!beenToEnd, 'have been to end');
      assert.equal(err.message, 'must not yield such value: 10.');
      done();
    }, () => {
      done(`no complete`);
    });
  });

  it('handles complex cases', done => {
    let beenToEnd = false;
    const produced = [];

    corx(function*(): Generator {
      yield put(1, 2);

      try {
        let counter = 2;
        yield chain(Observable.timer(0, 0).map(() => {
          if (++counter === 5) { throw new Error('err1'); }
          return counter;
        }));
        assert.fail('error undetected');
      } catch (err) {
        assert.equal(err.message, 'err1');
      }

      yield put(5);

      try {
        yield chain(corx(function*(): Generator {
          yield Observable.timer(0, 0).take(1);

          yield put(6);

          yield chain(Observable.timer(0, 0).take(1).switchMap(() => Observable.from([7, 8])));

          yield Observable.timer(0, 0).switchMap(() => Observable.throw(new Error('err2')));
        }));
        assert.fail('error undetected');
      } catch (err) {
        assert.equal(err.message, 'err2');
        yield put(9);
      }

      const value = yield corx(function*(): Generator {
        yield Observable.timer(0, 0).take(1);
        yield put(10);
      });
      assert.equal(value, 10);
      yield put(value);

      beenToEnd = true;
    }).subscribe(next => {
      produced.push(next);
    }, err => {
      done(`error ${err}`);
    }, () => {
      assert.ok(beenToEnd, 'have not been to end');
      assert.deepEqual(produced, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      done();
    });
  });
});
