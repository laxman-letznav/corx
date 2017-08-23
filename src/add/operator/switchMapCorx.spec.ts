import { Observable } from 'rxjs';
import * as assert from 'assert';
import 'mocha';

import './switchMapCorx';

describe('switchMapCorx', () => {
  it('works like switchMap', done => {
    const produced = [];
    let counter = 0;

    Observable.timer(0, 0)
      .take(3)
      .map(() => ++counter)
      .switchMapCorx(async ({ put }, value: number) => {
        await put(value);
        await put(value * 10);
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
      .switchMapCorx(async ({ put, get }, value: number) => {
        await put(value);

        await get(Observable.timer(0, 0).take(1));

        assert.strictEqual(value, 3, 'should never get here unless 3');
        await put(value * 10);
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
