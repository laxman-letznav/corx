import * as assert from 'assert';
import { Observable } from 'rxjs';
import 'mocha';

import { corx } from './corx';

/* tslint:disable:no-shadowed-variable */

describe('corx', () => {
  it('waits for obserbable and returns last value', done => {
    let beenToEnd = false;

    corx(async ({ wait }) => {
      const data = await wait(Observable.timer(1, 1).take(2).map(() => 3));
      assert.equal(data, 3);

      const data2 = await Observable.timer(1, 1).take(2).map(() => 4).toPromise();
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

    const subscription = corx(async ({ wait }) => {
      await wait(Observable.timer(0, 0).take(1));

      await wait(Observable.create(subscriber => {
        setTimeout(cancel, 0);
        setTimeout(() => subscriber.complete(), 0);

        return () => beenCanceled = true;
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
        assert.ok(beenCanceled, 'inner has not been canceled');

        done();
      }, 0);
    };
  });

  it('supports chain', done => {
    let beenToEnd = false;
    const produced = [];

    corx(async ({ wait, chain }) => {
      let counter = 0;
      await chain(Observable.timer(0, 1).take(3).map(() => ++counter));
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

  it('propagates cancel properly', done => {
    let beenToEnd = false;
    let subscribeCalled = false;
    let cancel;

    const subscription = corx(async ({ wait, chain }) => {
      await wait(Observable.timer(0, 0).take(1));

      await chain(corx(async ({ wait }) => {
        await wait(Observable.timer(0, 0).take(1));

        cancel();

        await wait(Observable.create(subscriber => {
          subscribeCalled = true;
        }));

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

    corx(async ({ wait, put }) => {
      await put(1);
      await put(2, 3);

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

  it('propagates error outside', done => {
    corx(async ({ wait }) => {
      await wait(Observable.timer(0, 1000).take(1));

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

    corx(async ({ wait }) => {
      try {
        await wait(Observable.timer(0, 0).take(1).switchMap(() => Observable.throw(new Error('ups'))));
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
      assert.ok(beenToEnd, 'have not been to end');
      done();
    });
  });

  it('propagates error outside 2', done => {
    let beenToEnd = false;

    corx(async ({ wait }) => {
      await wait(Observable.timer(0, 0).take(1).switchMap(() => Observable.throw(new Error('ups'))));
      beenToEnd = true;
    }).subscribe(next => {
      assert.fail('no next');
    }, err => {
      assert.ok(!beenToEnd, 'have been to end');
      assert.equal(err.message, 'ups');
      done();
    }, () => {
      done(`no completed`);
    });
  });

  it('throws error on wait of unknown value', done => {
    let beenToEnd = false;

    corx(async ({ wait }) => {
      await wait(10 as any);
      beenToEnd = true;
    }).subscribe(next => {
      assert.fail('no next');
    }, err => {
      assert.ok(!beenToEnd, 'have been to end');
      assert.equal(err.message, 'wait supports only observables (value: 10).');
      done();
    }, () => {
      done(`no complete`);
    });
  });

  it('passes additional arguments', done => {
    let beenToEnd = false;

    corx(async ({ wait }, arg0, arg1) => {
      assert.equal(arg0, 3);
      assert.equal(arg1, 4);
      beenToEnd = true;
    }, 3, 4).subscribe(next => {
      assert.fail('no next');
    }, err => {
      done(`error ${err}`);
    }, () => {
      assert.ok(beenToEnd, 'have not been to end');
      done();
    });
  });

  it('handles complex cases', done => {
    let beenToEnd = false;
    const produced = [];

    corx(async ({ wait, put, chain }) => {
      await put(1, 2);

      try {
        let counter = 2;
        await chain(Observable.timer(0, 0).map(() => {
          if (++counter === 5) { throw new Error('err1'); }
          return counter;
        }));
        assert.fail('error undetected');
      } catch (err) {
        assert.equal(err.message, 'err1');
      }

      await put(5);

      try {
        await chain(corx(async ({ wait, put, chain }) => {
          await wait(Observable.timer(0, 0).take(1));

          await put(6);

          await chain(Observable.timer(0, 0).take(1).switchMap(() => Observable.from([7, 8])));

          await wait(Observable.timer(0, 0).switchMap(() => Observable.throw(new Error('err2'))));
        }));
        assert.fail('error undetected');
      } catch (err) {
        assert.equal(err.message, 'err2');
        await put(9);
      }

      const value = await wait(corx(async ({ wait, put }) => {
        await wait(Observable.timer(0, 0).take(1));
        await put(10);
      }));
      assert.equal(value, 10);
      await put(value);

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
