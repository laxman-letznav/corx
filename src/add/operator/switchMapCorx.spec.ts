import { Observable } from 'rxjs';
import * as assert from 'assert';
import 'mocha';

import { put } from '../../';
import './switchMapCorx';

describe('switchMapCorx', () => {
  it('works like switchMap', done => {
    const produced = [];
    let counter = 0;

    Observable.timer(0, 0)
      .take(3)
      .map(() => ++counter)
      .switchMapCorx(function*(value: number): Generator {
        yield put(value);
        yield put(value * 10);
      }).subscribe(next => {
        produced.push(next);
      }, err => {
        done(`error ${err}`);
      }, () => {
        assert.deepEqual(produced, [1, 10, 2, 20, 3, 30]);
        done();
      });
  });

  it('cancels like switchMap', done => {
    const produced = [];

    Observable
      .generate(1, x => x <= 3, x => x + 1)
      .switchMapCorx(function*(value: number): Generator {
        yield put(value);

        yield Observable.timer(0, 0).take(1);

        assert.strictEqual(value, 3, 'should never get here unless 3');
        yield put(value * 10);
      }).subscribe(next => {
        produced.push(next);
      }, err => {
        done(`error ${err}`);
      }, () => {
        assert.deepEqual(produced, [1, 2, 3, 30]);
        done();
      });
  });
});
