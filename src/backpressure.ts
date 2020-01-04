import {
  defer,
  isObservable,
  merge,
  MonoTypeOperatorFunction,
  Observable,
  OperatorFunction,
  Subject,
  UnaryFunction
} from 'rxjs';
import { concatMap, filter, finalize, scan } from 'rxjs/operators';

import { arrayPush } from './utils';

const IDLE = Symbol();
declare type IdleType = typeof IDLE;

declare type BackpressureState<T, R> = T[] | Observable<R> | undefined;

function isIdle(aValue: any): aValue is IdleType {
  return aValue === IDLE;
}

// array test
function isBuffer<T>(aValue: any): aValue is T[] {
  return Array.isArray(aValue);
}
// observable test
function isBusy<R>(aValue: any): aValue is Observable<R> {
  return isObservable(aValue);
}

/**
 * Implementation of a backpressure operator. The operator will combine source items
 * into chunks and produces a result observable per chunk. It will buffer source
 * items as long as the observable of the last chunk has not finished, yet.
 *
 * @param aDelegate - delegate function to produce the result based on a chunk
 * @returns an operator function that transforms a source sequence into a target sequence
 */
export function rxBatch<T, R>(
  aDelegate: UnaryFunction<T[], Observable<R>>
): OperatorFunction<T, R> {
  // type safe helper
  const NOTHING: BackpressureState<T, R> = undefined;

  return (src$: Observable<T>) =>
    defer(() => {
      /**
       * Flag to check if the source sequence is done. We need this to potentially flush the
       * final buffer.
       */
      let bDone = false;
      /**
       * Source sequence setting the done flag when it completes
       */
      const obj$ = src$.pipe(finalize(() => (bDone = true)));
      /**
       * Triggers when the generated downstream sequence has terminated
       */
      const idle$ = new Subject<IdleType>();

      const done = () => {
        idle$.complete();
        return NOTHING;
      };

      // trigger callback
      const opFinal: MonoTypeOperatorFunction<R> = finalize<R>(() =>
        idle$.next(IDLE)
      );

      /**
       * The accumulator is either `undefined`, a (non-empty) buffer or an Observable<R>
       *
       * - if `undefined` the downstreams is idle and we do not have a buffer, yet
       * - if a buffer, downstream is busy and we already have a buffered item
       * - if an observable, downstream is busy but there is no buffered item, yet
       */
      const accumulator = (
        acc: BackpressureState<T, R>,
        obj: T | IdleType
      ): BackpressureState<T, R> =>
        /**
         * The idle event indicates that downstream had been busy but is idle, now
         */
        isIdle(obj)
          ? /**
             * if there is data in the buffer, process downstream and reset the buffer
             */
            isBuffer<T>(acc)
            ? // process the next chunk of data
              aDelegate(acc)
            : bDone
            ? // nothing to process, but source is done. Also complete the backpressure stream
              done()
            : // nothing to process, downstream is idle, wait for the next regular event
              NOTHING
          : // we have a buffer, append to it
          isBuffer<T>(acc)
          ? // downstream is busy, buffer the item
            arrayPush(obj, acc)
          : // we have a running observable, start a new buffer
          acc !== undefined
          ? // downstream is busy, start buffering
            [obj]
          : // downstream is idle
            aDelegate([obj]);

      const opScan: OperatorFunction<
        T | IdleType,
        BackpressureState<T, R>
      > = scan(accumulator, NOTHING);

      // only continue if we have new work
      const opFilter: OperatorFunction<
        BackpressureState<T, R>,
        Observable<R>
      > = filter(isBusy) as any;

      const opConcat = concatMap((res$: Observable<R>) => res$.pipe(opFinal));

      /**
       * We merge the original events and the events that tell about downstream readiness
       */
      return merge(obj$, idle$).pipe(opScan, opFilter, opConcat);
    });
}
