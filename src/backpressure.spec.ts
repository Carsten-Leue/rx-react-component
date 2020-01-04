import { interval, timer } from 'rxjs';
import { marbles } from 'rxjs-marbles';
import { delay, take } from 'rxjs/operators';
import { rxBatch } from './backpressure';

describe('operators', () => {
  it(
    'backpressure',
    marbles(m => {
      const down$ = m.cold('---b|');

      const src$ = m.cold('aa---aaaaaa-a-a-a-a-aaa------a|');
      const expc$ = m.cold('---b---b---b---b---b---b---b----b|');

      const back$ = src$.pipe(rxBatch((buffer: any[]) => down$));

      m.expect(back$).toBeObservable(expc$);
    })
  );

  it('simple backpressure should work', () => {
    const t0 = Date.now();

    const src$ = interval(100).pipe(delay(1000), take(20));

    const handler = (buf: number[]) => {
      console.log('buffer', buf);
      return timer(500);
    };

    const evt$ = src$.pipe(rxBatch(handler));

    return evt$.toPromise();
  });
});
