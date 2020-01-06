import { interval, timer, Observable, of, UnaryFunction } from 'rxjs';
import { marbles } from 'rxjs-marbles';
import { delay, take } from 'rxjs/operators';
import { batch } from './backpressure';
import { ajax, AjaxResponse } from 'rxjs/ajax';

declare type Entry<V> = [string, V];

// combine our batch into a record
const batchToData = <V>(batch: Array<Entry<V>>): Record<string, V> =>
  batch.reduce(
    (dst, [key, value]) => ({
      ...dst,
      [key]: value
    }),
    {}
  );

// send the data to our REST entry
const postData = <V>(body: Record<string, V>) =>
  ajax({ url: 'http://example.org/REST', method: 'POST', body });

describe('operators', () => {
  xit('POST sample', () => {
    const handler: UnaryFunction<
      Array<Entry<string>>,
      Observable<AjaxResponse>
    > = entry => postData(batchToData(entry));

    const src$: Observable<Entry<string>> = of(['a', 'b']);

    const processed$ = src$.pipe(batch(handler));
  });

  it(
    'backpressure',
    marbles(m => {
      const down$ = m.cold('---b|');

      const src$ = m.cold('aa---aaaaaa-a-a-a-a-aaa------a|');
      const expc$ = m.cold('---b---b---b---b---b---b---b----b|');

      const back$ = src$.pipe(batch((buffer: any[]) => down$));

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

    const evt$ = src$.pipe(batch(handler));

    return evt$.toPromise();
  });
});
