import * as React from 'react';
import { MouseEvent } from 'react';
import { Observable, Subject, UnaryFunction } from 'rxjs';
import { map, scan, startWith } from 'rxjs/operators';

import { bindNext, rxComponent } from '../../public_api';
import { ValueObservable } from '../../rx.component';

export interface CounterProps {
  initial: number;
}

export interface CounterViewProps {
  counter: number;
  onClick: UnaryFunction<MouseEvent, void>;
}

/**
 * The view only component
 */
const viewOnly = ({ counter, onClick }: CounterViewProps) => (
  <div>
    <div>Counter {counter}</div>
    <button onClick={onClick}>Increment</button>
  </div>
);

function bloc(
  props$: ValueObservable<CounterProps>
): Observable<CounterViewProps> {
  // extract the initial value
  const { initial } = props$.value;

  const clickSubject = new Subject<any>();
  const click$ = clickSubject.pipe(
    scan(value => value + 1, initial),
    startWith(initial)
  );

  const onClick = bindNext(clickSubject);

  return click$.pipe(map(counter => ({ counter, onClick })));
}

export const Counter = rxComponent<CounterProps, CounterViewProps>(
  bloc,
  viewOnly
);
